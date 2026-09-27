import React, { useEffect } from 'react';
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
  ArrowLeft,
  X,
  ArrowSquareOut,
  MapPin,
  CalendarBlank,
  BookOpen,
  Info,
  Warning,
  ArrowClockwise
} from '@phosphor-icons/react';
import { DetailLoadStatus } from './SettlementPanel';

interface SettlementFullPageViewProps {
  settlement: Settlement | null;
  onBackToMap: () => void;
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

export const SettlementFullPageView: React.FC<SettlementFullPageViewProps> = ({
  settlement,
  onBackToMap,
  isLoading = false,
  status = 'idle',
  error = null,
  onRetry
}) => {
  const { lang, t } = useLanguage();

  // Handle loading, errors, or unmigrated/index-only settlement before full monograph load
  if (!settlement || isLoading || status === 'loading' || status === 'error' || status === 'not_found' || !settlement.isLoadedDetail) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('Detaylar Yükleniyor', 'Loading Details')}
        className="fixed inset-0 z-50 flex flex-col bg-[#F9F5EC] text-[#241F1A] overflow-hidden"
      >
        <header className="shrink-0 h-16 px-4 sm:px-8 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E2D8C7] flex items-center justify-between gap-4 z-20 shadow-xs">
          <button
            onClick={onBackToMap}
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-serif font-semibold text-[#1A1510] bg-[#ECE2D0] hover:bg-[#DFCDB4] border border-[#D5C2A4] transition-all cursor-pointer shadow-xs active:scale-98"
            aria-label={t('Haritaya Geri Dön', 'Back to Map')}
          >
            <ArrowLeft size={18} weight="bold" className="text-[#8A4526]" />
            <span>{t('Haritaya Geri Dön', 'Back to Map')}</span>
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#736554] space-y-4">
          {status === 'not_found' ? (
            <div className="text-center space-y-3 max-w-md">
              <Warning size={40} className="text-[#8A4526] mx-auto" />
              <h2 className="font-serif font-bold text-lg text-[#1A1510]">
                {t('Ayrıntılı Monografi Bulunamadı', 'Detailed Monograph Not Found')}
              </h2>
              <p className="font-prose text-sm text-[#6B5D4E] leading-relaxed">
                {t(
                  'Bu alan için henüz Firebase Storage arşivinde monografi dosyası bulunmamaktadır.',
                  'A detailed monograph file is not currently available in the Firebase Storage archive for this site.'
                )}
              </p>
              <button
                onClick={onBackToMap}
                className="mt-2 px-4 py-2 bg-[#8A4526] hover:bg-[#72371E] text-white text-xs font-serif transition-colors"
              >
                {t('Haritaya Dön', 'Return to Map')}
              </button>
            </div>
          ) : status === 'error' ? (
            <div className="text-center space-y-3 max-w-md">
              <Warning size={40} className="text-red-700 mx-auto" />
              <h2 className="font-serif font-bold text-lg text-[#1A1510]">
                {t('Detaylar Yüklenirken Hata Oluştu', 'Error Loading Details')}
              </h2>
              <p className="font-prose text-xs text-[#7A3E26] font-mono leading-relaxed bg-[#F4E9E2] p-3 border border-[#E5CEC0]">
                {error || t('Bağlantı hatası oluştu.', 'A connection error occurred.')}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8A4526] hover:bg-[#72371E] text-white text-xs font-serif transition-colors"
                  >
                    <ArrowClockwise size={14} />
                    <span>{t('Tekrar Dene', 'Retry')}</span>
                  </button>
                )}
                <button
                  onClick={onBackToMap}
                  className="px-4 py-2 bg-[#ECE2D0] hover:bg-[#DFCDB4] border border-[#D5C2A4] text-xs font-serif text-[#1A1510] transition-colors"
                >
                  {t('Haritaya Dön', 'Return to Map')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#8A4526] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-serif tracking-wide">{t('Monografi detayları yükleniyor...', 'Loading monograph details...')}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={settlement.name}
      className="fixed inset-0 z-50 flex flex-col bg-[#F9F5EC] text-[#241F1A] overflow-hidden select-text animate-in fade-in duration-150"
    >
      {/* Top Fixed Header with Back to Map Button */}
      <header className="shrink-0 h-16 px-4 sm:px-8 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E2D8C7] flex items-center justify-between gap-4 z-20 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToMap}
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-serif font-semibold text-[#1A1510] bg-[#ECE2D0] hover:bg-[#DFCDB4] border border-[#D5C2A4] transition-all cursor-pointer shadow-xs active:scale-98"
            aria-label={t('Haritaya Geri Dön', 'Back to Map')}
          >
            <ArrowLeft size={18} weight="bold" className="text-[#8A4526]" />
            <span className="hidden sm:inline">{t('Haritaya Geri Dön', 'Back to Map')}</span>
            <span className="sm:hidden">{t('Harita', 'Map')}</span>
          </button>

          <div className="h-5 w-px bg-[#D5C2A4] hidden sm:block" />

          {/* Quick Breadcrumb in header */}
          <div className="min-w-0 truncate hidden md:flex items-center gap-2 text-xs font-serif text-[#786A59]">
            <span>{settlement.province}</span>
            {settlement.district && <span>· {settlement.district}</span>}
            <span>·</span>
            <span className="font-semibold text-[#1A1510] truncate">{settlement.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {settlement.siteType && (
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-serif font-bold uppercase tracking-wider bg-[#F4E9DF] text-[#8A4526] border border-[#E8D4C4]">
              {Array.isArray(settlement.siteType)
                ? settlement.siteType.join(', ')
                : settlement.siteType}
            </span>
          )}

          <button
            onClick={onBackToMap}
            className="p-2 text-[#736554] hover:text-[#1A1510] hover:bg-[#EFE7D8] transition-colors rounded-none"
            title={t('Kapat ve Haritaya Dön (Esc)', 'Close and Back to Map (Esc)')}
            aria-label={t('Kapat ve Haritaya Dön', 'Close and Back to Map')}
          >
            <X size={22} weight="regular" />
          </button>
        </div>
      </header>

      {/* Main Full-Page Editorial Reading Body */}
      <main className="flex-1 overflow-y-auto">
          {/* Hero Article Header Container */}
          <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 pb-6 border-b border-[#E8DFC8]">
            {/* Province / District / Modern Place */}
            <div className="flex flex-wrap items-center gap-2 text-sm font-sans tracking-wide uppercase text-[#857564] mb-2 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={16} weight="fill" className="text-[#8A4526]" />
                {settlement.province}
                {settlement.district ? ` · ${settlement.district}` : ''}
              </span>
              {settlement.modernPlace && (
                <span className="normal-case font-serif text-sm text-[#695B4A]">
                  ({settlement.modernPlace})
                </span>
              )}
            </div>

            {/* Giant Title */}
            <h1 className="font-serif font-bold text-[#140F0A] text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-3">
              {settlement.name}
            </h1>

            {/* Alternative Names */}
            {settlement.alternativeNames && settlement.alternativeNames.length > 0 && (
              <p className="text-sm sm:text-base font-serif italic text-[#706251] mb-4">
                {t('Diğer adları / literatür: ', 'Alternative names / references: ')}{settlement.alternativeNames.join(', ')}
              </p>
            )}

            {/* Period Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {settlement.periodDetails && settlement.periodDetails.length > 0 ? (
                settlement.periodDetails.map(pd => {
                  const cfg = getPeriodConfig(pd.periodId || pd.period);
                  const periodLabel = getPeriodLabel(pd.periodId || pd.period, lang);
                  return (
                    <span
                      key={pd.period}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-serif font-medium px-3 py-1 border shadow-xs"
                      style={{
                        backgroundColor: cfg.bgLight,
                        borderColor: cfg.borderColor,
                        color: cfg.color
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
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
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-serif font-medium px-3 py-1 border shadow-xs"
                      style={{
                        backgroundColor: cfg.bgLight,
                        borderColor: cfg.borderColor,
                        color: cfg.color
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                      {periodLabel}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Article Two-Column / Wide Layout */}
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-10">
            {/* Top Interactive Mini Map & Quick Coordinates */}
            <div className="bg-[#FAF7F0] border border-[#E2D6C0] p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#E8DFC8] gap-2">
                <span className="font-serif text-sm font-bold uppercase tracking-wider text-[#736554] flex items-center gap-1.5">
                  <MapPin size={18} className="text-[#8A4526]" />
                  {t('Konum ve Koordinatlar', 'Location & Coordinates')}
                </span>
                <span className="font-mono text-xs sm:text-sm text-[#736554] tabular-nums">
                  {settlement.latitude.toFixed(5)}° N, {settlement.longitude.toFixed(5)}° E
                </span>
              </div>
              <SettlementMiniMap
                settlement={settlement}
                onShowOnMainMap={onBackToMap}
                hideHeader={true}
              />
            </div>

            {/* 1. Overview */}
            {hasOverview && (
              <section className="space-y-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2 flex items-center gap-2">
                  <BookOpen size={22} className="text-[#8A4526]" />
                  {t('Genel Bakış', 'Overview')}
                </h2>
                <div className="space-y-3.5">
                  {Array.isArray(settlement.overview) ? (
                    settlement.overview.map((paragraph, idx) => (
                      <RichParagraphRenderer
                        key={idx}
                        item={paragraph}
                        className="font-prose text-base sm:text-[17px] leading-relaxed text-[#2B231B]"
                        titleClassName="font-serif font-bold text-base text-[#1C1712]"
                      />
                    ))
                  ) : (
                    <RichParagraphRenderer
                      item={settlement.overview}
                      className="font-prose text-base sm:text-[17px] leading-relaxed text-[#2B231B]"
                    />
                  )}
                </div>
              </section>
            )}

            {/* 2. Interactive Chronology & Phases */}
            <section className="space-y-4">
              <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2 flex items-center gap-2">
                <CalendarBlank size={22} className="text-[#8A4526]" />
                {t('Kronoloji & Evreler', 'Chronology & Phases')}
              </h2>

              {/* Visual Timeline Bar */}
              <div className="p-4 bg-[#FAF7F0] border border-[#E2D6C0]">
                <Timeline settlement={settlement} />
              </div>

              {/* Editorial Chronology Paragraphs */}
              {hasChronology && (
                <div className="space-y-3.5 pt-2">
                  {Array.isArray(settlement.chronology) ? (
                    settlement.chronology.map((paragraph, idx) => (
                      <RichParagraphRenderer
                        key={idx}
                        item={paragraph}
                        className="font-prose text-base sm:text-[16px] leading-relaxed text-[#332A21]"
                        titleClassName="font-serif font-bold text-base text-[#1C1712]"
                      />
                    ))
                  ) : (
                    <RichParagraphRenderer
                      item={settlement.chronology}
                      className="font-prose text-base sm:text-[16px] leading-relaxed text-[#332A21]"
                    />
                  )}
                </div>
              )}
            </section>

            {/* 3. Archaeological Significance */}
            {hasImportance && (
              <section className="space-y-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2 flex items-center gap-2">
                  <Info size={22} className="text-[#8A4526]" />
                  {t('Neden Önemli? (Arkeolojik Anlamı)', 'Why It Matters (Significance)')}
                </h2>
                <div className="space-y-3.5">
                  {Array.isArray(settlement.importance) ? (
                    settlement.importance.map((paragraph, idx) => (
                      <RichParagraphRenderer
                        key={idx}
                        item={paragraph}
                        className="font-prose text-base sm:text-[16px] leading-relaxed text-[#2B231B]"
                        titleClassName="font-serif font-bold text-base text-[#1C1712]"
                      />
                    ))
                  ) : (
                    <RichParagraphRenderer
                      item={settlement.importance}
                      className="font-prose text-base sm:text-[16px] leading-relaxed text-[#2B231B]"
                    />
                  )}
                </div>
              </section>
            )}

            {/* 4. Discoveries & Key Finds */}
            {hasDiscoveries && (
              <section className="space-y-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
                  {t('Başlıca Bulgular ve Eserler', 'Key Discoveries & Finds')}
                </h2>

                {/* General Discoveries Text */}
                {hasRichContent(settlement.discoveries) && (
                  <div className="space-y-3.5">
                    {Array.isArray(settlement.discoveries) ? (
                      settlement.discoveries.map((paragraph, idx) => (
                        <RichParagraphRenderer
                          key={idx}
                          item={paragraph}
                          className="font-prose text-base sm:text-[16px] leading-relaxed text-[#2B231B]"
                          titleClassName="font-serif font-bold text-base text-[#1C1712]"
                        />
                      ))
                    ) : (
                      <RichParagraphRenderer
                        item={settlement.discoveries}
                        className="font-prose text-base sm:text-[16px] leading-relaxed text-[#2B231B]"
                      />
                    )}
                  </div>
                )}

                {/* Key Finds Structured Cards */}
                {settlement.keyFinds && settlement.keyFinds.length > 0 && (
                  <div className="pt-2 space-y-3">
                    <div className="text-xs sm:text-sm font-serif font-bold tracking-wider uppercase text-[#8A4526]">
                      {t('Önemli Eser ve Yapılar', 'Key Artifacts and Structures')}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {settlement.keyFinds.map((find, idx) => (
                        <div key={idx} className="p-4 bg-[#FAF7F0] border border-[#E0D5C3] space-y-1.5 shadow-xs">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-serif font-bold text-sm sm:text-base text-[#1C1712]">
                              {find.name}
                            </span>
                            {find.period && (
                              <span className="text-xs font-serif italic text-[#786957] shrink-0">
                                {find.period}
                              </span>
                            )}
                          </div>
                          <p className="font-prose text-sm text-[#42372A] leading-relaxed">
                            {find.description}
                          </p>
                          {find.sourceIds && find.sourceIds.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#EAE0D0]">
                              <span className="font-serif text-[11px] text-[#786957] font-medium">
                                {t('Kaynak:', 'Source:')}
                              </span>
                              {find.sourceIds.map((sid, sidx) => (
                                <span key={sidx} className="px-1.5 py-0.5 bg-[#EAE0D0] text-[#635342] border border-[#D8CABE] font-mono text-[10px] rounded-2xs">
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
              <section className="space-y-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
                  {t('Araştırma / Kazı Tarihi', 'Research / Excavation History')}
                </h2>
                <div className="space-y-3.5">
                  {Array.isArray(settlement.excavationHistory) ? (
                    settlement.excavationHistory.map((paragraph, idx) => (
                      <RichParagraphRenderer
                        key={idx}
                        item={paragraph}
                        className="font-prose text-base sm:text-[16px] leading-relaxed text-[#2E251D]"
                        titleClassName="font-serif font-bold text-base text-[#1C1712]"
                      />
                    ))
                  ) : (
                    <RichParagraphRenderer
                      item={settlement.excavationHistory}
                      className="font-prose text-base sm:text-[16px] leading-relaxed text-[#2E251D]"
                    />
                  )}
                </div>

                {/* Current Status */}
                {hasCurrentStatus && (
                  <div className="p-3.5 bg-[#FAF7F0] border-l-3 border-[#8A4526] text-sm font-sans text-[#5C4D3D] flex flex-col gap-1.5">
                    <span className="font-serif font-bold text-[#332A21]">
                      {t('Güncel Durum:', 'Current Status:')}
                    </span>
                    <div className="space-y-1.5">
                      {Array.isArray(settlement.currentStatus) ? (
                        settlement.currentStatus.map((item, idx) => (
                          <RichParagraphRenderer
                            key={idx}
                            item={item}
                            className="font-prose text-sm text-[#524436] leading-relaxed"
                          />
                        ))
                      ) : (
                        <RichParagraphRenderer
                          item={settlement.currentStatus}
                          className="font-prose text-sm text-[#524436] leading-relaxed"
                        />
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 5b. Research & Debates */}
            {hasResearchDebates && settlement.researchDebates && (
              <section className="space-y-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2 flex items-center gap-2">
                  <BookOpen size={22} className="text-[#8A4526]" />
                  {t('Araştırma ve Bilimsel Tartışmalar', 'Research & Scholarly Debates')}
                </h2>
                <div className="grid grid-cols-1 gap-3.5">
                  {settlement.researchDebates.map((debate, idx) => (
                    <div key={idx} className="p-4 bg-[#FAF7F0] border border-[#E0D5C3] space-y-2 shadow-xs">
                      <h3 className="font-serif font-bold text-base text-[#1C1712]">
                        {debate.title || debate.topic}
                      </h3>
                      <p className="font-prose text-sm sm:text-[15px] text-[#3D3226] leading-relaxed">
                        {debate.text || debate.scholarlyDebate || debate.consensus || debate.evidence}
                      </p>
                      {debate.sourceIds && debate.sourceIds.length > 0 && (
                        <div className="text-xs font-mono text-[#7D6E5D] flex flex-wrap gap-1.5 items-center pt-1.5 border-t border-[#EDE4D6]">
                          <span className="font-serif font-semibold text-[#5C4F40]">{t('Kaynaklar:', 'Sources:')}</span>
                          {debate.sourceIds.map((sid, sidx) => (
                            <span key={sidx} className="px-2 py-0.5 bg-[#EAE0D0] border border-[#D8CABE] rounded-xs">
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

            {/* 6. Gallery */}
            {hasImages && (
              <section className="space-y-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
                  {t('Görsel Arşiv', 'Visual Archive')}
                </h2>
                <ImageGallery
                  images={settlement.images}
                  settlementName={settlement.name}
                />
              </section>
            )}

            {/* 7. Geography */}
            {hasGeography && geography && (
              <section className="space-y-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
                  {t('Coğrafi Konum & Çevre', 'Geography & Environment')}
                </h2>
                {geography.summary && (
                  <p className="font-prose text-base sm:text-[16px] leading-relaxed text-[#2B231B]">
                    {geography.summary}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-sm">
                  {geography.landscape && (
                    <div className="p-3.5 bg-[#FAF7F0] border border-[#E5DAC8] space-y-1">
                      <span className="font-serif font-bold text-[#42372A] block">
                        {t('Doğal Çevre & Peyzaj', 'Landscape')}
                      </span>
                      <p className="font-prose text-[#3D3327] leading-relaxed">{geography.landscape}</p>
                    </div>
                  )}
                  {geography.distanceFromNearestCenter && (
                    <div className="p-3.5 bg-[#FAF7F0] border border-[#E5DAC8] space-y-1">
                      <span className="font-serif font-bold text-[#42372A] block">
                        {t('Merkeze Mesafe', 'Distance from Center')}
                      </span>
                      <p className="font-prose text-[#3D3327] leading-relaxed">{geography.distanceFromNearestCenter}</p>
                    </div>
                  )}
                  {geography.gettingThere && (
                    <div className="sm:col-span-2 p-3.5 bg-[#FAF7F0] border border-[#E5DAC8] space-y-1">
                      <span className="font-serif font-bold text-[#42372A] block">
                        {t('Ulaşım Bilgisi', 'Getting There')}
                      </span>
                      <p className="font-prose text-[#3D3327] leading-relaxed">{geography.gettingThere}</p>
                    </div>
                  )}
                  {geography.sourceIds && geography.sourceIds.length > 0 && (
                    <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E8DFC8]">
                      <span className="font-serif text-xs font-semibold text-[#5C4F40]">
                        {t('Kaynaklar:', 'Sources:')}
                      </span>
                      {geography.sourceIds.map((sid, sidx) => (
                        <span key={sidx} className="px-2 py-0.5 bg-[#EAE0D0] border border-[#D8CABE] font-mono text-xs rounded-xs text-[#635342]">
                          [{sid}]
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 8. Visit Information */}
            {hasVisit && visit && (
              <section className="space-y-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
                  {t('Ziyaret Bilgileri', 'Visitor Information')}
                </h2>

                {/* Visit Status Badge */}
                {visit.statusLabel && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-serif font-medium border ${
                        visit.status === 'open'
                          ? 'bg-[#EDF5E8] border-[#8BAE72] text-[#2D5A1E]'
                          : visit.status === 'submerged'
                            ? 'bg-[#F2EFEA] border-[#D4C8B8] text-[#695F54]'
                            : 'bg-[#FAF3E6] border-[#D9BD8B] text-[#7A5720]'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
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

                {/* Visit Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {hasVisitHours && visit.hours && (
                    <div className="p-3.5 bg-[#FAF7F0] border border-[#EFE8DC]">
                      <span className="text-[#80705E] font-medium block text-xs uppercase tracking-wider mb-1">
                        {t('Ziyaret Saatleri', 'Opening Hours')}
                      </span>
                      <span className="font-sans font-medium text-[#241D17]">
                        {visit.hours.open} – {visit.hours.close}
                        {visit.hours.boxOfficeClose && (
                          <span className="text-[#736554] text-xs block font-normal mt-0.5">
                            ({t('Gişe kapanışı:', 'Box office closes:')} {visit.hours.boxOfficeClose})
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {hasClosedDays && visit.closedDays && (
                    <div className="p-3.5 bg-[#FAF7F0] border border-[#EFE8DC]">
                      <span className="text-[#80705E] font-medium block text-xs uppercase tracking-wider mb-1">
                        {t('Kapalı Günler', 'Closed Days')}
                      </span>
                      <span className="font-sans font-medium text-[#241D17]">
                        {visit.closedDays.join(', ')}
                      </span>
                    </div>
                  )}

                  {hasMuseumPass && (
                    <div className="p-3.5 bg-[#FAF7F0] border border-[#EFE8DC]">
                      <span className="text-[#80705E] font-medium block text-xs uppercase tracking-wider mb-1">
                        {t('Müzekart', 'Museum Pass')}
                      </span>
                      <span className="font-sans font-medium text-[#241D17]">
                        {visit.museumPass ? t('Geçerlidir', 'Valid / Accepted') : t('Geçerli değildir', 'Not Accepted')}
                      </span>
                    </div>
                  )}

                  {hasAddress && visit.address && (
                    <div className="p-3.5 bg-[#FAF7F0] border border-[#EFE8DC]">
                      <span className="text-[#80705E] font-medium block text-xs uppercase tracking-wider mb-1">
                        {t('Adres', 'Address')}
                      </span>
                      <span className="font-sans text-[#241D17]">
                        {visit.address}
                      </span>
                    </div>
                  )}

                  {hasPhone && visit.phone && (
                    <div className="p-3.5 bg-[#FAF7F0] border border-[#EFE8DC]">
                      <span className="text-[#80705E] font-medium block text-xs uppercase tracking-wider mb-1">
                        {t('Telefon', 'Phone')}
                      </span>
                      <a
                        href={`tel:${visit.phone.replace(/\s+/g, '')}`}
                        className="font-mono text-[#8A4526] hover:underline"
                      >
                        {visit.phone}
                      </a>
                    </div>
                  )}

                  {hasOfficialUrl && visit.officialUrl && (
                    <div className="p-3.5 bg-[#FAF7F0] border border-[#EFE8DC]">
                      <span className="text-[#80705E] font-medium block text-xs uppercase tracking-wider mb-1">
                        {t('Resmî Sayfa', 'Official Site')}
                      </span>
                      <a
                        href={visit.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-serif text-[#8A4526] hover:underline"
                      >
                        <span>{t('Resmî Ziyaretçi Portalı', 'Official Visitor Portal')}</span>
                        <ArrowSquareOut size={14} weight="regular" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Visitor Note Callout */}
                {hasVisitorNote && visit.visitorNote && (
                  <div className="p-4 bg-[#FAF5EC] border-l-3 border-[#8A4526] text-sm">
                    <span className="font-serif font-bold text-[#42372A] block mb-1">
                      {t('Ziyaretçi Notu', 'Visitor Note')}
                    </span>
                    <p className="font-prose text-[#3D3327] leading-relaxed">
                      {visit.visitorNote}
                    </p>
                  </div>
                )}

                {/* Visit Sources */}
                {visit.sourceIds && visit.sourceIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E8DFC8]">
                    <span className="font-serif text-xs font-semibold text-[#5C4F40]">
                      {t('Kaynaklar:', 'Sources:')}
                    </span>
                    {visit.sourceIds.map((sid, sidx) => (
                      <span key={sidx} className="px-2 py-0.5 bg-[#EAE0D0] border border-[#D8CABE] font-mono text-xs rounded-xs text-[#635342]">
                        [{sid}]
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 9. Nearby Places */}
            {hasNearbyPlaces && settlement.nearbyPlaces && settlement.nearbyPlaces.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
                  {t('Yakın Kültür Noktaları & Müzeler', 'Nearby Sites & Museums')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {settlement.nearbyPlaces.map((place, idx) => (
                    <div key={idx} className="p-4 bg-[#FAF7F0] border border-[#E5DAC8] space-y-1.5 shadow-xs">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-serif font-bold text-sm sm:text-base text-[#1F1914]">{place.name}</span>
                          {place.type && (
                            <span className="text-[11px] font-mono px-1.5 py-0.5 bg-[#EFE4D2] text-[#6E5D4B] border border-[#DFCDB7]">
                              {getPlaceTypeLabel(place.type, lang)}
                            </span>
                          )}
                        </div>
                        {place.distance && (
                          <span className="font-serif text-xs text-[#80705E] shrink-0 font-medium">
                            {place.distance}
                          </span>
                        )}
                      </div>
                      {place.note && (
                        <p className="font-prose text-xs sm:text-sm text-[#42372A] leading-relaxed">
                          {place.note}
                        </p>
                      )}
                      {place.url && (
                        <div className="pt-1">
                          <a
                            href={place.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-serif font-medium text-[#8A4526] hover:underline"
                          >
                            <span>{t('Detaylı Bilgi', 'Details & Links')}</span>
                            <ArrowSquareOut size={13} weight="regular" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 10. Participation & Programs */}
            {hasParticipation && settlement.participation && settlement.participation.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
                  {t('Katılım & Gönüllülük Programları', 'Participation & Volunteer Programmes')}
                </h2>
                <div className="space-y-3">
                  {settlement.participation.map((item, idx) => (
                    <div key={idx} className="p-4 bg-[#FAF7F0] border border-[#E5DAC8] space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
                        <span className="font-serif font-bold text-sm sm:text-base text-[#1F1914]">{item.title}</span>
                        {item.status && (
                          <span className="text-xs font-sans font-medium px-2.5 py-0.5 bg-[#E8DDD0] text-[#5C4D3D] self-start sm:self-auto">
                            {item.status}
                          </span>
                        )}
                      </div>
                      {item.period && (
                        <div className="text-xs sm:text-sm font-serif text-[#8A4526]">
                          <span className="font-medium">{t('Dönem: ', 'Season / Period: ')}</span>
                          <span>{item.period}</span>
                        </div>
                      )}
                      {item.note && (
                        <p className="font-prose text-sm text-[#42372A] leading-relaxed">
                          {item.note}
                        </p>
                      )}
                      {item.url && (
                        <div className="pt-1">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-serif font-medium text-[#8A4526] hover:underline"
                          >
                            <span>{t('Başvuru & Detay (GönüllüyüzBiz)', 'Application & Details')}</span>
                            <ArrowSquareOut size={13} weight="regular" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 11. Sources / Bibliography */}
            {hasSources && (
              <section className="space-y-4 pt-4 border-t border-[#E8DFC8]">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1510] pb-2">
                  {t('Kaynakça & Yayınlar', 'Sources & Bibliography')}
                </h2>
                <Sources sources={settlement.sources} />
              </section>
            )}

            {/* Bottom Back-to-Map Action Bar */}
            <div className="pt-8 pb-12 text-center">
              <button
                onClick={onBackToMap}
                className="inline-flex items-center gap-2.5 px-6 py-3 text-base font-serif font-bold text-[#FAF6EE] bg-[#8A4526] hover:bg-[#72371E] transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98"
              >
                <ArrowLeft size={20} weight="bold" />
                <span>{t('Haritaya Geri Dön', 'Back to Map')}</span>
              </button>
            </div>
          </div>
        </main>
    </div>
  );
};
