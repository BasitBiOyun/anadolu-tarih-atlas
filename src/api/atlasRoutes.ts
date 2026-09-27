import { Router, Request, Response } from 'express';
import { serverDb } from './serverFirestore';
import { uploadMonographToStorage } from './serverStorage';
import { validateSiteJson } from '../validation/siteValidator';

export const atlasRouter = Router();

function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(item => sanitizeForFirestore(item));
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) result[key] = sanitizeForFirestore(value);
    }
    return result;
  }
  return obj;
}

// Bearer token authentication middleware for external research workers
// Fails closed if ATLAS_INGESTION_TOKEN is not configured in the server environment.
atlasRouter.use((req: Request, res: Response, next) => {
  const expectedToken = process.env.ATLAS_INGESTION_TOKEN;

  if (!expectedToken || typeof expectedToken !== 'string' || expectedToken.trim().length === 0) {
    console.error('[Atlas Security] Ingestion API failed closed: ATLAS_INGESTION_TOKEN is not configured.');
    return res.status(500).json({
      error: 'Server configuration error: Ingestion API is disabled because ATLAS_INGESTION_TOKEN is missing.'
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing Authorization header with Bearer token.'
    });
  }

  const token = authHeader.substring(7).trim();
  if (token !== expectedToken) {
    return res.status(403).json({
      error: 'Forbidden: Invalid ingestion bearer token.'
    });
  }

  next();
});

/**
 * POST /api/atlas/claim
 * Atomically reserves pending records from Firestore 'research_queue'
 * using Firestore transactions so no two workers can claim the same site.
 */
atlasRouter.post('/claim', async (req: Request, res: Response) => {
  try {
    const { workerId, limit: requestedLimit } = req.body;
    if (!workerId || typeof workerId !== 'string') {
      return res.status(400).json({ error: 'Missing required field: "workerId".' });
    }

    const claimLimit = Math.min(Math.max(Number(requestedLimit) || 1, 1), 20);

    // Query candidate pending items in research_queue
    const q = serverDb
      .collection('research_queue')
      .where('status', '==', 'pending')
      .limit(claimLimit * 2);
    const candidateSnap = await q.get();

    if (candidateSnap.empty) {
      return res.json({
        success: true,
        workerId,
        claimedCount: 0,
        claimed: []
      });
    }

    const claimedItems: Array<{ id: string; name: any; province: any; priority: string }> = [];

    // Execute atomic claim in a Firestore transaction ensuring ALL reads occur before ANY writes
    await serverDb.runTransaction(async transaction => {
      // 1. Phase 1: All reads
      const validPendingDocs: Array<{ docRef: any; data: any; id: string }> = [];
      for (const docSnap of candidateSnap.docs) {
        if (validPendingDocs.length >= claimLimit) break;

        const docRef = serverDb.collection('research_queue').doc(docSnap.id);
        const freshSnap = await transaction.get(docRef);

        if (freshSnap.exists && freshSnap.data().status === 'pending') {
          validPendingDocs.push({
            docRef,
            data: freshSnap.data(),
            id: freshSnap.id
          });
        }
      }

      // 2. Phase 2: All writes
      const claimedAt = new Date().toISOString();
      for (const item of validPendingDocs) {
        const currentAttempts = item.data.attemptCount || 0;

        transaction.update(item.docRef, {
          status: 'processing',
          assignedWorker: workerId,
          claimedAt,
          attemptCount: currentAttempts + 1,
          updatedAt: claimedAt
        });

        claimedItems.push({
          id: item.id,
          name: item.data.name || (item.data.siteName ? item.data.siteName.tr : item.id),
          province: item.data.province || '',
          priority: item.data.priority || 'normal'
        });
      }
    });

    return res.json({
      success: true,
      workerId,
      claimedCount: claimedItems.length,
      claimed: claimedItems
    });
  } catch (err: any) {
    console.error('[API /claim] Error reserving research tasks:', err);
    return res.status(500).json({
      error: 'Failed to claim research tasks',
      details: err.message
    });
  }
});

/**
 * POST /api/atlas/upload
 * Accepts a full site JSON document:
 * 1. Validates archaeological and structural JSON compliance (schemaVersion 3 & 4)
 * 2. Uploads the full canonical JSON to Firebase Storage at atlas/sites/{id}.json
 * 3. Derives and updates the lightweight Firestore document in sites_index
 * 4. Marks the research_queue task as completed
 * 5. Records complete job execution metrics in research_jobs
 */
atlasRouter.post('/upload', async (req: Request, res: Response) => {
  const startedAt = new Date().toISOString();
  const { workerId, site } = req.body;

  if (!workerId || typeof workerId !== 'string') {
    return res.status(400).json({ error: 'Missing required field: "workerId".' });
  }

  if (!site || typeof site !== 'object') {
    return res.status(400).json({ error: 'Missing required field: "site" must be a complete site object.' });
  }

  const siteId = site.id;

  // 1. Strict Site JSON Validation
  const validation = validateSiteJson(site);
  if (!validation.isValid) {
    // Record rejected attempt in research_jobs if siteId is present
    if (siteId) {
      const failedJobId = `job_fail_${siteId}_${Date.now()}`;
      await serverDb.collection('research_jobs').doc(failedJobId).set({
        id: failedJobId,
        workerId,
        siteId,
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'failed',
        validationErrors: validation.errors,
        sourceCount: site.core?.sources?.length || 0,
        imageCount: site.core?.images?.length || 0
      }).catch(e => console.warn('Failed to record job error:', e));
    }

    return res.status(400).json({
      success: false,
      error: 'Archaeological site JSON validation failed.',
      validationErrors: validation.errors
    });
  }

  const jsonString = JSON.stringify(site, null, 2);

  // 2. Perform durable SERVER-SIDE upload to Google Cloud / Firebase Storage
  // Uses privileged Application Default Credentials / Cloud Run service identity
  let canonicalStoragePath: string;
  try {
    canonicalStoragePath = await uploadMonographToStorage(siteId, jsonString);
  } catch (storageErr: any) {
    const errorMessage = storageErr.message || 'Storage persistence failed';
    const errorCode = storageErr.code || 502;
    console.error(`[API /upload] CRITICAL: Storage persistence failed for "${siteId}":`, storageErr);

    // Fail transactional semantics: do NOT mark queue completed; set status to 'needs_review'
    const queueDocRef = serverDb.collection('research_queue').doc(siteId);
    await queueDocRef.set({
        id: siteId,
        name: site.content?.tr?.name || siteId,
        province: site.content?.tr?.province || '',
        status: 'needs_review',
        assignedWorker: workerId,
        lastError: `Storage persistence error: ${errorMessage}`,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    ).catch(e => console.warn('Failed to update queue error status:', e));

    // Record job failure in research_jobs
    const failedJobId = `job_${siteId}_failed_${Date.now()}`;
    await serverDb.collection('research_jobs').doc(failedJobId).set({
      id: failedJobId,
      workerId,
      siteId,
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'failed',
      error: errorMessage,
      errorCode,
      storageUploaded: false,
      sourceCount: site.core?.sources?.length || 0,
      imageCount: site.core?.images?.length || 0
    }).catch(e => console.warn('Failed to log research job failure:', e));

    return res.status(502).json({
      success: false,
      error: `Durable Cloud Storage persistence failed for site "${siteId}".`,
      details: errorMessage,
      code: errorCode,
      queueStatus: 'needs_review'
    });
  }

  // 3. Storage persistence and read-back verification succeeded!
  // Now derive lightweight sites_index document for map and multi-field search
  try {
    const periodIds: string[] = (site.core.chronology || []).map((c: any) => c.periodId);
    const startYear = site.core.dateRange?.startYear ?? site.core.chronology?.[0]?.startYear ?? null;
    const endYear = site.core.dateRange?.endYear ?? site.core.chronology?.[site.core.chronology.length - 1]?.endYear ?? null;

    const altNamesTR = Array.isArray(site.content.tr.alternativeNames) ? site.content.tr.alternativeNames : [];
    const altNamesEN = Array.isArray(site.content.en.alternativeNames) ? site.content.en.alternativeNames : [];

    const indexDoc = {
      id: site.id,
      nameTR: site.content.tr.name,
      nameEN: site.content.en.name,
      alternativeNamesTR: altNamesTR,
      alternativeNamesEN: altNamesEN,
      province: site.content.tr.province || '',
      district: site.content.tr.district || '',
      latitude: site.core.coordinates.latitude,
      longitude: site.core.coordinates.longitude,
      siteType: site.core.siteType || site.content.tr.siteTypeLabel || 'mound',
      periodIds: periodIds,
      startYear: startYear,
      endYear: endYear,
      importance: site.core.visibility?.importance ?? 2,
      minZoom: site.core.visibility?.minZoom ?? 1.8,
      featured: site.core.visibility?.featured ?? false,
      storagePath: canonicalStoragePath,
      updatedAt: new Date().toISOString()
    };

    // Update sites_index document in Firestore
    const indexDocRef = serverDb.collection('sites_index').doc(siteId);
    await indexDocRef.set(sanitizeForFirestore(indexDoc), { merge: true });

    // 4. Mark research_queue task as completed
    const queueDocRef = serverDb.collection('research_queue').doc(siteId);
    await queueDocRef.set({
        id: siteId,
        name: site.content.tr.name,
        province: site.content.tr.province || '',
        status: 'completed',
        assignedWorker: workerId,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastError: null
      }, { merge: true });

    // 5. Record successful job in research_jobs
    const completedAt = new Date().toISOString();
    const jobId = `job_${siteId}_${Date.now()}`;
    await serverDb.collection('research_jobs').doc(jobId).set({
      id: jobId,
      workerId,
      siteId,
      startedAt,
      completedAt,
      status: 'completed',
      validationErrors: [],
      storageUploaded: true,
      storagePath: canonicalStoragePath,
      sourceCount: site.core.sources?.length || 0,
      imageCount: site.core.images?.length || 0
    });

    return res.status(200).json({
      success: true,
      siteId,
      storagePath: canonicalStoragePath,
      storageUploaded: true,
      indexedAt: indexDoc.updatedAt,
      jobId
    });
  } catch (err: any) {
    console.error(`[API /upload] Error finalizing index/queue for "${siteId}":`, err);
    return res.status(500).json({
      success: false,
      error: `Failed to finalize index for "${siteId}" after Storage upload.`,
      details: err.message || 'Firestore indexing error'
    });
  }
});

/**
 * POST /api/atlas/maintenance/retain-index
 *
 * Protected maintenance endpoint for reconciling stale Firestore map records.
 * It only prunes sites_index documents. Canonical Storage monographs are never
 * deleted by this operation.
 */
atlasRouter.post('/maintenance/retain-index', async (req: Request, res: Response) => {
  try {
    const rawIds = req.body?.siteIds;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return res.status(400).json({
        error: 'siteIds must be a non-empty array of canonical site IDs.'
      });
    }

    const siteIds = Array.from(
      new Set(
        rawIds
          .filter((id: unknown): id is string => typeof id === 'string')
          .map((id: string) => id.trim())
          .filter((id: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
      )
    );

    if (siteIds.length !== rawIds.length) {
      return res.status(400).json({
        error: 'Every siteIds entry must be a unique lowercase hyphenated site ID.'
      });
    }

    const keep = new Set(siteIds);
    const snapshot = await serverDb.collection('sites_index').get();
    const removed: string[] = [];

    let batch = serverDb.batch();
    let operations = 0;

    for (const docSnap of snapshot.docs) {
      if (keep.has(docSnap.id)) continue;

      batch.delete(docSnap.ref);
      removed.push(docSnap.id);
      operations += 1;

      if (operations === 450) {
        await batch.commit();
        batch = serverDb.batch();
        operations = 0;
      }
    }

    if (operations > 0) {
      await batch.commit();
    }

    return res.json({
      success: true,
      retained: siteIds,
      retainedCount: siteIds.length,
      removed,
      removedCount: removed.length
    });
  } catch (err: any) {
    console.error('[API /maintenance/retain-index] Error pruning sites_index:', err);
    return res.status(500).json({
      error: 'Failed to reconcile sites_index.',
      details: err?.message || String(err)
    });
  }
});

/**
 * POST /api/atlas/fail
 * Allows a worker to return a claimed record back to the queue or
 * mark it as needing review with an explanatory error reason.
 */
atlasRouter.post('/fail', async (req: Request, res: Response) => {
  try {
    const { workerId, siteId, reason, action } = req.body;

    if (!workerId || !siteId || !reason) {
      return res.status(400).json({
        error: 'Missing required fields: "workerId", "siteId", and "reason" must be provided.'
      });
    }

    const queueDocRef = serverDb.collection('research_queue').doc(siteId);
    const snap = await queueDocRef.get();

    const now = new Date().toISOString();
    const targetStatus = action === 'retry' ? 'pending' : 'needs_review';

    if (snap.exists) {
      await queueDocRef.update({
        status: targetStatus,
        assignedWorker: action === 'retry' ? null : workerId,
        lastError: reason,
        updatedAt: now
      });
    } else {
      await queueDocRef.set({
        id: siteId,
        name: siteId,
        status: targetStatus,
        assignedWorker: action === 'retry' ? null : workerId,
        lastError: reason,
        createdAt: now,
        updatedAt: now
      });
    }

    // Record job failure event in research_jobs
    const jobId = `job_err_${siteId}_${Date.now()}`;
    await serverDb.collection('research_jobs').doc(jobId).set({
      id: jobId,
      workerId,
      siteId,
      startedAt: now,
      completedAt: now,
      status: targetStatus === 'needs_review' ? 'needs_review' : 'failed',
      validationErrors: [reason],
      sourceCount: 0,
      imageCount: 0
    });

    return res.json({
      success: true,
      siteId,
      status: targetStatus,
      reason
    });
  } catch (err: any) {
    console.error('[API /fail] Error recording task failure:', err);
    return res.status(500).json({
      error: 'Failed to record task failure',
      details: err.message
    });
  }
});
