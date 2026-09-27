import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Configure MapLibre Web Worker for Vite bundler
if (typeof window !== 'undefined' && workerUrl) {
  setWorkerUrl(workerUrl);
}

export { workerUrl };
