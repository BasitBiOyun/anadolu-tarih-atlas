import React, { createContext, useContext, useState } from 'react';
import { ArrowSquareOut, X } from '@phosphor-icons/react';
import { BibliographySource } from '../types/settlement';
import { useLanguage } from '../context/LanguageContext';

interface CitationContextValue {
  sources: BibliographySource[];
  mobileCitationIndex: number | null;
  setMobileCitationIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

const CitationContext = createContext<CitationContextValue>({
  sources: [],
  mobileCitationIndex: null,
  setMobileCitationIndex: () => undefined
});

export const CitationProvider: React.FC<{
  sources: BibliographySource[];
  children: React.ReactNode;
}> = ({ sources, children }) => {
  const [mobileCitationIndex, setMobileCitationIndex] = useState<number | null>(null);

  return (
    <CitationContext.Provider
      value={{
        sources: sources || [],
        mobileCitationIndex,
        setMobileCitationIndex
      }}
    >
      {children}
    </CitationContext.Provider>
  );
};

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
  const {
    sources,
    mobileCitationIndex,
    setMobileCitationIndex
  } = useContext(CitationContext);
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
        const mobileOpen = mobileCitationIndex === index;

        return (
          <span
            key={index}
            className="group/citation relative z-0 inline-flex align-super hover:z-[80] focus-within:z-[80]"
          >
            <button
              type="button"
              onClick={() => {
                setMobileCitationIndex(previous => previous === index ? null : index);
              }}
              className="relative -top-[0.28em] inline-flex min-h-6 min-w-6 touch-manipulation items-center justify-center border-b border-[#A95B35] px-1 font-sans text-[10px] font-bold leading-4 text-[#8A4526] outline-none transition-colors hover:text-[#5F2D18] focus-visible:bg-[#F1E5D8] sm:min-h-0 sm:min-w-[18px] sm:px-0.5 sm:text-[11px]"
              aria-label={t(`Kaynak ${index + 1}`, `Source ${index + 1}`)}
              aria-expanded={mobileOpen}
            >
              {index + 1}
            </button>

            <span
              role="tooltip"
              className="pointer-events-none invisible absolute bottom-[calc(100%+5px)] left-1/2 z-[100] hidden w-[min(320px,80vw)] -translate-x-1/2 border border-[#D7C8B5] bg-[#FFFDF8] p-3.5 text-left opacity-0 shadow-[0_24px_60px_-24px_rgba(35,27,20,0.82)] transition-all duration-150 after:absolute after:-bottom-2 after:left-0 after:h-2 after:w-full after:content-[''] group-hover/citation:pointer-events-auto group-hover/citation:visible group-hover/citation:opacity-100 group-focus-within/citation:pointer-events-auto group-focus-within/citation:visible group-focus-within/citation:opacity-100 sm:block"
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

            {mobileOpen && (
              <>
                <button
                  type="button"
                  aria-label={t('Kaynak kartını kapat', 'Close source card')}
                  onClick={() => setMobileCitationIndex(null)}
                  className="fixed inset-0 z-[150] bg-black/10 sm:hidden"
                />
                <span
                  role="dialog"
                  aria-label={t(`Kaynak ${index + 1}`, `Source ${index + 1}`)}
                  className="fixed inset-x-3 z-[160] block max-h-[60dvh] overflow-y-auto border border-[#D2C2AE] bg-[#FFFDF8] p-4 text-left normal-case shadow-[0_28px_70px_-24px_rgba(28,21,16,0.55)] sm:hidden"
                  style={{ bottom: 'max(12px, env(safe-area-inset-bottom))' }}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A765C]">
                        {t(`Kaynak ${index + 1}`, `Source ${index + 1}`)}
                      </span>
                      <span className="mt-1 block font-serif text-base font-bold leading-snug text-[#251E18]">
                        {author}{source.year ? ` (${source.year})` : ''}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobileCitationIndex(null)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#DED1C0] text-[#6B5B4B]"
                      aria-label={t('Kapat', 'Close')}
                    >
                      <X size={17} />
                    </button>
                  </span>

                  <span className="mt-3 block font-prose text-[14px] leading-relaxed text-[#4D4034]">
                    {source.title}
                  </span>

                  {publication && (
                    <span className="mt-2 block font-serif text-xs italic text-[#756555]">
                      {publication}
                    </span>
                  )}

                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex min-h-11 items-center gap-2 border border-[#DECDBB] bg-[#F5EBDD] px-3 py-2 font-sans text-xs font-semibold text-[#8A4526]"
                    >
                      {t('Kaynağı aç', 'Open source')}
                      <ArrowSquareOut size={14} />
                    </a>
                  )}
                </span>
              </>
            )}
          </span>
        );
      })}
    </span>
  );
};
