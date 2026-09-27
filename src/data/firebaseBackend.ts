import { collection, getDocs } from 'firebase/firestore';
import { db, STORAGE_SITES_PATH } from '../config/firebase';
import { IndexSettlement, SiteDetail } from '../types/settlement';

export { STORAGE_SITES_PATH };

/**
 * Fetches all index records from Firestore collection 'sites_index'.
 */
export async function getSitesIndexFromFirestore(): Promise<IndexSettlement[]> {
  const sitesRef = collection(db, 'sites_index');
  const snapshot = await getDocs(sitesRef);

  if (snapshot.empty) {
    return [];
  }

  const items: IndexSettlement[] = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data() as IndexSettlement;
    items.push({
      ...data,
      id: docSnap.id
    });
  });

  return items;
}

/**
 * Lazy-loads a detailed site JSON directly from Firebase Storage under `atlas/sites/${cleanId}.json`.
 * Firebase Storage is the sole authoritative source for full archaeological monographs.
 * Attempts client Storage download (getBytes / getDownloadURL) and falls back to same-origin Storage proxy if browser CORS blocks client fetch.
 * Returns null if the site is not present in Firebase Storage.
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
