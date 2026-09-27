import React from 'react';
import { BibliographySource } from '../types/settlement';
import { useLanguage } from '../context/LanguageContext';
import { ArrowSquareOut, FilePdf } from '@phosphor-icons/react';

interface SourcesProps {
  sources: BibliographySource[];
}

export const Sources: React.FC<SourcesProps> = ({ sources }) => {
  const { lang, t } = useLanguage();

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <ul className="divide-y divide-[#EAE0D0]">
        {sources.map((src, idx) => {
          const hasPdf = Boolean(src.pdfUrl && src.pdfUrl.trim().length > 0);
          const hasUrl = Boolean(src.url && src.url.trim().length > 0);
          const hasDoi = Boolean(src.doi && src.doi.trim().length > 0);

          const mainLink = hasUrl
            ? src.url!
            : hasDoi
              ? `https://doi.org/${src.doi}`
              : hasPdf
                ? src.pdfUrl!
                : null;

          const authorText =
            src.authors && src.authors.length > 0
              ? src.authors.join(', ')
              : src.author || t('Anonim', 'Anonymous');
          const pubText = (src.journalOrPublisher && src.journalOrPublisher.trim().length > 0)
            ? src.journalOrPublisher
            : (src.journal && src.journal.trim().length > 0)
              ? src.journal
              : src.publisher;

          return (
            <li key={idx} className="py-2.5 first:pt-0 last:pb-0 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-[#211B15] font-serif text-[13px] leading-snug">
                    {(src.id || src.citationKey) && (
                      <span className="inline-block px-1.5 py-0.5 mr-1.5 text-[10px] font-mono font-semibold bg-[#EAE0D0] text-[#635342] border border-[#D8CABE] rounded-2xs align-middle">
                        [{src.id || src.citationKey}]
                      </span>
                    )}
                    <span className="font-semibold">{authorText}</span>
                    {src.year ? ` (${src.year}). ` : '. '}
                    <span className="italic text-[#3D3327]">"{src.title}"</span>
                  </div>
                  {pubText && (
                    <div className="text-[#695B4C] text-[11px]">
                      <span className="font-serif italic">{pubText}</span>
                      {src.volume && (
                        <span>
                          {lang === 'en' ? `, Vol. ${src.volume}` : `, Cilt ${src.volume}`}
                        </span>
                      )}
                      {src.pages && (
                        <span>
                          {lang === 'en' ? `, pp. ${src.pages}` : `, ss. ${src.pages}`}
                        </span>
                      )}
                    </div>
                  )}
                  {src.doi && (
                    <div className="text-[10px] font-mono text-[#8C7D6B]">
                      DOI:{' '}
                      <a
                        href={`https://doi.org/${src.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-[#8A4526]"
                      >
                        {src.doi}
                      </a>
                    </div>
                  )}
                </div>

                {/* Primary Resource Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  {hasPdf && (
                    <a
                      href={src.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-[#8A4526] bg-[#F7ECE4] hover:bg-[#EFE0D5] border border-[#E8D4C8] transition-colors"
                      title={t('PDF Belgesini Aç', 'Open PDF Document')}
                    >
                      <FilePdf size={12} weight="regular" />
                      <span>PDF</span>
                    </a>
                  )}

                  {mainLink && (
                    <a
                      href={mainLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 p-1 text-[#665747] hover:text-[#1F1914] border border-[#DDD3C2] hover:bg-[#F2ECE1] transition-colors"
                      title={t('Kaynağa Git', 'Go to Source')}
                      aria-label={t('Kaynağa Git', 'Go to Source')}
                    >
                      <ArrowSquareOut size={13} weight="regular" />
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
