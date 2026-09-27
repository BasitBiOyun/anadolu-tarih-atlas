import {
  IndexSettlement,
  SiteDetail,
  Settlement,
  Language,
  CanonicalSiteType,
  SITE_TYPE_LABELS
} from '../types/settlement';
import { normalizePeriodId, getPeriodConfig, getPeriodLabel, updatePeriodsData } from './periods';
import { formatDateRange } from '../utils/chronology';
import {
  getSitesIndexFromFirestore,
  fetchSiteDetailFromStorage
} from './firebaseBackend';

let cachedIndex: IndexSettlement[] | null = null;
let pendingIndexPromise: Promise<IndexSettlement[]> | null = null;

let cachedPeriods: any | null = null;
let pendingPeriodsPromise: Promise<any> | null = null;

const siteDetailCache = new Map<string, SiteDetail>();
const pendingSitePromises = new Map<string, Promise<SiteDetail>>();

/**
 * Resolves a site type into localized human readable string.
 * Supports canonical keys ('cave' -> 'Mağara'), object ({ tr, en }), array, or raw string.
 */
export function resolveSiteType(rawType: any, lang: Language): string {
  if (!rawType) return lang === 'en' ? 'Archaeological Site' : 'Arkeolojik Alan';

  if (Array.isArray(rawType)) {
    return rawType
      .map(item => resolveSiteType(item, lang))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof rawType === 'object') {
    return (
      rawType[lang] ||
      rawType.tr ||
      rawType.en ||
      (lang === 'en' ? 'Archaeological Site' : 'Arkeolojik Alan')
    );
  }

  if (typeof rawType === 'string') {
    const key = rawType.toLowerCase().trim() as CanonicalSiteType;
    if (SITE_TYPE_LABELS[key]) {
      return SITE_TYPE_LABELS[key][lang];
    }
    return rawType;
  }

  return lang === 'en' ? 'Archaeological Site' : 'Arkeolojik Alan';
}

/**
 * Strips legacy limitation phrases if present in dataset notes
 */
function cleanScopeNote(text?: any): string {
  if (!text) return '';
  const rawStr = typeof text === 'object' ? text.text || '' : String(text);
  return rawStr
    .replace(/^Atlas kapsamı:\s*/i, '')
    .replace(/^atlas coverage:\s*/i, '')
    .replace(/Bu dosyadaki sayısal aralık atlasın.*?sınırlandırılmıştır\./gi, '')
    .replace(/The numerical range here is limited to.*?of this atlas\./gi, '')
    .trim();
}

/**
 * Loads periods.json and keeps period configurations synchronized.
 */
export async function fetchPeriods(): Promise<any> {
  if (cachedPeriods) return cachedPeriods;
  if (pendingPeriodsPromise) return pendingPeriodsPromise;

  pendingPeriodsPromise = fetch('/periods.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error loading periods.json: ${res.status}`);
      return res.json();
    })
    .then(data => {
      cachedPeriods = data;
      pendingPeriodsPromise = null;
      updatePeriodsData(data);
      return data;
    })
    .catch(err => {
      pendingPeriodsPromise = null;
      throw err;
    });

  return pendingPeriodsPromise;
}

/**
 * Loads the lightweight map/search index solely from Cloud Firestore 'sites_index'.
 * If a site does not exist in Firebase, it will not appear as an available site.
 */
export async function fetchSettlementIndex(): Promise<IndexSettlement[]> {
  if (cachedIndex) return cachedIndex;
  if (pendingIndexPromise) return pendingIndexPromise;

  pendingIndexPromise = (async () => {
    try {
      const firestoreSites = await getSitesIndexFromFirestore();
      cachedIndex = firestoreSites;
      pendingIndexPromise = null;
      return firestoreSites;
    } catch (err) {
      console.error('[Firestore] Failed to query sites_index:', err);
      pendingIndexPromise = null;
      return [];
    }
  })();

  return pendingIndexPromise;
}

/**
 * Lazy-loads the detailed bilingual site monograph solely from Firebase Storage at atlas/sites/{id}.json.
 * If the site does not exist in Firebase Storage, an error is thrown; there is zero local fallback.
 */
export async function fetchSiteDetail(id: string): Promise<SiteDetail> {
  const cleanId = id.replace(/^sites\//, '').replace(/\.json$/, '');
  const cached = siteDetailCache.get(cleanId);
  if (cached) return cached;

  const pending = pendingSitePromises.get(cleanId);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const storageDetail = await fetchSiteDetailFromStorage(cleanId);
      if (!storageDetail) {
        throw new Error(
          `Archaeological site monograph for "${cleanId}" does not exist in Firebase Storage (atlas/sites/${cleanId}.json).`
        );
      }

      siteDetailCache.set(cleanId, storageDetail);
      return storageDetail;
    } finally {
      pendingSitePromises.delete(cleanId);
    }
  })();

  pendingSitePromises.set(cleanId, promise);
  return promise;
}

export function getCachedSiteDetail(id: string): SiteDetail | undefined {
  const cleanId = id.replace(/^sites\//, '').replace(/\.json$/, '');
  return siteDetailCache.get(cleanId);
}

/**
 * Builds a lightweight Settlement object from the index entry for map markers and search
 */
export function buildIndexSettlement(item: IndexSettlement, lang: Language): Settlement {
  const rawPeriods = item.periodIds || item.periods || [];
  const normalizedPeriods: string[] = rawPeriods.map(normalizePeriodId);

  const siteTypeVal = resolveSiteType(item.siteType, lang);

  const nameTR = item.nameTR || (item.name ? item.name.tr : item.id);
  const nameEN = item.nameEN || (item.name ? item.name.en : item.id);
  const nameVal = lang === 'en' ? nameEN : nameTR;

  const districtVal =
    typeof item.district === 'string'
      ? item.district
      : item.district
      ? item.district[lang] || item.district.tr || item.district.en || ''
      : '';
  const provinceVal =
    typeof item.province === 'string'
      ? item.province
      : item.province
      ? item.province[lang] || item.province.tr || item.province.en || ''
      : '';

  // Extract alternative names array in active language (or flattened)
  let altNamesVal: string[] = [];
  if (lang === 'en' && Array.isArray(item.alternativeNamesEN) && item.alternativeNamesEN.length > 0) {
    altNamesVal = item.alternativeNamesEN;
  } else if (lang === 'tr' && Array.isArray(item.alternativeNamesTR) && item.alternativeNamesTR.length > 0) {
    altNamesVal = item.alternativeNamesTR;
  } else if (Array.isArray(item.alternativeNames)) {
    altNamesVal = item.alternativeNames;
  } else if (item.alternativeNames && typeof item.alternativeNames === 'object') {
    altNamesVal = (item.alternativeNames as any)[lang] || (item.alternativeNames as any).tr || (item.alternativeNames as any).en || [];
  }

  // Determine startYear and endYear (null preserved as undefined without fabricating dates)
  const startYear =
    item.startYear !== null && item.startYear !== undefined ? item.startYear : undefined;
  const endYear =
    item.endYear !== null && item.endYear !== undefined ? item.endYear : undefined;

  // Authentic display text or clean automatic date range
  let displayVal = item.occupation?.display
    ? typeof item.occupation.display === 'string'
      ? item.occupation.display
      : item.occupation.display[lang] || item.occupation.display.tr || ''
    : '';
  displayVal = cleanScopeNote(displayVal);
  if (!displayVal && startYear !== undefined && endYear !== undefined) {
    displayVal = formatDateRange(startYear, endYear, lang);
  }

  const summaryVal = item.summary
    ? typeof item.summary === 'string'
      ? item.summary
      : item.summary[lang] || item.summary.tr || ''
    : '';

  const importance = item.importance ?? (item.featured ? 1 : 2);
  const minZoom = item.minZoom ?? (importance === 1 ? 1.0 : 2.0);
  const featured = item.featured ?? (importance === 1);

  return {
    id: item.id,
    name: nameVal,
    nameTR: nameTR,
    nameEN: nameEN,
    alternativeNames: altNamesVal,
    province: provinceVal,
    provinceTR: typeof item.province === 'string' ? item.province : item.province?.tr,
    provinceEN: typeof item.province === 'string' ? item.province : item.province?.en,
    district: districtVal,
    districtTR: typeof item.district === 'string' ? item.district : item.district?.tr,
    districtEN: typeof item.district === 'string' ? item.district : item.district?.en,
    latitude: item.latitude,
    longitude: item.longitude,
    siteType: siteTypeVal,
    periods: normalizedPeriods,
    startYear,
    endYear,
    importanceScore: importance,
    minZoom,
    featured,
    visibility: {
      importance,
      minZoom,
      featured
    },
    occupation: {
      startBCE:
        startYear !== undefined && startYear < 0
          ? Math.abs(startYear)
          : item.occupation?.startBCE || 0,
      endBCE:
        endYear !== undefined && endYear < 0
          ? Math.abs(endYear)
          : item.occupation?.endBCE || 0,
      startYear,
      endYear,
      display: displayVal
    },
    overview: summaryVal ? [summaryVal] : [],
    chronology: [],
    importance: [],
    discoveries: [],
    excavationHistory: [],
    currentStatus: [],
    images: [],
    sources: [],
    isLoadedDetail: false
  };
}

/**
 * Transforms the detailed bilingual site JSON into a localized Settlement
 * for the detail panel, mini-map, image gallery and sources view.
 */
export function buildLocalizedSettlement(detail: SiteDetail, lang: Language): Settlement {
  const content = detail.content[lang] || detail.content['tr'];
  const core = detail.core;

  // 1. Periods & Chronology
  let normalizedPeriods: string[] = [];
  let periodDetails: Array<{
    period: string;
    periodId?: string;
    startYear?: number;
    endYear?: number;
    startBCE?: number;
    endBCE?: number;
    note?: string;
  }> = [];

  // Core chronology
  if (core.chronology && core.chronology.length > 0) {
    normalizedPeriods = core.chronology.map(c => normalizePeriodId(c.periodId));
    periodDetails = core.chronology.map(c => {
      const pId = normalizePeriodId(c.periodId);
      const cfg = getPeriodConfig(pId);
      const label = getPeriodLabel(pId, lang);
      const sYear = c.startYear ?? cfg.startYear;
      const eYear = c.endYear ?? cfg.endYear;
      return {
        period: label,
        periodId: pId,
        startYear: sYear,
        endYear: eYear,
        startBCE: sYear !== undefined && sYear < 0 ? Math.abs(sYear) : 0,
        endBCE: eYear !== undefined && eYear < 0 ? Math.abs(eYear) : 0,
        note: c.note
      };
    });
  } else if (core.periods && core.periods.length > 0) {
    normalizedPeriods = core.periods.map(p => normalizePeriodId(p.id));
    periodDetails = normalizedPeriods.map(pId => {
      const cfg = getPeriodConfig(pId);
      const label = getPeriodLabel(pId, lang);
      return {
        period: label,
        periodId: pId,
        startYear: cfg.startYear,
        endYear: cfg.endYear,
        startBCE: cfg.startYear < 0 ? Math.abs(cfg.startYear) : 0,
        endBCE: cfg.endYear < 0 ? Math.abs(cfg.endYear) : 0
      };
    });
  }

  // 2. Date Range
  const startYear =
    core.dateRange?.startYear !== null && core.dateRange?.startYear !== undefined
      ? core.dateRange.startYear
      : undefined;
  const endYear =
    core.dateRange?.endYear !== null && core.dateRange?.endYear !== undefined
      ? core.dateRange.endYear
      : undefined;

  // 3. Site Type: Priority to content.siteTypeLabel, then content.siteType, then core.siteType
  const rawSiteType = content.siteTypeLabel || content.siteType || core.siteType;
  const siteTypeVal = resolveSiteType(rawSiteType, lang);

  // 4. Clean display string
  let displayVal = cleanScopeNote(content.occupationDisplay);
  if (!displayVal && startYear !== undefined && endYear !== undefined) {
    displayVal = formatDateRange(startYear, endYear, lang);
  }

  const cleanNote = cleanScopeNote(content.occupationNote);

  // 5. Visibility
  const importance = core.visibility?.importance ?? 1;
  const minZoom = core.visibility?.minZoom ?? (importance === 1 ? 1.0 : 2.0);
  const featured = core.visibility?.featured ?? (importance === 1);

  // 6. UNESCO Status
  const isUnesco = (content.currentStatus || []).some((s: any) => {
    const text = typeof s === 'string' ? s : s?.text || s?.title || '';
    return text.toLowerCase().includes('unesco');
  });

  return {
    id: detail.id,
    name: content.name,
    nameTR: detail.content.tr?.name || content.name,
    nameEN: detail.content.en?.name || content.name,
    alternativeNames: Array.isArray(content.alternativeNames) ? content.alternativeNames : [],
    province: content.province,
    district: content.district,
    modernPlace: content.modernPlace,
    latitude: core.coordinates.latitude,
    longitude: core.coordinates.longitude,
    siteType: siteTypeVal,
    periods: normalizedPeriods,
    periodDetails,
    startYear,
    endYear,
    importanceScore: importance,
    minZoom,
    featured,
    visibility: {
      importance,
      minZoom,
      featured
    },
    occupation: {
      startBCE:
        startYear !== undefined && startYear < 0
          ? Math.abs(startYear)
          : core.occupation?.startBCE || 0,
      endBCE:
        endYear !== undefined && endYear < 0
          ? Math.abs(endYear)
          : core.occupation?.endBCE || 0,
      startYear,
      endYear,
      display: displayVal,
      approximate: core.dateRange?.approximate ?? core.occupation?.approximate,
      datingNote: cleanNote
    },
    overview: Array.isArray(content.overview) ? content.overview : content.overview ? [content.overview] : [],
    chronology: Array.isArray(content.chronology) ? content.chronology : content.chronology ? [content.chronology] : [],
    importance: Array.isArray(content.importance) ? content.importance : content.importance ? [content.importance] : [],
    discoveries: Array.isArray(content.discoveries) ? content.discoveries : content.discoveries ? [content.discoveries] : [],
    excavationHistory: Array.isArray(content.excavationHistory) ? content.excavationHistory : content.excavationHistory ? [content.excavationHistory] : [],
    currentStatus: Array.isArray(content.currentStatus) ? content.currentStatus : content.currentStatus ? [content.currentStatus] : [],
    keyFinds: (content.keyFinds || []).map((kf: any) => ({
      name: kf.name,
      description: kf.description,
      period: kf.period,
      sourceIds: kf.sourceIds || kf.citations || []
    })),
    researchDebates: content.researchDebates || [],
    unescoStatus: isUnesco ? 'World Heritage' : undefined,
    images: (core.images || []).map(img => {
      const captionText =
        typeof img.caption === 'object' && img.caption !== null
          ? (img.caption as any)[lang] ||
            (img.caption as any).tr ||
            (img.caption as any).en ||
            ''
          : img.caption || '';
      return {
        ...img,
        caption: captionText,
        type: img.type || 'site-photo'
      };
    }),
    sources: (core.sources || []).map(src => ({
      ...src,
      authors: src.authors
    })),
    geography: content.geography ? {
      ...content.geography,
      sourceIds: content.geography.sourceIds || []
    } : undefined,
    visit: {
      status: core.visit?.status,
      statusLabel: content.visit?.statusLabel,
      hours: core.visit?.hours,
      closedDays: core.visit?.closedDays,
      museumPass: core.visit?.museumPass,
      phone: core.visit?.phone,
      officialUrl: core.visit?.officialUrl,
      address: content.visit?.address,
      visitorNote: content.visit?.visitorNote,
      sourceIds: content.visit?.sourceIds || []
    },
    nearbyPlaces: content.nearbyPlaces || [],
    participation: content.participation || [],
    isLoadedDetail: true
  };
}
