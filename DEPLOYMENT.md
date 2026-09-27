# Cloud Run Deployment

The GitHub repository is source control only. Deployment is handled directly by Google Cloud Run; GitHub Actions is not part of the deployment or ingestion path.

## Runtime

The React frontend and Express API run together in one Cloud Run service.

Required runtime configuration:

- `ATLAS_INGESTION_TOKEN`: Bearer token protecting `/api/atlas/*`.
- Cloud Run service identity with the minimum permissions required for:
  - Firebase Storage object access on `hiddenfeed.firebasestorage.app`
  - Firestore access to the configured database

Firebase client configuration in `firebase-applet-config.json` is browser configuration, not a privileged service-account credential.

## Container build

```bash
docker build -t anadolu-tarih-atlas .
```

The production container serves both the built Vite frontend and the Express API.

## Data model

- Firestore `sites_index`: lightweight public map/search index
- Firebase Storage `atlas/sites/{siteId}.json`: canonical full monographs
- Firestore `research_queue`: private worker queue
- Firestore `research_jobs`: private worker telemetry

The frontend does not read archaeological monographs from the GitHub repository.

## Deployment rule

Changes are committed directly to `main`. Cloud Run is the deployment target. No GitHub workflow, deployment branch, or GitHub-hosted runner is required.
