import React, { createContext, useContext } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { BibliographySource } from '../types/settlement';
import { useLanguage } from '../context/LanguageContext';

const CitationContext = createContext<BibliographySource[]>([]);

export const CitationProvider: React.FC<{
  sources: BibliographySource[];
  children: React.ReactNode;
}> = ({ sources, children }) => (
  <CitationContext.Provider value={sources || []}>
    {children}
  </CitationContext.Provider>
);

function getSourceLink(source: BibliographySource): string | null {
  if (source.url?.trim()) return source.url;
  if (source.doi?.trim()) return `https://doi.org/${source.doi}`;
  if (source.pdfUrl?.trim()) return source.pdfUrl;
  return null;
}

function getAuthorText(source: BibliographySource, anonymousLabel: string): string {
  if (source.authors?.length) return source.authors.join(', ');
  return source.author || anonymousLabel;
}

export const CitationRefs: React.FC<{ sourceIds?: string[] }> = ({ sourceIds }) => {
  const sources = useContext(CitationContext);
  const { t } = useLanguage();

  if (!sourceIds?.length || !sources.length) return null;

  const resolved = Array.from(new Set(sourceIds))
    .map(sourceId => {
      const index = sources.findIndex(
        source => source.id === sourceId || source.citationKey === sourceId
      );
      if (index < 0) return null;
      return { index, source: sources[index] };
    })
    .filter(Boolean) as Array<{ index: number; source: BibliographySource }>;

  if (!resolved.length) return null;

  return (
    <span className="ml-1 inline-flex items-baseline gap-0.5 align-baseline">
      {resolved.map(({ index, source }) => {
        const author = getAuthorText(source, t('Anonim', 'Anonymous'));
        const publication =
          source.journalOrPublisher || source.journal || source.publisher || '';
        const link = getSourceLink(source);

        return (
          <span key={index} className="group relative inline-flex align-super">
            <button
              type="button"
              className="relative -top-[0.28em] inline-flex min-w-[18px] items-center justify-center border-b border-[#A95B35] px-0.5 font-sans text-[10px] font-bold leading-4 text-[#8A4526] outline-none transition-colors hover:text-[#5F2D18] focus-visible:bg-[#F1E5D8] sm:text-[11px]"
              aria-label={t(`Kaynak ${index + 1}`, `Source ${index + 1}`)}
            >
              {index + 1}
            </button>

            <span
              role="tooltip"
              className="pointer-events-none invisible absolute bottom-[calc(100%+9px)] left-1/2 z-50 w-[min(320px,80vw)] -translate-x-1/2 border border-[#D7C8B5] bg-[#FFFDF8] p-3.5 text-left opacity-0 shadow-[0_20px_50px_-26px_rgba(35,27,20,0.75)] transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100"
            >
              <span className="mb-1 block font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A765C]">
                {t(`Kaynak ${index + 1}`, `Source ${index + 1}`)}
              </span>
              <span className="block font-serif text-[14px] font-bold leading-snug text-[#251E18]">
                {author}{source.year ? ` (${source.year})` : ''}
              </span>
              <span className="mt-1 block font-prose text-[13px] leading-snug text-[#4D4034]">
                {source.title}
              </span>
              {publication && (
                <span className="mt-1 block font-serif text-[11px] italic text-[#756555]">
                  {publication}
                </span>
              )}
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto mt-2 inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-[#8A4526] hover:underline"
                >
                  {t('Kaynağı aç', 'Open source')}
                  <ArrowSquareOut size={12} />
                </a>
              )}
            </span>
          </span>
        );
      })}
    </span>
  );
};
