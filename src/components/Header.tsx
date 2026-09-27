import React, { useState } from 'react';
import { Settlement } from '../types/settlement';
import { Search } from './Search';
import { PeriodFilter } from './PeriodFilter';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  Compass,
  Info,
  Moon,
  SlidersHorizontal,
  Sun
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
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const themeLabel =
    theme === 'dark'
      ? t('Açık temaya geç', 'Switch to light theme')
      : t('Koyu temaya geç', 'Switch to dark theme');

  return (
    <header className="shrink-0 bg-[#FAF7F2] border-b border-[#E0D5C3] select-none z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3 md:space-y-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 shrink">
            <h1 className="flex min-w-0 items-center gap-2 font-serif text-xl font-bold tracking-tight text-[#1A1510] sm:text-2xl">
              <Compass size={22} weight="regular" className="shrink-0 text-[#8A4526]" />
              <span className="truncate">{t('Anadolu Tarih Atlası', 'Anatolian Historical Atlas')}</span>
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center border border-[#D9CEBC] bg-[#F4EFE6] text-[#4A3F33] transition-colors hover:bg-[#EAE2D3] hover:text-[#1A1510]"
              aria-label={themeLabel}
              title={themeLabel}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? <Sun size={17} weight="regular" /> : <Moon size={17} weight="regular" />}
            </button>

            <button
              type="button"
              onClick={onOpenAboutModal}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center border border-[#D9CEBC] bg-[#F4EFE6] text-[#4A3F33]"
              aria-label={t('Atlas Hakkında', 'About Atlas')}
            >
              <Info size={17} weight="regular" />
            </button>
          </div>

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
              onClick={toggleTheme}
              className="inline-flex h-[34px] w-[42px] shrink-0 items-center justify-center border border-[#D9CEBC] bg-[#F4EFE6] text-[#4A3F33] transition-colors hover:bg-[#EAE2D3] hover:text-[#1A1510]"
              aria-label={themeLabel}
              title={themeLabel}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? <Sun size={17} weight="regular" /> : <Moon size={17} weight="regular" />}
            </button>

            <button
              type="button"
              onClick={onOpenAboutModal}
              className="inline-flex w-[118px] shrink-0 items-center justify-center gap-1.5 border border-[#D9CEBC] bg-[#F4EFE6] py-2 font-serif text-xs text-[#4A3F33] transition-colors hover:bg-[#EAE2D3] hover:text-[#1A1510]"
              title={t('Atlas rehberi ve metodoloji', 'Atlas guide and methodology')}
            >
              <Info size={16} weight="regular" className="text-[#8A4526]" />
              <span>{t('Atlas Rehberi', 'Atlas Guide')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <div className="min-w-0 flex-1">
            <Search
              settlements={settlements}
              onSelect={onSelectSettlement}
              selectedSettlementId={selectedSettlementId}
            />
          </div>

          <div className="inline-flex w-[68px] shrink-0 items-center justify-center border border-[#D9CEBC] bg-[#F4EFE6] p-0.5 font-serif text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setLang('tr')}
              className={`w-[30px] py-1.5 text-center text-[11px] font-semibold tracking-wider transition-colors ${
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
              className={`w-[30px] py-1.5 text-center text-[11px] font-semibold tracking-wider transition-colors ${
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
            type="button"
            onClick={() => setMobileFilterOpen(current => !current)}
            className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center border border-[#D9CEBC] bg-[#F4EFE6] text-[#4A3F33]"
            aria-label={t('Dönem filtrelerini aç', 'Toggle period filters')}
            aria-expanded={mobileFilterOpen}
          >
            <SlidersHorizontal size={17} weight="regular" />
          </button>
        </div>
      </div>

      <div
        className={`border-t border-[#E8DFD0] bg-[#F6F1E8]/70 px-4 py-2 sm:px-6 ${
          mobileFilterOpen ? 'block' : 'hidden md:block'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
