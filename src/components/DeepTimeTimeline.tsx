import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowCounterClockwise,
  CaretLeft,
  CaretRight,
  Clock
} from '@phosphor-icons/react';
import {
  CHRONOLOGICAL_PERIOD_IDS,
  ERAS,
  PERIODS,
  getPeriodConfig
} from '../data/periods';
import { formatDateRange } from '../utils/chronology';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getPeriodDotColor, getThemeAccentColor } from '../utils/themeStyles';

interface DeepTimeTimelineProps {
  selectedPeriods: string[];
  onSelectPeriods: (periods: string[]) => void;
  onSelectAll: () => void;
  periodCounts: Record<string, number>;
  filteredCount: number;
  totalCount: number;
}

export const DeepTimeTimeline: React.FC<DeepTimeTimelineProps> = ({
  selectedPeriods,
  onSelectPeriods,
  onSelectAll,
  periodCounts,
  filteredCount,
  totalCount
}) => {
  const { lang, t } = useLanguage();
  const { theme } = useTheme();

  const periods = useMemo(
    () => [...PERIODS].sort((a, b) => a.order - b.order),
    []
  );

  const defaultIndex = Math.max(
    0,
    periods.findIndex(period => period.id === 'neolithic')
  );
  const [cursorIndex, setCursorIndex] = useState(defaultIndex);

  const isAllSelected =
    selectedPeriods.length === CHRONOLOGICAL_PERIOD_IDS.length &&
    CHRONOLOGICAL_PERIOD_IDS.every(periodId => selectedPeriods.includes(periodId));

  useEffect(() => {
    if (selectedPeriods.length !== 1) return;
    const nextIndex = periods.findIndex(period => period.id === selectedPeriods[0]);
    if (nextIndex >= 0) setCursorIndex(nextIndex);
  }, [periods, selectedPeriods]);

  const selectedConfigs = useMemo(
    () => periods.filter(period => selectedPeriods.includes(period.id)),
    [periods, selectedPeriods]
  );

  const cursorPeriod = periods[cursorIndex] || periods[0];
  const currentCount = cursorPeriod ? periodCounts[cursorPeriod.id] || 0 : 0;
  const sliderProgress =
    periods.length > 1 ? (cursorIndex / (periods.length - 1)) * 100 : 0;

  const periodGradient = periods
    .map((period, index) => {
      const start = (index / periods.length) * 100;
      const end = ((index + 1) / periods.length) * 100;
      const color = getThemeAccentColor(period.color, theme);
      return `${color} ${start}%, ${color} ${end}%`;
    })
    .join(', ');

  const selectionLabel = (() => {
    if (isAllSelected) return t('Tüm zaman', 'All time');
    if (selectedConfigs.length === 1) {
      return lang === 'tr' ? selectedConfigs[0].shortTr : selectedConfigs[0].shortEn;
    }
    return t(
      `${selectedConfigs.length} dönem seçili`,
      `${selectedConfigs.length} periods selected`
    );
  })();

  const selectionDateLabel = (() => {
    if (!selectedConfigs.length) return t('Dönem seçilmedi', 'No period selected');
    const start = Math.min(...selectedConfigs.map(period => period.startYear));
    const end = Math.max(...selectedConfigs.map(period => period.endYear));
    return formatDateRange(start, end, lang);
  })();

  const commitCursor = (nextIndex: number) => {
    const bounded = Math.max(0, Math.min(periods.length - 1, nextIndex));
    const period = periods[bounded];
    if (!period) return;
    setCursorIndex(bounded);
    onSelectPeriods([period.id]);
  };

  const handleEraSelect = (periodIds: string[]) => {
    onSelectPeriods(periodIds);
    const firstIndex = periods.findIndex(period => period.id === periodIds[0]);
    if (firstIndex >= 0) setCursorIndex(firstIndex);
  };

  return (
    <section
      aria-label={t('Derin Zaman Zaman Çizelgesi', 'Deep Time Timeline')}
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 mx-auto max-w-[1180px] border border-[#D9CEBC] bg-[#FAF7F2]/95 shadow-[0_22px_60px_-28px_rgba(32,23,17,0.45)] backdrop-blur-md sm:inset-x-5 sm:bottom-4"
    >
      <div className="flex items-center gap-3 border-b border-[#E8DFD0] px-3 py-2.5 sm:px-4">
        <div className="hidden min-w-[118px] shrink-0 sm:block">
          <div className="flex items-center gap-1.5 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-[#9A765C]">
            <Clock size={13} />
            {t('Derin Zaman', 'Deep Time')}
          </div>
          <div className="mt-0.5 font-serif text-xs font-semibold text-[#57493A]">
            {t('Kronolojik mercek', 'Chronological lens')}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <div
              aria-live="polite"
              className="truncate font-serif text-sm font-bold text-[#1A1510] sm:text-base"
            >
              {selectionLabel}
            </div>
            <div className="hidden truncate font-mono text-[9px] text-[#8A7A68] min-[460px]:block sm:text-[10px]">
              {selectionDateLabel}
            </div>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => commitCursor(cursorIndex - 1)}
              className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center border border-[#D9CEBC] bg-[#F4EFE6] text-[#57493A] transition-colors hover:bg-[#EAE2D3]"
              aria-label={t('Önceki döneme git', 'Go to previous period')}
            >
              <CaretLeft size={14} weight="bold" />
            </button>

            <div className="relative min-w-0 flex-1">
              <input
                className={`deep-time-range h-8 w-full touch-pan-x ${
                  isAllSelected ? 'deep-time-range--all' : ''
                }`}
                type="range"
                min={0}
                max={Math.max(0, periods.length - 1)}
                step={1}
                value={cursorIndex}
                onChange={event => commitCursor(Number(event.target.value))}
                aria-label={t('Zaman çizelgesinde gezin', 'Scrub through the timeline')}
                style={
                  {
                    '--deep-time-gradient': `linear-gradient(90deg, ${periodGradient})`,
                    '--deep-time-progress': `${sliderProgress}%`
                  } as React.CSSProperties
                }
              />
            </div>

            <button
              type="button"
              onClick={() => commitCursor(cursorIndex + 1)}
              className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center border border-[#D9CEBC] bg-[#F4EFE6] text-[#57493A] transition-colors hover:bg-[#EAE2D3]"
              aria-label={t('Sonraki döneme git', 'Go to next period')}
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>

        <div className="hidden shrink-0 border-l border-[#E8DFD0] pl-4 text-right md:block">
          <div className="font-serif text-base font-bold text-[#1A1510]">
            {filteredCount}
            <span className="font-normal text-[#8A7A68]"> / {totalCount}</span>
          </div>
          <div className="font-sans text-[8px] font-bold uppercase tracking-[0.12em] text-[#8A7A68]">
            {t('Haritadaki yer', 'Sites on map')}
          </div>
        </div>

        <button
          type="button"
          onClick={onSelectAll}
          className={`flex min-h-9 shrink-0 touch-manipulation items-center gap-1.5 border px-2.5 font-sans text-[9px] font-bold uppercase tracking-[0.08em] transition-colors sm:px-3 sm:text-[10px] ${
            isAllSelected
              ? 'border-[#8A4526] bg-[#8A4526] text-[#FAF7F2]'
              : 'border-[#D9CEBC] bg-[#F4EFE6] text-[#57493A] hover:bg-[#EAE2D3]'
          }`}
          aria-pressed={isAllSelected}
        >
          <ArrowCounterClockwise size={13} />
          <span className="hidden min-[390px]:inline">{t('Tüm Zaman', 'All Time')}</span>
        </button>
      </div>

      <div className="flex touch-pan-x items-center gap-1 overflow-x-auto overscroll-x-contain px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-4">
        {ERAS.map(era => {
          const eraActive =
            era.periodIds.length === selectedPeriods.length &&
            era.periodIds.every(periodId => selectedPeriods.includes(periodId));
          const firstPeriod = getPeriodConfig(era.periodIds[0]);
          const count = era.periodIds.reduce(
            (sum, periodId) => sum + (periodCounts[periodId] || 0),
            0
          );

          return (
            <button
              key={era.id}
              type="button"
              onClick={() => handleEraSelect(era.periodIds)}
              className={`inline-flex min-h-8 shrink-0 touch-manipulation items-center gap-1.5 border px-2.5 font-serif text-[10px] font-semibold transition-all sm:text-[11px] ${
                eraActive
                  ? 'border-[#8A4526] bg-[#F1E7DA] text-[#1A1510]'
                  : 'border-[#E2D8C7] bg-[#FCF9F3] text-[#6B5B4B] hover:border-[#C8B69F]'
              }`}
              aria-pressed={eraActive}
              title={lang === 'tr' ? era.nameTr : era.nameEn}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: getPeriodDotColor(firstPeriod.color, theme) }}
              />
              <span>{lang === 'tr' ? era.shortTr : era.shortEn}</span>
              <span className="font-mono text-[8px] opacity-65">{count}</span>
            </button>
          );
        })}

        {!isAllSelected && selectedConfigs.length === 1 && (
          <div className="ml-auto hidden shrink-0 items-center gap-2 pl-2 text-right lg:flex">
            <div>
              <div className="font-serif text-[11px] font-bold text-[#2B231B]">
                {lang === 'tr' ? cursorPeriod.shortTr : cursorPeriod.shortEn}
              </div>
              <div className="font-mono text-[8px] text-[#8A7A68]">
                {currentCount} {t('yer', 'sites')}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
