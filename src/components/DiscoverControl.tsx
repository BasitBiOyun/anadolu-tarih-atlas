import React from 'react';
import { Compass } from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';

interface DiscoverControlProps {
  onDiscover: () => void;
  availableCount: number;
}

export const DiscoverControl: React.FC<DiscoverControlProps> = ({
  onDiscover,
  availableCount
}) => {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onDiscover}
      disabled={availableCount === 0}
      className="group pointer-events-auto absolute bottom-[132px] right-3 z-20 inline-flex min-h-12 touch-manipulation items-center gap-2.5 border border-[#D9CEBC] bg-[#FAF7F2]/95 px-2.5 py-2 text-left shadow-[0_16px_40px_-24px_rgba(32,23,17,0.55)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[#C8B69F] hover:bg-[#FFFDF8] disabled:cursor-not-allowed disabled:opacity-45 sm:bottom-[138px] sm:right-5 sm:px-3"
      aria-label={t('Rastgele bir yer keşfet', 'Discover a random site')}
      title={t(
        'Seçili dönemler içinden rastgele bir yerleşim aç',
        'Open a random site from the selected periods'
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#8A4526] text-[#FAF7F2] transition-transform group-hover:rotate-[-8deg]">
        <Compass size={18} weight="bold" />
      </span>

      <span className="min-w-0">
        <span className="block font-serif text-sm font-bold leading-none text-[#1A1510]">
          {t('Keşfet', 'Discover')}
        </span>
        <span className="mt-1 block whitespace-nowrap font-sans text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8A7A68]">
          {t('Rastgele bir yer', 'Random site')}
        </span>
      </span>
    </button>
  );
};
