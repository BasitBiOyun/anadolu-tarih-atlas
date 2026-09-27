import React from 'react';
import { Settlement, OccupationPeriod, SettlementPeriodDetail } from '../types/settlement';
import { getPeriodConfig, getPeriodColor } from '../data/periods';
import { formatYear, formatDateRange, sortPeriodsChronologically } from '../utils/chronology';
import { useLanguage } from '../context/LanguageContext';

interface TimelineProps {
  settlement?: Settlement;
  occupation?: OccupationPeriod;
  periods?: string[];
  periodDetails?: SettlementPeriodDetail[];
}

/**
 * Computes nice, round timeline boundaries [axisStart, axisEnd]
 * based on the site's date range. Both values use negative numbers for BCE, positive for CE.
 */
function getAxisBounds(startYear: number, endYear: number): [number, number] {
  // If dates are invalid or identical
  if (startYear === 0 && endYear === 0) {
    return [-10000, -1000];
  }

  const span = Math.max(100, endYear - startYear);
  const padding = span * 0.15;
  const rawStart = startYear - padding;
  const rawEnd = endYear + padding;

  // Deep Pleistocene (> 500k years ago)
  if (startYear <= -500000) {
    const roundStep = 200000;
    const aStart = Math.floor(rawStart / roundStep) * roundStep;
    const aEnd = Math.ceil(rawEnd / roundStep) * roundStep;
    return [aStart, aEnd];
  }

  // Paleolithic (> 20k years ago)
  if (startYear <= -20000) {
    const roundStep = 20000;
    const aStart = Math.floor(rawStart / roundStep) * roundStep;
    const aEnd = Math.ceil(rawEnd / roundStep) * roundStep;
    return [aStart, aEnd];
  }

  // Prehistory / Bronze / Iron / Classical
  if (startYear < 0 && endYear <= 0) {
    const roundStep = 1000;
    const aStart = Math.floor(rawStart / roundStep) * roundStep;
    const aEnd = Math.ceil(rawEnd / roundStep) * roundStep;
    return [aStart, aEnd];
  }

  // Crossing from BCE to CE or Historical CE
  const roundStep = 500;
  const aStart = Math.floor(rawStart / roundStep) * roundStep;
  const aEnd = Math.ceil(rawEnd / roundStep) * roundStep;
  return [aStart, aEnd];
}

export const Timeline: React.FC<TimelineProps> = (props) => {
  const { lang, t } = useLanguage();

  const settlement = props.settlement;
  const occupation = props.occupation || settlement?.occupation || { startBCE: 0, endBCE: 0 };
  const periods = props.periods || settlement?.periods || [];
  const periodDetails = props.periodDetails || settlement?.periodDetails;

  // Resolve startYear and endYear (negative for BCE, positive for CE)
  let startYear = settlement?.startYear ?? occupation.startYear;
  let endYear = settlement?.endYear ?? occupation.endYear;

  if (startYear === undefined && occupation.startBCE > 0) {
    startYear = -Math.abs(occupation.startBCE);
  }
  if (endYear === undefined && occupation.endBCE > 0) {
    endYear = -Math.abs(occupation.endBCE);
  }

  const sYear = startYear ?? -9600;
  const eYear = endYear ?? -5500;

  const [axisStart, axisEnd] = getAxisBounds(sYear, eYear);
  const totalRange = Math.max(1, axisEnd - axisStart);

  // Site boundaries percentage along the axis
  const occLeftPercent = Math.max(0, Math.min(98, ((sYear - axisStart) / totalRange) * 100));
  const occRightPercent = Math.max(2, Math.min(100, ((eYear - axisStart) / totalRange) * 100));
  const occWidthPercent = Math.max(2, occRightPercent - occLeftPercent);

  const sortedPeriods = sortPeriodsChronologically(periods);

  // Compute period segments accurately
  interface Segment {
    id: string;
    name: string;
    color: string;
    left: number;
    width: number;
    startYear: number;
    endYear: number;
  }

  let periodSegments: Segment[] = [];

  if (periodDetails && periodDetails.length > 0) {
    periodSegments = periodDetails
      .map(pd => {
        const cfg = getPeriodConfig(pd.periodId || pd.period);
        const segStart = pd.startYear ?? (pd.startBCE ? -pd.startBCE : cfg.startYear);
        const segEnd = pd.endYear ?? (pd.endBCE ? -pd.endBCE : cfg.endYear);

        const clampedStart = Math.max(axisStart, segStart);
        const clampedEnd = Math.min(axisEnd, segEnd);
        if (clampedStart >= clampedEnd) return null;

        const left = Math.max(0, Math.min(100, ((clampedStart - axisStart) / totalRange) * 100));
        const right = Math.max(0, Math.min(100, ((clampedEnd - axisStart) / totalRange) * 100));
        const width = Math.max(1.5, right - left);

        return {
          id: pd.periodId || pd.period,
          name: pd.period || (lang === 'en' ? cfg.shortEn : cfg.shortTr),
          color: cfg.color,
          left,
          width,
          startYear: segStart,
          endYear: segEnd
        };
      })
      .filter(Boolean) as Segment[];
  } else if (sortedPeriods.length > 0) {
    periodSegments = sortedPeriods
      .map(pId => {
        const cfg = getPeriodConfig(pId);
        const segStart = cfg.startYear;
        const segEnd = cfg.endYear;

        const clampedStart = Math.max(sYear, segStart);
        const clampedEnd = Math.min(eYear, segEnd);
        if (clampedStart >= clampedEnd) return null;

        const left = Math.max(0, Math.min(100, ((clampedStart - axisStart) / totalRange) * 100));
        const right = Math.max(0, Math.min(100, ((clampedEnd - axisStart) / totalRange) * 100));
        const width = Math.max(1.5, right - left);

        return {
          id: pId,
          name: lang === 'en' ? cfg.shortEn : cfg.shortTr,
          color: cfg.color,
          left,
          width,
          startYear: segStart,
          endYear: segEnd
        };
      })
      .filter(Boolean) as Segment[];
  }

  const fallbackColor = getPeriodColor(sortedPeriods[0] ?? 'neolithic');
  const midYear = Math.round((axisStart + axisEnd) / 2);

  return (
    <div className="py-2 font-sans select-none">
      {/* Date Span Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[#E7DFD1] pb-2 mb-3 gap-1">
        <span className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554]">
          {t('Kronoloji', 'Chronology')}
        </span>
        <span className="font-serif text-[13px] font-bold text-[#1F1A15] tracking-tight">
          {occupation.display || formatDateRange(sYear, eYear, lang)}
          {occupation.datingNote && (
            <span className="ml-1.5 font-sans text-[11px] font-normal text-[#807261]">
              ({occupation.datingNote})
            </span>
          )}
        </span>
      </div>

      {/* Chronology Axis Track */}
      <div className="relative pt-3 pb-6 px-1">
        {/* Baseline Axis Line */}
        <div className="relative h-[2px] w-full bg-[#B0A290]">
          {/* Period Bar(s) - Accurately positioned and color-coded */}
          {periodSegments.length > 0 ? (
            periodSegments.map(seg => (
              <div
                key={seg.id}
                className="absolute -top-[3px] h-[8px] transition-all duration-200"
                style={{
                  left: `${seg.left}%`,
                  width: `${seg.width}%`,
                  backgroundColor: seg.color
                }}
                title={`${seg.name}: ${formatDateRange(seg.startYear, seg.endYear, lang)}`}
              />
            ))
          ) : (
            <div
              className="absolute -top-[3px] h-[8px] transition-all duration-200"
              style={{
                left: `${occLeftPercent}%`,
                width: `${occWidthPercent}%`,
                backgroundColor: fallbackColor
              }}
            />
          )}

          {/* Site Start Boundary Pin */}
          <div
            className="absolute -top-[5px] w-[2px] h-[12px] bg-[#241D17]"
            style={{ left: `${occLeftPercent}%` }}
          />

          {/* Site End Boundary Pin */}
          <div
            className="absolute -top-[5px] w-[2px] h-[12px] bg-[#241D17]"
            style={{ left: `${occRightPercent}%` }}
          />
        </div>

        {/* Milestone Date Labels along axis */}
        <div className="relative w-full h-5 mt-2">
          {/* Start Date Label (Left) */}
          <div className="absolute left-0 top-0 font-mono text-[9px] text-[#786958]">
            {formatYear(axisStart, lang)}
          </div>

          {/* Mid Tick */}
          <div
            className="absolute top-0 -translate-x-1/2 font-mono text-[9px] text-[#8C7D6B]"
            style={{ left: '50%' }}
          >
            {formatYear(midYear, lang)}
          </div>

          {/* End Date Label (Right) */}
          <div className="absolute right-0 top-0 font-mono text-[9px] text-[#786958] text-right">
            {formatYear(axisEnd, lang)}
          </div>
        </div>
      </div>

      {/* Period Legend Row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-[#4A4035]">
        {periodSegments.length > 0 ? (
          periodSegments.map(seg => (
            <div key={seg.id} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2 shrink-0 border border-black/10"
                style={{ backgroundColor: seg.color }}
              />
              <span className="font-serif font-medium">{seg.name}</span>
              <span className="font-mono text-[10px] text-[#857766]">
                ({formatDateRange(seg.startYear, seg.endYear, lang)})
              </span>
            </div>
          ))
        ) : (
          sortedPeriods.map(pId => {
            const cfg = getPeriodConfig(pId);
            return (
              <div key={pId} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2 shrink-0 border border-black/10"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="font-serif font-medium">
                  {lang === 'en' ? cfg.shortEn : cfg.shortTr}
                </span>
                <span className="font-mono text-[10px] text-[#857766]">
                  ({formatDateRange(cfg.startYear, cfg.endYear, lang)})
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
