/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Settlement, PeriodId, IndexSettlement, SiteDetail } from './types/settlement';
import {
  fetchSettlementIndex,
  fetchSiteDetail,
  getCachedSiteDetail,
  buildIndexSettlement,
  buildLocalizedSettlement
} from './data/settlementService';
import { fetchTurkeyGeo, fetchSurroundingGeo } from './utils/mapData';
import { CHRONOLOGICAL_PERIOD_IDS, PERIODS } from './data/periods';
import { Header } from './components/Header';
import { AtlasMap } from './components/AtlasMap';
import { SettlementPanel, DetailLoadStatus } from './components/SettlementPanel';
import { SettlementFullPageView } from './components/SettlementFullPageView';
import { AboutModal } from './components/AboutModal';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function AtlasApp() {
  const { lang, t } = useLanguage();

  // Index Settlements (loaded only once on initial app load)
  const [indexData, setIndexData] = useState<IndexSettlement[]>([]);
  const [isLoadingIndex, setIsLoadingIndex] = useState(true);

  // Periods Filter State (Defaults to all periods enabled)
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([
    ...CHRONOLOGICAL_PERIOD_IDS
  ]);

  // Selected Settlement State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SiteDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailStatus, setDetailStatus] = useState<DetailLoadStatus>('idle');
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFullScreenView, setIsFullScreenView] = useState(false);

  const [mapFocusTarget, setMapFocusTarget] = useState<{
    center: [number, number];
    zoom: number;
    timestamp: number;
  } | null>(null);

  // Modals
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // Keep HTML document title & language tag synced
  useEffect(() => {
    document.title =
      lang === 'en'
        ? 'Anatolian Historical Atlas — Archaeological & Historical Sites of Anatolia'
        : 'Anadolu Tarih Atlası — Anadolu Arkeolojik ve Tarihî Alanları';
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // 1. Initial Load: Fetch Firestore sites_index, prefetching map GeoJSONs in parallel
  useEffect(() => {
    let isMounted = true;

    // Load lightweight index from Cloud Firestore sites_index for instant app start
    fetchSettlementIndex()
      .then(index => {
        if (isMounted) {
          setIndexData(index);
          setIsLoadingIndex(false);
        }
      })
      .catch(err => {
        console.error('Failed to load initial settlement index:', err);
        if (isMounted) {
          setIsLoadingIndex(false);
        }
      });

    // Prefetch map GeoJSON layers in background in parallel
    fetchTurkeyGeo().catch(err => console.error('Error prefetching turkey geo:', err));
    fetchSurroundingGeo().catch(err => console.error('Error prefetching surrounding geo:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Build lightweight settlements dynamically when index data or language changes
  const allSettlements = useMemo(() => {
    return indexData.map(item => buildIndexSettlement(item, lang));
  }, [indexData, lang]);

  // 3. Active selected settlement: Localized from loaded detail if available, or lightweight index
  const activeSettlement: Settlement | null = useMemo(() => {
    if (!selectedId) return null;
    if (selectedDetail && selectedDetail.id === selectedId) {
      return buildLocalizedSettlement(selectedDetail, lang);
    }
    const found = allSettlements.find(s => s.id === selectedId);
    return found || null;
  }, [selectedId, selectedDetail, lang, allSettlements]);

  // 4. Calculate count of sites per period across the indexed dataset
  const periodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CHRONOLOGICAL_PERIOD_IDS.forEach(p => {
      counts[p] = 0;
    });

    allSettlements.forEach(s => {
      s.periods.forEach(p => {
        counts[p] = (counts[p] || 0) + 1;
      });
    });

    return counts;
  }, [allSettlements]);

  // 5. Filter settlements based on selected periods
  const filteredSettlements = useMemo(() => {
    if (selectedPeriods.length === CHRONOLOGICAL_PERIOD_IDS.length) {
      return allSettlements;
    }

    if (selectedPeriods.length === 0) {
      return [];
    }

    return allSettlements.filter(s =>
      s.periods.some(p => selectedPeriods.includes(p))
    );
  }, [allSettlements, selectedPeriods]);

  // Toggle individual period
  const handleTogglePeriod = useCallback((period: string) => {
    setSelectedPeriods(prev => {
      if (prev.includes(period)) {
        return prev.filter(p => p !== period);
      } else {
        return [...prev, period];
      }
    });
  }, []);

  // Select a batch of periods (e.g. from an Era)
  const handleSelectPeriods = useCallback((periods: string[]) => {
    setSelectedPeriods(periods);
  }, []);

  // Select all periods
  const handleSelectAllPeriods = useCallback(() => {
    setSelectedPeriods([...CHRONOLOGICAL_PERIOD_IDS]);
  }, []);

  // Select settlement: Open panel and lazy-load atlas/sites/{id}.json from Firebase Storage if not cached
  const handleSelectSettlement = useCallback(async (settlement: Settlement) => {
    setSelectedId(settlement.id);
    setIsPanelOpen(true);

    const cached = getCachedSiteDetail(settlement.id);
    if (cached) {
      setSelectedDetail(cached);
      setDetailStatus('loaded');
      setDetailError(null);
      setIsDetailLoading(false);
      return;
    }

    setIsDetailLoading(true);
    setDetailStatus('loading');
    setDetailError(null);
    try {
      const detail = await fetchSiteDetail(settlement.id);
      setSelectedDetail(detail);
      setDetailStatus('loaded');
      setDetailError(null);
    } catch (err: any) {
      console.error(`Failed to load site details for ${settlement.id}:`, err);
      const isNotFound =
        err?.message?.includes('not exist') ||
        err?.message?.includes('404') ||
        err?.message?.includes('bulunamadı');
      setDetailStatus(isNotFound ? 'not_found' : 'error');
      setDetailError(
        err?.message || (lang === 'en' ? 'Failed to load site monograph details.' : 'Yerleşim monografi detayları yüklenemedi.')
      );
    } finally {
      setIsDetailLoading(false);
    }
  }, [lang]);

  // Close panel
  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    setIsFullScreenView(false);
    setSelectedId(null);
    setDetailStatus('idle');
    setDetailError(null);
  }, []);

  // Open Full-Page Monograph View
  const handleOpenFullScreen = useCallback(() => {
    setIsFullScreenView(true);
  }, []);

  // Back from Full-Page View to Map
  const handleBackToMap = useCallback(() => {
    setIsFullScreenView(false);
  }, []);

  // Return to main atlas map and focus on settlement
  const handleShowOnMainMap = useCallback((settlement: Settlement) => {
    setIsPanelOpen(false);
    setIsFullScreenView(false);
    setSelectedId(settlement.id);
    setMapFocusTarget({
      center: [settlement.longitude, settlement.latitude],
      zoom: 3.8,
      timestamp: Date.now()
    });
  }, []);

  // Global escape key handler to close panel / modal / fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (aboutModalOpen) {
          setAboutModalOpen(false);
        } else if (isFullScreenView) {
          setIsFullScreenView(false);
        } else if (isPanelOpen) {
          handleClosePanel();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aboutModalOpen, isFullScreenView, isPanelOpen, handleClosePanel]);

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-[#FAF6EE] text-[#24211D]">
      {/* Top Header with Brand, Search, TR/EN Language Switcher, and Period Filters */}
      <Header
        settlements={allSettlements}
        selectedPeriods={selectedPeriods}
        onTogglePeriod={handleTogglePeriod}
        onSelectPeriods={handleSelectPeriods}
        onSelectAllPeriods={handleSelectAllPeriods}
        onSelectSettlement={handleSelectSettlement}
        selectedSettlementId={selectedId || undefined}
        periodCounts={periodCounts}
        totalCount={allSettlements.length}
        filteredCount={filteredSettlements.length}
        onOpenAboutModal={() => setAboutModalOpen(true)}
      />

      {/* Main Map Viewport */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {isLoadingIndex ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FAF6EE] z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#8A4526] border-t-transparent rounded-full animate-spin" />
              <span className="font-serif text-xs text-[#736554] tracking-wider">
                {t('Atlas yükleniyor...', 'Loading atlas...')}
              </span>
            </div>
          </div>
        ) : (
          <AtlasMap
            settlements={filteredSettlements}
            selectedSettlement={activeSettlement}
            onSelectSettlement={handleSelectSettlement}
            focusTarget={mapFocusTarget}
          />
        )}

        {/* Mobile backdrop overlay when settlement panel is open */}
        {isPanelOpen && activeSettlement && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs sm:hidden transition-opacity"
            onClick={handleClosePanel}
            aria-hidden="true"
          />
        )}

        {/* Settlement Detail Panel (Desktop: right sliding drawer, Mobile: bottom-sheet) */}
        <SettlementPanel
          settlement={isPanelOpen && !isFullScreenView ? activeSettlement : null}
          onClose={handleClosePanel}
          onOpenFullScreen={handleOpenFullScreen}
          onShowOnMainMap={handleShowOnMainMap}
          isLoading={isDetailLoading}
          status={detailStatus}
          error={detailError}
          onRetry={() => activeSettlement && handleSelectSettlement(activeSettlement)}
        />

        {/* Full-Page Monograph View with high-readability typography & back to map */}
        {isFullScreenView && activeSettlement && (
          <SettlementFullPageView
            settlement={activeSettlement}
            onBackToMap={handleBackToMap}
            isLoading={isDetailLoading}
            status={detailStatus}
            error={detailError}
            onRetry={() => activeSettlement && handleSelectSettlement(activeSettlement)}
          />
        )}
      </main>

      {/* About & Methodology Modal */}
      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AtlasApp />
    </LanguageProvider>
  );
}
