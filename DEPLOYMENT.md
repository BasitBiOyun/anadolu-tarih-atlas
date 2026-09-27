# Deployment without AI Studio

The repository is the source of truth. The React application and Express API can be deployed together as one Cloud Run service.

## Required runtime environment

- `ATLAS_INGESTION_TOKEN`: secret Bearer token for `/api/atlas/*`.
- Cloud Run service identity must have the minimum IAM permissions required for:
  - Firebase Storage object access on `hiddenfeed.firebasestorage.app`
  - Firestore access to the configured database.

Firebase client configuration in `firebase-applet-config.json` is browser configuration, not a privileged service-account credential.

## Build

```bash
docker build -t anadolu-tarih-atlas .
```

## Cloud Run

Use a user-managed service account and Application Default Credentials. Do not store a service-account JSON key in this repository.

A later deployment can use GitHub Actions + Google Workload Identity Federation so no long-lived Google credential needs to be stored in GitHub.

## Data model

- Firestore `sites_index`: lightweight public map/search index
- Firebase Storage `atlas/sites/{siteId}.json`: canonical full monographs
- Firestore `research_queue`: private worker queue
- Firestore `research_jobs`: private worker telemetry

The frontend does not read archaeological monographs from the repository.

## Research ingestion branch

The optional `research-ingest` branch is a staging branch for researched JSON files. Its workflow sends the JSON through the authenticated production ingestion API. It is not deployed as frontend content.

Required GitHub repository configuration:

- Secret: `ATLAS_INGESTION_TOKEN`
- Variable: `ATLAS_INGESTION_BASE_URL`

Do not put either value into tracked files.
