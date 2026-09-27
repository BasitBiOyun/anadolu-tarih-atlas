import React from 'react';
import { BibliographySource } from '../types/settlement';
import { useLanguage } from '../context/LanguageContext';
import { ArrowSquareOut, FilePdf } from '@phosphor-icons/react';

interface SourcesProps {
  sources: BibliographySource[];
}

export const Sources: React.FC<SourcesProps> = ({ sources }) => {
  const { lang, t } = useLanguage();

  if (!sources?.length) return null;

  return (
    <ol className="space-y-2.5">
      {sources.map((src, idx) => {
        const hasPdf = Boolean(src.pdfUrl?.trim());
        const hasUrl = Boolean(src.url?.trim());
        const hasDoi = Boolean(src.doi?.trim());
        const mainLink = hasUrl
          ? src.url!
          : hasDoi
            ? `https://doi.org/${src.doi}`
            : hasPdf
              ? src.pdfUrl!
              : null;

        const authorText = src.authors?.length
          ? src.authors.join(', ')
          : src.author || t('Anonim', 'Anonymous');

        const pubText = src.journalOrPublisher || src.journal || src.publisher;

        return (
          <li
            key={idx}
            id={`source-${idx + 1}`}
            className="group grid grid-cols-[42px_minmax(0,1fr)] gap-3 border border-[#E2D7C7] bg-[#FCF9F3] px-4 py-4 transition-colors hover:border-[#CDBCA7] sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5"
          >
            <div className="flex h-9 w-9 items-center justify-center border border-[#D8C9B5] bg-[#F3E9DC] font-serif text-sm font-bold text-[#8A4526]">
              {String(idx + 1).padStart(2, '0')}
            </div>

            <div className="min-w-0">
              <div className="font-serif text-[15px] leading-snug text-[#211B15] sm:text-base">
                <span className="font-bold">{authorText}</span>
                {src.year ? ` (${src.year}). ` : '. '}
                <span className="italic text-[#3D3327]">“{src.title}”</span>
              </div>

              {pubText && (
                <div className="mt-1 font-serif text-xs italic text-[#6D5D4D] sm:text-[13px]">
                  {pubText}
                  {src.volume && (
                    <span>{lang === 'en' ? `, Vol. ${src.volume}` : `, Cilt ${src.volume}`}</span>
                  )}
                  {src.pages && (
                    <span>{lang === 'en' ? `, pp. ${src.pages}` : `, ss. ${src.pages}`}</span>
                  )}
                </div>
              )}

              {src.doi && (
                <div className="mt-1.5 font-mono text-[10px] text-[#8C7D6B] sm:text-[11px]">
                  DOI: {src.doi}
                </div>
              )}
            </div>

            <div className="col-start-2 flex items-center gap-2 sm:col-start-3 sm:row-start-1 sm:self-center">
              {hasPdf && (
                <a
                  href={src.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 border border-[#E1CBBB] bg-[#F8EEE5] px-2.5 py-1.5 font-sans text-[10px] font-semibold text-[#8A4526] transition-colors hover:bg-[#F1E1D4]"
                >
                  <FilePdf size={13} />
                  PDF
                </a>
              )}
              {mainLink && (
                <a
                  href={mainLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 border border-[#D8CDBD] bg-[#F7F2EA] px-2.5 py-1.5 font-sans text-[10px] font-semibold text-[#54483C] transition-colors hover:bg-[#EEE5D8]"
                >
                  {t('Kaynağa git', 'Open')}
                  <ArrowSquareOut size={13} />
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
