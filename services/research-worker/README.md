# Atlas Research Worker — pilot implementation

**Status:** code and local tests only until the Cloud Shell pilot is executed. No production scheduler is enabled by this repository. No new archaeological record has been researched or published by this implementation yet. The 10 reference JSONs are regression fixtures, not independently reverified scholarship.

Preserved publication chain:

`Research worker → Drive Inbox → atlas-drive-import → atlas/sites/*.json → Eventarc → atlas-storage-sync → sites_index → site`

The worker never writes canonical `atlas/sites/` objects or `sites_index`. Its only Storage writes are immutable private audit files under `atlas/research/`. Existing bucket rules deny browser access there and the existing sync ignores that prefix. Existing service code and the frontend are unchanged.

## Runtime

- Independent Cloud Run **Job**, region `us-west1`, 10 parallel tasks when production is enabled. Job execution avoids keeping an HTTP request alive for long research operations.
- Named Firestore DB: `ai-studio-anadolutarihnces-f71dcc77-2c3d-464d-a885-67c82d256cf1` in `hiddenfeed`.
- Global transaction counter caps all executions/retries/enrichment at **10 claims per UTC hour**. A capacity lease also caps live claims at 10 across overlapping executions. Pilot limit is 1.
- Queue order uses canonical `periods.json`: early Pleistocene → Palaeolithic subdivisions → Neolithic → Chalcolithic → early/middle/late Bronze → Iron → Archaic → Classical → Hellenistic → Roman → Late Antiquity → Byzantine → Seljuk → Beyliks → Ottoman. Within a period: earliest known year, importance, stable ID. Seed chronology is an unverified scheduling hint, never copied as a fact.
- Transactions claim with unique fencing tokens, 10-minute leases and 1-minute renewal. Expired/deferred items are recovered by bounded queries. Backoff has jitter; core quality failure gets a second research attempt before quarantine; technical/drafting failures get at most 5 attempts before dead-letter.
- Queue status `ready` is deliberate: the old application's `/claim` only consumes `pending`. Do not send new worker jobs to old `/claim` or `/upload`.
- Unlimited incremental JSON seed arrays via `seed`; 5,001-record emulator test included. Alias+province, canonical slug and optional external-ID reservations prevent known duplicates transactionally. Existing index identities are registered first. A location/name check and Drive-name check run before publication. Unknown aliases still need identity review; arbitrary semantic deduplication is not guaranteed.

## Quality

1. Grounded source discovery in Turkish/English.
2. Actual HTML/PDF retrieval, redirect/IP/size/time limits, timestamp+hash. Private/metadata IPs are denied at DNS connect time. Search snippets are not accepted as evidence.
3. Extract facts with exact retrieved quotations; reject extraction entries whose quotations cannot be found.
4. Draft TR/EN schemaVersion 4 monographs from retrieved sources, using a reference only for structure.
5. Independent checker calls check every factual leaf against retrieved text, including core identity/coordinates/chronology and TR/EN equivalence. Checks are bound to the final JSON hash. A changed draft loses approval.
6. Existing validator plus worker constraints: canonical types/periods, finite dates/coordinates, citations, source retrieval, coverage, minimum narrative substance, independent source hosts, no workflow data.
7. `publishable` / `needs_enrichment` can deliver; missing optional sections remain empty. Core conflicts/unsupported facts retry then quarantine. Draft errors retry then dead-letter, not archaeology quarantine.

**Limits:** model checking reduces errors; it cannot guarantee historical truth. Two hosts alone do not prove scholarly independence; the checker must assess dependence. Pilot human/agent review remains necessary. New authoritative source hosts can be added through `TRUSTED_SOURCE_HOSTS` after verification. No image is emitted in v1: the gate rejects nonempty images until an independent license verifier is implemented. Images alone therefore keep a record in `needs_enrichment`; this is publishable. Enrichment is bounded to 3 cycles before review, so missing optional material cannot create an infinite loop.

## Delivery and recovery

An immutable outbox reserves a Google Drive file ID before creation and binds it to a payload hash. A timeout/crash retry uses the same ID; HTTP 409 is only treated as successful after actual content readback matches. All retrying publishers for that intent send identical bytes. Enrichment creates an intentional new immutable revision with the same canonical filename; the existing importer selects the newest file. This produces one logical site in Storage/Firestore, though Drive retains revision files.

`delivered` means Drive readback passed. `published` additionally requires Storage hash and source Drive ID plus index identity/coordinates/periods/update time to match. A stalled publication emits a structured log. The current sync acknowledges failures; this worker does **not** silently claim these succeeded or rewrite the index. Repair must use the existing sync service after investigating `atlas_sync_errors`.

## Tests

```bash
npm ci
npm test
npm run check
npm run audit
npx firebase emulators:exec --only firestore --project demo-atlas-research --config firebase.emulator.json 'npx tsx --test integration/queue.test.ts'
```

The integration test refuses to run without a localhost emulator and uses a demo project, never the production project. The local Windows JDK may fail opening its Unix-domain selector socket; run that integration command in Cloud Shell/Linux if so. Emulator index behavior is not production index verification; `ops/indexes.ts` creates additive indexes in the explicit named database.

All 10 fixtures pass the pre-existing validator. Ani and Aphrodisias use noncanonical legacy siteType values; the new worker reports them without modifying those originals.

Cloud Shell verification on 2026-09-28: npm clean install, all 18 unit tests, TypeScript checking, and both Firestore emulator integration tests passed. The integration run seeded 5,001 synthetic records and checked concurrent claims, chronological priority, hourly limits, capacity, fencing, recovery and duplicate rejection. This is queue verification, not evidence that live research quality or Drive publication has passed.

## Cloud Shell pilot

First run local unit/type checks and emulator integration. Select a currently available Vertex model (both model IDs are required in runtime configuration; no silent fallback).

```bash
export RESEARCH_MODEL='YOUR_AVAILABLE_VERTEX_MODEL_ID'
export CHECK_MODEL="$RESEARCH_MODEL"
bash services/research-worker/ops/pilot.sh
```

This creates only new research resources and additive indexes/IAM grants. It seeds three candidate names, registers existing published identities, deploys one task, and disables publication. Confirm indexes are READY, then execute the displayed command. Use `npx tsx src/cli.ts status` and `export-pilot dursunlu` to inspect the result. No 5,000-entry production seed is fabricated; import a real candidate catalogue when the pilot passes.

Before creating the worker resources, the installer probes structured output for both selected models and Google Search grounding using the deployer's credentials. An unavailable model or failed search stops installation. This does not prove the runtime service account's access; the first unpublished pilot checks that separately.

## Drive authorization (required for My Drive)

The existing importer only needs `drive.readonly`; reading permission does not imply writer capability. A service account has no personal Drive quota. Keep the specified Inbox by using a dedicated user OAuth client and a durable refresh token stored in Secret Manager, mounted as `/secrets/drive/oauth.json`. Runtime setting: `DRIVE_OAUTH_FILE=/secrets/drive/oauth.json`. The JSON has type `authorized_user`, client_id, client_secret, refresh_token. Never place it in Git, logs or chat. Use a dedicated OAuth client in production publishing status; external apps left in Testing can issue short-lived refresh tokens.

Authorize using your own OAuth client (`gcloud auth application-default login --client-id-file=... --scopes=https://www.googleapis.com/auth/drive --no-launch-browser`) in a separate gcloud configuration directory to avoid replacing existing ADC. Scope `drive.file` is preferable when the app has been explicitly granted access to this existing folder through Picker; do not assume it can see the Inbox automatically. The job hardcodes the designated Inbox and only uploads worker files.

After authorization, run `preflight-drive`. Mount the secret on the pilot Job, run `publish-pilot dursunlu`, and execute the job at the next eligible hourly slot. Re-run the worker for reconciliation (an idle claim performs no new research). Inspect the exported monograph, evidence, citations, translation, index and live page before filling `ops/acceptance.example.json`. Only then use `ops/enable-schedule.sh`. That activation checks the reviewed hash against a verified published pilot before opening the 10/hour gate.

## Operations

`research_jobs` stores attempt metrics, token counts, stage/status, artifact link, quality and errors. Cloud Logging receives structured `stage`, `quality_rejected`, `delivered`, `published`, `publication_pending`, `worker_error` events. `status` reports queue/quarantine/dead-letter/enrichment counts. No alert destination is configured automatically. Monitor job failures, stale leases, publication lag, API token usage and quarantines before scaling.

Emergency stop: `npx tsx src/cli.ts pause` and pause `atlas-research-hourly` in Cloud Scheduler. Existing importer/sync remain operational. Resume only after resolving the cause and reapplying the acceptance gate. Do not delete queue/history/outbox to retry a record; preserve deduplication and delivery IDs.

Official references: [Cloud Run jobs](https://cloud.google.com/run/docs/create-jobs), [scheduled execution](https://cloud.google.com/run/docs/execute/jobs-on-schedule), [named Firestore database IAM](https://firebase.google.com/docs/firestore/manage-databases), [Drive quota and service accounts](https://developers.google.com/workspace/drive/api/guides/handle-errors#storageQuotaExceeded), [pre-generated Drive file IDs](https://developers.google.com/workspace/drive/api/guides/create-file).
