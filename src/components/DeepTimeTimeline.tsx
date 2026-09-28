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

  const periodGradient = periods
    .map((period, index) => {
      const start = (index / periods.length) * 100;
      const end = ((index + 1) / periods.length) * 100;
      const color = getThemeAccentColor(period.color, theme);
      return color + ' ' + start + '%, ' + color + ' ' + end + '%';
    })
    .join(', ');

  const selectionLabel = (() => {
    if (isAllSelected) return t('Tüm Zamanlar', 'All periods');
    if (selectedConfigs.length === 1) {
      return lang === 'tr' ? selectedConfigs[0].shortTr : selectedConfigs[0].shortEn;
    }
    return t(
      selectedConfigs.length + ' dönem seçili',
      selectedConfigs.length + ' periods selected'
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
      aria-label={t('Derin Zaman Çizelgesi', 'Deep Time Timeline')}
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 mx-auto max-w-[1240px] overflow-hidden rounded-[14px] border border-[#D8CBB8] bg-[#FBF8F2]/97 shadow-[0_22px_58px_-28px_rgba(48,34,22,0.48),0_2px_8px_rgba(62,44,29,0.08)] ring-1 ring-white/70 backdrop-blur-md sm:inset-x-5 sm:bottom-4"
    >
      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
        <div className="hidden min-w-[122px] shrink-0 border-r border-[#E6DDCF] pr-4 sm:block">
          <div className="flex items-center gap-1.5 font-sans text-[9px] font-bold uppercase tracking-[0.19em] text-[#98745B]">
            <Clock size={13} weight="bold" />
            {t('Derin Zaman', 'Deep Time')}
          </div>
          <div className="mt-0.5 font-serif text-[12px] font-semibold text-[#57493A]">
            {t('Kronolojik görünüm', 'Chronological view')}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2.5">
            <div
              aria-live="polite"
              className="truncate font-serif text-[15px] font-bold leading-none text-[#1A1510] sm:text-[17px]"
            >
              {selectionLabel}
            </div>
            <div className="hidden truncate font-mono text-[9px] tracking-[0.02em] text-[#8A7A68] min-[460px]:block sm:text-[10px]">
              {selectionDateLabel}
            </div>
          </div>

          <div className="mt-1.5 grid grid-cols-[30px_minmax(0,1fr)_30px] items-center gap-2">
            <button
              type="button"
              onClick={() => commitCursor(cursorIndex - 1)}
              disabled={cursorIndex === 0}
              className="flex h-[30px] w-[30px] touch-manipulation items-center justify-center rounded-[8px] border border-[#D8CBB8] bg-[#F6F0E7] text-[#5D4E3F] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all hover:-translate-y-px hover:border-[#C8B69F] hover:bg-[#EFE6D8] disabled:cursor-default disabled:opacity-35 disabled:hover:translate-y-0"
              aria-label={t('Önceki döneme git', 'Go to previous period')}
            >
              <CaretLeft size={14} weight="bold" />
            </button>

            <input
              className={'deep-time-range h-8 w-full touch-pan-x ' + (isAllSelected ? 'deep-time-range--all' : '')}
              type="range"
              min={0}
              max={Math.max(0, periods.length - 1)}
              step={1}
              value={cursorIndex}
              onChange={event => commitCursor(Number(event.target.value))}
              aria-label={t('Zaman çizelgesinde gezin', 'Scrub through the timeline')}
              style={
                {
                  '--deep-time-gradient': 'linear-gradient(90deg, ' + periodGradient + ')'
                } as React.CSSProperties
              }
            />

            <button
              type="button"
              onClick={() => commitCursor(cursorIndex + 1)}
              disabled={cursorIndex === periods.length - 1}
              className="flex h-[30px] w-[30px] touch-manipulation items-center justify-center rounded-[8px] border border-[#D8CBB8] bg-[#F6F0E7] text-[#5D4E3F] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all hover:-translate-y-px hover:border-[#C8B69F] hover:bg-[#EFE6D8] disabled:cursor-default disabled:opacity-35 disabled:hover:translate-y-0"
              aria-label={t('Sonraki döneme git', 'Go to next period')}
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>

        <div className="hidden shrink-0 border-l border-[#E6DDCF] pl-4 text-right md:block">
          <div className="font-serif text-[17px] font-bold leading-none text-[#1A1510]">
            {filteredCount}
            <span className="font-normal text-[#9A8A77]"> / {totalCount}</span>
          </div>
          <div className="mt-1 font-sans text-[8px] font-bold uppercase tracking-[0.13em] text-[#8A7A68]">
            {t('Haritadaki yer', 'Sites on map')}
          </div>
        </div>
      </div>

      <div className="border-t border-[#E6DDCF] bg-[#F7F2E9]/78 px-2.5 py-2 sm:px-3">
        <div className="flex min-w-0 items-stretch gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className={
              'inline-flex w-[116px] shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-[9px] border px-2.5 font-sans text-[9px] font-bold uppercase leading-tight tracking-[0.07em] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-all hover:-translate-y-px sm:w-[126px] sm:text-[9.5px] ' +
              (isAllSelected
                ? 'border-[#8A4526] bg-[#8A4526] text-[#FFF9F2] shadow-[0_3px_10px_rgba(138,69,38,0.18)]'
                : 'border-[#D8CBB8] bg-[#FFFDF8] text-[#57493A] hover:border-[#C8B69F] hover:bg-[#F6EFE4]')
            }
            aria-pressed={isAllSelected}
          >
            <ArrowCounterClockwise size={13} weight="bold" />
            <span>{t('Tüm Zamanlar', 'All Periods')}</span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="grid h-full grid-flow-col auto-cols-[minmax(132px,1fr)] snap-x snap-proximity gap-1.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid-flow-row lg:grid-cols-7 lg:auto-cols-auto lg:overflow-visible">
              {ERAS.map(era => {
                const eraActive =
                  era.periodIds.length === selectedPeriods.length &&
                  era.periodIds.every(periodId => selectedPeriods.includes(periodId));
                const firstPeriod = getPeriodConfig(era.periodIds[0]);
                const count = era.periodIds.reduce(
                  (sum, periodId) => sum + (periodCounts[periodId] || 0),
                  0
                );
                const accent = getPeriodDotColor(firstPeriod.color, theme);

                return (
                  <button
                    key={era.id}
                    type="button"
                    onClick={() => handleEraSelect(era.periodIds)}
                    className={
                      'relative min-w-0 snap-start overflow-hidden rounded-[9px] border px-2.5 pb-1.5 pt-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.76)] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(70,48,31,0.08)] ' +
                      (eraActive
                        ? 'text-[#1A1510] shadow-[0_4px_14px_rgba(78,51,31,0.09)]'
                        : 'border-[#DED3C2] bg-[#FFFDF9] text-[#655646] hover:border-[#C9B8A1]')
                    }
                    style={{
                      borderColor: eraActive ? firstPeriod.borderColor : undefined,
                      backgroundColor: eraActive ? firstPeriod.bgLight : undefined
                    }}
                    aria-pressed={eraActive}
                    aria-label={lang === 'tr' ? era.nameTr : era.nameEn}
                    title={lang === 'tr' ? era.nameTr : era.nameEn}
                  >
                    <span
                      className="absolute inset-x-2 top-0 h-[2px] rounded-b-full opacity-90"
                      style={{ backgroundColor: accent }}
                      aria-hidden="true"
                    />

                    <div className="flex min-h-[25px] items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: accent }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 whitespace-normal font-serif text-[10px] font-semibold leading-[1.05] sm:text-[10.5px]">
                        {lang === 'tr' ? era.shortTr : era.shortEn}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center justify-end">
                      <span className="rounded-full bg-[#F3EDE3]/85 px-1.5 py-0.5 font-mono text-[7.5px] leading-none text-[#8A7A68]">
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
