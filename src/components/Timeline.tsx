import React, { useState } from 'react';
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

interface Segment {
  id: string;
  name: string;
  color: string;
  bgLight: string;
  borderColor: string;
  left: number;
  width: number;
  startYear: number;
  endYear: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getAxisBounds(startYear: number, endYear: number): [number, number] {
  if (startYear === 0 && endYear === 0) return [-10000, -1000];

  const start = Math.min(startYear, endYear);
  const end = Math.max(startYear, endYear);
  const span = Math.max(100, end - start);
  const padding = span * 0.22;
  const rawStart = start - padding;
  const rawEnd = end + padding;

  let roundStep = 500;
  if (start <= -500000) roundStep = 200000;
  else if (start <= -100000) roundStep = 50000;
  else if (start <= -20000) roundStep = 10000;
  else if (span > 15000) roundStep = 5000;
  else if (span > 5000) roundStep = 2500;
  else if (span > 2000) roundStep = 1000;

  const axisStart = Math.floor(rawStart / roundStep) * roundStep;
  const axisEnd = Math.ceil(rawEnd / roundStep) * roundStep;

  if (axisStart === axisEnd) return [axisStart - roundStep, axisEnd + roundStep];
  return [axisStart, axisEnd];
}

function niceStep(range: number, targetTicks = 6): number {
  const rough = Math.max(1, range / targetTicks);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / magnitude;
  if (residual >= 5) return 5 * magnitude;
  if (residual >= 2.5) return 2.5 * magnitude;
  if (residual >= 2) return 2 * magnitude;
  return magnitude;
}

function buildTicks(axisStart: number, axisEnd: number): number[] {
  const range = axisEnd - axisStart;
  const step = niceStep(range, 6);
  const ticks: number[] = [axisStart];

  const firstInterior = Math.ceil(axisStart / step) * step;
  for (let value = firstInterior; value < axisEnd; value += step) {
    if (Math.abs(value - axisStart) > step * 0.05) ticks.push(Math.round(value));
  }
  ticks.push(axisEnd);

  const unique = Array.from(new Set(ticks)).sort((a, b) => a - b);
  if (unique.length <= 8) return unique;
  return unique.filter((_, index) => index === 0 || index === unique.length - 1 || index % 2 === 0);
}

function formatDuration(startYear: number, endYear: number, lang: 'tr' | 'en'): string {
  const years = Math.max(0, Math.abs(endYear - startYear));
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';

  if (years >= 1000000) {
    const value = (years / 1000000).toLocaleString(locale, { maximumFractionDigits: 1 });
    return lang === 'tr' ? `≈ ${value} milyon yıl` : `≈ ${value} million years`;
  }

  const rounded = years >= 10000 ? Math.round(years) : Math.round(years / 10) * 10;
  return lang === 'tr'
    ? `≈ ${rounded.toLocaleString(locale)} yıl`
    : `≈ ${rounded.toLocaleString(locale)} years`;
}

export const Timeline: React.FC<TimelineProps> = (props) => {
  const { lang, t } = useLanguage();
  const [activeMobileSegment, setActiveMobileSegment] = useState<Segment | null>(null);

  const settlement = props.settlement;
  const occupation = props.occupation || settlement?.occupation || { startBCE: 0, endBCE: 0 };
  const periods = props.periods || settlement?.periods || [];
  const periodDetails = props.periodDetails || settlement?.periodDetails;

  let startYear = settlement?.startYear ?? occupation.startYear;
  let endYear = settlement?.endYear ?? occupation.endYear;

  if (startYear === undefined && occupation.startBCE > 0) startYear = -Math.abs(occupation.startBCE);
  if (endYear === undefined && occupation.endBCE > 0) endYear = -Math.abs(occupation.endBCE);

  const rawStart = startYear ?? -9600;
  const rawEnd = endYear ?? -5500;
  const sYear = Math.min(rawStart, rawEnd);
  const eYear = Math.max(rawStart, rawEnd);

  const [axisStart, axisEnd] = getAxisBounds(sYear, eYear);
  const totalRange = Math.max(1, axisEnd - axisStart);
  const ticks = buildTicks(axisStart, axisEnd);
  const toPercent = (year: number) => clamp(((year - axisStart) / totalRange) * 100, 0, 100);

  const occupationLeft = toPercent(sYear);
  const occupationRight = toPercent(eYear);
  const occupationWidth = Math.max(1.5, occupationRight - occupationLeft);

  const sortedPeriods = sortPeriodsChronologically(periods);
  let periodSegments: Segment[] = [];

  if (periodDetails && periodDetails.length > 0) {
    periodSegments = periodDetails
      .map((pd) => {
        const cfg = getPeriodConfig(pd.periodId || pd.period);
        const rawSegmentStart = pd.startYear ?? (pd.startBCE ? -Math.abs(pd.startBCE) : cfg.startYear);
        const rawSegmentEnd = pd.endYear ?? (pd.endBCE ? -Math.abs(pd.endBCE) : cfg.endYear);
        const segStart = Math.min(rawSegmentStart, rawSegmentEnd);
        const segEnd = Math.max(rawSegmentStart, rawSegmentEnd);
        const clampedStart = Math.max(axisStart, segStart);
        const clampedEnd = Math.min(axisEnd, segEnd);
        if (clampedStart >= clampedEnd) return null;

        return {
          id: pd.periodId || pd.period,
          name: pd.period || (lang === 'en' ? cfg.shortEn : cfg.shortTr),
          color: cfg.color,
          bgLight: cfg.bgLight,
          borderColor: cfg.borderColor,
          left: toPercent(clampedStart),
          width: Math.max(1.5, toPercent(clampedEnd) - toPercent(clampedStart)),
          startYear: segStart,
          endYear: segEnd
        };
      })
      .filter(Boolean) as Segment[];
  } else if (sortedPeriods.length > 0) {
    periodSegments = sortedPeriods
      .map((periodId) => {
        const cfg = getPeriodConfig(periodId);
        const segStart = Math.max(sYear, Math.min(cfg.startYear, cfg.endYear));
        const segEnd = Math.min(eYear, Math.max(cfg.startYear, cfg.endYear));
        if (segStart >= segEnd) return null;

        return {
          id: periodId,
          name: lang === 'en' ? cfg.shortEn : cfg.shortTr,
          color: cfg.color,
          bgLight: cfg.bgLight,
          borderColor: cfg.borderColor,
          left: toPercent(segStart),
          width: Math.max(1.5, toPercent(segEnd) - toPercent(segStart)),
          startYear: segStart,
          endYear: segEnd
        };
      })
      .filter(Boolean) as Segment[];
  }

  const fallbackColor = getPeriodColor(sortedPeriods[0] ?? 'neolithic');
  const durationLabel = formatDuration(sYear, eYear, lang);
  const compactDatingNote =
    occupation.datingNote && occupation.datingNote.trim().length <= 180
      ? occupation.datingNote.trim()
      : null;

  const siteLabel = settlement?.name
    ? t(`${settlement.name} yerleşim aralığı`, `${settlement.name} occupation span`)
    : t('Belgelenen yerleşim aralığı', 'Documented occupation span');

  return (
    <div className="relative overflow-visible border border-[#D9CEBC] bg-[#FCF9F3] p-5 sm:p-7 lg:p-8 shadow-[0_22px_55px_-38px_rgba(43,35,27,0.55)]">
      <div className="flex flex-col gap-5 border-b border-[#E7DDCD] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A4526] sm:text-xs">
            {t('Belgelenen zaman aralığı', 'Documented time span')}
          </div>
          <div className="font-serif text-2xl font-bold tracking-tight text-[#1B1612] sm:text-3xl lg:text-[34px]">
            {formatDateRange(sYear, eYear, lang)}
          </div>
          {compactDatingNote && (
            <p className="mt-2 max-w-3xl font-prose text-sm leading-relaxed text-[#6E5F50] sm:text-[15px]">
              {compactDatingNote}
            </p>
          )}
        </div>

        <div className="shrink-0 border-l-2 border-[#8A4526] pl-4 sm:text-right">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A7A68] sm:text-[11px]">
            {t('Yaklaşık süre', 'Approx. duration')}
          </div>
          <div className="mt-0.5 font-serif text-xl font-bold text-[#2B231B] sm:text-2xl">
            {durationLabel}
          </div>
        </div>
      </div>

      <div className="mt-5 grid auto-rows-fr grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:gap-3">
        <div className="flex min-h-[72px] flex-col justify-between border border-[#E7DDCD] bg-[#F8F2E9] px-3 py-3 sm:min-h-[78px] sm:px-4">
          <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-[#897967] sm:text-[10px]">
            {t('Başlangıç', 'Start')}
          </div>
          <div className="mt-1 font-serif text-sm font-bold text-[#2B231B] sm:text-base">
            {formatYear(sYear, lang)}
          </div>
        </div>
        <div className="flex min-h-[72px] flex-col justify-between border border-[#E7DDCD] bg-[#F8F2E9] px-3 py-3 text-center sm:min-h-[78px] sm:px-4">
          <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-[#897967] sm:text-[10px]">
            {t('Süre', 'Duration')}
          </div>
          <div className="mt-1 font-serif text-sm font-bold text-[#2B231B] sm:text-base">
            {durationLabel.replace('≈ ', '')}
          </div>
        </div>
        <div className="flex min-h-[72px] flex-col justify-between border border-[#E7DDCD] bg-[#F8F2E9] px-3 py-3 text-right sm:min-h-[78px] sm:px-4">
          <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-[#897967] sm:text-[10px]">
            {t('Bitiş', 'End')}
          </div>
          <div className="mt-1 font-serif text-sm font-bold text-[#2B231B] sm:text-base">
            {formatYear(eYear, lang)}
          </div>
        </div>
      </div>

      <div className="mt-7 border border-[#E3D8C7] bg-[#F7F1E7]/70 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-serif text-base font-bold text-[#2A211A] sm:text-lg">
              {t('Yerleşim evreleri', 'Occupation phases')}
            </div>
            <div className="mt-0.5 font-sans text-[11px] text-[#837462] sm:text-xs">
              {siteLabel}
            </div>
          </div>
          <div className="font-sans text-[10px] text-[#9A8A77] sm:text-[11px]">
            <span className="sm:hidden">{t('Bir evreye dokunun', 'Tap a phase')}</span>
            <span className="hidden sm:inline">
              {t('Bir evrenin üzerine gelin veya odaklanın', 'Hover or focus a phase for details')}
            </span>
          </div>
        </div>

        <div className="relative mt-5 h-[150px] sm:h-[174px]">
          {ticks.map((tick, index) => {
            const left = toPercent(tick);
            const hideOnMobile = index !== 0 && index !== ticks.length - 1 && index % 2 === 1;

            return (
              <div key={`${tick}-${index}`} className="absolute inset-y-0" style={{ left: `${left}%` }}>
                <div className="h-[104px] w-px bg-[#DDD1C0] sm:h-[124px]" />
                <div
                  className={`absolute top-[112px] whitespace-nowrap font-mono text-[10px] font-medium text-[#776858] sm:top-[132px] sm:text-[11px] ${
                    hideOnMobile ? 'hidden sm:block' : ''
                  }`}
                  style={{
                    transform:
                      index === 0
                        ? 'translateX(0)'
                        : index === ticks.length - 1
                          ? 'translateX(-100%)'
                          : 'translateX(-50%)'
                  }}
                >
                  {formatYear(tick, lang)}
                </div>
              </div>
            );
          })}

          <div className="absolute left-0 right-0 top-[54px] h-[46px] sm:top-[62px] sm:h-[54px]">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#BCAE9A]" />

            <div
              className="absolute top-1/2 h-[46px] -translate-y-1/2 border-y border-[#CDBEA8] bg-[#EDE4D6]/75 sm:h-[54px]"
              style={{ left: `${occupationLeft}%`, width: `${occupationWidth}%` }}
              aria-hidden="true"
            />

            {periodSegments.length > 0 ? (
              periodSegments.map((segment) => {
                const showInlineLabel = segment.width >= 13;
                const tooltipStyle =
                  segment.left < 12
                    ? { left: 0 }
                    : segment.left + segment.width > 88
                      ? { right: 0 }
                      : { left: '50%', transform: 'translateX(-50%)' };

                return (
                  <button
                    key={`${segment.id}-${segment.startYear}-${segment.endYear}`}
                    type="button"
                    onClick={() => setActiveMobileSegment(segment)}
                    className="group absolute top-1/2 h-[38px] touch-manipulation -translate-y-1/2 border shadow-[0_6px_18px_-12px_rgba(30,24,19,0.8)] outline-none transition-all duration-200 hover:z-20 hover:h-[40px] focus-visible:z-20 focus-visible:h-[40px] focus-visible:ring-2 focus-visible:ring-[#8A4526]/35 sm:h-[38px] sm:hover:h-[44px] sm:focus-visible:h-[44px]"
                    style={{
                      left: `${segment.left}%`,
                      width: `${segment.width}%`,
                      backgroundColor: segment.color,
                      borderColor: segment.borderColor
                    }}
                    aria-label={`${segment.name}: ${formatDateRange(segment.startYear, segment.endYear, lang)}`}
                  >
                    {showInlineLabel && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-2 font-sans text-[10px] font-semibold tracking-wide text-white/95 drop-shadow-sm sm:text-[11px]">
                        <span className="truncate">{segment.name}</span>
                      </span>
                    )}

                    <span
                      className="pointer-events-none invisible absolute bottom-[calc(100%+10px)] z-30 hidden w-[230px] border border-[#D8C9B5] bg-[#FFFDF8] p-3 text-left opacity-0 shadow-[0_18px_42px_-24px_rgba(32,24,18,0.75)] transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 sm:block"
                      style={tooltipStyle}
                    >
                      <span className="block font-serif text-sm font-bold text-[#201913]">
                        {segment.name}
                      </span>
                      <span className="mt-1 block font-mono text-[11px] text-[#6D5D4C]">
                        {formatDateRange(segment.startYear, segment.endYear, lang)}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div
                className="absolute top-1/2 h-[36px] -translate-y-1/2 border border-black/10 sm:h-[40px]"
                style={{
                  left: `${occupationLeft}%`,
                  width: `${occupationWidth}%`,
                  backgroundColor: fallbackColor
                }}
              />
            )}

            <div
              className="absolute top-1/2 h-[58px] w-[2px] -translate-y-1/2 bg-[#2A211A] sm:h-[66px]"
              style={{ left: `${occupationLeft}%` }}
            >
              <span className="absolute -left-[4px] -top-[4px] h-2.5 w-2.5 rotate-45 border border-[#2A211A] bg-[#FCF9F3]" />
            </div>

            <div
              className="absolute top-1/2 h-[58px] w-[2px] -translate-y-1/2 bg-[#2A211A] sm:h-[66px]"
              style={{ left: `${occupationRight}%` }}
            >
              <span className="absolute -right-[4px] -top-[4px] h-2.5 w-2.5 rotate-45 border border-[#2A211A] bg-[#FCF9F3]" />
            </div>
          </div>
        </div>

        {activeMobileSegment && (
          <div className="mt-3 border border-[#D8C9B5] bg-[#FFFDF8] p-3.5 sm:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-[#9A765C]">
                  {t('Seçili Evre', 'Selected Phase')}
                </div>
                <div className="mt-1 font-serif text-base font-bold text-[#251E18]">
                  {activeMobileSegment.name}
                </div>
                <div className="mt-1 font-mono text-[11px] text-[#6D5D4C]">
                  {formatDateRange(activeMobileSegment.startYear, activeMobileSegment.endYear, lang)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMobileSegment(null)}
                className="min-h-10 min-w-10 touch-manipulation border border-[#E0D4C4] px-2 font-sans text-[10px] font-semibold text-[#6D5D4C]"
              >
                {t('Kapat', 'Close')}
              </button>
            </div>
          </div>
        )}
      </div>

      {periodSegments.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A7A68] sm:text-[11px]">
            {t('Evreler', 'Phases')}
          </div>
          <div className="grid auto-rows-fr grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {periodSegments.map((segment) => (
              <div
                key={`legend-${segment.id}-${segment.startYear}-${segment.endYear}`}
                className="flex min-h-[76px] items-center gap-3 border border-[#E4DACB] bg-[#FAF6EF] px-3.5 py-3"
              >
                <span
                  className="h-9 w-1.5 shrink-0"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div className="truncate font-serif text-sm font-bold text-[#2B231B] sm:text-[15px]">
                    {segment.name}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-[#776858] sm:text-[11px]">
                    {formatDateRange(segment.startYear, segment.endYear, lang)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
