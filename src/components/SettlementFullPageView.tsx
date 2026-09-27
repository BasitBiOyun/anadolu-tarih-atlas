import React, { useEffect, useState } from 'react';
import { Settlement } from '../types/settlement';
import { Timeline } from './Timeline';
import { ImageGallery } from './ImageGallery';
import { Sources } from './Sources';
import { CitationProvider, CitationRefs } from './CitationSystem';
import { SettlementMiniMap } from './SettlementMiniMap';
import { RichParagraphRenderer, hasRichContent } from './RichTextRenderer';
import { getPeriodConfig, getPeriodColor, getPeriodLabel } from '../config/periods';
import { formatDateRange, getPrimaryPeriod } from '../utils/chronology';
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
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!settlement?.isLoadedDetail) return;

    const root = document.querySelector<HTMLElement>('[data-monograph-scroll]');
    if (!root) return;

    const observed = Array.from(root.querySelectorAll<HTMLElement>('[data-monograph-section]'));
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.getAttribute('data-monograph-section');
        if (id) setActiveSection(id);
      },
      {
        root,
        rootMargin: '-18% 0px -68% 0px',
        threshold: [0.05, 0.2, 0.45]
      }
    );

    observed.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [settlement?.id, settlement?.isLoadedDetail, lang]);

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

  const heroStartYear =
    settlement.startYear ??
    settlement.occupation?.startYear ??
    (settlement.occupation?.startBCE ? -Math.abs(settlement.occupation.startBCE) : undefined);
  const heroEndYear =
    settlement.endYear ??
    settlement.occupation?.endYear ??
    (settlement.occupation?.endBCE ? -Math.abs(settlement.occupation.endBCE) : undefined);
  const heroDateRange = formatDateRange(heroStartYear, heroEndYear, lang);

  const sectionNav = [
    hasOverview && { id: 'overview', label: t('Genel Bakış', 'Overview') },
    { id: 'chronology', label: t('Kronoloji', 'Chronology') },
    hasImportance && { id: 'importance', label: t('Arkeolojik Anlam', 'Significance') },
    hasDiscoveries && { id: 'discoveries', label: t('Buluntular', 'Discoveries') },
    (hasHistory || hasCurrentStatus) && { id: 'history', label: t('Kazı Tarihi', 'Research History') },
    hasResearchDebates && { id: 'research', label: t('Tartışmalar', 'Debates') },
    hasImages && { id: 'gallery', label: t('Görseller', 'Gallery') },
    hasGeography && { id: 'geography', label: t('Coğrafya', 'Geography') },
    hasVisit && { id: 'visit', label: t('Ziyaret', 'Visit') },
    hasNearbyPlaces && { id: 'nearby', label: t('Yakın Noktalar', 'Nearby') },
    hasParticipation && { id: 'participation', label: t('Katılım', 'Participation') },
    hasSources && { id: 'sources', label: t('Kaynakça', 'Bibliography') }
  ].filter(Boolean) as Array<{ id: string; label: string }>;

  const scrollToSection = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

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
      <main data-monograph-scroll className="flex-1 overflow-y-auto scroll-smooth">
          {/* Premium monograph hero */}
          <div className="mx-auto max-w-[1420px] px-4 pb-8 pt-8 sm:px-8 sm:pt-10">
            <div className="relative overflow-hidden border-y border-[#DCCFBC] bg-[#FCF9F3] px-5 py-7 shadow-[0_24px_60px_-48px_rgba(42,31,22,0.65)] sm:px-8 sm:py-9 lg:px-10">
              <div
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ backgroundColor: primaryColor }}
                aria-hidden="true"
              />

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:items-end">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7F6F5D] sm:text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={15} weight="fill" className="text-[#8A4526]" />
                      {settlement.province}
                      {settlement.district ? ` · ${settlement.district}` : ''}
                    </span>
                    {settlement.modernPlace && <span>· {settlement.modernPlace}</span>}
                    {settlement.unescoStatus && (
                      <span className="border border-[#CDBEA8] bg-[#F2E9DC] px-2 py-0.5 text-[#735039]">
                        UNESCO · {settlement.unescoStatus}
                      </span>
                    )}
                  </div>

                  <h1 className="max-w-4xl font-serif text-4xl font-bold leading-[0.98] tracking-[-0.025em] text-[#150F0A] sm:text-5xl lg:text-6xl">
                    {settlement.name}
                  </h1>

                  {settlement.alternativeNames?.length > 0 && (
                    <p className="mt-3 max-w-3xl font-serif text-sm italic leading-relaxed text-[#756656] sm:text-base">
                      {t('Literatürde: ', 'In the literature: ')}
                      {settlement.alternativeNames.join(', ')}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(settlement.periodDetails?.length ? settlement.periodDetails : settlement.periods).slice(0, 5).map((entry: any) => {
                      const periodId = typeof entry === 'string' ? entry : entry.periodId || entry.period;
                      const cfg = getPeriodConfig(periodId);
                      return (
                        <span
                          key={periodId}
                          className="inline-flex items-center gap-2 border px-3 py-1.5 font-serif text-xs font-semibold sm:text-sm"
                          style={{
                            backgroundColor: cfg.bgLight,
                            borderColor: cfg.borderColor,
                            color: cfg.color
                          }}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                          {getPeriodLabel(periodId, lang)}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="grid min-h-[272px] grid-cols-2 grid-rows-2 border border-[#E1D6C6] bg-[#F8F2E9]">
                  <div className="flex min-h-[136px] flex-col justify-between border-b border-r border-[#E1D6C6] p-4 sm:p-5">
                    <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8C7A67] sm:text-[10px]">
                      {t('Tarih Aralığı', 'Date Range')}
                    </div>
                    <div className="mt-1.5 font-serif text-base font-bold leading-snug text-[#2A211A] sm:text-lg">
                      {heroDateRange}
                    </div>
                  </div>
                  <div className="flex min-h-[136px] flex-col justify-between border-b border-[#E1D6C6] p-4 sm:p-5">
                    <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8C7A67] sm:text-[10px]">
                      {t('Alan Türü', 'Site Type')}
                    </div>
                    <div className="mt-2 font-serif text-[15px] font-bold leading-[1.2] text-[#2A211A] sm:text-base">
                      {Array.isArray(settlement.siteType) ? settlement.siteType.join(', ') : settlement.siteType}
                    </div>
                  </div>
                  <div className="flex min-h-[136px] flex-col justify-between border-r border-[#E1D6C6] p-4 sm:p-5">
                    <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8C7A67] sm:text-[10px]">
                      {t('Dönem', 'Periods')}
                    </div>
                    <div className="mt-1.5 font-serif text-2xl font-bold text-[#2A211A]">
                      {settlement.periods.length}
                    </div>
                  </div>
                  <div className="flex min-h-[136px] flex-col justify-between p-4 sm:p-5">
                    <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8C7A67] sm:text-[10px]">
                      {t('Akademik Kaynak', 'Academic Sources')}
                    </div>
                    <div className="mt-1.5 font-serif text-2xl font-bold text-[#2A211A]">
                      {settlement.sources.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monograph reading layout */}
          <div className="mx-auto max-w-[1420px] px-4 pb-10 sm:px-8">
            <div className="sticky top-0 z-20 -mx-4 mb-8 overflow-x-auto border-y border-[#E2D7C7] bg-[#F9F5EC]/95 px-4 py-2 backdrop-blur-md lg:hidden">
              <div className="flex min-w-max gap-1.5">
                {sectionNav.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`border px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                      activeSection === item.id
                        ? 'border-[#8A4526] bg-[#8A4526] text-[#FFF9F1]'
                        : 'border-[#D8CBBB] bg-[#FCF9F3] text-[#6F6051]'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')} · {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] xl:gap-12">
              <aside className="hidden lg:block">
                <nav className="sticky top-6 border-l border-[#D9CCBA] py-2">
                  <div className="mb-3 pl-4 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A806B]">
                    {t('Monografi', 'Monograph')}
                  </div>
                  <div className="space-y-0.5">
                    {sectionNav.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollToSection(item.id)}
                        className={`group flex w-full items-center gap-3 border-l-2 px-4 py-2 text-left transition-all ${
                          activeSection === item.id
                            ? '-ml-px border-[#8A4526] bg-[#F1E7DA] text-[#2A2018]'
                            : '-ml-px border-transparent text-[#786958] hover:bg-[#F6EFE5] hover:text-[#2A2018]'
                        }`}
                      >
                        <span className="w-5 font-mono text-[9px] text-[#A28F7B]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="font-serif text-[13px] font-semibold leading-tight">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </nav>
              </aside>

              <CitationProvider sources={settlement.sources}>
                <div className="min-w-0 space-y-16">
            {/* Top Interactive Mini Map & Quick Coordinates */}
            <div className="border border-[#DDD0BD] bg-[#FCF9F3] p-5 shadow-[0_18px_42px_-34px_rgba(42,31,22,0.55)] sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#E8DFC8] gap-2">
                <span className="flex items-center gap-2 font-serif text-base font-bold text-[#392E24] sm:text-lg">
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
              <section id="section-overview" data-monograph-section="overview" className="max-w-[840px] scroll-mt-24 space-y-5">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2 flex items-center gap-2">
                  <BookOpen size={22} className="text-[#8A4526]" />
                  {t('Genel Bakış', 'Overview')}
                </h2>
                <div className="space-y-3.5">
                  {Array.isArray(settlement.overview) ? (
                    settlement.overview.map((paragraph, idx) => (
                      <RichParagraphRenderer
                        key={idx}
                        item={paragraph}
                        className="font-prose text-[17px] sm:text-[18px] leading-[1.75] text-[#2B231B]"
                        titleClassName="font-serif font-bold text-base text-[#1C1712]"
                      />
                    ))
                  ) : (
                    <RichParagraphRenderer
                      item={settlement.overview}
                      className="font-prose text-[17px] sm:text-[18px] leading-[1.75] text-[#2B231B]"
                    />
                  )}
                </div>
              </section>
            )}

            {/* 2. Interactive Chronology & Phases */}
            <section id="section-chronology" data-monograph-section="chronology" className="scroll-mt-24 space-y-6">
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2.5 flex items-center gap-2">
                <CalendarBlank size={24} className="text-[#8A4526]" />
                {t('Kronoloji & Evreler', 'Chronology & Phases')}
              </h2>

              {/* Wide visual chronology: breaks out of the prose column without widening body text */}
              <div className="w-full">
                <Timeline settlement={settlement} />
              </div>

              {/* Editorial Chronology Paragraphs */}
              {hasChronology && (
                <div className="space-y-4 pt-2">
                  {Array.isArray(settlement.chronology) ? (
                    settlement.chronology.map((paragraph, idx) => (
                      <RichParagraphRenderer
                        key={idx}
                        item={paragraph}
                        className="font-prose text-[17px] sm:text-[18px] leading-[1.75] text-[#332A21]"
                        titleClassName="font-serif font-bold text-lg text-[#1C1712]"
                      />
                    ))
                  ) : (
                    <RichParagraphRenderer
                      item={settlement.chronology}
                      className="font-prose text-[17px] sm:text-[18px] leading-[1.75] text-[#332A21]"
                    />
                  )}
                </div>
              )}
            </section>

            {/* 3. Archaeological Significance */}
            {hasImportance && (
              <section id="section-importance" data-monograph-section="importance" className="max-w-[840px] scroll-mt-24 space-y-5">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2 flex items-center gap-2">
                  <Info size={22} className="text-[#8A4526]" />
                  {t('Neden Önemli? (Arkeolojik Anlamı)', 'Why It Matters (Significance)')}
                </h2>
                <div className="space-y-3.5">
                  {Array.isArray(settlement.importance) ? (
                    settlement.importance.map((paragraph, idx) => (
                      <RichParagraphRenderer
                        key={idx}
                        item={paragraph}
                        className="font-prose text-[17px] sm:text-[18px] leading-[1.75] text-[#2B231B]"
                        titleClassName="font-serif font-bold text-base text-[#1C1712]"
                      />
                    ))
                  ) : (
                    <RichParagraphRenderer
                      item={settlement.importance}
                      className="font-prose text-[17px] sm:text-[18px] leading-[1.75] text-[#2B231B]"
                    />
                  )}
                </div>
              </section>
            )}

            {/* 4. Discoveries & Key Finds */}
            {hasDiscoveries && (
              <section id="section-discoveries" data-monograph-section="discoveries" className="scroll-mt-24 space-y-6">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
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
                          className="font-prose text-[17px] sm:text-[18px] leading-[1.75] text-[#2B231B]"
                          titleClassName="font-serif font-bold text-base text-[#1C1712]"
                        />
                      ))
                    ) : (
                      <RichParagraphRenderer
                        item={settlement.discoveries}
                        className="font-prose text-[17px] sm:text-[18px] leading-[1.75] text-[#2B231B]"
                      />
                    )}
                  </div>
                )}

                {/* Key Finds — editorial artifact cards */}
                {settlement.keyFinds && settlement.keyFinds.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-end justify-between border-b border-[#E2D6C6] pb-2">
                      <div>
                        <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9A765C]">
                          {t('Seçilmiş Kayıtlar', 'Selected Records')}
                        </div>
                        <div className="mt-0.5 font-serif text-lg font-bold text-[#2A211A]">
                          {t('Önemli Eser ve Yapılar', 'Key Artifacts and Structures')}
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-[#9A8A77]">
                        {settlement.keyFinds.length} {t('kayıt', 'records')}
                      </div>
                    </div>

                    <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2">
                      {settlement.keyFinds.map((find, idx) => (
                        <article
                          key={idx}
                          className="group relative z-0 h-full overflow-visible border border-[#DDD0BE] bg-[#FCF9F3] p-5 shadow-[0_16px_34px_-30px_rgba(35,27,20,0.7)] transition-all duration-200 hover:z-30 hover:-translate-y-0.5 hover:border-[#C8B69F] hover:shadow-[0_22px_42px_-30px_rgba(35,27,20,0.6)] focus-within:z-30 sm:p-6"
                        >
                          <div
                            className="absolute left-0 top-0 h-1 w-full opacity-85"
                            style={{ backgroundColor: primaryColor }}
                            aria-hidden="true"
                          />

                          <div className="mb-4 flex items-start justify-between gap-3">
                            <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#A18C77]">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            {find.period && (
                              <span className="border border-[#DED1C0] bg-[#F4ECE1] px-2 py-1 font-serif text-[11px] italic text-[#6F5F4E]">
                                {find.period}
                              </span>
                            )}
                          </div>

                          <h3 className="font-serif text-xl font-bold leading-tight text-[#1C1611] sm:text-2xl">
                            {find.name}
                          </h3>
                          <p className="mt-3 font-prose text-[16px] leading-[1.72] text-[#46392E] sm:text-[17px]">
                            {find.description}
                            <CitationRefs sourceIds={find.sourceIds} />
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 5. Excavation History */}
            {(hasHistory || hasCurrentStatus) && (
              <section id="section-history" data-monograph-section="history" className="max-w-[840px] scroll-mt-24 space-y-5">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
                  {t('Araştırma / Kazı Tarihi', 'Research / Excavation History')}
                </h2>
                <div className="space-y-3.5">
                  {Array.isArray(settlement.excavationHistory) ? (
                    settlement.excavationHistory.map((paragraph, idx) => (
                      <RichParagraphRenderer
                        key={idx}
                        item={paragraph}
                        className="font-prose text-[17px] sm:text-[18px] leading-[1.75] text-[#2E251D]"
                        titleClassName="font-serif font-bold text-base text-[#1C1712]"
                      />
                    ))
                  ) : (
                    <RichParagraphRenderer
                      item={settlement.excavationHistory}
                      className="font-prose text-[17px] sm:text-[18px] leading-[1.75] text-[#2E251D]"
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
              <section id="section-research" data-monograph-section="research" className="scroll-mt-24 space-y-6">
                <div className="border-b border-[#E2D8C7] pb-3">
                  <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A765C]">
                    {t('Akademik Katman', 'Scholarly Layer')}
                  </div>
                  <h2 className="mt-1 flex items-center gap-2 font-serif text-xl font-bold tracking-tight text-[#1A1510] sm:text-2xl">
                    <BookOpen size={24} className="text-[#8A4526]" />
                    {t('Araştırma ve Bilimsel Tartışmalar', 'Research & Scholarly Debates')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {settlement.researchDebates.map((debate, idx) => {
                    const mainText = debate.text || debate.scholarlyDebate;
                    const consensus = debate.consensus && debate.consensus !== mainText ? debate.consensus : null;
                    const evidence = debate.evidence && debate.evidence !== mainText && debate.evidence !== consensus
                      ? debate.evidence
                      : null;

                    return (
                      <article
                        key={idx}
                        className="border border-[#DCCFBD] bg-[#FCF9F3] shadow-[0_18px_40px_-34px_rgba(35,27,20,0.65)]"
                      >
                        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[84px_minmax(0,1fr)]">
                          <div className="flex h-16 w-16 items-center justify-center border border-[#D7C8B5] bg-[#F1E6D8] font-serif text-xl font-bold text-[#8A4526]">
                            {String(idx + 1).padStart(2, '0')}
                          </div>

                          <div className="min-w-0">
                            <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A765C]">
                              {t('Bilimsel Tartışma', 'Scholarly Debate')}
                            </div>
                            <h3 className="mt-1 font-serif text-xl font-bold leading-tight text-[#1C1712] sm:text-2xl">
                              {debate.title || debate.topic || t('Araştırma Problemi', 'Research Question')}
                            </h3>

                            {mainText && (
                              <p className="mt-3 font-prose text-[16px] leading-[1.75] text-[#3D3226] sm:text-[17px]">
                                {mainText}
                                <CitationRefs sourceIds={debate.sourceIds || debate.citations} />
                              </p>
                            )}

                            {(consensus || evidence) && (
                              <div className="mt-5 grid gap-3 md:grid-cols-2">
                                {consensus && (
                                  <div className="border-l-2 border-[#58775A] bg-[#F1F5EF] p-4">
                                    <div className="font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-[#58775A]">
                                      {t('Mevcut Uzlaşı', 'Current Consensus')}
                                    </div>
                                    <p className="mt-1.5 font-prose text-sm leading-relaxed text-[#3E4A3D]">
                                      {consensus}
                                    </p>
                                  </div>
                                )}
                                {evidence && (
                                  <div className="border-l-2 border-[#A26A3D] bg-[#F8F1E8] p-4">
                                    <div className="font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-[#8A5A35]">
                                      {t('Başlıca Kanıt', 'Key Evidence')}
                                    </div>
                                    <p className="mt-1.5 font-prose text-sm leading-relaxed text-[#4E4034]">
                                      {evidence}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 6. Gallery */}
            {hasImages && (
              <section id="section-gallery" data-monograph-section="gallery" className="scroll-mt-24 space-y-5">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
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
              <section id="section-geography" data-monograph-section="geography" className="scroll-mt-24 space-y-5">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
                  {t('Coğrafi Konum & Çevre', 'Geography & Environment')}
                </h2>
                {geography.summary && (
                  <p className="font-prose text-[17px] sm:text-[18px] leading-[1.75] text-[#2B231B]">
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
                </div>
              </section>
            )}

            {/* 8. Visit Information */}
            {hasVisit && visit && (
              <section id="section-visit" data-monograph-section="visit" className="scroll-mt-24 space-y-5">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
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

              </section>
            )}

            {/* 9. Nearby Places */}
            {hasNearbyPlaces && settlement.nearbyPlaces && settlement.nearbyPlaces.length > 0 && (
              <section id="section-nearby" data-monograph-section="nearby" className="scroll-mt-24 space-y-5">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
                  {t('Yakın Kültür Noktaları & Müzeler', 'Nearby Sites & Museums')}
                </h2>
                <div className="grid auto-rows-fr grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {settlement.nearbyPlaces.map((place, idx) => (
                    <div key={idx} className="h-full p-4 bg-[#FAF7F0] border border-[#E5DAC8] space-y-1.5 shadow-xs">
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
              <section id="section-participation" data-monograph-section="participation" className="scroll-mt-24 space-y-5">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1510] border-b border-[#E2D8C7] pb-2">
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
              <section id="section-sources" data-monograph-section="sources" className="scroll-mt-24 space-y-5 border-t border-[#E8DFC8] pt-6">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1510] pb-2">
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
              </CitationProvider>
            </div>
          </div>
        </main>
    </div>
  );
};
