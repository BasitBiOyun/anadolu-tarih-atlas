import React, { useEffect, useRef } from 'react';
import {
  BookOpen,
  Books,
  CalendarBlank,
  Compass,
  MapTrifold,
  ShieldCheck,
  X
} from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteCount: number;
  periodCount: number;
}

const featureCards = [
  {
    icon: MapTrifold,
    titleTr: 'Harita',
    titleEn: 'Map',
    textTr: 'Yerleşimlerin Anadolu içindeki konumunu ve birbirleriyle olan coğrafi ilişkilerini görün.',
    textEn: 'See where sites sit within Anatolia and how their locations relate to one another.'
  },
  {
    icon: CalendarBlank,
    titleTr: 'Zaman',
    titleEn: 'Time',
    textTr: 'Bir yerleşimin farklı dönemlerdeki kullanımını ve uzun zaman içindeki değişimini izleyin.',
    textEn: 'Follow a site across its different phases and place those phases in a wider chronology.'
  },
  {
    icon: BookOpen,
    titleTr: 'Yerleşim sayfaları',
    titleEn: 'Site pages',
    textTr: 'Kronoloji, buluntular, kazı geçmişi, bilimsel tartışmalar, görseller ve ziyaret bilgilerini birlikte inceleyin.',
    textEn: 'Explore chronology, finds, research history, scholarly debates, images and visitor information in one place.'
  },
  {
    icon: Books,
    titleTr: 'Kaynakça',
    titleEn: 'Sources',
    textTr: 'Metindeki bilgilerin hangi yayınlara dayandığını görün ve erişilebilen kaynaklara doğrudan ulaşın.',
    textEn: 'Trace information back to the publications behind it and open available sources directly.'
  }
] as const;

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  siteCount,
  periodCount
}) => {
  const { lang, t } = useLanguage();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="atlas-about-title"
        className="flex h-[94dvh] w-full max-w-[1120px] flex-col overflow-hidden border border-[#D9CEBC] bg-[#FAF7F2] text-[#262018] shadow-[0_36px_90px_-28px_rgba(25,18,13,0.65)] sm:h-auto sm:max-h-[90dvh]"
        onClick={event => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E8DFD0] bg-[#F4EFE6] px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <div className="font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-[#9A765C] sm:text-[10px]">
              {t('Atlas Hakkında', 'About the Atlas')}
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <Compass size={20} className="shrink-0 text-[#8A4526]" />
              <h2
                id="atlas-about-title"
                className="truncate font-serif text-lg font-bold text-[#1A1510] sm:text-xl"
              >
                {t('Anadolu Tarih Atlası', 'Anatolian Historical Atlas')}
              </h2>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#D9CEBC] bg-[#FAF7F2] text-[#786958] transition-colors hover:bg-[#EFE8DC] hover:text-[#1A1510]"
            aria-label={t('Kapat', 'Close')}
          >
            <X size={19} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="border-b border-[#E8DFD0] bg-[#F8F2E9] p-5 sm:p-7 lg:sticky lg:top-0 lg:h-full lg:border-b-0 lg:border-r lg:border-[#E8DFD0] lg:p-8">
              <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A765C]">
                {t('Anadolu · Mekân · Zaman', 'Anatolia · Place · Time')}
              </div>

              <h3 className="mt-3 font-serif text-3xl font-bold leading-[1.02] tracking-[-0.02em] text-[#1A1510] sm:text-4xl">
                {t(
                  'Anadolu’nun geçmişini harita üzerinde, zaman içinde okumak.',
                  'Explore Anatolia as a landscape shaped across time.'
                )}
              </h3>

              <p className="mt-4 font-prose text-[15px] leading-[1.72] text-[#4A3F33]">
                {t(
                  'Anadolu Tarih Atlası, arkeolojik ve tarihî alanları tek bir haritada bir araya getirir. Amacı yalnızca bu yerlerin nerede olduğunu göstermek değil; hangi dönemlerde yaşadıklarını, neden önemli olduklarını ve bugün onlar hakkında neler bildiğimizi anlaşılır bir bütün içinde sunmaktır.',
                  'The Anatolian Historical Atlas brings archaeological and historical places together in a shared spatial and chronological view. It is designed for exploration: where a place is, when it mattered, what has been found there, and how our understanding of it has developed.'
                )}
              </p>

              <div className="mt-6 grid grid-cols-2 border border-[#D9CEBC] bg-[#FAF7F2]">
                <div className="border-r border-[#D9CEBC] px-3 py-3 text-center">
                  <div className="font-serif text-xl font-bold text-[#1A1510]">{siteCount}</div>
                  <div className="mt-0.5 font-sans text-[8px] font-bold uppercase tracking-[0.12em] text-[#8A7A68]">
                    {t('Yerleşim', 'Sites')}
                  </div>
                </div>
                <div className="px-3 py-3 text-center">
                  <div className="font-serif text-xl font-bold text-[#1A1510]">{periodCount}</div>
                  <div className="mt-0.5 font-sans text-[8px] font-bold uppercase tracking-[0.12em] text-[#8A7A68]">
                    {t('Dönem', 'Periods')}
                  </div>
                </div>
              </div>

              <p className="mt-5 border-l-2 border-[#8A4526] pl-4 font-prose text-sm leading-relaxed text-[#5A493A]">
                {t(
                  'Atlas yeni yerleşimler eklendikçe genişleyecek. İçerik sayısı arttıkça dönemler ve bölgeler arasında karşılaştırma yapmak da daha anlamlı hâle gelecek.',
                  'The atlas will continue to grow as new sites are added, making comparisons across regions and periods increasingly useful.'
                )}
              </p>
            </aside>

            <div className="space-y-9 p-5 sm:p-7 lg:p-9">
              <section>
                <div className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A765C]">
                  01 · {t('Atlas ne sunuyor?', 'What can you explore?')}
                </div>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#1A1510] sm:text-3xl">
                  {t(
                    'Bir yerleşime farklı açılardan bakabilmek.',
                    'A fuller view of each place.'
                  )}
                </h3>

                <p className="mt-4 max-w-3xl font-prose text-[16px] leading-[1.75] text-[#42372A] sm:text-[17px]">
                  {t(
                    'Aynı yer hakkında coğrafya, kronoloji, önemli buluntular, kazı geçmişi, bilimsel görüşler ve kaynakça çoğu zaman farklı yerlerde karşımıza çıkar. Atlas bu bilgileri birbirinden koparmadan, gerektiğinde ayrıntıya inebileceğiniz tek bir okuma düzeninde buluşturmayı hedefliyor.',
                    'Information about a site is often scattered across maps, excavation reports, articles and catalogues. The atlas brings those strands together so that geography, chronology, discoveries and scholarship can be read side by side.'
                  )}
                </p>

                <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {featureCards.map(({ icon: Icon, titleTr, titleEn, textTr, textEn }) => (
                    <article
                      key={titleEn}
                      className="border border-[#DDD0BE] bg-[#FCF9F3] p-4 sm:p-5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center border border-[#D8C9B5] bg-[#F2E8DA] text-[#8A4526]">
                        <Icon size={18} />
                      </div>
                      <h4 className="mt-4 font-serif text-lg font-bold text-[#1A1510]">
                        {lang === 'tr' ? titleTr : titleEn}
                      </h4>
                      <p className="mt-2 font-prose text-sm leading-[1.65] text-[#57493A]">
                        {lang === 'tr' ? textTr : textEn}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="border-t border-[#E8DFD0] pt-8">
                <div className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A765C]">
                  02 · {t('Nasıl kullanılır?', 'How to use it')}
                </div>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#1A1510]">
                  {t(
                    'Haritada gezin, dönemi daraltın, merak ettiğiniz yere girin.',
                    'Browse the map, narrow the period, then open a place that catches your attention.'
                  )}
                </h3>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      no: '01',
                      tr: 'Arama ve dönem filtreleriyle haritadaki alanı daraltın ya da doğrudan harita üzerinde gezin.',
                      en: 'Use search and period filters, or simply explore the map.'
                    },
                    {
                      no: '02',
                      tr: 'Bir yerleşime dokunduğunuzda temel bilgiler ve kronoloji hızlıca açılır.',
                      en: 'Open a site for a concise overview of its location, dates and significance.'
                    },
                    {
                      no: '03',
                      tr: 'Daha ayrıntılı okumak istediğinizde tam yerleşim sayfasına geçin; kaynakları ve görselleri oradan inceleyin.',
                      en: 'Move into the full site page when you want the deeper research, bibliography and visual material.'
                    }
                  ].map(item => (
                    <div
                      key={item.no}
                      className="border-t border-[#E8DFD0] pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0"
                    >
                      <div className="font-mono text-[9px] font-bold text-[#A18C77]">{item.no}</div>
                      <div className="mt-1 font-prose text-[15px] leading-[1.65] text-[#4A3F33]">
                        {lang === 'tr' ? item.tr : item.en}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-t border-[#E8DFD0] pt-8">
                <div className="flex items-start gap-4 border border-[#D6C8B5] bg-[#F4EBDD] p-5 sm:p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#C8B69E] bg-[#FFF9F0] text-[#8A4526]">
                    <ShieldCheck size={21} />
                  </div>
                  <div>
                    <div className="font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-[#9A765C]">
                      03 · {t('İçerik yaklaşımı', 'Editorial approach')}
                    </div>
                    <h3 className="mt-1 font-serif text-xl font-bold text-[#1A1510]">
                      {t(
                        'Bilinenle bilinmeyeni birbirine karıştırmamak.',
                        'Keep evidence, interpretation and uncertainty distinct.'
                      )}
                    </h3>
                    <p className="mt-2 font-prose text-[15px] leading-[1.72] text-[#514335]">
                      {t(
                        'Tarihi kesin olmayan bir veri kesinmiş gibi yazılmaz. Bilimsel görüş ayrılıkları tek bir hükme indirgenmez. Rekonstrüksiyonlar açıkça belirtilir. Kaynaklar mümkün olduğu ölçüde yazar, eser ve yayın bilgileriyle birlikte gösterilir. Amaç, okurun hem anlatıyı rahatça takip edebilmesi hem de isterse bilginin kaynağına ulaşabilmesidir.',
                        'Dates are not presented as exact when the evidence is uncertain. Competing scholarly interpretations are not flattened into a single answer. Reconstructions are identified as such, and bibliographic information is provided wherever possible so readers can follow the evidence further.'
                      )}
                    </p>
                  </div>
                </div>
              </section>

              <footer className="border-t border-[#E8DFD0] pt-5 font-sans text-[10px] text-[#8A7A68]">
                {t(
                  'Anadolu Tarih Atlası · Türkçe ve İngilizce',
                  'Anatolian Historical Atlas · Turkish and English'
                )}
              </footer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
