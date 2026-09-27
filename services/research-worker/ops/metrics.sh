#!/usr/bin/env bash
set -euo pipefail
for EVENT in delivered published quality_rejected worker_error publication_pending; do
  METRIC="atlas_research_$EVENT"
  FILTER="resource.type=\"cloud_run_job\" AND resource.labels.job_name=\"atlas-research-worker\" AND jsonPayload.event=\"$EVENT\""
  if ! gcloud logging metrics describe "$METRIC" --project=hiddenfeed >/dev/null 2>&1; then
    gcloud logging metrics create "$METRIC" --project=hiddenfeed --description="Atlas research $EVENT count" --log-filter="$FILTER"
  fi
done
