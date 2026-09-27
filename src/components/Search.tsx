import React, { useState, useRef, useEffect } from 'react';
import { Settlement } from '../types/settlement';
import { getPrimaryPeriod } from '../utils/chronology';
import { getPeriodColor, getPeriodConfig, getPeriodLabel } from '../config/periods';
import { useLanguage } from '../context/LanguageContext';
import { filterSettlements } from '../utils/search';
import { getPeriodChipStyle, getPeriodDotColor } from '../utils/themeStyles';
import { useTheme } from '../context/ThemeContext';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

interface SearchProps {
  settlements: Settlement[];
  onSelect: (settlement: Settlement) => void;
  selectedSettlementId?: string;
}

export const Search: React.FC<SearchProps> = ({
  settlements,
  onSelect,
  selectedSettlementId
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { lang, t } = useLanguage();
  const { theme } = useTheme();

  // Filter matching settlements using Turkish-aware, diacritic-insensitive normalization
  const results = query.trim()
    ? filterSettlements(settlements, query, lang).slice(0, 10)
    : [];

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlightIndex]) {
        onSelect(results[highlightIndex]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelect = (settlement: Settlement) => {
    onSelect(settlement);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <MagnifyingGlass
          size={16}
          weight="regular"
          className="absolute left-3 text-[#7A6D5E] pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('Yerleşim, il veya dönem ara...', 'Search settlement, province or period...')}
          className="w-full pl-9 pr-8 py-2 bg-[#F6F0E6] border border-[#DDD2C0] hover:border-[#C4B69F] focus:border-[#8A4526] focus:bg-[#FFFDF9] focus:outline-none rounded-none font-sans text-xs text-[#241E18] placeholder-[#8F8171] transition-colors"
          aria-label={t('Yerleşim ara', 'Search settlements')}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 p-1 text-[#8C7D6B] hover:text-[#1F1914] transition-colors"
            aria-label={t('Aramayı temizle', 'Clear search')}
          >
            <X size={14} weight="regular" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#FAF7F2] border border-[#D9CEBC] shadow-lg z-50 max-h-96 overflow-y-auto divide-y divide-[#EDE4D5]">
          {results.map((settlement, idx) => {
            const isHighlighted = idx === highlightIndex;
            const isSelected = settlement.id === selectedSettlementId;
            const primaryPeriod = getPrimaryPeriod(settlement.periods);
            const periodColor = getPeriodColor(primaryPeriod);

            return (
              <div
                key={settlement.id}
                onMouseEnter={() => setHighlightIndex(idx)}
                onClick={() => handleSelect(settlement)}
                className={`px-3.5 py-2.5 cursor-pointer transition-colors ${
                  isHighlighted ? 'bg-[#EFE8DC]' : isSelected ? 'bg-[#F2ECE0]' : 'hover:bg-[#F4EEE4]'
                }`}
              >
                {/* Row 1: Period indicator dot + Full Site Name (Prominent, NEVER truncate to Ka...) */}
                <div className="flex items-start gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: getPeriodDotColor(periodColor, theme) }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-serif font-bold text-sm text-[#1C1712] leading-snug break-words">
                        {settlement.name}
                      </span>
                    </div>

                    {/* Row 2: Location (Province / District) underneath in smaller text */}
                    <div className="mt-0.5 text-[11px] text-[#6E6152] font-sans flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-[#4A3F33]">{settlement.province}</span>
                      {settlement.district && (
                        <>
                          <span className="text-[#A89C8C]">•</span>
                          <span>{settlement.district}</span>
                        </>
                      )}
                      {settlement.siteType && (
                        <>
                          <span className="text-[#A89C8C]">•</span>
                          <span className="italic text-[#7A6D5E]">{settlement.siteType}</span>
                        </>
                      )}
                    </div>

                    {/* Row 3: Translated Period tags on a separate line (maximum 2, then +N) */}
                    {settlement.periods && settlement.periods.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        {settlement.periods.slice(0, 2).map(periodId => {
                          const periodCfg = getPeriodConfig(periodId);
                          const label = getPeriodLabel(periodId, lang);
                          return (
                            <span
                              key={periodId}
                              className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 border"
                              style={getPeriodChipStyle(periodCfg, theme)}
                            >
                              {label}
                            </span>
                          );
                        })}
                        {settlement.periods.length > 2 && (
                          <span className="text-[10px] text-[#7A6D5E] font-medium bg-[#EFE8DC] border border-[#DDD2C0] px-1.5 py-0.5">
                            +{settlement.periods.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results indicator */}
      {isOpen && query.trim().length > 1 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#FAF7F2] border border-[#D9CEBC] shadow-lg z-50 p-4 text-center">
          <p className="font-sans text-xs text-[#7A6D5E]">
            {t(
              `"${query}" için eşleşen yerleşim bulunamadı.`,
              `No settlements found matching "${query}".`
            )}
          </p>
        </div>
      )}
    </div>
  );
};
