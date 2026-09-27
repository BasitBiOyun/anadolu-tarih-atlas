/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Central Period & Era Configuration for Anatolian Historical & Archaeological Atlas.
 * Sourced directly from `periods.json` as the single source of truth for all TR/EN labels.
 */

import periodsRaw from './periods.json';

export interface EraConfig {
  id: string;
  nameTr: string;
  nameEn: string;
  shortTr: string;
  shortEn: string;
  order: number;
  periodIds: string[];
}

export interface PeriodConfig {
  id: string;
  eraId: string;
  nameTr: string;
  nameEn: string;
  shortTr: string;
  shortEn: string;
  startYear: number;
  endYear: number;
  color: string;
  contrastColor: string;
  bgLight: string;
  borderColor: string;
  order: number;
  descriptionTr?: string;
  descriptionEn?: string;
}

export interface PeriodsJsonGroup {
  id: string;
  label: { tr: string; en: string };
  periods: string[];
}

export interface PeriodsJsonPeriod {
  label: { tr: string; en: string };
  order: number;
}

export interface PeriodsJsonData {
  version: number;
  groups: PeriodsJsonGroup[];
  periods: Record<string, PeriodsJsonPeriod>;
}

// Runtime reactive store seeded from imported JSON
let activePeriodsData: PeriodsJsonData = periodsRaw as PeriodsJsonData;

const PERIOD_YEAR_BRACKETS: Record<string, { start: number; end: number }> = {
  early_pleistocene: { start: -1800000, end: -780000 },
  lower_palaeolithic: { start: -780000, end: -300000 },
  middle_palaeolithic: { start: -300000, end: -45000 },
  upper_palaeolithic: { start: -45000, end: -14000 },
  epipalaeolithic: { start: -14000, end: -9600 },
  neolithic: { start: -9600, end: -5500 },
  chalcolithic: { start: -5500, end: -3000 },
  early_bronze_age: { start: -3000, end: -2000 },
  middle_bronze_age: { start: -2000, end: -1600 },
  late_bronze_age: { start: -1600, end: -1200 },
  iron_age: { start: -1200, end: -550 },
  archaic: { start: -750, end: -480 },
  classical: { start: -480, end: -330 },
  hellenistic: { start: -330, end: -30 },
  roman: { start: -30, end: 395 },
  late_antiquity: { start: 284, end: 650 },
  byzantine: { start: 330, end: 1453 },
  seljuk: { start: 1077, end: 1308 },
  beyliks: { start: 1300, end: 1453 },
  ottoman: { start: 1299, end: 1922 }
};

const PERIOD_COLOR_PALETTES: Record<
  string,
  { color: string; contrastColor: string; bgLight: string; borderColor: string }
> = {
  early_pleistocene: { color: '#6E472D', contrastColor: '#FFFFFF', bgLight: '#F5ECE5', borderColor: '#D4B59F' },
  lower_palaeolithic: { color: '#855132', contrastColor: '#FFFFFF', bgLight: '#F7EDE6', borderColor: '#DDBFA8' },
  middle_palaeolithic: { color: '#9E6238', contrastColor: '#FFFFFF', bgLight: '#FAF0E8', borderColor: '#E2C7B0' },
  upper_palaeolithic: { color: '#B57442', contrastColor: '#FFFFFF', bgLight: '#FAF2EC', borderColor: '#E8D0BF' },
  epipalaeolithic: { color: '#C48348', contrastColor: '#FFFFFF', bgLight: '#FAF4EC', borderColor: '#EAD8C4' },
  neolithic: { color: '#2E6F40', contrastColor: '#FFFFFF', bgLight: '#EDF5EE', borderColor: '#B8D9C2' },
  chalcolithic: { color: '#B84A1A', contrastColor: '#FFFFFF', bgLight: '#FDF1EC', borderColor: '#F0C7B5' },
  early_bronze_age: { color: '#C27D38', contrastColor: '#FFFFFF', bgLight: '#FAF5EC', borderColor: '#E8D9C0' },
  middle_bronze_age: { color: '#A85C1C', contrastColor: '#FFFFFF', bgLight: '#FAF2E8', borderColor: '#E5CEB4' },
  late_bronze_age: { color: '#8C4314', contrastColor: '#FFFFFF', bgLight: '#FAF0E6', borderColor: '#E0C4A8' },
  iron_age: { color: '#4B5563', contrastColor: '#FFFFFF', bgLight: '#F3F4F6', borderColor: '#CBD5E1' },
  archaic: { color: '#3B7A57', contrastColor: '#FFFFFF', bgLight: '#EDF6F0', borderColor: '#BEDBC6' },
  classical: { color: '#1A64C2', contrastColor: '#FFFFFF', bgLight: '#EBF4FD', borderColor: '#A2C8F7' },
  hellenistic: { color: '#097E8C', contrastColor: '#FFFFFF', bgLight: '#E6F7F8', borderColor: '#8DD6DD' },
  roman: { color: '#9B1B30', contrastColor: '#FFFFFF', bgLight: '#FDF1F3', borderColor: '#EBAEB8' },
  late_antiquity: { color: '#4E538E', contrastColor: '#FFFFFF', bgLight: '#F0F1FA', borderColor: '#BFC3E8' },
  byzantine: { color: '#6B21A8', contrastColor: '#FFFFFF', bgLight: '#F5EEFB', borderColor: '#CFB5E8' },
  seljuk: { color: '#0D9488', contrastColor: '#FFFFFF', bgLight: '#E6F8F5', borderColor: '#96E6DC' },
  beyliks: { color: '#166534', contrastColor: '#FFFFFF', bgLight: '#ECF6EE', borderColor: '#A2E2B4' },
  ottoman: { color: '#991B1B', contrastColor: '#FFFFFF', bgLight: '#FEF2F2', borderColor: '#FCA5A5' }
};

export const LEGACY_PERIOD_KEY_MAP: Record<string, string> = {
  EARLY_PLEISTOCENE: 'early_pleistocene',
  LOWER_PALAEOLITHIC: 'lower_palaeolithic',
  MIDDLE_PALAEOLITHIC: 'middle_palaeolithic',
  UPPER_PALAEOLITHIC: 'upper_palaeolithic',
  EPIPALAEO: 'epipalaeolithic',
  EPIPALEOLITHIC: 'epipalaeolithic',
  NEOLITHIC: 'neolithic',
  CHALCOLITHIC: 'chalcolithic',
  BRONZE_AGE: 'early_bronze_age',
  EARLY_BRONZE: 'early_bronze_age',
  MIDDLE_BRONZE: 'middle_bronze_age',
  LATE_BRONZE: 'late_bronze_age',
  IRON_AGE: 'iron_age',
  ROMAN: 'roman',
  BYZANTINE: 'byzantine',
  anatolian_beyliks: 'beyliks',
  'Anatolian Beyliks': 'beyliks',
  beylikler: 'beyliks'
};

function buildEras(data: PeriodsJsonData): EraConfig[] {
  return data.groups.map((group, idx) => ({
    id: group.id,
    nameTr: group.label.tr,
    nameEn: group.label.en,
    shortTr: group.label.tr,
    shortEn: group.label.en,
    order: idx + 1,
    periodIds: group.periods
  }));
}

function buildPeriods(data: PeriodsJsonData): PeriodConfig[] {
  const periodToEraMap = new Map<string, string>();
  data.groups.forEach(g => {
    g.periods.forEach(pId => {
      periodToEraMap.set(pId, g.id);
    });
  });

  return Object.entries(data.periods)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([id, meta]) => {
      const eraId = periodToEraMap.get(id) || 'deep_time';
      const yearBracket = PERIOD_YEAR_BRACKETS[id] || { start: -5000, end: -1000 };
      const palette = PERIOD_COLOR_PALETTES[id] || {
        color: '#4A7C59',
        contrastColor: '#FFFFFF',
        bgLight: '#EDF5F0',
        borderColor: '#B8D9C2'
      };

      return {
        id,
        eraId,
        nameTr: meta.label.tr,
        nameEn: meta.label.en,
        shortTr: meta.label.tr,
        shortEn: meta.label.en,
        startYear: yearBracket.start,
        endYear: yearBracket.end,
        color: palette.color,
        contrastColor: palette.contrastColor,
        bgLight: palette.bgLight,
        borderColor: palette.borderColor,
        order: meta.order
      };
    });
}

export let ERAS: EraConfig[] = buildEras(activePeriodsData);
export let PERIODS: PeriodConfig[] = buildPeriods(activePeriodsData);

export let PERIOD_MAP: Record<string, PeriodConfig> = {};
PERIODS.forEach(p => {
  PERIOD_MAP[p.id] = p;
});

export let ERA_MAP: Record<string, EraConfig> = {};
ERAS.forEach(e => {
  ERA_MAP[e.id] = e;
});

export let CHRONOLOGICAL_PERIOD_IDS: string[] = PERIODS.map(p => p.id);

export let CANONICAL_PERIOD_LABELS: Record<string, { tr: string; en: string }> = {};
Object.entries(activePeriodsData.periods).forEach(([id, meta]) => {
  CANONICAL_PERIOD_LABELS[id] = {
    tr: meta.label.tr,
    en: meta.label.en
  };
});

/**
 * Updates internal period structures if updated periods.json is fetched.
 */
export function updatePeriodsData(newData: PeriodsJsonData): void {
  if (!newData || !newData.periods || !newData.groups) return;
  activePeriodsData = newData;

  ERAS = buildEras(activePeriodsData);
  PERIODS = buildPeriods(activePeriodsData);

  PERIOD_MAP = {};
  PERIODS.forEach(p => {
    PERIOD_MAP[p.id] = p;
  });

  ERA_MAP = {};
  ERAS.forEach(e => {
    ERA_MAP[e.id] = e;
  });

  CHRONOLOGICAL_PERIOD_IDS = PERIODS.map(p => p.id);

  CANONICAL_PERIOD_LABELS = {};
  Object.entries(activePeriodsData.periods).forEach(([id, meta]) => {
    CANONICAL_PERIOD_LABELS[id] = {
      tr: meta.label.tr,
      en: meta.label.en
    };
  });
}

export function getPeriodConfig(id: string): PeriodConfig {
  const normalizedId = normalizePeriodId(id);
  return (
    PERIOD_MAP[normalizedId] || {
      id,
      eraId: 'deep_time',
      nameTr: id,
      nameEn: id,
      shortTr: id,
      shortEn: id,
      startYear: -10000,
      endYear: -1000,
      color: '#4A7C59',
      contrastColor: '#FFFFFF',
      bgLight: '#EDF5F0',
      borderColor: '#B8D9C2',
      order: 99
    }
  );
}

export function getEraConfig(eraId: string): EraConfig | undefined {
  return ERA_MAP[eraId];
}

export function getPeriodColor(id: string): string {
  return getPeriodConfig(id).color;
}

export function normalizePeriodId(id: string): string {
  const cleanId = String(id || '').trim();
  return LEGACY_PERIOD_KEY_MAP[cleanId] || cleanId.toLowerCase();
}

/**
 * Resolves period labels directly from periods.json according to the active language:
 * TR: Alt Paleolitik, Neolitik, etc.
 * EN: Lower Palaeolithic, Neolithic, etc.
 * Never outputs raw IDs like LOWER_PALAEOLITHIC or early_pleistocene.
 */
export function getPeriodLabel(periodId?: string | null, lang: 'tr' | 'en' = 'tr'): string {
  if (!periodId) return '';
  const raw = String(periodId).trim();
  const normalizedId = normalizePeriodId(raw);

  // 1. Direct match in periods.json
  const jsonPeriod = activePeriodsData.periods[normalizedId];
  if (jsonPeriod?.label) {
    return lang === 'en' ? jsonPeriod.label.en : jsonPeriod.label.tr;
  }

  // 2. Canonical dictionary lookup
  if (CANONICAL_PERIOD_LABELS[normalizedId]) {
    return CANONICAL_PERIOD_LABELS[normalizedId][lang];
  }

  // 3. Fallback to PERIOD_MAP
  const cfg = PERIOD_MAP[normalizedId];
  if (cfg) {
    return lang === 'en' ? cfg.nameEn : cfg.nameTr;
  }

  // 4. Clean formatting for any unanticipated period key
  return normalizedId
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
