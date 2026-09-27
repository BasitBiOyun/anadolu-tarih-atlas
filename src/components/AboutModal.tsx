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

const principleCards = [
  {
    icon: MapTrifold,
    titleTr: 'Mekân',
    titleEn: 'Space',
    textTr: 'Yerleşimleri yalnızca bir liste olarak değil, Anadolu’nun coğrafi ilişkileri içinde okumak.',
    textEn: 'Read sites not as a list, but through their geographic relationships across Anatolia.'
  },
  {
    icon: CalendarBlank,
    titleTr: 'Zaman',
    titleEn: 'Time',
    textTr: 'Farklı yerleşim evrelerini aynı kronolojik çerçevede karşılaştırılabilir hâle getirmek.',
    textEn: 'Make different occupation phases comparable within a shared chronological framework.'
  },
  {
    icon: Books,
    titleTr: 'Kaynak',
    titleEn: 'Evidence',
    textTr: 'İddiaları kaynakça, DOI, PDF ve yayın bilgileriyle izlenebilir kılmak.',
    textEn: 'Keep claims traceable through bibliography, DOI, PDF and publication metadata.'
  },
  {
    icon: BookOpen,
    titleTr: 'Monografi',
    titleEn: 'Monograph',
    textTr: 'Her yerleşimi kısa bir pin açıklamasından çıkarıp araştırılabilir bir dijital dosyaya dönüştürmek.',
    textEn: 'Turn each site from a map pin into a researchable digital dossier.'
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
        className="flex h-[94dvh] w-full max-w-[1180px] flex-col overflow-hidden border border-[#D9CEBC] bg-[#FAF7F2] text-[#262018] shadow-[0_36px_90px_-28px_rgba(25,18,13,0.65)] sm:h-auto sm:max-h-[90dvh]"
        onClick={event => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E8DFD0] bg-[#F4EFE6] px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <div className="font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-[#9A765C] sm:text-[10px]">
              {t('Proje Rehberi', 'Project Guide')}
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
          <div className="grid lg:grid-cols-[330px_minmax(0,1fr)]">
            <aside className="border-b border-[#E8DFD0] bg-[#F8F2E9] p-5 sm:p-7 lg:sticky lg:top-0 lg:h-full lg:border-b-0 lg:border-r lg:border-[#E8DFD0] lg:p-8">
              <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A765C]">
                {t('Harita · Zaman · Kaynak · Monografi', 'Map · Time · Evidence · Monograph')}
              </div>

              <h3 className="mt-3 font-serif text-3xl font-bold leading-[0.98] tracking-[-0.02em] text-[#1A1510] sm:text-4xl">
                {t(
                  'Anadolu’nun tarihini pinlerle değil, bağlamla okumak.',
                  'Reading Anatolia through context, not just pins.'
                )}
              </h3>

              <p className="mt-4 font-prose text-[15px] leading-[1.72] text-[#4A3F33]">
                {t(
                  'Anadolu Tarih Atlası; arkeolojik ve tarihî alanları mekân, kronoloji, buluntular, araştırma tarihi, bilimsel tartışmalar, görsel belge ve kaynakça katmanlarını tek bir harita deneyiminde birleştiren çift dilli bir dijital atlas projesidir.',
                  'The Anatolian Historical Atlas is a bilingual digital atlas that brings geography, chronology, finds, research history, scholarly debate, visual documentation and bibliography together in a single map-first experience.'
                )}
              </p>

              <div className="mt-6 grid grid-cols-3 border border-[#D9CEBC] bg-[#FAF7F2]">
                <div className="border-r border-[#D9CEBC] px-3 py-3 text-center">
                  <div className="font-serif text-xl font-bold text-[#1A1510]">{siteCount}</div>
                  <div className="mt-0.5 font-sans text-[8px] font-bold uppercase tracking-[0.12em] text-[#8A7A68]">
                    {t('Yayında', 'Published')}
                  </div>
                </div>
                <div className="border-r border-[#D9CEBC] px-3 py-3 text-center">
                  <div className="font-serif text-xl font-bold text-[#1A1510]">{periodCount}</div>
                  <div className="mt-0.5 font-sans text-[8px] font-bold uppercase tracking-[0.12em] text-[#8A7A68]">
                    {t('Dönem', 'Periods')}
                  </div>
                </div>
                <div className="px-3 py-3 text-center">
                  <div className="font-serif text-xl font-bold text-[#1A1510]">TR/EN</div>
                  <div className="mt-0.5 font-sans text-[8px] font-bold uppercase tracking-[0.12em] text-[#8A7A68]">
                    {t('Çift Dil', 'Bilingual')}
                  </div>
                </div>
              </div>

              <div className="mt-5 border-l-2 border-[#8A4526] bg-[#F4EBDD] px-4 py-3">
                <div className="font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-[#9A765C]">
                  {t('Yayın Modeli', 'Publishing Model')}
                </div>
                <p className="mt-1 font-prose text-sm leading-relaxed text-[#5A493A]">
                  {t(
                    'Atlas tamamlanmış bir katalog değil, doğrulanmış monografiler eklendikçe büyüyen yaşayan bir araştırma altyapısıdır.',
                    'The atlas is not a finished catalogue; it is a living research infrastructure that grows as verified monographs are published.'
                  )}
                </p>
              </div>
            </aside>

            <div className="space-y-10 p-5 sm:p-7 lg:p-9">
              <section>
                <div className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A765C]">
                  01 · {t('Ne yapıyoruz?', 'What are we building?')}
                </div>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#1A1510] sm:text-3xl">
                  {t('Haritadan dijital monografiye', 'From map to digital monograph')}
                </h3>

                <p className="mt-4 max-w-3xl font-prose text-[16px] leading-[1.75] text-[#42372A] sm:text-[17px]">
                  {t(
                    'Amaç yalnızca “nerede?” sorusunu cevaplamak değil. Bir yerleşimi açtığınızda ne zaman iskân edildiğini, hangi dönemlerden geçtiğini, neden önemli olduğunu, hangi buluntuların öne çıktığını, kazı ve araştırma tarihinin nasıl geliştiğini, hangi bilimsel tartışmaların sürdüğünü ve bunların hangi yayınlara dayandığını tek bir yerde görebilmelisiniz.',
                    'The goal is not merely to answer “where?”. Opening a site should reveal when it was occupied, which phases it passed through, why it matters, which finds define it, how research developed, which scholarly debates remain open, and which publications support those claims.'
                  )}
                </p>

                <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {principleCards.map(({ icon: Icon, titleTr, titleEn, textTr, textEn }) => (
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
                  02 · {t('Nasıl kullanılır?', 'How does it work?')}
                </div>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#1A1510]">
                  {t('Harita önce gelir; ayrıntı ihtiyaç oldukça açılır.', 'The map comes first; detail opens when needed.')}
                </h3>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      no: '01',
                      tr: 'Haritada dönem, konum ve yerleşim adları üzerinden alanları keşfedin.',
                      en: 'Explore sites through period, location and settlement names on the map.'
                    },
                    {
                      no: '02',
                      tr: 'Bir yerleşimi seçtiğinizde hızlı özet paneli ve temel kronoloji açılır.',
                      en: 'Selecting a site opens a fast summary panel with its core chronology.'
                    },
                    {
                      no: '03',
                      tr: 'Ayrıntılı görünüm, tam monografiyi yalnızca ihtiyaç olduğunda yükler.',
                      en: 'The detailed view loads the full monograph only when you ask for it.'
                    },
                    {
                      no: '04',
                      tr: 'Metin içindeki kaynak numaraları doğrudan bibliyografik kayda bağlanır.',
                      en: 'Inline source numbers connect directly to the relevant bibliographic record.'
                    }
                  ].map(item => (
                    <div
                      key={item.no}
                      className="grid grid-cols-[42px_minmax(0,1fr)] gap-3 border-b border-[#E8DFD0] py-3"
                    >
                      <div className="font-mono text-[10px] font-bold text-[#A18C77]">{item.no}</div>
                      <div className="font-prose text-[15px] leading-[1.65] text-[#4A3F33]">
                        {lang === 'tr' ? item.tr : item.en}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-t border-[#E8DFD0] pt-8">
                <div className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A765C]">
                  03 · {t('Monografi standardı', 'Monograph standard')}
                </div>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#1A1510]">
                  {t('Her yerleşimde aynı soruları soruyoruz.', 'We ask the same core questions of every site.')}
                </h3>

                <div className="mt-5 grid grid-cols-2 gap-px border border-[#D9CEBC] bg-[#D9CEBC] sm:grid-cols-3">
                  {[
                    ['Genel Bakış', 'Overview'],
                    ['Kronoloji', 'Chronology'],
                    ['Arkeolojik Anlam', 'Significance'],
                    ['Buluntular', 'Finds'],
                    ['Kazı Tarihi', 'Research History'],
                    ['Bilimsel Tartışmalar', 'Scholarly Debates'],
                    ['Görsel Arşiv', 'Visual Archive'],
                    ['Coğrafya', 'Geography'],
                    ['Ziyaret', 'Visitor Information'],
                    ['Yakın Noktalar', 'Nearby Places'],
                    ['Katılım', 'Participation'],
                    ['Kaynakça', 'Bibliography']
                  ].map(([tr, en], index) => (
                    <div key={en} className="bg-[#FCF9F3] px-3 py-3.5 sm:px-4">
                      <div className="font-mono text-[9px] text-[#A18C77]">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="mt-1 font-serif text-sm font-bold text-[#2B231B] sm:text-base">
                        {lang === 'tr' ? tr : en}
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
                      04 · {t('Bilimsel İlke', 'Research Principle')}
                    </div>
                    <h3 className="mt-1 font-serif text-xl font-bold text-[#1A1510]">
                      {t('Belirsizlik saklanmaz, veri uydurulmaz.', 'Uncertainty is preserved; data is not invented.')}
                    </h3>
                    <p className="mt-2 font-prose text-[15px] leading-[1.72] text-[#514335]">
                      {t(
                        'Tarihleme bilinmiyorsa boş bırakılır. Kaynaklar teknik kimliklerle değil, yazar, yıl, eser ve yayın bilgileriyle gösterilir. Rekonstrüksiyonlar görsel olarak açıkça işaretlenir. Bir bilimsel tartışmada uzlaşı, kanıt ve görüş ayrılıkları mümkün olduğunca birbirinden ayrılır.',
                        'Unknown dates are left unknown. Sources are shown as readable bibliographic records rather than internal IDs. Reconstructions are explicitly marked. Where scholarly debate exists, consensus, evidence and disagreement are kept distinct whenever the source material allows it.'
                      )}
                    </p>
                  </div>
                </div>
              </section>

              <footer className="flex flex-col gap-2 border-t border-[#E8DFD0] pt-5 font-sans text-[10px] text-[#8A7A68] sm:flex-row sm:items-center sm:justify-between">
                <span>{t('Anadolu Tarih Atlası · Çift dilli dijital araştırma atlası', 'Anatolian Historical Atlas · Bilingual digital research atlas')}</span>
                <span>{t('Harita merkezli · Kaynak izlenebilir · Sürekli genişleyen', 'Map-first · Traceable sources · Continuously expanding')}</span>
              </footer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
