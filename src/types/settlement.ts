export type Language = 'tr' | 'en';

export type CanonicalSiteType =
  | 'hominin_findspot'
  | 'open_air_locality'
  | 'cave'
  | 'rock_shelter'
  | 'mound'
  | 'settlement'
  | 'city'
  | 'cemetery'
  | 'necropolis'
  | 'monument'
  | 'sanctuary'
  | 'fortress'
  | 'castle'
  | 'palace'
  | 'workshop'
  | 'harbour'
  | 'road_station'
  | 'church'
  | 'monastery'
  | 'mosque'
  | 'caravanserai'
  | 'other';

export const SITE_TYPE_LABELS: Record<CanonicalSiteType, { tr: string; en: string }> = {
  hominin_findspot: { tr: 'Hominin Buluntu Alanı', en: 'Hominin Findspot' },
  open_air_locality: { tr: 'Açık Hava Lokalitesi', en: 'Open-Air Locality' },
  cave: { tr: 'Mağara', en: 'Cave' },
  rock_shelter: { tr: 'Kaya Sığınağı', en: 'Rock Shelter' },
  mound: { tr: 'Höyük', en: 'Mound (Tell)' },
  settlement: { tr: 'Yerleşim', en: 'Settlement' },
  city: { tr: 'Antik Kent', en: 'Ancient City' },
  cemetery: { tr: 'Mezarlık', en: 'Cemetery' },
  necropolis: { tr: 'Nekropol', en: 'Necropolis' },
  monument: { tr: 'Anıt', en: 'Monument' },
  sanctuary: { tr: 'Kutsal Alan / Tapınak', en: 'Sanctuary' },
  fortress: { tr: 'Müstahkem Kent / Hisar', en: 'Fortress' },
  castle: { tr: 'Kale', en: 'Castle' },
  palace: { tr: 'Saray Kompleksi', en: 'Palace' },
  workshop: { tr: 'Atölye (İşlik)', en: 'Workshop' },
  harbour: { tr: 'Liman', en: 'Harbour' },
  road_station: { tr: 'Yol İstasyonu / Menzil', en: 'Road Station' },
  church: { tr: 'Kilise / Bazilika', en: 'Church / Basilica' },
  monastery: { tr: 'Manastır', en: 'Monastery' },
  mosque: { tr: 'Cami / Külliye', en: 'Mosque / Külliye' },
  caravanserai: { tr: 'Kervansaray / Han', en: 'Caravanserai' },
  other: { tr: 'Arkeolojik Alan', en: 'Archaeological Site' }
};

export type SiteType = CanonicalSiteType | string;
export type PeriodId = string;

export interface SiteVisibility {
  importance: number; // 1 = major/featured, 2 = regional, 3 = local findspot
  minZoom: number;    // zoom level at which marker becomes visible
  featured: boolean;
}

export interface SiteChronologyEntry {
  periodId: string;
  startYear?: number;
  endYear?: number;
  approximate?: boolean;
  note?: string;
}

export interface SiteDateRange {
  startYear: number;
  endYear: number;
  approximate?: boolean;
}

export interface OccupationPeriod {
  startBCE: number; // For compatibility
  endBCE: number;
  startYear?: number; // Canonical year (negative = BCE, positive = CE)
  endYear?: number;
  display?: string;
  approximate?: boolean;
  datingNote?: string;
  note?: string;
}

export interface SettlementPeriodDetail {
  period: string; // Period id or localized label
  periodId?: string;
  startYear?: number;
  endYear?: number;
  startBCE?: number;
  endBCE?: number;
  note?: string;
}

export type ImageType =
  | 'archaeological-photo'
  | 'site-photo'
  | 'artifact'
  | 'site-plan'
  | 'map'
  | 'reconstruction';

export interface SettlementImage {
  url: string;
  thumbnailUrl?: string;
  sourcePageUrl?: string;
  caption: string;
  source?: string;
  credit?: string;
  license?: string;
  licenseUrl?: string;
  type: ImageType | string;
}

export interface BibliographySource {
  id?: string;
  citationKey?: string;
  citationNumber?: number;
  type?: string;
  title: string;
  author?: string;
  authors?: string[];
  year?: number | null;
  publisher?: string;
  journal?: string;
  journalOrPublisher?: string;
  volume?: string;
  pages?: string;
  url?: string;
  pdfUrl?: string;
  doi?: string;
}

export interface KeyFind {
  name: string;
  description: string;
  period?: string;
  sourceIds?: string[];
}

export interface SettlementGeography {
  summary?: string;
  distanceFromNearestCenter?: string;
  landscape?: string;
  gettingThere?: string;
  sourceIds?: string[];
}

export interface VisitHours {
  open?: string | null;
  close?: string | null;
  boxOfficeClose?: string | null;
}

export interface SettlementVisit {
  status?: string;
  statusLabel?: string;
  hours?: VisitHours | null;
  closedDays?: string[];
  museumPass?: boolean | null;
  address?: string;
  phone?: string;
  officialUrl?: string;
  visitorNote?: string;
  lastChecked?: string;
  sourceIds?: string[];
}

export interface NearbyPlace {
  name: string;
  type?: string;
  distance?: string;
  note?: string;
  url?: string;
}

export interface SettlementParticipation {
  title: string;
  status?: string;
  period?: string;
  note?: string;
  url?: string;
}

export interface ResearchDebate {
  title?: string;
  topic?: string;
  text?: string;
  scholarlyDebate?: string;
  consensus?: string;
  evidence?: string;
  sourceIds?: string[];
  citations?: string[];
}

export interface RichContentItem {
  title?: string;
  topic?: string;
  text?: string;
  scholarlyDebate?: string;
  consensus?: string;
  evidence?: string;
  sourceIds?: string[];
  citations?: string[];
}

export type ContentParagraph = string | RichContentItem;

export interface Settlement {
  id: string;
  slug?: string;
  name: string;
  nameTR?: string;
  nameEN?: string;
  alternativeNames: string[];
  province: string;
  provinceTR?: string;
  provinceEN?: string;
  district: string;
  districtTR?: string;
  districtEN?: string;
  modernPlace?: string;
  latitude: number;
  longitude: number;
  siteType: SiteType | string[];
  periods: string[];
  periodDetails?: SettlementPeriodDetail[];
  occupation: OccupationPeriod;
  startYear?: number;
  endYear?: number;
  importanceScore?: number;
  minZoom?: number;
  featured?: boolean;
  visibility?: SiteVisibility;
  overview: ContentParagraph[];
  chronology: ContentParagraph[];
  importance: ContentParagraph[];
  discoveries: ContentParagraph[];
  excavationHistory: ContentParagraph[];
  currentStatus: ContentParagraph[];
  keyFinds?: KeyFind[];
  researchDebates?: ResearchDebate[];
  unescoStatus?: 'World Heritage' | 'Tentative List';
  coordinatesVerified?: boolean;
  images: SettlementImage[];
  sources: BibliographySource[];
  geography?: SettlementGeography;
  visit?: SettlementVisit;
  nearbyPlaces?: NearbyPlace[];
  participation?: SettlementParticipation[];
  isLoadedDetail?: boolean;
}

export interface IndexSettlement {
  id: string;
  file?: string;
  storagePath?: string;
  name?: {
    tr: string;
    en: string;
  };
  nameTR?: string;
  nameEN?: string;
  alternativeNames?: string[] | {
    tr?: string[];
    en?: string[];
    [key: string]: any;
  };
  alternativeNamesTR?: string[];
  alternativeNamesEN?: string[];
  latitude: number;
  longitude: number;
  siteType?: any;
  periods?: string[];
  periodIds?: string[];
  startYear?: number;
  endYear?: number;
  importance?: number;
  minZoom?: number;
  featured?: boolean;
  province?: any;
  district?: any;
  updatedAt?: string;
  occupation?: {
    startBCE?: number;
    endBCE?: number;
    startYear?: number;
    endYear?: number;
    display?: {
      tr: string;
      en: string;
    };
  };
  summary?: {
    tr: string;
    en: string;
  };
}

export interface SiteCore {
  slug?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  siteType?: CanonicalSiteType | string;
  chronology?: SiteChronologyEntry[];
  dateRange?: SiteDateRange;
  visibility?: SiteVisibility;
  // Legacy fields
  periods?: Array<{
    id: string;
    startBCE?: number;
    endBCE?: number;
  }>;
  occupation?: {
    startBCE: number;
    endBCE: number;
    approximate?: boolean;
  };
  visit?: SettlementVisit;
  images?: SettlementImage[];
  sources?: BibliographySource[];
}

export interface SiteLocalizedContent {
  name: string;
  alternativeNames?: string[];
  province: string;
  district: string;
  modernPlace?: string;
  siteType?: string | string[];
  siteTypeLabel?: string;
  periods?: Array<{
    id: string;
    label: string;
    note?: string;
  }>;
  occupationDisplay?: string;
  occupationNote?: string | RichContentItem;
  overview?: ContentParagraph[];
  chronology?: ContentParagraph[];
  importance?: ContentParagraph[];
  discoveries?: ContentParagraph[];
  excavationHistory?: ContentParagraph[];
  currentStatus?: ContentParagraph[];
  keyFinds?: Array<{
    name: string;
    description: string;
    period?: string;
  }>;
  researchDebates?: ResearchDebate[];
  geography?: SettlementGeography;
  visit?: {
    statusLabel?: string;
    address?: string;
    visitorNote?: string;
    sourceIds?: string[];
  };
  nearbyPlaces?: NearbyPlace[];
  participation?: SettlementParticipation[];
}

export interface SiteDetail {
  id: string;
  core: SiteCore;
  content: {
    tr: SiteLocalizedContent;
    en: SiteLocalizedContent;
  };
}

