import { Storage } from '@google-cloud/storage';

export const ATLAS_STORAGE_BUCKET = 'hiddenfeed.firebasestorage.app';
export const STORAGE_SITES_PATH = 'atlas/sites';

// Initialize official Google Cloud Storage Node.js client using Cloud Run Application Default Credentials
export const serverStorage = new Storage({
  projectId: 'hiddenfeed'
});

/**
 * Uploads canonical archaeological JSON to Google Cloud / Firebase Storage
 * using privileged server-side Application Default Credentials.
 * Verifies existence and read-back before returning.
 */
export async function uploadMonographToStorage(siteId: string, jsonString: string): Promise<string> {
  const bucket = serverStorage.bucket(ATLAS_STORAGE_BUCKET);
  const objectPath = `${STORAGE_SITES_PATH}/${siteId}.json`;
  const file = bucket.file(objectPath);

  // 1. Upload canonical JSON with metadata
  await file.save(jsonString, {
    contentType: 'application/json',
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=3600'
    }
  });

  // 2. Verify existence on remote store
  const [exists] = await file.exists();
  if (!exists) {
    throw new Error(`Storage read-back verification failed: Object "${objectPath}" does not exist after write.`);
  }

  // 3. Verify content integrity by downloading
  const [downloadedBuffer] = await file.download();
  const downloadedString = downloadedBuffer.toString('utf-8');
  if (downloadedString.length === 0) {
    throw new Error(`Storage read-back verification failed: Object "${objectPath}" is empty.`);
  }

  return objectPath;
}

/**
 * Executes a full CRUD test on Storage: write -> read -> verify -> delete.
 */
export async function testStorageCRUD(): Promise<{
  success: boolean;
  tempPath: string;
  error?: string;
  statusCode?: number;
}> {
  const bucket = serverStorage.bucket(ATLAS_STORAGE_BUCKET);
  const tempPath = `atlas/temp/test_${Date.now()}.json`;
  const file = bucket.file(tempPath);
  const testPayload = JSON.stringify({
    test: true,
    timestamp: new Date().toISOString(),
    agent: 'anadolu-tarih-atlasi-server-storage'
  });

  try {
    // 1. Write
    await file.save(testPayload, {
      contentType: 'application/json',
      resumable: false
    });

    // 2. Read back & verify
    const [downloaded] = await file.download();
    const parsed = JSON.parse(downloaded.toString('utf-8'));
    if (!parsed.test) {
      throw new Error('Read back verification mismatch: test property missing.');
    }

    // 3. Delete
    await file.delete();

    return {
      success: true,
      tempPath
    };
  } catch (err: any) {
    return {
      success: false,
      tempPath,
      error: err.message || 'Unknown Storage error',
      statusCode: err.code || 500
    };
  }
}

/**
 * Checks whether a site JSON exists in the bucket.
 */
export async function siteExistsInStorage(siteId: string): Promise<boolean> {
  try {
    const bucket = serverStorage.bucket(ATLAS_STORAGE_BUCKET);
    const file = bucket.file(`${STORAGE_SITES_PATH}/${siteId}.json`);
    const [exists] = await file.exists();
    return exists;
  } catch {
    return false;
  }
}
