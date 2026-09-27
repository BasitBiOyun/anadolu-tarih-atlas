import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { atlasRouter } from './src/api/atlasRoutes';
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
    const cleanId = rawId.replace(/^sites\//, '').replace(/\.json$/, '');
    const bucket = serverStorage.bucket(ATLAS_STORAGE_BUCKET);
    const objectPath = `${STORAGE_SITES_PATH}/${cleanId}.json`;
    const file = bucket.file(objectPath);

    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        error: `Monograph for "${cleanId}" not found in Firebase Storage at "${objectPath}".`
      });
    }

    const [data] = await file.download();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(data);
  } catch (err: any) {
    console.error(`[API] Error reading site monograph from Firebase Storage for ${req.params.siteId}:`, err);
    return res.status(500).json({
      error: `Failed to load monograph from Firebase Storage: ${err?.message || String(err)}`
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
