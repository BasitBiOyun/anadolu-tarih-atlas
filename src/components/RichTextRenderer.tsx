import React from 'react';
import { ContentParagraph } from '../types/settlement';
import { CitationRefs } from './CitationSystem';

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
}

export const RichParagraphRenderer: React.FC<RichParagraphRendererProps> = ({
  item,
  className = 'font-prose text-[17px] leading-[1.75] text-[#2B231B]',
  titleClassName = 'font-serif font-bold text-lg text-[#1C1712]'
}) => {
  if (!item) return null;

  if (typeof item === 'string') {
    return <p className={className}>{item}</p>;
  }

  const title = item.title || item.topic;
  const text = item.text || item.scholarlyDebate || item.consensus || item.evidence;
  const sourceIds = item.sourceIds || item.citations;

  return (
    <div className="space-y-2">
      {title && <h4 className={titleClassName}>{title}</h4>}
      {text && (
        <p className={className}>
          {text}
          <CitationRefs sourceIds={sourceIds} />
        </p>
      )}
    </div>
  );
};
