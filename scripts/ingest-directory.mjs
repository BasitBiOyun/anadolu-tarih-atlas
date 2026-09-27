import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const inputDir = process.argv[2] || 'research/sites';
const baseUrl = (process.env.ATLAS_INGESTION_BASE_URL || '').replace(/\/$/, '');
const token = process.env.ATLAS_INGESTION_TOKEN;
const workerId = process.env.ATLAS_WORKER_ID || 'github-research-ingest';

if (!baseUrl) {
  throw new Error('ATLAS_INGESTION_BASE_URL is required.');
}
if (!token) {
  throw new Error('ATLAS_INGESTION_TOKEN is required.');
}

const entries = (await readdir(inputDir, { withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
  .map(entry => entry.name)
  .sort();

if (entries.length === 0) {
  console.log(`No JSON files found in ${inputDir}.`);
  process.exit(0);
}

let succeeded = 0;

for (const filename of entries) {
  const absolutePath = path.join(inputDir, filename);
  const text = await readFile(absolutePath, 'utf8');
  const site = JSON.parse(text);

  if (!site?.id || typeof site.id !== 'string') {
    throw new Error(`${filename}: missing string site.id`);
  }

  console.log(`Ingesting ${site.id} from ${filename}...`);

  const response = await fetch(`${baseUrl}/api/atlas/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      workerId,
      site
    })
  });

  const bodyText = await response.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = { raw: bodyText };
  }

  if (!response.ok) {
    console.error(JSON.stringify(body, null, 2));
    throw new Error(`${site.id}: ingestion failed with HTTP ${response.status}`);
  }

  if (!body?.success || body?.storageUploaded !== true) {
    console.error(JSON.stringify(body, null, 2));
    throw new Error(`${site.id}: ingestion endpoint did not confirm durable Storage success`);
  }

  succeeded += 1;
  console.log(`✓ ${site.id} -> ${body.storagePath || 'Storage'}`);
}

console.log(`Successfully ingested ${succeeded}/${entries.length} site JSON files.`);
