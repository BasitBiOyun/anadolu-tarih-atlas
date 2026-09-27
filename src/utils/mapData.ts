/**
 * Cached loader for Turkey and Surrounding Countries GeoJSON map data
 * Prevents redundant fetches and shares geometry across components.
 */

let cachedTurkeyGeo: any = null;
let pendingTurkeyPromise: Promise<any> | null = null;

let cachedSurroundingGeo: any = null;
let pendingSurroundingPromise: Promise<any> | null = null;

export async function fetchTurkeyGeo(): Promise<any> {
  if (cachedTurkeyGeo) return cachedTurkeyGeo;
  if (pendingTurkeyPromise) return pendingTurkeyPromise;

  pendingTurkeyPromise = fetch('/maps/turkey.geojson')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      cachedTurkeyGeo = data;
      pendingTurkeyPromise = null;
      return data;
    })
    .catch(err => {
      pendingTurkeyPromise = null;
      throw err;
    });

  return pendingTurkeyPromise;
}

export function getCachedTurkeyGeo(): any | null {
  return cachedTurkeyGeo;
}

export async function fetchSurroundingGeo(): Promise<any> {
  if (cachedSurroundingGeo) return cachedSurroundingGeo;
  if (pendingSurroundingPromise) return pendingSurroundingPromise;

  pendingSurroundingPromise = fetch('/maps/surrounding.geojson')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      cachedSurroundingGeo = data;
      pendingSurroundingPromise = null;
      return data;
    })
    .catch(err => {
      pendingSurroundingPromise = null;
      throw err;
    });

  return pendingSurroundingPromise;
}

export function getCachedSurroundingGeo(): any | null {
  return cachedSurroundingGeo;
}
