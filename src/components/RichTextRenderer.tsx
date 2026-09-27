import React from 'react';
import { ContentParagraph } from '../types/settlement';
import { useLanguage } from '../context/LanguageContext';

/**
 * Safely tests whether a section (string, array of strings, or array of rich objects) has content.
 */
export function hasRichContent(val?: any): boolean {
  if (!val) return false;
  if (Array.isArray(val)) {
    return (
      val.length > 0 &&
      val.some(item => {
        if (!item) return false;
        if (typeof item === 'string') return item.trim().length > 0;
        if (typeof item === 'object') {
          return Boolean(
            (item.text && String(item.text).trim().length > 0) ||
            (item.title && String(item.title).trim().length > 0) ||
            (item.summary && String(item.summary).trim().length > 0)
          );
        }
        return false;
      })
    );
  }
  if (typeof val === 'string') return val.trim().length > 0;
  if (typeof val === 'object') {
    return Boolean(
      (val.text && String(val.text).trim().length > 0) ||
      (val.summary && String(val.summary).trim().length > 0)
    );
  }
  return false;
}

/**
 * Safely extracts a plain string from either a string or a rich object.
 */
export function extractStringText(val?: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.text || val.summary || val.title || '';
  }
  return String(val);
}

interface RichParagraphRendererProps {
  item: ContentParagraph;
  className?: string;
  titleClassName?: string;
  sourceBadgeClassName?: string;
}

/**
 * Renders an archaeological content item safely whether it is a raw string
 * or a Schema 4 rich object { title?, text, sourceIds? }.
 */
export const RichParagraphRenderer: React.FC<RichParagraphRendererProps> = ({
  item,
  className = 'font-prose text-[13px] sm:text-sm leading-relaxed text-[#2B231B]',
  titleClassName = 'font-serif font-bold text-xs sm:text-sm text-[#1C1712]',
  sourceBadgeClassName = 'px-1.5 py-0.5 bg-[#EAE0D0] text-[#635342] border border-[#D8CABE] font-mono text-[10px] rounded-2xs'
}) => {
  const { t } = useLanguage();

  if (!item) return null;

  if (typeof item === 'string') {
    return <p className={className}>{item}</p>;
  }

  const title = item.title || item.topic;
  const text = item.text || item.scholarlyDebate || item.consensus || item.evidence;
  const sources = item.sourceIds || item.citations;

  return (
    <div className="space-y-1.5">
      {title && <h4 className={titleClassName}>{title}</h4>}
      {text && <p className={className}>{text}</p>}
      {sources && sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="font-serif text-[11px] text-[#786957] font-medium">
            {t('Kaynak:', 'Source:')}
          </span>
          {sources.map((sid, sidx) => (
            <span key={sidx} className={sourceBadgeClassName}>
              [{sid}]
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
