import React, { useState } from 'react';
import { Settlement } from '../types/settlement';
import { Search } from './Search';
import { PeriodFilter } from './PeriodFilter';
import { useLanguage } from '../context/LanguageContext';
import {
  Compass,
  Info,
  List,
  SlidersHorizontal,
  X
} from '@phosphor-icons/react';

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
  onOpenAboutModal
}) => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const openAbout = () => {
    setMobileMenuOpen(false);
    onOpenAboutModal();
  };

  return (
    <header className="z-30 shrink-0 select-none border-b border-[#E0D5C3] bg-[#FAF7F2]">
      <div className="mx-auto max-w-7xl space-y-2.5 px-3 py-2.5 sm:px-6 sm:py-3 md:space-y-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 shrink">
            <h1 className="flex min-w-0 items-center gap-2 font-serif text-lg font-bold tracking-tight text-[#1A1510] sm:text-2xl">
              <Compass size={21} weight="regular" className="shrink-0 text-[#8A4526]" />
              <span className="truncate">{t('Anadolu Tarih Atlası', 'Anatolian Historical Atlas')}</span>
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(current => !current)}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#D9CEBC] bg-[#F4EFE6] text-[#4A3F33] md:hidden"
            aria-label={t('Dil ve atlas bilgileri', 'Language and atlas information')}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={18} /> : <List size={19} />}
          </button>

          <div className="hidden items-center gap-2.5 md:flex">
            <div className="w-80 shrink-0">
              <Search
                settlements={settlements}
                onSelect={onSelectSettlement}
                selectedSettlementId={selectedSettlementId}
              />
            </div>

            <div className="inline-flex w-[76px] shrink-0 items-center justify-center border border-[#D9CEBC] bg-[#F4EFE6] p-0.5 font-serif text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setLang('tr')}
                className={`w-[34px] py-1 text-center text-xs font-semibold tracking-wider transition-colors ${
                  lang === 'tr'
                    ? 'bg-[#8A4526] text-[#FAF7F2] shadow-xs'
                    : 'text-[#695B4A] hover:bg-[#EAE2D3] hover:text-[#1A1510]'
                }`}
                aria-label="Türkçe"
              >
                TR
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`w-[34px] py-1 text-center text-xs font-semibold tracking-wider transition-colors ${
                  lang === 'en'
                    ? 'bg-[#8A4526] text-[#FAF7F2] shadow-xs'
                    : 'text-[#695B4A] hover:bg-[#EAE2D3] hover:text-[#1A1510]'
                }`}
                aria-label="English"
              >
                EN
              </button>
            </div>


            <button
              type="button"
              onClick={onOpenAboutModal}
              className="inline-flex w-[118px] shrink-0 items-center justify-center gap-1.5 border border-[#D9CEBC] bg-[#F4EFE6] py-2 font-serif text-xs text-[#4A3F33] transition-colors hover:bg-[#EAE2D3] hover:text-[#1A1510]"
              title={t('Atlas hakkında', 'About the atlas')}
            >
              <Info size={16} className="text-[#8A4526]" />
              <span>{t('Atlas Hakkında', 'About')}</span>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 border border-[#E0D5C3] bg-[#F6F1E8]/70 p-2 md:hidden">
            <div className="inline-flex items-center border border-[#D9CEBC] bg-[#F4EFE6] p-0.5 font-serif text-xs">
              <button
                type="button"
                onClick={() => setLang('tr')}
                className={`min-h-9 min-w-10 px-2 font-semibold ${
                  lang === 'tr' ? 'bg-[#8A4526] text-[#FAF7F2]' : 'text-[#695B4A]'
                }`}
              >
                TR
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`min-h-9 min-w-10 px-2 font-semibold ${
                  lang === 'en' ? 'bg-[#8A4526] text-[#FAF7F2]' : 'text-[#695B4A]'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={openAbout}
              className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 border border-[#D9CEBC] bg-[#F4EFE6] px-3 font-sans text-[10px] font-semibold text-[#4A3F33]"
            >
              <Info size={16} className="shrink-0 text-[#8A4526]" />
              <span className="truncate">{t('Atlas Hakkında', 'About the Atlas')}</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 md:hidden">
          <div className="min-w-0 flex-1">
            <Search
              settlements={settlements}
              onSelect={onSelectSettlement}
              selectedSettlementId={selectedSettlementId}
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileFilterOpen(current => !current)}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#D9CEBC] bg-[#F4EFE6] text-[#4A3F33]"
            aria-label={t('Dönem filtrelerini aç', 'Toggle period filters')}
            aria-expanded={mobileFilterOpen}
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </div>

      <div
        className={`border-t border-[#E8DFD0] bg-[#F6F1E8]/70 px-3 py-2 sm:px-6 ${
          mobileFilterOpen ? 'block' : 'hidden md:block'
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
