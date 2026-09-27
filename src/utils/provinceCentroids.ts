/**
 * Exact precomputed centroids [lng, lat] for all 81 provinces of Turkey.
 * Used for placing the single hover label directly on the province centroid
 * without polygon tiling duplication or multi-part label fragmentation.
 */

export const PROVINCE_CENTROIDS: Record<string, [number, number]> = {
  Adana: [35.5948, 37.4614],
  Adıyaman: [38.3357, 37.8046],
  Afyon: [30.6557, 38.6225],
  Ağrı: [43.2687, 39.5746],
  Aksaray: [33.8416, 38.3711],
  Amasya: [35.7213, 40.6914],
  Ankara: [32.6175, 39.7952],
  Antalya: [30.9221, 36.7992],
  Ardahan: [42.7621, 41.1162],
  Artvin: [41.8167, 41.1096],
  Aydın: [28.0177, 37.7529],
  Balıkesir: [27.8722, 39.6653],
  Bartın: [32.4691, 41.5487],
  Batman: [41.4081, 38.001],
  Bayburt: [40.2315, 40.2369],
  Bilecik: [30.12, 40.116],
  Bingöl: [40.7217, 39.0457],
  Bitlis: [42.4025, 38.5506],
  Bolu: [31.6672, 40.601],
  Burdur: [30.0907, 37.4229],
  Bursa: [29.0272, 40.1145],
  Çanakkale: [26.8104, 39.9844],
  Çankırı: [33.4271, 40.6897],
  Çorum: [34.6622, 40.5664],
  Denizli: [29.2628, 37.734],
  Diyarbakır: [40.3466, 38.136],
  Düzce: [31.2679, 40.8943],
  Edirne: [26.6034, 41.2456],
  Elazığ: [39.4273, 38.6763],
  Erzincan: [39.3162, 39.6658],
  Erzurum: [41.5626, 40.055],
  Eskişehir: [31.0787, 39.5987],
  Gaziantep: [37.3439, 37.0918],
  Giresun: [38.5912, 40.5757],
  Gümüşhane: [39.4132, 40.332],
  Hakkari: [44.109, 37.4354],
  Hatay: [36.2563, 36.4417],
  Iğdır: [43.9642, 39.9038],
  Isparta: [30.9528, 37.9227],
  İstanbul: [28.5608, 41.1939],
  İzmir: [27.3148, 38.4836],
  Kahramanmaraş: [36.9857, 37.9208],
  Karabük: [32.6327, 41.1661],
  Karaman: [33.1932, 37.043],
  Kars: [43.066, 40.4739],
  Kastamonu: [33.6694, 41.4908],
  Kayseri: [35.8565, 38.6789],
  Kilis: [37.1447, 36.8071],
  Kırıkkale: [33.6983, 39.7794],
  Kırklareli: [27.4443, 41.6817],
  Kırşehir: [34.1685, 39.3156],
  Kocaeli: [29.8952, 40.8586],
  Konya: [32.6399, 38.0382],
  Kütahya: [29.5879, 39.2726],
  Malatya: [38.1164, 38.5124],
  Manisa: [28.1478, 38.7651],
  Mardin: [40.8988, 37.3662],
  Mersin: [33.8276, 36.6914],
  Muğla: [28.4703, 37.0275],
  Muş: [41.8823, 39.0138],
  Nevşehir: [34.6911, 38.8116],
  Niğde: [34.7369, 37.9538],
  Ordu: [37.5366, 40.7875],
  Osmaniye: [36.2452, 37.2653],
  Rize: [40.8696, 40.9323],
  Sakarya: [30.5404, 40.7414],
  Samsun: [36.0176, 41.2128],
  Şanlıurfa: [39.1035, 37.2504],
  Siirt: [42.1852, 37.9481],
  Sinop: [34.8835, 41.6233],
  Şırnak: [42.6157, 37.5069],
  Sivas: [37.3162, 39.5679],
  Tekirdağ: [27.4454, 41.1119],
  Tokat: [36.6068, 40.3656],
  Trabzon: [39.8185, 40.7973],
  Tunceli: [39.5117, 39.1886],
  Uşak: [29.3603, 38.5347],
  Van: [43.6379, 38.4758],
  Yalova: [29.1236, 40.5868],
  Yozgat: [35.2507, 39.6628],
  Zonguldak: [31.8412, 41.2521]
};

/**
 * Calculates centroid of a polygon ring using area-weighted formula.
 */
function getPolygonCentroid(coords: number[][]): [number, number] {
  let area = 0;
  let cx = 0;
  let cy = 0;
  const n = coords.length;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = coords[i];
    const [x1, y1] = coords[i + 1];
    const a = x0 * y1 - x1 * y0;
    area += a;
    cx += (x0 + x1) * a;
    cy += (y0 + y1) * a;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-7) {
    let sx = 0;
    let sy = 0;
    for (let i = 0; i < n; i++) {
      sx += coords[i][0];
      sy += coords[i][1];
    }
    return [sx / n, sy / n];
  }
  return [Number((cx / (6 * area)).toFixed(4)), Number((cy / (6 * area)).toFixed(4))];
}

/**
 * Calculates area of a closed polygon ring.
 */
function getRingArea(coords: number[][]): number {
  let area = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
  }
  return Math.abs(area * 0.5);
}

/**
 * Calculates geometric representative centroid for arbitrary Polygon or MultiPolygon.
 * For MultiPolygon (such as Istanbul, Izmir, islands), selects the largest mainland ring.
 */
export function calculateFeatureCentroid(geometry: any): [number, number] | null {
  if (!geometry || !geometry.type || !geometry.coordinates) return null;

  if (geometry.type === 'Polygon') {
    return getPolygonCentroid(geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    let maxArea = -1;
    let bestRing: number[][] | null = null;
    for (const poly of geometry.coordinates) {
      if (poly && poly[0]) {
        const a = getRingArea(poly[0]);
        if (a > maxArea) {
          maxArea = a;
          bestRing = poly[0];
        }
      }
    }
    if (bestRing) {
      return getPolygonCentroid(bestRing);
    }
  }
  return null;
}

/**
 * Resolves province centroid coordinates [lng, lat].
 * Uses precomputed coordinates first, falling back to dynamic geometric calculation.
 */
export function getProvinceCentroid(provinceName?: string, geometry?: any): [number, number] | null {
  if (provinceName && PROVINCE_CENTROIDS[provinceName]) {
    return PROVINCE_CENTROIDS[provinceName];
  }
  // Try case-insensitive matching if exact key is not found
  if (provinceName) {
    const lower = provinceName.toLocaleLowerCase('tr-TR').trim();
    for (const [key, coords] of Object.entries(PROVINCE_CENTROIDS)) {
      if (key.toLocaleLowerCase('tr-TR').trim() === lower) {
        return coords;
      }
    }
  }
  // Dynamic fallback to geometry
  if (geometry) {
    return calculateFeatureCentroid(geometry);
  }
  return null;
}
