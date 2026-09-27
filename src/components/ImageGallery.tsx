import React, { useState } from 'react';
import { SettlementImage } from '../types/settlement';
import {
  Image as ImageIcon,
  CaretLeft,
  CaretRight,
  Warning,
  CornersOut,
  X
} from '@phosphor-icons/react';

interface ImageGalleryProps {
  images: SettlementImage[];
  settlementName: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, settlementName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="py-4 text-center border-t border-b border-[#EDE6D9] text-[#786D5F]">
        <p className="font-serif text-xs italic text-[#807261]">
          Bu yerleşim için arşiv fotoğrafları derlenmektedir.
        </p>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const isReconstruction = currentImage.type === 'reconstruction';

  return (
    <div className="space-y-2.5">
      {/* Main Image Frame */}
      <div className="relative bg-[#1A1714] aspect-[16/10] overflow-hidden border border-[#DED4C3] flex items-center justify-center">
        <img
          src={currentImage.url}
          alt={currentImage.caption || `${settlementName} Görseli`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
        />

        {/* Reconstruction Notice */}
        {isReconstruction && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#852C22] text-[#FFF8F5] px-2 py-0.5 text-[10px] font-serif uppercase tracking-wider shadow-xs">
            <Warning size={12} weight="regular" />
            <span>Temsili Rekonstrüksiyon</span>
          </div>
        )}

        {/* Image Type Tag */}
        {!isReconstruction && (
          <div className="absolute top-2 left-2 bg-[#1C1814]/85 text-[#EFE7D8] px-2 py-0.5 text-[10px] font-serif uppercase tracking-wider">
            {currentImage.type === 'archaeological-photo' && 'Arkeolojik Belgeleme'}
            {currentImage.type === 'site-photo' && 'Saha Fotoğrafı'}
            {currentImage.type === 'artifact' && 'Müze Eseri / Buluntu'}
            {currentImage.type === 'site-plan' && 'Yerleşim Planı'}
            {currentImage.type === 'map' && 'Tarihsel Harita'}
          </div>
        )}

        {/* Fullscreen view trigger */}
        <button
          onClick={() => setModalOpen(true)}
          className="absolute bottom-2 right-2 p-1.5 bg-[#1C1814]/80 text-[#EFE7D8] hover:text-white hover:bg-black transition-colors"
          title="Büyüt"
          aria-label="Görseli Büyüt"
        >
          <CornersOut size={16} weight="regular" />
        </button>

        {/* Navigation arrows if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 bg-[#1C1814]/75 text-white hover:bg-black transition-colors"
              aria-label="Önceki görsel"
            >
              <CaretLeft size={18} weight="regular" />
            </button>
            <button
              onClick={() => setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 bg-[#1C1814]/75 text-white hover:bg-black transition-colors"
              aria-label="Sonraki görsel"
            >
              <CaretRight size={18} weight="regular" />
            </button>
          </>
        )}
      </div>

      {/* Caption & Attribution */}
      <div className="text-xs text-[#524637] flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-1 border-b border-[#EDE6D9] pb-2">
        <p className="font-serif italic text-[12px] text-[#29221B]">
          {currentImage.caption}
        </p>
        <div className="text-[10px] font-mono text-[#8C7D6B] shrink-0 flex flex-wrap items-center gap-1.5">
          {currentImage.credit ? (
            currentImage.sourcePageUrl ? (
              <a
                href={currentImage.sourcePageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#1A1510] transition-colors"
                title="Görsel kaynağını aç"
              >
                {currentImage.credit}
              </a>
            ) : (
              <span>{currentImage.credit}</span>
            )
          ) : currentImage.source ? (
            <span>Kaynak: {currentImage.source}</span>
          ) : null}

          {currentImage.license && (
            <span>
              ·{' '}
              {currentImage.licenseUrl ? (
                <a
                  href={currentImage.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#1A1510] transition-colors"
                  title="Lisans ayrıntılarını aç"
                >
                  {currentImage.license}
                </a>
              ) : (
                currentImage.license
              )}
            </span>
          )}
        </div>
      </div>

      {/* Thumbnail Bar */}
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative shrink-0 w-14 h-10 overflow-hidden border transition-all ${
                currentIndex === idx
                  ? 'border-[#8A4526] opacity-100 ring-1 ring-[#8A4526]'
                  : 'border-[#D9CDBA] opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img.thumbnailUrl || img.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col p-4 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div className="flex justify-between items-center text-white pb-3">
            <span className="font-serif text-sm">
              {settlementName} · {currentIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setModalOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-white"
            >
              <X size={20} weight="regular" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={currentImage.url}
              alt={currentImage.caption}
              className="max-w-full max-h-full object-contain"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="text-center text-xs text-[#D9CEBC] font-serif pt-2 italic">
            {currentImage.caption}
          </div>
        </div>
      )}
    </div>
  );
};
