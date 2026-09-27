#!/usr/bin/env bash
set -euo pipefail
# Run inside the reviewed repository. Never modifies existing Cloud Run services.
: "${RESEARCH_MODEL:?Set a currently available Vertex model ID}"
: "${CHECK_MODEL:=$RESEARCH_MODEL}"
export RESEARCH_MODEL CHECK_MODEL
REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKER="$REPO_ROOT/services/research-worker"
PROJECT=hiddenfeed
REGION=us-west1
DATABASE=ai-studio-anadolutarihnces-f71dcc77-2c3d-464d-a885-67c82d256cf1
RUNTIME=atlas-research-worker@hiddenfeed.iam.gserviceaccount.com
TAG="$(git rev-parse --short=12 HEAD)"
cd "$WORKER"
npm ci --no-audit --no-fund
npm test
npm run check
npm run audit
npx firebase emulators:exec --only firestore --project demo-atlas-research --config firebase.emulator.json 'npx tsx --test integration/queue.test.ts'
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com aiplatform.googleapis.com firestore.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com --project="$PROJECT"
if ! gcloud iam service-accounts describe "$RUNTIME" --project="$PROJECT" >/dev/null 2>&1; then
  gcloud iam service-accounts create atlas-research-worker --display-name='Atlas Research Worker' --project="$PROJECT"
fi
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$RUNTIME" --role=roles/datastore.user --condition="expression=resource.name=='projects/$PROJECT/databases/$DATABASE',title=atlas-named-db"
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$RUNTIME" --role=roles/aiplatform.user --condition=None
gcloud storage buckets add-iam-policy-binding gs://hiddenfeed.firebasestorage.app --member="serviceAccount:$RUNTIME" --role=roles/storage.objectViewer --condition="expression=resource.name.startsWith('projects/_/buckets/hiddenfeed.firebasestorage.app/objects/atlas/'),title=atlas-read"
gcloud storage buckets add-iam-policy-binding gs://hiddenfeed.firebasestorage.app --member="serviceAccount:$RUNTIME" --role=roles/storage.objectCreator --condition="expression=resource.name.startsWith('projects/_/buckets/hiddenfeed.firebasestorage.app/objects/atlas/research/'),title=private-research-create"
npx tsx ops/indexes.ts
if ! gcloud artifacts repositories describe atlas-research --location="$REGION" --project="$PROJECT" >/dev/null 2>&1; then
  gcloud artifacts repositories create atlas-research --repository-format=docker --location="$REGION" --project="$PROJECT"
fi
npx tsx src/cli.ts register-existing
npx tsx src/cli.ts seed seed.pilot.json
npx tsx src/cli.ts pilot dursunlu
cd "$REPO_ROOT"
gcloud builds submit . --config=services/research-worker/ops/cloudbuild.yaml --substitutions="_TAG=$TAG" --project="$PROJECT"
gcloud run jobs deploy atlas-research-worker --project="$PROJECT" --region="$REGION" --image="us-west1-docker.pkg.dev/$PROJECT/atlas-research/worker:$TAG" --service-account="$RUNTIME" --tasks=1 --parallelism=1 --max-retries=0 --task-timeout=3600s --cpu=2 --memory=2Gi --set-env-vars="RESEARCH_MODEL=$RESEARCH_MODEL,CHECK_MODEL=$CHECK_MODEL,VERTEX_LOCATION=global"
bash services/research-worker/ops/metrics.sh
printf '\nPilot deployed with publication OFF. Before executing, all research indexes must be READY.\n'
gcloud firestore indexes composite list --project="$PROJECT" --database="$DATABASE" --format='table(name.basename(),state)'
printf '\nRun when indexes are READY: gcloud run jobs execute atlas-research-worker --project=hiddenfeed --region=us-west1 --wait\n'
