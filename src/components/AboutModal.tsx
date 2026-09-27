import React from 'react';
import { X, Compass, ShieldCheck } from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F2] border border-[#D9CEBC] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-[#262018]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8DFD0] bg-[#F4EFE6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass size={20} weight="regular" className="text-[#8A4526]" />
            <h2 className="text-base font-serif font-bold text-[#1A1510]">
              {t('Anadolu Tarihöncesi Atlası Hakkında', 'About Prehistoric Anatolia Atlas')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#786958] hover:text-[#1A1510] transition-colors"
            aria-label={t('Kapat', 'Close')}
          >
            <X size={20} weight="regular" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed scrollbar-thin">
          <div className="space-y-2">
            <h3 className="font-serif font-semibold text-sm text-[#1A1510]">
              {t('Amaç ve Metodoloji', 'Purpose & Methodology')}
            </h3>
            <p className="font-prose text-[13px] leading-relaxed text-[#382E24]">
              <strong>{t('Anadolu Tarihöncesi Atlası (Prehistoric Anatolia Atlas)', 'Prehistoric Anatolia Atlas (Anadolu Tarihöncesi Atlası)')}</strong>,{' '}
              {t(
                'Pleistosen dönemi ilk insan izlerinden (Paleolitik) MÖ 1200 Tunç Çağı sonuna kadar Anadolu yarımadasında belgelenmiş temel arkeolojik yerleşimleri mekânsal, kronolojik ve bibliyografik bağlamda sunan interaktif bir akademik atlas projesidir.',
                'is an interactive academic atlas project presenting principal prehistoric settlements documented across the Anatolian peninsula from early human presence (Palaeolithic) to the end of the Bronze Age (1200 BCE) in their spatial, chronological, and bibliographic contexts.'
              )}
            </p>
          </div>

          <div className="p-3.5 bg-[#F2EDE2] border-l-2 border-[#8A4526] space-y-1">
            <div className="flex items-center gap-1.5 font-serif font-semibold text-xs text-[#8A4526]">
              <ShieldCheck size={16} weight="regular" />
              <span>{t('Bilimsel Doğruluk İlkesi', 'Scientific Accuracy Principle')}</span>
            </div>
            <p className="font-prose text-xs text-[#4A3F33]">
              {t(
                'Atlas kapsamında hiçbir arkeolojik veri veya rekonstrüksiyon yapay olarak uydurulmamıştır. Tüm koordinatlar, tabaka dizilimleri ve yayın referansları Türkiye Kültür ve Turizm Bakanlığı, TAY Projesi, üniversite kazı raporları ve hakemli akademik yayınlar temel alınarak titizlikle derlenmiştir.',
                'No archaeological data or reconstructions in this atlas have been fabricated. All geographic coordinates, stratigraphic sequences, and bibliographic references are derived strictly from authoritative excavation reports, university fieldwork publications, and peer-reviewed archaeological research.'
              )}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-semibold text-sm text-[#1A1510]">
              {t('Kronolojik Kapsam', 'Chronological Scope')}
            </h3>
            <p className="font-prose text-xs text-[#4A3F33] leading-relaxed">
              {t(
                'Atlas; Paleolitik, Epipaleolitik, Neolitik, Kalkolitik ve Tunç Çağı (Erken, Orta, Geç) evrelerini kapsar. Tarihleme sisteminde MÖ (Milattan Önce / BCE) standart alınmıştır.',
                'The atlas spans the Palaeolithic, Epipalaeolithic, Neolithic, Chalcolithic, and Bronze Age (Early, Middle, Late) horizons, calibrated to standard BCE (Before Common Era) chronology.'
              )}
            </p>
          </div>

          <div className="pt-2 border-t border-[#E8DFD0] text-[11px] text-[#7A6C5C] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>{t('Anadolu Tarihöncesi Atlası', 'Prehistoric Anatolia Atlas')}</span>
            <span className="font-mono text-[10px]">v1.2.0 · Bilingual Edition</span>
          </div>
        </div>
      </div>
    </div>
  );
};
