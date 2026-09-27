import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { atlasRouter } from './src/api/atlasRoutes';
import { serverDb } from './src/api/serverFirestore';
import { serverStorage, ATLAS_STORAGE_BUCKET, STORAGE_SITES_PATH } from './src/api/serverStorage';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser with 10mb limit for detailed archaeological site monographs
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint - confirms ingestion configuration and Firebase project identity
app.get('/api/health', (req, res) => {
  const token = process.env.ATLAS_INGESTION_TOKEN;
  const isIngestionConfigured = Boolean(token && typeof token === 'string' && token.trim().length >= 32);

  res.json({
    status: 'ok',
    service: 'anadolu-tarih-atlasi-backend',
    ingestionConfigured: isIngestionConfigured,
    firebase: {
      projectId: 'hiddenfeed',
      firestoreDatabaseId: 'ai-studio-anadolutarihnces-f71dcc77-2c3d-464d-a885-67c82d256cf1',
      storageBucket: 'hiddenfeed.firebasestorage.app'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Public Archaeological Monograph Endpoint:
 * Streams the canonical, unedited JSON directly from Firebase Storage bucket:
 * atlas/sites/{cleanId}.json
 * Provides a reliable same-origin fallback when browser CORS blocks direct GCS downloads.
 */
app.get('/api/sites/:siteId', async (req, res) => {
  try {
    const rawId = req.params.siteId;
    const cleanId = rawId.replace(/\.json$/, '');

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanId)) {
      return res.status(400).json({ error: 'Invalid site id.' });
    }

    const bucket = serverStorage.bucket(ATLAS_STORAGE_BUCKET);
    const objectPath = `${STORAGE_SITES_PATH}/${cleanId}.json`;
    const file = bucket.file(objectPath);

    // One Storage round trip only. Avoid exists() followed by download(), which
    // doubles latency on every cold detail request.
    const [data] = await file.download();

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    return res.send(data);
  } catch (err: any) {
    if (Number(err?.code) === 404) {
      return res.status(404).json({
        error: `Monograph for "${req.params.siteId}" was not found.`
      });
    }

    console.error(`[API] Error reading site monograph from Firebase Storage for ${req.params.siteId}:`, err);
    return res.status(500).json({
      error: 'Failed to load monograph from Firebase Storage.'
    });
  }
});


// Public published-site index.
// Firebase Storage is authoritative for whether a site exists in the atlas.
// Firestore is used only as lightweight metadata for Storage objects that
// actually exist under atlas/sites/*.json.
app.get('/api/site-index', async (req, res) => {
  try {
    const bucket = serverStorage.bucket(ATLAS_STORAGE_BUCKET);
    const prefix = `${STORAGE_SITES_PATH}/`;

    const [files] = await bucket.getFiles({ prefix });

    const siteIds = Array.from(
      new Set(
        files
          .map(file => file.name)
          .filter(name => name.startsWith(prefix) && name.endsWith('.json'))
          .map(name => name.slice(prefix.length, -5))
          .filter(id => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
      )
    ).sort();

    if (siteIds.length === 0) {
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
      return res.json([]);
    }

    const indexedById = new Map<string, any>();

    // Fetch Firestore metadata only for IDs that physically exist in Storage.
    // Chunking keeps this safe as the atlas grows to hundreds/thousands of sites.
    for (let i = 0; i < siteIds.length; i += 200) {
      const chunk = siteIds.slice(i, i + 200);
      const refs = chunk.map(id => serverDb.collection('sites_index').doc(id));
      const snapshots = await serverDb.getAll(...refs);

      snapshots.forEach(snapshot => {
        if (snapshot.exists) {
          indexedById.set(snapshot.id, {
            ...snapshot.data(),
            id: snapshot.id
          });
        }
      });
    }

    const publishedIndex: any[] = [];

    for (const siteId of siteIds) {
      const indexed = indexedById.get(siteId);
      if (indexed) {
        publishedIndex.push(indexed);
        continue;
      }

      // Defensive fallback: if Storage contains a canonical monograph but its
      // Firestore index document is missing, derive the lightweight metadata
      // directly from the monograph instead of hiding a published site.
      try {
        const file = bucket.file(`${prefix}${siteId}.json`);
        const [buffer] = await file.download();
        const site = JSON.parse(buffer.toString('utf8'));

        const chronology = Array.isArray(site?.core?.chronology)
          ? site.core.chronology
          : [];

        publishedIndex.push({
          id: siteId,
          nameTR: site?.content?.tr?.name || siteId,
          nameEN: site?.content?.en?.name || site?.content?.tr?.name || siteId,
          alternativeNamesTR: site?.content?.tr?.alternativeNames || [],
          alternativeNamesEN: site?.content?.en?.alternativeNames || [],
          province: site?.content?.tr?.province || '',
          district: site?.content?.tr?.district || '',
          latitude: site?.core?.coordinates?.latitude,
          longitude: site?.core?.coordinates?.longitude,
          siteType: site?.core?.siteType || site?.content?.tr?.siteTypeLabel || 'other',
          periodIds: chronology.map((entry: any) => entry.periodId).filter(Boolean),
          startYear: site?.core?.dateRange?.startYear ?? chronology[0]?.startYear ?? null,
          endYear:
            site?.core?.dateRange?.endYear ??
            chronology[chronology.length - 1]?.endYear ??
            null,
          importance: site?.core?.visibility?.importance ?? 2,
          minZoom: site?.core?.visibility?.minZoom ?? 1.8,
          featured: site?.core?.visibility?.featured ?? false,
          storagePath: `${prefix}${siteId}.json`
        });
      } catch (fallbackError) {
        console.error(`[API /site-index] Failed to derive metadata for ${siteId}:`, fallbackError);
      }
    }

    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.setHeader('X-Atlas-Site-Count', String(publishedIndex.length));
    return res.json(publishedIndex);
  } catch (err: any) {
    console.error('[API /site-index] Failed to build published Storage index:', err);
    return res.status(500).json({
      error: 'Failed to load published site index from Firebase Storage.'
    });
  }
});

// Secure Ingestion API routes for archaeological research workers
app.use('/api/atlas', atlasRouter);

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Anatolian Historical Atlas] Backend & UI running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
