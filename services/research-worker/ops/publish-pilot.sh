#!/usr/bin/env bash
set -euo pipefail
echo 'STOP: Zero additional cost required. Cloud Run pilot execution is disabled pending a free-runtime redesign.' >&2
exit 1
cd "$(git rev-parse --show-toplevel)/services/research-worker"
: "${DRIVE_OAUTH_SECRET:?Set existing dedicated Secret Manager secret name}"
: "${DRIVE_OAUTH_FILE:?Set local authorized_user JSON path; never paste its contents}"
SITE_ID="${1:-dursunlu}"
npx tsx src/cli.ts preflight-drive
gcloud secrets add-iam-policy-binding "$DRIVE_OAUTH_SECRET" --project=hiddenfeed --member=serviceAccount:atlas-research-worker@hiddenfeed.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor
gcloud run jobs update atlas-research-worker --project=hiddenfeed --region=us-west1 --update-secrets="/secrets/drive/oauth.json=$DRIVE_OAUTH_SECRET:latest" --update-env-vars=DRIVE_OAUTH_FILE=/secrets/drive/oauth.json
npx tsx src/cli.ts publish-pilot "$SITE_ID"
gcloud run jobs execute atlas-research-worker --project=hiddenfeed --region=us-west1 --wait
npx tsx src/cli.ts status
