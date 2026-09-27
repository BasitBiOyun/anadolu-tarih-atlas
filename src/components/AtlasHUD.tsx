import React, { useMemo } from 'react';
import { MapTrifold } from '@phosphor-icons/react';
import {
  CHRONOLOGICAL_PERIOD_IDS,
  ERAS,
  PERIODS
} from '../data/periods';
import { useLanguage } from '../context/LanguageContext';

interface AtlasHUDProps {
  selectedPeriods: string[];
  filteredCount: number;
  totalCount: number;
}

export const AtlasHUD: React.FC<AtlasHUDProps> = ({
  selectedPeriods,
  filteredCount,
  totalCount
}) => {
  const { lang, t } = useLanguage();

  const periodLabel = useMemo(() => {
    const isAll =
      selectedPeriods.length === CHRONOLOGICAL_PERIOD_IDS.length &&
      CHRONOLOGICAL_PERIOD_IDS.every(id => selectedPeriods.includes(id));

    if (isAll) return t('Tüm Zamanlar', 'All periods');

    if (selectedPeriods.length === 1) {
      const period = PERIODS.find(item => item.id === selectedPeriods[0]);
      if (period) return lang === 'tr' ? period.shortTr : period.shortEn;
    }

    const exactEra = ERAS.find(
      era =>
        era.periodIds.length === selectedPeriods.length &&
        era.periodIds.every(id => selectedPeriods.includes(id))
    );
    if (exactEra) return lang === 'tr' ? exactEra.shortTr : exactEra.shortEn;

    return t(
      `${selectedPeriods.length} dönem`,
      `${selectedPeriods.length} periods`
    );
  }, [lang, selectedPeriods, t]);

  return (
    <aside
      className="pointer-events-none absolute left-3 top-3 z-20 border border-[#D9CEBC] bg-[#FAF7F2]/92 px-3 py-2.5 shadow-[0_14px_36px_-26px_rgba(32,23,17,0.6)] backdrop-blur-md sm:left-5 sm:top-4"
      aria-label={t('Atlas durumu', 'Atlas status')}
    >
      <div className="flex items-center gap-2">
        <MapTrifold size={15} className="shrink-0 text-[#8A4526]" />
        <div className="font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-[#9A765C]">
          {t('Atlas Görünümü', 'Atlas View')}
        </div>
      </div>

      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-serif text-xl font-bold leading-none text-[#1A1510]">
          {filteredCount}
        </span>
        <span className="font-serif text-[11px] font-semibold text-[#6B5B4B]">
          / {totalCount} {t('yer', 'sites')}
        </span>
      </div>

      <div className="mt-1 max-w-[180px] truncate font-sans text-[9px] font-semibold text-[#736554]">
        {periodLabel}
      </div>
    </aside>
  );
};
