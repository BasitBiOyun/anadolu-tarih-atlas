import React from 'react';
import { Settlement } from '../types/settlement';
import { Timeline } from './Timeline';
import { ImageGallery } from './ImageGallery';
import { Sources } from './Sources';
import { SettlementMiniMap } from './SettlementMiniMap';
import { RichParagraphRenderer, hasRichContent } from './RichTextRenderer';
import { getPeriodConfig, getPeriodColor, getPeriodLabel } from '../config/periods';
import { getPrimaryPeriod } from '../utils/chronology';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  ArrowSquareOut,
  ArrowsOutSimple,
  BookOpen,
  Warning,
  ArrowClockwise
} from '@phosphor-icons/react';

export type DetailLoadStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'not_found';

interface SettlementPanelProps {
  settlement: Settlement | null;
  onClose: () => void;
  onOpenFullScreen?: () => void;
  onShowOnMainMap?: (settlement: Settlement) => void;
  isLoading?: boolean;
  status?: DetailLoadStatus;
  error?: string | null;
  onRetry?: () => void;
}

function getPlaceTypeLabel(type: string, lang: 'tr' | 'en'): string {
  switch (type) {
    case 'museum':
      return lang === 'en' ? 'Museum' : 'Müze';
    case 'archaeological_site':
      return lang === 'en' ? 'Archaeological Site' : 'Ören Yeri / Sit';
    case 'visitor_center':
      return lang === 'en' ? 'Visitor Centre' : 'Karşılama Merkezi';
    case 'virtual_museum':
      return lang === 'en' ? 'Virtual Museum' : 'Sanal Müze';
    default:
      return type;
  }
}

export const SettlementPanel: React.FC<SettlementPanelProps> = ({
  settlement,
  onClose,
  onOpenFullScreen,
  onShowOnMainMap,
  isLoading = false,
  status = 'idle',
  error = null,
  onRetry
}) => {
  const { lang, t } = useLanguage();

  if (!settlement) return null;

  const primaryPeriod = getPrimaryPeriod(settlement.periods);
  const primaryColor = getPeriodColor(primaryPeriod);

  const hasOverview = hasRichContent(settlement.overview);
  const hasChronology = hasRichContent(settlement.chronology);
  const hasImportance = hasRichContent(settlement.importance);
  const hasDiscoveries = hasRichContent(settlement.discoveries) || (settlement.keyFinds && settlement.keyFinds.length > 0);
  const hasHistory = hasRichContent(settlement.excavationHistory);
  const hasCurrentStatus = hasRichContent(settlement.currentStatus);
  const hasResearchDebates = Boolean(settlement.researchDebates && settlement.researchDebates.length > 0);
  const hasImages = settlement.images && settlement.images.length > 0;
  const hasSources = settlement.sources && settlement.sources.length > 0;

  // Geography
  const geography = settlement.geography;
  const hasGeography = Boolean(
    geography && (
      (geography.summary && geography.summary.trim().length > 0) ||
      (geography.landscape && geography.landscape.trim().length > 0) ||
      (geography.distanceFromNearestCenter && geography.distanceFromNearestCenter.trim().length > 0) ||
      (geography.gettingThere && geography.gettingThere.trim().length > 0)
    )
  );

  // Visit
  const visit = settlement.visit;
  const hasVisitHours = Boolean(visit?.hours && (visit.hours.open || visit.hours.close));
  const hasClosedDays = Boolean(visit?.closedDays && visit.closedDays.length > 0);
  const hasMuseumPass = visit?.museumPass !== null && visit?.museumPass !== undefined;
  const hasAddress = Boolean(visit?.address && visit.address.trim().length > 0);
  const hasPhone = Boolean(visit?.phone && visit.phone.trim().length > 0);
  const hasOfficialUrl = Boolean(visit?.officialUrl && visit.officialUrl.trim().length > 0);
  const hasVisitorNote = Boolean(visit?.visitorNote && visit.visitorNote.trim().length > 0);

  const hasVisit = Boolean(
    visit && (
      visit.statusLabel ||
      hasVisitHours ||
      hasClosedDays ||
      hasMuseumPass ||
      hasAddress ||
      hasPhone ||
      hasOfficialUrl ||
      hasVisitorNote
    )
  );

  // Nearby Places
  const hasNearbyPlaces = Boolean(settlement.nearbyPlaces && settlement.nearbyPlaces.length > 0);

  // Participation
  const hasParticipation = Boolean(settlement.participation && settlement.participation.length > 0);

  const isCurrentlyLoading = isLoading || status === 'loading';

  return (
    <aside
      aria-label={t('Arkeolojik Alan Detay Paneli', 'Archaeological Site Detail Panel')}
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[500px] lg:w-[560px] bg-[#FAF7F2] border-l border-[#E2D8C7] shadow-2xl flex flex-col text-[#262018] overflow-hidden select-text"
    >
      {/* Sticky Top Header Bar */}
      <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-[#E8DFD0] bg-[#FAF7F2]/95 backdrop-blur-xs flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Province / District / Modern Place + Prominent Site Type Badge */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-sans font-medium tracking-wider uppercase text-[#7D6E5D] truncate">
              {settlement.province}
              {settlement.district ? ` · ${settlement.district}` : ''}
              {settlement.modernPlace && (
                <span className="normal-case font-serif text-[11px] text-[#695B4A]">
                  {' '}· {settlement.modernPlace}
                </span>
              )}
            </span>
            {settlement.siteType && (
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-serif font-bold uppercase tracking-wider bg-[#F4E9DF] text-[#8A4526] border border-[#E8D4C4]">
                {Array.isArray(settlement.siteType)
                  ? settlement.siteType.join(', ')
                  : settlement.siteType}
              </span>
            )}
          </div>

          {/* Settlement / Site Name */}
          <h2
            className="font-serif font-bold text-[#1A1510] tracking-tight leading-snug"
            style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}
          >
            {settlement.name}
          </h2>

          {/* Alternative Names */}
          {settlement.alternativeNames && settlement.alternativeNames.length > 0 && (
            <div className="text-xs font-serif italic text-[#706251] mt-0.5">
              {t('Diğer adları: ', 'Alternative names: ')}{settlement.alternativeNames.join(', ')}
            </div>
          )}

          {/* Period Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {settlement.periodDetails && settlement.periodDetails.length > 0 ? (
              settlement.periodDetails.map(pd => {
                const cfg = getPeriodConfig(pd.periodId || pd.period);
                const periodLabel = getPeriodLabel(pd.periodId || pd.period, lang);
                return (
                  <span
                    key={pd.period}
                    className="inline-flex items-center gap-1 text-[11px] font-serif font-medium px-2 py-0.5 border"
                    style={{
                      backgroundColor: cfg.bgLight,
                      borderColor: cfg.borderColor,
                      color: cfg.color
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    />
                    {periodLabel}
                  </span>
                );
              })
            ) : (
              settlement.periods.map(period => {
                const cfg = getPeriodConfig(period);
                const periodLabel = getPeriodLabel(period, lang);
                return (
                  <span
                    key={period}
                    className="inline-flex items-center gap-1 text-[11px] font-serif font-medium px-2 py-0.5 border"
                    style={{
                      backgroundColor: cfg.bgLight,
                      borderColor: cfg.borderColor,
                      color: cfg.color
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    />
                    {periodLabel}
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Actions: Full Page & Close */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenFullScreen && (
            <button
              onClick={onOpenFullScreen}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-[#736554] hover:text-[#8A4526] hover:bg-[#EFE7D8] transition-colors rounded-none"
              title={t('Tam Sayfa Aç', 'Open Full Page')}
              aria-label={t('Tam Sayfa Aç', 'Open Full Page')}
            >
              <ArrowsOutSimple size={20} weight="bold" />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-[#736554] hover:text-[#1A1510] hover:bg-[#EFE7D8] transition-colors rounded-none"
            aria-label={t('Paneli Kapat', 'Close Panel')}
          >
            <X size={20} weight="regular" />
          </button>
        </div>
      </div>

      {/* Loading state, Error state, Not Found state, or Scrollable Editorial Article Body */}
      {isCurrentlyLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#736554] space-y-3">
          <div className="w-7 h-7 border-2 border-[#8A4526] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-serif">{t('Yerleşim detayları yükleniyor...', 'Loading settlement details...')}</span>
        </div>
      ) : status === 'not_found' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <Warning size={32} className="text-[#8A4526]" />
          <h3 className="font-serif font-bold text-sm text-[#1A1510]">
            {t('Ayrıntılı Monografi Bulunamadı', 'Detailed Monograph Not Found')}
          </h3>
          <p className="font-prose text-xs text-[#6B5D4E] max-w-xs leading-relaxed">
            {t(
              'Bu alan için henüz Firebase Storage üzerinde monografi dosyası yüklenmemiştir. Temel harita ve kronoloji bilgileri görüntülenmektedir.',
              'A full monograph file has not yet been uploaded to Firebase Storage for this site. Basic map and chronology data remain available.'
            )}
          </p>
        </div>
      ) : status === 'error' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <Warning size={32} className="text-red-700" />
          <h3 className="font-serif font-bold text-sm text-[#1A1510]">
            {t('Detaylar Yüklenemedi', 'Failed to Load Details')}
          </h3>
          <p className="font-prose text-xs text-[#7A3E26] max-w-xs leading-relaxed font-mono">
            {error || t('Bağlantı hatası oluştu.', 'A connection error occurred.')}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8A4526] hover:bg-[#72371E] text-white text-xs font-serif transition-colors"
            >
              <ArrowClockwise size={14} />
              <span>{t('Tekrar Dene', 'Retry')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-7 scrollbar-thin">
          {/* Prominent Full Page Banner Button */}
          {onOpenFullScreen && (
            <button
              onClick={onOpenFullScreen}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#EFE6D8] hover:bg-[#E5D9C7] border border-[#D8C7B0] transition-colors text-left group shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={20} weight="fill" className="text-[#8A4526] shrink-0" />
                <div>
                  <div className="font-serif font-bold text-xs sm:text-sm text-[#1A1510] group-hover:text-[#8A4526] transition-colors">
                    {t('Ayrıntılı Monografiyi / Tam Sayfayı Aç', 'Read Full Monograph & Deep Details')}
                  </div>
                  <div className="font-sans text-[11px] text-[#706251]">
                    {t('Geniş yazı puntoları, büyük tablolar ve ferah okuma', 'Large typography, expanded tables & clean view')}
                  </div>
                </div>
              </div>
              <ArrowsOutSimple size={18} weight="bold" className="text-[#8A4526] shrink-0 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Compact Location Map at Top */}
          <SettlementMiniMap
            settlement={settlement}
            onShowOnMainMap={onShowOnMainMap || onClose}
          />

          {/* 1. Overview */}
          {hasOverview && (
            <section className="space-y-2">
              <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1">
                {t('Genel Bakış', 'Overview')}
              </h3>
              <div className="space-y-2.5">
                {Array.isArray(settlement.overview) ? (
                  settlement.overview.map((paragraph, idx) => (
                    <RichParagraphRenderer
                      key={idx}
                      item={paragraph}
                      className="font-prose text-[14px] leading-relaxed text-[#2B231B]"
                    />
                  ))
                ) : (
                  <RichParagraphRenderer
                    item={settlement.overview}
                    className="font-prose text-[14px] leading-relaxed text-[#2B231B]"
                  />
                )}
              </div>
            </section>
          )}

          {/* 2. Interactive Chronology & Phases */}
          <section className="space-y-3">
            <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1">
              {t('Kronoloji & Evreler', 'Chronology & Phases')}
            </h3>

            {/* Visual Timeline Bar */}
            <Timeline settlement={settlement} />

            {/* Editorial Chronology Paragraphs */}
            {hasChronology && (
              <div className="space-y-2.5 pt-1">
                {Array.isArray(settlement.chronology) ? (
                  settlement.chronology.map((paragraph, idx) => (
                    <RichParagraphRenderer
                      key={idx}
                      item={paragraph}
                      className="font-prose text-[13px] leading-relaxed text-[#332A21]"
                    />
                  ))
                ) : (
                  <RichParagraphRenderer
                    item={settlement.chronology}
                    className="font-prose text-[13px] leading-relaxed text-[#332A21]"
                  />
                )}
              </div>
            )}
          </section>

          {/* 3. Archaeological Significance */}
          {hasImportance && (
            <section className="space-y-2">
              <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1">
                {t('Neden Önemli?', 'Why It Matters')}
              </h3>
              <div className="space-y-2.5">
                {Array.isArray(settlement.importance) ? (
                  settlement.importance.map((paragraph, idx) => (
                    <RichParagraphRenderer
                      key={idx}
                      item={paragraph}
                      className="font-prose text-[13px] leading-relaxed text-[#2B231B]"
                    />
                  ))
                ) : (
                  <RichParagraphRenderer
                    item={settlement.importance}
                    className="font-prose text-[13px] leading-relaxed text-[#2B231B]"
                  />
                )}
              </div>
            </section>
          )}

          {/* 4. Discoveries & Key Finds */}
          {hasDiscoveries && (
            <section className="space-y-3">
              <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1">
                {t('Başlıca Bulgular', 'Key Discoveries')}
              </h3>

              {/* General Discoveries Text */}
              {hasRichContent(settlement.discoveries) && (
                <div className="space-y-2.5">
                  {Array.isArray(settlement.discoveries) ? (
                    settlement.discoveries.map((paragraph, idx) => (
                      <RichParagraphRenderer
                        key={idx}
                        item={paragraph}
                        className="font-prose text-[13px] leading-relaxed text-[#2B231B]"
                      />
                    ))
                  ) : (
                    <RichParagraphRenderer
                      item={settlement.discoveries}
                      className="font-prose text-[13px] leading-relaxed text-[#2B231B]"
                    />
                  )}
                </div>
              )}

              {/* Key Finds Structured Cards */}
              {settlement.keyFinds && settlement.keyFinds.length > 0 && (
                <div className="pt-1 space-y-2">
                  <div className="text-[11px] font-serif font-semibold tracking-wider uppercase text-[#8A4526]">
                    {t('Önemli Eser ve Yapılar', 'Key Artifacts and Structures')}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {settlement.keyFinds.map((find, idx) => (
                      <div key={idx} className="p-3 bg-[#F4EFE6] border border-[#E0D5C3] space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-serif font-bold text-xs text-[#1C1712]">
                            {find.name}
                          </span>
                          {find.period && (
                            <span className="text-[10px] font-serif italic text-[#786957] shrink-0">
                              {find.period}
                            </span>
                          )}
                        </div>
                        <p className="font-prose text-xs text-[#42372A] leading-relaxed">
                          {find.description}
                        </p>
                        {find.sourceIds && find.sourceIds.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="font-serif text-[10px] text-[#786957] font-medium">
                              {t('Kaynak:', 'Source:')}
                            </span>
                            {find.sourceIds.map((sid, sidx) => (
                              <span key={sidx} className="px-1.5 py-0.5 bg-[#EAE0D0] text-[#635342] border border-[#D8CABE] font-mono text-[9px] rounded-2xs">
                                [{sid}]
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 5. Excavation History */}
          {(hasHistory || hasCurrentStatus) && (
            <section className="space-y-2">
              <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1">
                {t('Araştırma / Kazı Tarihi', 'Research / Excavation History')}
              </h3>
              <div className="space-y-2.5">
                {Array.isArray(settlement.excavationHistory) ? (
                  settlement.excavationHistory.map((paragraph, idx) => (
                    <RichParagraphRenderer
                      key={idx}
                      item={paragraph}
                      className="font-prose text-[13px] leading-relaxed text-[#2E251D]"
                    />
                  ))
                ) : (
                  <RichParagraphRenderer
                    item={settlement.excavationHistory}
                    className="font-prose text-[13px] leading-relaxed text-[#2E251D]"
                  />
                )}
              </div>

              {/* Current Status - only shown if non-empty */}
              {hasCurrentStatus && (
                <div className="pt-2 text-xs font-sans text-[#6B5D4E] flex flex-col gap-1">
                  <span className="font-serif font-semibold text-[#42372A]">
                    {t('Güncel Durum:', 'Current Status:')}
                  </span>
                  <div className="space-y-1">
                    {Array.isArray(settlement.currentStatus) ? (
                      settlement.currentStatus.map((item, idx) => (
                        <RichParagraphRenderer
                          key={idx}
                          item={item}
                          className="font-prose text-xs text-[#4A3D2F] leading-relaxed"
                        />
                      ))
                    ) : (
                      <RichParagraphRenderer
                        item={settlement.currentStatus}
                        className="font-prose text-xs text-[#4A3D2F] leading-relaxed"
                      />
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 5b. Research & Debates - ONLY rendered if present */}
          {hasResearchDebates && settlement.researchDebates && (
            <section className="space-y-2.5">
              <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1 flex items-center gap-1.5">
                <BookOpen size={14} className="text-[#8A4526]" />
                {t('Bilimsel Tartışmalar & Görüşler', 'Research & Debates')}
              </h3>
              <div className="space-y-2">
                {settlement.researchDebates.map((debate, idx) => (
                  <div key={idx} className="p-3 bg-[#F6EFE3] border border-[#E5DAC8] space-y-1.5">
                    <h4 className="font-serif font-bold text-xs text-[#1F1914]">
                      {debate.title || debate.topic}
                    </h4>
                    <p className="font-prose text-xs text-[#3D3226] leading-relaxed">
                      {debate.text || debate.scholarlyDebate || debate.consensus || debate.evidence}
                    </p>
                    {debate.sourceIds && debate.sourceIds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono text-[#7D6E5D] pt-0.5">
                        <span className="font-serif font-medium text-[#6B5D4E]">{t('Kaynak:', 'Source:')}</span>
                        {debate.sourceIds.map((sid, sidx) => (
                          <span key={sidx} className="px-1.5 py-0.5 bg-[#ECE2D4] border border-[#DDD0BF]">
                            [{sid}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6. Gallery - ONLY rendered if images are present */}
          {hasImages && (
            <section className="space-y-2">
              <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1">
                {t('Görsel Arşiv', 'Visual Archive')}
              </h3>
              <ImageGallery
                images={settlement.images}
                settlementName={settlement.name}
              />
            </section>
          )}

          {/* 7. Geography - ONLY rendered if geography data is present */}
          {hasGeography && geography && (
            <section className="space-y-2.5">
              <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1">
                {t('Coğrafi Konum & Çevre', 'Geography & Environment')}
              </h3>
              {geography.summary && (
                <p className="font-prose text-[13px] leading-relaxed text-[#2B231B]">
                  {geography.summary}
                </p>
              )}
              <div className="space-y-1.5 pt-1 text-xs">
                {geography.landscape && (
                  <div className="space-y-0.5">
                    <span className="font-serif font-semibold text-[#42372A]">
                      {t('Doğal Çevre & Peyzaj: ', 'Landscape: ')}
                    </span>
                    <span className="font-prose text-[#3D3327] leading-relaxed">{geography.landscape}</span>
                  </div>
                )}
                {geography.distanceFromNearestCenter && (
                  <div className="space-y-0.5">
                    <span className="font-serif font-semibold text-[#42372A]">
                      {t('Merkeze Mesafe: ', 'Distance from Center: ')}
                    </span>
                    <span className="font-prose text-[#3D3327] leading-relaxed">{geography.distanceFromNearestCenter}</span>
                  </div>
                )}
                {geography.gettingThere && (
                  <div className="space-y-0.5">
                    <span className="font-serif font-semibold text-[#42372A]">
                      {t('Ulaşım: ', 'Getting There: ')}
                    </span>
                    <span className="font-prose text-[#3D3327] leading-relaxed">{geography.gettingThere}</span>
                  </div>
                )}
                {geography.sourceIds && geography.sourceIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-[#EAE0D0]">
                    <span className="font-serif text-[10px] text-[#786957] font-medium">
                      {t('Kaynaklar:', 'Sources:')}
                    </span>
                    {geography.sourceIds.map((sid, sidx) => (
                      <span key={sidx} className="px-1.5 py-0.5 bg-[#EAE0D0] text-[#635342] border border-[#D8CABE] font-mono text-[9px] rounded-2xs">
                        [{sid}]
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 8. Visit Information - ONLY rendered if visit data is present */}
          {hasVisit && visit && (
            <section className="space-y-2.5">
              <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1">
                {t('Ziyaret Bilgileri', 'Visitor Information')}
              </h3>

              {/* Visit Status Badge */}
              {visit.statusLabel && (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-serif font-medium border ${
                      visit.status === 'open'
                        ? 'bg-[#EDF5E8] border-[#8BAE72] text-[#2D5A1E]'
                        : visit.status === 'submerged'
                          ? 'bg-[#F2EFEA] border-[#D4C8B8] text-[#695F54]'
                          : 'bg-[#FAF3E6] border-[#D9BD8B] text-[#7A5720]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        visit.status === 'open'
                          ? 'bg-[#3E7A2A]'
                          : visit.status === 'submerged'
                            ? 'bg-[#7D7366]'
                            : 'bg-[#A3752C]'
                      }`}
                    />
                    {visit.statusLabel}
                  </span>
                </div>
              )}

              {/* Visit Details Table */}
              <div className="space-y-1.5 pt-1 text-xs">
                {hasVisitHours && visit.hours && (
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-1 border-b border-[#EFE8DC] gap-0.5">
                    <span className="text-[#80705E] font-medium">{t('Ziyaret Saatleri', 'Opening Hours')}</span>
                    <span className="font-sans text-[#241D17]">
                      {visit.hours.open} – {visit.hours.close}
                      {visit.hours.boxOfficeClose && (
                        <span className="text-[#736554] text-[11px]">
                          {' '}({t('Gişe kapanışı:', 'Box office closes:')} {visit.hours.boxOfficeClose})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {hasClosedDays && visit.closedDays && (
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-1 border-b border-[#EFE8DC] gap-0.5">
                    <span className="text-[#80705E] font-medium">{t('Kapalı Günler', 'Closed Days')}</span>
                    <span className="font-sans text-[#241D17]">
                      {visit.closedDays.join(', ')}
                    </span>
                  </div>
                )}

                {hasMuseumPass && (
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-1 border-b border-[#EFE8DC] gap-0.5">
                    <span className="text-[#80705E] font-medium">{t('Müzekart', 'Museum Pass')}</span>
                    <span className="font-sans font-medium text-[#241D17]">
                      {visit.museumPass ? t('Geçerlidir', 'Valid / Accepted') : t('Geçerli değildir', 'Not Accepted')}
                    </span>
                  </div>
                )}

                {hasAddress && visit.address && (
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-1 border-b border-[#EFE8DC] gap-0.5">
                    <span className="text-[#80705E] font-medium">{t('Adres', 'Address')}</span>
                    <span className="font-sans text-[#241D17] text-right">
                      {visit.address}
                    </span>
                  </div>
                )}

                {hasPhone && visit.phone && (
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-1 border-b border-[#EFE8DC] gap-0.5">
                    <span className="text-[#80705E] font-medium">{t('Telefon', 'Phone')}</span>
                    <a
                      href={`tel:${visit.phone.replace(/\s+/g, '')}`}
                      className="font-mono text-[#8A4526] hover:underline"
                    >
                      {visit.phone}
                    </a>
                  </div>
                )}

                {hasOfficialUrl && visit.officialUrl && (
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-1 border-b border-[#EFE8DC] gap-0.5">
                    <span className="text-[#80705E] font-medium">{t('Resmî Sayfa', 'Official Site')}</span>
                    <a
                      href={visit.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-serif text-[#8A4526] hover:underline"
                    >
                      <span>{t('Resmî Ziyaretçi Portalı', 'Official Visitor Portal')}</span>
                      <ArrowSquareOut size={12} weight="regular" />
                    </a>
                  </div>
                )}
              </div>

              {/* Visitor Note Callout */}
              {hasVisitorNote && visit.visitorNote && (
                <div className="p-2.5 bg-[#F5EFE4] border-l-2 border-[#8A4526] text-xs">
                  <span className="font-serif font-semibold text-[#42372A] block mb-0.5">
                    {t('Ziyaretçi Notu', 'Visitor Note')}
                  </span>
                  <p className="font-prose text-[#3D3327] leading-relaxed">
                    {visit.visitorNote}
                  </p>
                </div>
              )}

              {/* Visit Sources */}
              {visit.sourceIds && visit.sourceIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="font-serif text-[10px] text-[#786957] font-medium">
                    {t('Kaynaklar:', 'Sources:')}
                  </span>
                  {visit.sourceIds.map((sid, sidx) => (
                    <span key={sidx} className="px-1.5 py-0.5 bg-[#EAE0D0] text-[#635342] border border-[#D8CABE] font-mono text-[9px] rounded-2xs">
                      [{sid}]
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 9. Nearby Places - ONLY rendered if non-empty */}
          {hasNearbyPlaces && settlement.nearbyPlaces && settlement.nearbyPlaces.length > 0 && (
            <section className="space-y-2.5">
              <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1">
                {t('Yakın Kültür Noktaları & Müzeler', 'Nearby Sites & Museums')}
              </h3>
              <div className="space-y-2">
                {settlement.nearbyPlaces.map((place, idx) => (
                  <div key={idx} className="p-3 bg-[#F6EFE3] border border-[#E5DAC8] space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-serif font-bold text-xs text-[#1F1914]">{place.name}</span>
                        {place.type && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#EFE4D2] text-[#6E5D4B] border border-[#DFCDB7]">
                            {getPlaceTypeLabel(place.type, lang)}
                          </span>
                        )}
                      </div>
                      {place.distance && (
                        <span className="font-serif text-[11px] text-[#80705E] shrink-0">
                          {place.distance}
                        </span>
                      )}
                    </div>
                    {place.note && (
                      <p className="font-prose text-xs text-[#42372A] leading-relaxed">
                        {place.note}
                      </p>
                    )}
                    {place.url && (
                      <div className="pt-0.5">
                        <a
                          href={place.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-serif text-[#8A4526] hover:underline"
                        >
                          <span>{t('Detaylı Bilgi', 'Details & Links')}</span>
                          <ArrowSquareOut size={12} weight="regular" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 10. Participation & Programs - ONLY rendered if non-empty */}
          {hasParticipation && settlement.participation && settlement.participation.length > 0 && (
            <section className="space-y-2.5">
              <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1">
                {t('Katılım & Gönüllülük Programları', 'Participation & Volunteer Programmes')}
              </h3>
              <div className="space-y-2">
                {settlement.participation.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#F6EFE3] border border-[#E5DAC8] space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <span className="font-serif font-bold text-xs text-[#1F1914]">{item.title}</span>
                      {item.status && (
                        <span className="text-[10px] font-sans font-medium px-2 py-0.5 bg-[#E8DDD0] text-[#5C4D3D] self-start sm:self-auto">
                          {item.status}
                        </span>
                      )}
                    </div>
                    {item.period && (
                      <div className="text-[11px] font-serif text-[#8A4526]">
                        <span className="font-medium">{t('Dönem: ', 'Season / Period: ')}</span>
                        <span>{item.period}</span>
                      </div>
                    )}
                    {item.note && (
                      <p className="font-prose text-xs text-[#42372A] leading-relaxed">
                        {item.note}
                      </p>
                    )}
                    {item.url && (
                      <div className="pt-0.5">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-serif text-[#8A4526] hover:underline"
                        >
                          <span>{t('Başvuru & Detay (GönüllüyüzBiz)', 'Application & Details')}</span>
                          <ArrowSquareOut size={12} weight="regular" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 11. Sources / Bibliography - ONLY rendered if sources are present */}
          {hasSources && (
            <section className="space-y-2">
              <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554] border-b border-[#E8DFD0] pb-1">
                {t('Kaynakça & Yayınlar', 'Sources & Bibliography')}
              </h3>
              <Sources sources={settlement.sources} />
            </section>
          )}
        </div>
      )}
    </aside>
  );
};
