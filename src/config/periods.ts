import {
  PeriodConfig as DataPeriodConfig,
  EraConfig,
  ERAS,
  PERIODS,
  PERIOD_MAP,
  ERA_MAP,
  getPeriodConfig as getDataPeriodConfig,
  getPeriodColor as getDataPeriodColor,
  getEraConfig,
  CHRONOLOGICAL_PERIOD_IDS,
  LEGACY_PERIOD_KEY_MAP,
  getPeriodLabel,
  CANONICAL_PERIOD_LABELS,
  normalizePeriodId
} from '../data/periods';

export type { EraConfig, DataPeriodConfig };
export {
  ERAS,
  PERIODS,
  PERIOD_MAP,
  ERA_MAP,
  getEraConfig,
  CHRONOLOGICAL_PERIOD_IDS,
  getPeriodLabel,
  CANONICAL_PERIOD_LABELS,
  normalizePeriodId
};

export interface PeriodConfig {
  id: string;
  nameTr: string;
  nameEn: string;
  shortTr: string;
  shortEn: string;
  startBCE: number;
  endBCE: number;
  color: string;
  contrastColor: string;
  bgLight: string;
  borderColor: string;
  descriptionTr: string;
  descriptionEn: string;
}

export const CHRONOLOGICAL_PERIOD_ORDER: string[] = CHRONOLOGICAL_PERIOD_IDS;

export function getPeriodConfig(id: string): PeriodConfig {
  const p = getDataPeriodConfig(id);
  return {
    id: p.id,
    nameTr: p.nameTr,
    nameEn: p.nameEn,
    shortTr: p.shortTr,
    shortEn: p.shortEn,
    startBCE: p.startYear < 0 ? Math.abs(p.startYear) : 0,
    endBCE: p.endYear < 0 ? Math.abs(p.endYear) : 0,
    color: p.color,
    contrastColor: p.contrastColor,
    bgLight: p.bgLight,
    borderColor: p.borderColor,
    descriptionTr: p.descriptionTr || '',
    descriptionEn: p.descriptionEn || ''
  };
}

export function getPeriodColor(id: string): string {
  return getDataPeriodColor(id);
}

export const PERIOD_CONFIGS: Record<string, PeriodConfig> = {};
PERIODS.forEach(p => {
  PERIOD_CONFIGS[p.id] = getPeriodConfig(p.id);
});
Object.keys(LEGACY_PERIOD_KEY_MAP).forEach(legacyKey => {
  const targetId = LEGACY_PERIOD_KEY_MAP[legacyKey];
  if (PERIOD_CONFIGS[targetId]) {
    PERIOD_CONFIGS[legacyKey] = PERIOD_CONFIGS[targetId];
  }
});

export function formatBCE(yearBCE: number): string {
  if (yearBCE >= 1000000) {
    return `${(yearBCE / 1000000).toLocaleString('tr-TR')} Milyon MÖ`;
  }
  return `${yearBCE.toLocaleString('tr-TR')} MÖ`;
}
