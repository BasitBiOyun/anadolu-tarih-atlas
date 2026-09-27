import { OccupationPeriod } from '../types/settlement';
import { CHRONOLOGICAL_PERIOD_IDS, getPeriodConfig } from '../data/periods';

export interface TimelineSpan {
  startYear: number;
  endYear: number;
  labelStart: string;
  labelEnd: string;
  percentageLeft: number;
  percentageWidth: number;
}

/**
 * Formats a single year naturally in TR or EN.
 * Negative numbers are BCE (e.g. -1300000 -> "1,3 Milyon MÖ" / "1.3M BCE", -7400 -> "7400 MÖ" / "7400 BCE")
 * Positive numbers are CE (e.g. 1453 -> "MS 1453" / "1453 CE")
 */
export function formatYear(year: number, lang: 'tr' | 'en' = 'tr'): string {
  if (year === 0) return '0';

  if (year < 0) {
    const absYear = Math.abs(year);
    if (absYear >= 1000000) {
      const millions = (absYear / 1000000).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', {
        maximumFractionDigits: 1
      });
      return lang === 'tr' ? `${millions} Milyon MÖ` : `${millions}M BCE`;
    }
    if (absYear >= 10000) {
      const thousands = absYear.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');
      return lang === 'tr' ? `${thousands} MÖ` : `${thousands} BCE`;
    }
    return lang === 'tr' ? `${absYear} MÖ` : `${absYear} BCE`;
  }

  // Positive year (CE / MS)
  const formatted = year.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');
  return lang === 'tr' ? `MS ${formatted}` : `${formatted} CE`;
}

/**
 * Formats a full date range [startYear, endYear] cleanly without repeating units
 */
export function formatDateRange(
  startYear?: number,
  endYear?: number,
  lang: 'tr' | 'en' = 'tr',
  fallbackText?: string
): string {
  if (
    startYear === undefined ||
    endYear === undefined ||
    (startYear === 0 && endYear === 0)
  ) {
    return fallbackText || (lang === 'tr' ? 'Tarihlendirme aşamasında' : 'Chronology under study');
  }

  // Both BCE (negative)
  if (startYear < 0 && endYear < 0) {
    const startAbs = Math.abs(startYear);
    const endAbs = Math.abs(endYear);

    // Deep time millions
    if (startAbs >= 1000000 || endAbs >= 1000000) {
      const sM = (startAbs / 1000000).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', {
        maximumFractionDigits: 1
      });
      const eM = (endAbs / 1000000).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', {
        maximumFractionDigits: 1
      });
      return lang === 'tr' ? `${sM} – ${eM} Milyon MÖ` : `${sM}M – ${eM}M BCE`;
    }

    const sStr = startAbs.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');
    const eStr = endAbs.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');
    return lang === 'tr' ? `${sStr} – ${eStr} MÖ` : `${sStr} – ${eStr} BCE`;
  }

  // Crossing from BCE to CE
  if (startYear < 0 && endYear > 0) {
    const startStr = formatYear(startYear, lang);
    const endStr = formatYear(endYear, lang);
    return `${startStr} – ${endStr}`;
  }

  // Both CE
  if (startYear > 0 && endYear > 0) {
    const sStr = startYear.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');
    const eStr = endYear.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');
    return lang === 'tr' ? `MS ${sStr} – ${eStr}` : `${sStr} – ${eStr} CE`;
  }

  return `${formatYear(startYear, lang)} – ${formatYear(endYear, lang)}`;
}

/**
 * Backward compatibility helper for BCE numbers
 */
export function formatYearBCE(bce: number): string {
  if (bce <= 0) return 'Tarihlendirme aşamasında';
  if (bce >= 1000000) {
    const val = (bce / 1000000).toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    return `${val} Milyon MÖ`;
  }
  return `${bce.toLocaleString('tr-TR')} MÖ`;
}

/**
 * Sorts periods chronologically according to the central CHRONOLOGICAL_PERIOD_IDS
 */
export function sortPeriodsChronologically(periods: string[]): string[] {
  return [...periods].sort((a, b) => {
    const cfgA = getPeriodConfig(a);
    const cfgB = getPeriodConfig(b);
    return (cfgA?.order ?? 999) - (cfgB?.order ?? 999);
  });
}

/**
 * Returns the primary (earliest known or most representative) period
 */
export function getPrimaryPeriod(periods: string[]): string {
  if (!periods || periods.length === 0) return 'neolithic';
  const sorted = sortPeriodsChronologically(periods);
  return sorted[0];
}
