import React, { useState } from 'react';
import { ERAS, PERIODS, getPeriodConfig, getEraConfig, CHRONOLOGICAL_PERIOD_IDS } from '../data/periods';
import { useLanguage } from '../context/LanguageContext';
import { CaretDown, CaretUp, Check } from '@phosphor-icons/react';

interface PeriodFilterProps {
  selectedPeriods: string[];
  onTogglePeriod: (periodId: string) => void;
  onSelectPeriods?: (periodIds: string[]) => void;
  onSelectAll: () => void;
  periodCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  selectedPeriods,
  onTogglePeriod,
  onSelectPeriods,
  onSelectAll,
  periodCounts,
  totalCount,
  filteredCount
}) => {
  const { lang, t } = useLanguage();
  const [expandedEraId, setExpandedEraId] = useState<string | null>(null);

  const isAllSelected =
    selectedPeriods.length === CHRONOLOGICAL_PERIOD_IDS.length ||
    CHRONOLOGICAL_PERIOD_IDS.every(p => selectedPeriods.includes(p));

  // Toggle all periods belonging to an era
  const handleToggleEra = (eraId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const era = getEraConfig(eraId);
    if (!era) return;

    const eraPeriods = era.periodIds;
    const allEraSelected = eraPeriods.every(p => selectedPeriods.includes(p));

    if (onSelectPeriods) {
      if (allEraSelected) {
        // Deselect this era's periods
        onSelectPeriods(selectedPeriods.filter(p => !eraPeriods.includes(p)));
      } else {
        // Add all of this era's periods
        const set = new Set([...selectedPeriods, ...eraPeriods]);
        onSelectPeriods(Array.from(set));
      }
    } else {
      // Fallback
      eraPeriods.forEach(p => onTogglePeriod(p));
    }
  };

  // Select ONLY this era
  const handleSelectOnlyEra = (eraId: string) => {
    const era = getEraConfig(eraId);
    if (!era) return;
    if (onSelectPeriods) {
      onSelectPeriods(era.periodIds);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 text-xs select-none">
      {/* Primary Row: All Periods + 6 Broad Eras */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        {/* All Periods Master Button */}
        <button
          onClick={onSelectAll}
          className={`px-3 py-1 text-xs font-serif font-medium border transition-colors whitespace-nowrap shrink-0 text-center ${
            isAllSelected
              ? 'bg-[#2B231B] text-[#FAF7F2] border-[#2B231B] shadow-xs'
              : 'bg-[#FAF7F2] text-[#594B3C] border-[#D9CEBC] hover:border-[#B8A892] hover:text-[#1F1914]'
          }`}
          title={t('Tüm Dönemler', 'All Periods')}
        >
          {t('Tüm Dönemler', 'All Periods')} ({totalCount})
        </button>

        {/* 6 Broad Eras */}
        {ERAS.map(era => {
          const eraPeriods = era.periodIds;
          const count = eraPeriods.reduce((acc, p) => acc + (periodCounts[p] || 0), 0);
          const hasAnySelected = eraPeriods.some(p => selectedPeriods.includes(p));
          const hasAllSelected = eraPeriods.every(p => selectedPeriods.includes(p));
          const isExpanded = expandedEraId === era.id;
          const eraName = lang === 'en' ? era.shortEn : era.shortTr;
          const isMultiPeriod = eraPeriods.length > 1;

          // Color sample from first period in era
          const firstPeriodCfg = getPeriodConfig(eraPeriods[0]);

          return (
            <div
              key={era.id}
              className={`inline-flex items-stretch border transition-colors whitespace-nowrap shrink-0 ${
                hasAllSelected
                  ? 'bg-[#F2ECE1] border-[#C8BAA5] text-[#241E18]'
                  : hasAnySelected
                  ? 'bg-[#FAF6EE] border-[#DDD2C0] text-[#3D3328]'
                  : 'bg-[#FAF7F2] border-[#E2D8C7] text-[#786958] opacity-60 hover:opacity-100'
              }`}
            >
              {/* Main Era Filter Button */}
              <button
                type="button"
                onClick={() => {
                  if (isMultiPeriod) {
                    // If era is not expanded, expand it for easy period selection
                    setExpandedEraId(prev => (prev === era.id ? null : era.id));
                  }
                  handleToggleEra(era.id);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-serif font-medium"
                title={`${lang === 'en' ? era.nameEn : era.nameTr}`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: firstPeriodCfg.color }}
                />
                <span>{eraName}</span>
                <span className="text-[10px] font-mono tabular-nums opacity-75">
                  {count}
                </span>
              </button>

              {/* Sub-period Expand Toggle Icon if multi-period */}
              {isMultiPeriod && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedEraId(prev => (prev === era.id ? null : era.id));
                  }}
                  className={`px-1.5 flex items-center justify-center border-l transition-colors ${
                    isExpanded
                      ? 'bg-[#E5DBCB] text-[#1E1710] border-[#C8BAA5]'
                      : 'hover:bg-[#EFE8DC] text-[#706150] border-[#E0D5C3]'
                  }`}
                  aria-label={t('Alt dönemleri göster', 'Toggle sub-periods')}
                  title={t('Alt dönemleri göster / gizle', 'Show / hide sub-periods')}
                >
                  {isExpanded ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Secondary Row: Specific Sub-Periods for the currently expanded Era */}
      {expandedEraId && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 bg-[#F5EFE4] border border-[#DDD1BE] shadow-2xs">
          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#736453] px-1.5 shrink-0">
            {lang === 'en'
              ? getEraConfig(expandedEraId)?.nameEn
              : getEraConfig(expandedEraId)?.nameTr}
            :
          </span>

          <button
            type="button"
            onClick={() => handleSelectOnlyEra(expandedEraId)}
            className="px-2 py-0.5 text-[11px] font-serif border border-[#D5C7B2] bg-[#FAF7F2] hover:bg-white text-[#57493A] shrink-0"
          >
            {t('Sadece Bu Çağ', 'Only This Era')}
          </button>

          {getEraConfig(expandedEraId)?.periodIds.map(periodId => {
            const config = getPeriodConfig(periodId);
            const isSelected = selectedPeriods.includes(periodId);
            const count = periodCounts[periodId] || 0;
            const periodLabel = lang === 'en' ? config.shortEn : config.shortTr;

            return (
              <button
                key={periodId}
                onClick={() => onTogglePeriod(periodId)}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-serif border transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'font-medium shadow-2xs'
                    : 'opacity-55 hover:opacity-100 bg-[#FAF7F2] text-[#695B4A] border-[#DDD3C2]'
                }`}
                style={{
                  backgroundColor: isSelected ? config.bgLight : undefined,
                  borderColor: isSelected ? config.borderColor : undefined,
                  color: isSelected ? config.color : undefined
                }}
                title={lang === 'en' ? config.nameEn : config.nameTr}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <span>{periodLabel}</span>
                <span className="text-[9.5px] font-mono tabular-nums opacity-75">
                  {count}
                </span>
                {isSelected && <Check size={10} weight="bold" className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
