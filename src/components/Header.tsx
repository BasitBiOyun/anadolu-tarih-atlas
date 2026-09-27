import React, { useState } from 'react';
import { Settlement, PeriodId } from '../types/settlement';
import { Search } from './Search';
import { PeriodFilter } from './PeriodFilter';
import { useLanguage } from '../context/LanguageContext';
import { Compass, Info, SlidersHorizontal, Database } from '@phosphor-icons/react';

interface HeaderProps {
  settlements: Settlement[];
  selectedPeriods: string[];
  onTogglePeriod: (period: string) => void;
  onSelectPeriods?: (periods: string[]) => void;
  onSelectAllPeriods: () => void;
  onSelectSettlement: (settlement: Settlement) => void;
  selectedSettlementId?: string;
  periodCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
  onOpenAboutModal: () => void;
  onOpenPipelineModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settlements,
  selectedPeriods,
  onTogglePeriod,
  onSelectPeriods,
  onSelectAllPeriods,
  onSelectSettlement,
  selectedSettlementId,
  periodCounts,
  totalCount,
  filteredCount,
  onOpenAboutModal,
  onOpenPipelineModal
}) => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="shrink-0 bg-[#FAF7F2] border-b border-[#E0D5C3] select-none z-30">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand / Title Zone */}
        <div className="flex items-center justify-between shrink-0">
          <div className="shrink-0">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1510] tracking-tight flex items-center gap-2 whitespace-nowrap">
              <Compass size={22} weight="regular" className="text-[#8A4526] shrink-0" />
              <span>{t('Anadolu Tarih Atlası', 'Anatolian Historical Atlas')}</span>
            </h1>
          </div>

          {/* Mobile Right Controls: Language Switcher, Filter Toggle, Info */}
          <div className="flex items-center gap-2 md:hidden shrink-0">
            {/* Language Switcher Mobile */}
            <div className="inline-flex items-center border border-[#D9CEBC] bg-[#F4EFE6] p-0.5 text-xs font-serif shadow-2xs w-[68px] justify-center shrink-0">
              <button
                type="button"
                onClick={() => setLang('tr')}
                className={`w-[30px] py-1 text-[11px] font-semibold tracking-wider text-center transition-colors ${
                  lang === 'tr'
                    ? 'bg-[#8A4526] text-[#FAF7F2] shadow-xs'
                    : 'text-[#695B4A] hover:text-[#1A1510]'
                }`}
                aria-label="Türkçe"
              >
                TR
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`w-[30px] py-1 text-[11px] font-semibold tracking-wider text-center transition-colors ${
                  lang === 'en'
                    ? 'bg-[#8A4526] text-[#FAF7F2] shadow-xs'
                    : 'text-[#695B4A] hover:text-[#1A1510]'
                }`}
                aria-label="English"
              >
                EN
              </button>
            </div>

            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="min-h-[38px] w-[100px] justify-center text-[#4A3F33] border border-[#D9CEBC] bg-[#F4EFE6] text-xs font-serif flex items-center gap-1.5 shrink-0"
              aria-label={t('Dönem filtrelerini aç', 'Toggle period filters')}
            >
              <SlidersHorizontal size={15} weight="regular" />
              <span>{t('Dönemler', 'Periods')}</span>
            </button>

            {onOpenPipelineModal && (
              <button
                onClick={onOpenPipelineModal}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center text-[#4A3F33] border border-[#D9CEBC] bg-[#F4EFE6] shrink-0"
                aria-label={t('Araştırma Veritabanı', 'Research Database')}
              >
                <Database size={16} weight="regular" className="text-[#8A4526]" />
              </button>
            )}

            <button
              onClick={onOpenAboutModal}
              className="min-h-[38px] min-w-[38px] flex items-center justify-center text-[#4A3F33] border border-[#D9CEBC] bg-[#F4EFE6] shrink-0"
              aria-label={t('Atlas Hakkında', 'About Atlas')}
            >
              <Info size={16} weight="regular" />
            </button>
          </div>
        </div>

        {/* Desktop Controls: Search Field, Language Switcher & Info Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-full md:w-80 shrink-0">
            <Search
              settlements={settlements}
              onSelect={onSelectSettlement}
              selectedSettlementId={selectedSettlementId}
            />
          </div>

          {/* Desktop Language Switcher (TR / EN) */}
          <div className="hidden md:inline-flex items-center border border-[#D9CEBC] bg-[#F4EFE6] p-0.5 text-xs font-serif shadow-2xs w-[76px] justify-center shrink-0">
            <button
              type="button"
              onClick={() => setLang('tr')}
              className={`w-[34px] py-1 text-xs font-semibold tracking-wider text-center transition-colors ${
                lang === 'tr'
                  ? 'bg-[#8A4526] text-[#FAF7F2] shadow-xs'
                  : 'text-[#695B4A] hover:text-[#1A1510] hover:bg-[#EAE2D3]'
              }`}
              aria-label="Türkçe"
            >
              TR
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`w-[34px] py-1 text-xs font-semibold tracking-wider text-center transition-colors ${
                lang === 'en'
                  ? 'bg-[#8A4526] text-[#FAF7F2] shadow-xs'
                  : 'text-[#695B4A] hover:text-[#1A1510] hover:bg-[#EAE2D3]'
              }`}
              aria-label="English"
            >
              EN
            </button>
          </div>

          {onOpenPipelineModal && (
            <button
              onClick={onOpenPipelineModal}
              className="hidden md:inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-serif text-[#4A3F33] hover:text-[#1A1510] bg-[#F4EFE6] hover:bg-[#EAE2D3] border border-[#D9CEBC] transition-colors shrink-0"
              title={t('Firestore Araştırma Havuzu ve Storage', 'Firestore Research Pipeline & Storage')}
            >
              <Database size={15} weight="regular" className="text-[#8A4526]" />
              <span>{t('Veritabanı', 'Database')}</span>
            </button>
          )}

          <button
            onClick={onOpenAboutModal}
            className="hidden md:inline-flex items-center justify-center gap-1.5 w-[128px] py-2 text-xs font-serif text-[#4A3F33] hover:text-[#1A1510] bg-[#F4EFE6] hover:bg-[#EAE2D3] border border-[#D9CEBC] transition-colors shrink-0"
            title={t('Atlas Metodolojisi ve Hakkında', 'Atlas Methodology and About')}
          >
            <Info size={16} weight="regular" className="text-[#8A4526]" />
            <span>{t('Atlas Hakkında', 'About Atlas')}</span>
          </button>
        </div>
      </div>

      {/* Period Filter Bar Row (Desktop & toggleable mobile) */}
      <div
        className={`border-t border-[#E8DFD0] bg-[#F6F1E8]/70 px-4 sm:px-6 py-2 ${
          mobileFilterOpen ? 'block' : 'hidden md:block'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <PeriodFilter
            selectedPeriods={selectedPeriods}
            onTogglePeriod={onTogglePeriod}
            onSelectPeriods={onSelectPeriods}
            onSelectAll={onSelectAllPeriods}
            periodCounts={periodCounts}
            totalCount={totalCount}
            filteredCount={filteredCount}
          />
        </div>
      </div>
    </header>
  );
};
