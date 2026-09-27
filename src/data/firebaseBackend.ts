import { IndexSettlement, SiteDetail } from '../types/settlement';

export const STORAGE_SITES_PATH = 'atlas/sites';

/**
 * Loads the published atlas index through the same-origin Cloud Run API.
 * Firebase Storage is authoritative for site existence; the server returns
 * metadata only for JSON monographs that physically exist under atlas/sites/.
 */
export async function getSitesIndexFromFirestore(): Promise<IndexSettlement[]> {
  const response = await fetch('/api/site-index', {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Published site index request failed with HTTP ${response.status}`);
  }

  const items = await response.json();
  return Array.isArray(items) ? items : [];
}

/**
 * Lazy-loads a detailed site JSON through the same-origin server endpoint.
 * Firebase Storage remains the sole authoritative source for full archaeological monographs.
 * The server streams atlas/sites/{id}.json with Cloud Run credentials, avoiding browser CORS retries.
 * Returns null when the canonical Storage object does not exist.
 */
export async function fetchSiteDetailFromStorage(cleanId: string): Promise<SiteDetail | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`/api/sites/${encodeURIComponent(cleanId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Site detail request failed with HTTP ${response.status}`);
    }

    const data: SiteDetail = await response.json();
    return data && data.id ? data : null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
