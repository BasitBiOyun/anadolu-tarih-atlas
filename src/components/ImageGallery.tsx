import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SettlementImage } from '../types/settlement';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowSquareOut,
  CaretLeft,
  CaretRight,
  CornersOut,
  FileImage,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Warning,
  X
} from '@phosphor-icons/react';

interface ImageGalleryProps {
  images: SettlementImage[];
  settlementName: string;
}

function imageTypeLabel(type: string, lang: 'tr' | 'en'): string {
  const labels: Record<string, { tr: string; en: string }> = {
    'archaeological-photo': { tr: 'Arkeolojik Belgeleme', en: 'Archaeological Documentation' },
    'site-photo': { tr: 'Saha Fotoğrafı', en: 'Site Photograph' },
    artifact: { tr: 'Eser / Buluntu', en: 'Artifact / Find' },
    'site-plan': { tr: 'Yerleşim Planı', en: 'Site Plan' },
    map: { tr: 'Harita', en: 'Map' },
    reconstruction: { tr: 'Temsili Rekonstrüksiyon', en: 'Illustrative Reconstruction' }
  };
  return labels[type]?.[lang] || (lang === 'tr' ? 'Arşiv Görseli' : 'Archive Image');
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, settlementName }) => {
  const { lang, t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const currentImage = images?.[currentIndex];
  const previewImages = useMemo(() => images?.slice(0, 3) || [], [images]);

  const goPrevious = () => {
    setZoom(1);
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNext = () => {
    setZoom(1);
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const openAt = (index: number) => {
    setCurrentIndex(index);
    setZoom(1);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModalOpen(false);
      if (event.key === 'ArrowLeft' && images.length > 1) goPrevious();
      if (event.key === 'ArrowRight' && images.length > 1) goNext();
      if (event.key === '+' || event.key === '=') {
        setZoom(prev => Math.min(3, prev + 0.5));
      }
      if (event.key === '-') {
        setZoom(prev => Math.max(1, prev - 0.5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [modalOpen, images.length]);

  if (!images?.length || !currentImage) {
    return (
      <div className="border-y border-[#E7DDCF] py-7 text-center text-[#786D5F]">
        <FileImage size={24} className="mx-auto mb-2 text-[#9B8772]" />
        <p className="font-serif text-sm italic">
          {t(
            'Bu yerleşim için görsel arşiv henüz derlenmektedir.',
            'The visual archive for this site is still being compiled.'
          )}
        </p>
      </div>
    );
  }

  const currentTypeLabel = imageTypeLabel(currentImage.type, lang);
  const isReconstruction = currentImage.type === 'reconstruction';

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 border-b border-[#E2D7C7] pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A765C]">
              {t('Görsel Belgeleme', 'Visual Documentation')}
            </div>
            <div className="mt-1 font-serif text-lg font-bold text-[#2A211A] sm:text-xl">
              {t('Saha, eser ve plan arşivi', 'Site, artifact and plan archive')}
            </div>
          </div>
          <div className="font-mono text-[10px] text-[#8B7A68] sm:text-[11px]">
            {images.length} {t('görsel', 'images')}
          </div>
        </div>

        <div
          className={
            previewImages.length === 1
              ? 'grid grid-cols-1 gap-2'
              : 'grid grid-cols-1 gap-2 sm:grid-cols-[1.65fr_0.85fr] sm:grid-rows-2'
          }
        >
          {previewImages.map((image, index) => {
            const isPrimary = index === 0;
            const remaining = index === 2 ? Math.max(0, images.length - 3) : 0;
            const cardClass = [
              'group relative overflow-hidden border border-[#D8CDBD] bg-[#1B1714] text-left shadow-[0_18px_42px_-34px_rgba(28,21,16,0.7)]',
              previewImages.length === 1
                ? 'aspect-[16/9]'
                : isPrimary
                  ? 'aspect-[16/10] sm:row-span-2 sm:aspect-auto sm:min-h-[520px]'
                  : 'hidden aspect-[16/9] sm:block sm:aspect-auto sm:min-h-0'
            ].join(' ');

            return (
              <button
                key={image.url + '-' + index}
                type="button"
                onClick={() => openAt(index)}
                className={cardClass}
                aria-label={t('Görsel ' + (index + 1) + ' büyüt', 'Open image ' + (index + 1))}
              >
                <img
                  src={image.url}
                  alt={image.caption || settlementName}
                  referrerPolicy="no-referrer"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/15" />

                <div className="absolute left-3 top-3">
                  {image.type === 'reconstruction' ? (
                    <span className="inline-flex items-center gap-1.5 border border-white/20 bg-[#7B2D23]/95 px-2.5 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-white sm:text-[10px]">
                      <Warning size={12} />
                      {imageTypeLabel(image.type, lang)}
                    </span>
                  ) : (
                    <span className="border border-white/20 bg-black/55 px-2.5 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm sm:text-[10px]">
                      {imageTypeLabel(image.type, lang)}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0 max-w-[45vw] sm:max-w-none">
                      {image.caption && (
                        <p
                          className={
                            'font-serif font-semibold leading-snug text-white ' +
                            (isPrimary ? 'text-lg sm:text-xl' : 'text-sm sm:text-base')
                          }
                        >
                          {image.caption}
                        </p>
                      )}
                      {(image.credit || image.source) && (
                        <p className="mt-1 truncate font-sans text-[10px] text-white/70 sm:text-[11px]">
                          {image.credit || image.source}
                        </p>
                      )}
                    </div>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/25 bg-black/35 text-white backdrop-blur-sm transition-colors group-hover:bg-black/65">
                      <CornersOut size={17} />
                    </span>
                  </div>
                </div>

                {remaining > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
                    <div className="border border-white/25 bg-black/50 px-4 py-2 font-serif text-xl font-bold text-white sm:text-2xl">
                      +{remaining}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {images.length > 1 && (
          <div className="flex touch-pan-x gap-2 overflow-x-auto overscroll-x-contain border-y border-[#E7DDCF] py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((image, index) => (
              <button
                key={'thumb-' + image.url + '-' + index}
                type="button"
                onClick={() => openAt(index)}
                className="group relative h-16 w-24 shrink-0 overflow-hidden border border-[#D8CDBD] bg-[#EDE4D8] sm:h-[72px] sm:w-28"
                aria-label={t('Görsel ' + (index + 1), 'Image ' + (index + 1))}
              >
                <img
                  src={image.thumbnailUrl || image.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover opacity-85 transition-all group-hover:scale-105 group-hover:opacity-100"
                />
                <span className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          data-gallery-lightbox="true"
          className="fixed inset-0 z-[120] flex h-[100dvh] max-h-[100dvh] flex-col bg-[#0D0B09]/96 text-white backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={t('Görsel arşiv görüntüleyici', 'Visual archive viewer')}
          onClick={() => setModalOpen(false)}
          onTouchStart={event => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={event => {
            const start = touchStartX.current;
            const end = event.changedTouches[0]?.clientX;
            touchStartX.current = null;
            if (start === null || end === undefined || images.length < 2) return;
            const delta = end - start;
            if (Math.abs(delta) < 55) return;
            if (delta > 0) goPrevious();
            else goNext();
          }}
        >
          <header
            className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 sm:min-h-16 sm:gap-4 sm:px-6 sm:py-3"
            onClick={event => event.stopPropagation()}
          >
            <div className="min-w-0">
              <div className="font-serif text-sm font-bold text-white sm:text-base">
                {settlementName}
              </div>
              <div aria-live="polite" className="mt-0.5 font-mono text-[10px] text-white/55 sm:text-[11px]">
                {String(currentIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                <span className="mx-2">·</span>
                {currentTypeLabel}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(1, prev - 0.5))}
                disabled={zoom <= 1}
                className="flex h-9 w-9 items-center justify-center border border-white/10 text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                aria-label={t('Uzaklaştır', 'Zoom out')}
              >
                <MagnifyingGlassMinus size={17} />
              </button>
              <div className="hidden min-w-[50px] text-center font-mono text-[10px] text-white/55 sm:block">
                {Math.round(zoom * 100)}%
              </div>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(3, prev + 0.5))}
                disabled={zoom >= 3}
                className="flex h-9 w-9 items-center justify-center border border-white/10 text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                aria-label={t('Yakınlaştır', 'Zoom in')}
              >
                <MagnifyingGlassPlus size={17} />
              </button>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setModalOpen(false)}
                className="ml-1 flex h-9 w-9 items-center justify-center border border-white/10 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0B09]"
                aria-label={t('Kapat', 'Close')}
              >
                <X size={19} />
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_330px] lg:grid-rows-1">
            <div
              className="relative flex min-h-0 items-center justify-center overflow-auto p-3 sm:p-6"
              onClick={event => event.stopPropagation()}
            >
              <img
                src={currentImage.url}
                alt={currentImage.caption || settlementName}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out"
                style={{ transform: 'scale(' + zoom + ')' }}
                draggable={false}
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrevious}
                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/10 bg-black/45 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/75 hover:text-white sm:left-5"
                    aria-label={t('Önceki görsel', 'Previous image')}
                  >
                    <CaretLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/10 bg-black/45 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/75 hover:text-white sm:right-5"
                    aria-label={t('Sonraki görsel', 'Next image')}
                  >
                    <CaretRight size={22} />
                  </button>
                </>
              )}
            </div>

            <aside
              className="max-h-[34dvh] overflow-y-auto border-t border-white/10 bg-[#15110E] p-4 lg:max-h-none lg:border-l lg:border-t-0 lg:p-6"
              onClick={event => event.stopPropagation()}
            >
              <div className="font-sans text-[9px] font-bold uppercase tracking-[0.15em] text-[#C49370]">
                {currentTypeLabel}
              </div>
              <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-white sm:text-xl">
                {currentImage.caption || settlementName}
              </h3>

              {isReconstruction && (
                <div className="mt-4 flex items-start gap-2 border-l-2 border-[#A94738] bg-[#271815] p-3 font-sans text-[11px] leading-relaxed text-[#E7C7C0]">
                  <Warning size={15} className="mt-0.5 shrink-0 text-[#D36E5F]" />
                  {t(
                    'Bu görsel arkeolojik veriye dayalı temsili bir rekonstrüksiyondur.',
                    'This image is an illustrative reconstruction based on archaeological evidence.'
                  )}
                </div>
              )}

              <dl className="mt-6 space-y-4 border-t border-white/10 pt-5">
                {(currentImage.credit || currentImage.source) && (
                  <div>
                    <dt className="font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
                      {t('Kaynak / Kredi', 'Source / Credit')}
                    </dt>
                    <dd className="mt-1 font-serif text-sm leading-relaxed text-white/80">
                      {currentImage.credit || currentImage.source}
                    </dd>
                  </div>
                )}
                {currentImage.license && (
                  <div>
                    <dt className="font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
                      {t('Lisans', 'License')}
                    </dt>
                    <dd className="mt-1 font-serif text-sm text-white/75">
                      {currentImage.license}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 flex flex-wrap gap-2">
                {currentImage.sourcePageUrl && (
                  <a
                    href={currentImage.sourcePageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-white/15 bg-white/5 px-3 py-2 font-sans text-[10px] font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {t('Görsel kaynağı', 'Image source')}
                    <ArrowSquareOut size={13} />
                  </a>
                )}
                {currentImage.licenseUrl && (
                  <a
                    href={currentImage.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-white/15 bg-white/5 px-3 py-2 font-sans text-[10px] font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {t('Lisans ayrıntısı', 'License details')}
                    <ArrowSquareOut size={13} />
                  </a>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-7">
                  <div className="mb-2 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
                    {t('Arşiv', 'Archive')}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-3">
                    {images.map((image, index) => {
                      const thumbClass = [
                        'relative aspect-[4/3] overflow-hidden border',
                        currentIndex === index
                          ? 'border-[#C77A4D] ring-1 ring-[#C77A4D]'
                          : 'border-white/10 opacity-60 hover:opacity-100'
                      ].join(' ');

                      return (
                        <button
                          key={'modal-thumb-' + image.url + '-' + index}
                          type="button"
                          onClick={() => {
                            setCurrentIndex(index);
                            setZoom(1);
                          }}
                          className={thumbClass}
                        >
                          <img
                            src={image.thumbnailUrl || image.url}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}
    </>
  );
};
