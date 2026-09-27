#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)/services/research-worker"
: "${DRIVE_OAUTH_SECRET:?Set the Secret Manager secret containing authorized_user JSON}"
: "${DRIVE_OAUTH_FILE:?Set the local authorized_user JSON file for preflight (never paste its contents)}"
: "${ACCEPTANCE_FILE:?Set the reviewed pilot acceptance JSON path}"
RUNTIME=atlas-research-worker@hiddenfeed.iam.gserviceaccount.com
SCHEDULER=atlas-research-scheduler@hiddenfeed.iam.gserviceaccount.com
npx tsx src/cli.ts preflight-drive
gcloud secrets add-iam-policy-binding "$DRIVE_OAUTH_SECRET" --project=hiddenfeed --member="serviceAccount:$RUNTIME" --role=roles/secretmanager.secretAccessor
gcloud run jobs update atlas-research-worker --project=hiddenfeed --region=us-west1 --tasks=10 --parallelism=10 --update-secrets="/secrets/drive/oauth.json=$DRIVE_OAUTH_SECRET:latest" --update-env-vars=DRIVE_OAUTH_FILE=/secrets/drive/oauth.json
if ! gcloud iam service-accounts describe "$SCHEDULER" --project=hiddenfeed >/dev/null 2>&1; then
  gcloud iam service-accounts create atlas-research-scheduler --project=hiddenfeed
fi
gcloud run jobs add-iam-policy-binding atlas-research-worker --project=hiddenfeed --region=us-west1 --member="serviceAccount:$SCHEDULER" --role=roles/run.invoker
ACTION=create
if gcloud scheduler jobs describe atlas-research-hourly --project=hiddenfeed --location=us-west1 >/dev/null 2>&1; then ACTION=update; fi
gcloud scheduler jobs "$ACTION" http atlas-research-hourly --project=hiddenfeed --location=us-west1 --schedule='0 * * * *' --time-zone=Etc/UTC --uri='https://run.googleapis.com/v2/projects/hiddenfeed/locations/us-west1/jobs/atlas-research-worker:run' --http-method=POST --message-body='{}' --oauth-service-account-email="$SCHEDULER" --max-retry-attempts=3
npx tsx src/cli.ts activate "$ACCEPTANCE_FILE"
printf 'Hourly schedule configured. Queue enforces maximum 10 claims/hour across all executions.\n'
