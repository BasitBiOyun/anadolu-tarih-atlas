/**
 * Accurate Turkish & English casing and localization utilities for Turkey provinces.
 * Ensures proper Turkish dotted/dotless I handling:
 *   - 'i' -> 'İ' (İstanbul, İzmir, Siirt)
 *   - 'ı' -> 'I' (Iğdır, Isparta)
 *   - 'I' -> 'ı'
 *   - 'İ' -> 'i'
 */

// Canonical Turkish province names and English equivalents
export const PROVINCE_LOCALIZED_NAMES: Record<string, { tr: string; en: string }> = {
  Adana: { tr: 'Adana', en: 'Adana' },
  Adıyaman: { tr: 'Adıyaman', en: 'Adıyaman' },
  Afyon: { tr: 'Afyonkarahisar', en: 'Afyonkarahisar' },
  Ağrı: { tr: 'Ağrı', en: 'Ağrı' },
  Aksaray: { tr: 'Aksaray', en: 'Aksaray' },
  Amasya: { tr: 'Amasya', en: 'Amasya' },
  Ankara: { tr: 'Ankara', en: 'Ankara' },
  Antalya: { tr: 'Antalya', en: 'Antalya' },
  Ardahan: { tr: 'Ardahan', en: 'Ardahan' },
  Artvin: { tr: 'Artvin', en: 'Artvin' },
  Aydın: { tr: 'Aydın', en: 'Aydın' },
  Balıkesir: { tr: 'Balıkesir', en: 'Balıkesir' },
  Bartın: { tr: 'Bartın', en: 'Bartın' },
  Batman: { tr: 'Batman', en: 'Batman' },
  Bayburt: { tr: 'Bayburt', en: 'Bayburt' },
  Bilecik: { tr: 'Bilecik', en: 'Bilecik' },
  Bingöl: { tr: 'Bingöl', en: 'Bingöl' },
  Bitlis: { tr: 'Bitlis', en: 'Bitlis' },
  Bolu: { tr: 'Bolu', en: 'Bolu' },
  Burdur: { tr: 'Burdur', en: 'Burdur' },
  Bursa: { tr: 'Bursa', en: 'Bursa' },
  Çanakkale: { tr: 'Çanakkale', en: 'Çanakkale' },
  Çankırı: { tr: 'Çankırı', en: 'Çankırı' },
  Çorum: { tr: 'Çorum', en: 'Çorum' },
  Denizli: { tr: 'Denizli', en: 'Denizli' },
  Diyarbakır: { tr: 'Diyarbakır', en: 'Diyarbakır' },
  Düzce: { tr: 'Düzce', en: 'Düzce' },
  Edirne: { tr: 'Edirne', en: 'Edirne' },
  Elazığ: { tr: 'Elazığ', en: 'Elazığ' },
  Erzincan: { tr: 'Erzincan', en: 'Erzincan' },
  Erzurum: { tr: 'Erzurum', en: 'Erzurum' },
  Eskişehir: { tr: 'Eskişehir', en: 'Eskişehir' },
  Gaziantep: { tr: 'Gaziantep', en: 'Gaziantep' },
  Giresun: { tr: 'Giresun', en: 'Giresun' },
  Gümüşhane: { tr: 'Gümüşhane', en: 'Gümüşhane' },
  Hakkari: { tr: 'Hakkâri', en: 'Hakkari' },
  Hatay: { tr: 'Hatay', en: 'Hatay' },
  Iğdır: { tr: 'Iğdır', en: 'Igdir' },
  Isparta: { tr: 'Isparta', en: 'Isparta' },
  İstanbul: { tr: 'İstanbul', en: 'Istanbul' },
  İzmir: { tr: 'İzmir', en: 'Izmir' },
  Kahramanmaraş: { tr: 'Kahramanmaraş', en: 'Kahramanmaraş' },
  Karabük: { tr: 'Karabük', en: 'Karabük' },
  Karaman: { tr: 'Karaman', en: 'Karaman' },
  Kars: { tr: 'Kars', en: 'Kars' },
  Kastamonu: { tr: 'Kastamonu', en: 'Kastamonu' },
  Kayseri: { tr: 'Kayseri', en: 'Kayseri' },
  Kilis: { tr: 'Kilis', en: 'Kilis' },
  Kırıkkale: { tr: 'Kırıkkale', en: 'Kırıkkale' },
  Kırklareli: { tr: 'Kırklareli', en: 'Kırklareli' },
  Kırşehir: { tr: 'Kırşehir', en: 'Kırşehir' },
  Kocaeli: { tr: 'Kocaeli', en: 'Kocaeli' },
  Konya: { tr: 'Konya', en: 'Konya' },
  Kütahya: { tr: 'Kütahya', en: 'Kütahya' },
  Malatya: { tr: 'Malatya', en: 'Malatya' },
  Manisa: { tr: 'Manisa', en: 'Manisa' },
  Mardin: { tr: 'Mardin', en: 'Mardin' },
  Mersin: { tr: 'Mersin', en: 'Mersin' },
  Muğla: { tr: 'Muğla', en: 'Muğla' },
  Muş: { tr: 'Muş', en: 'Muş' },
  Nevşehir: { tr: 'Nevşehir', en: 'Nevşehir' },
  Niğde: { tr: 'Niğde', en: 'Niğde' },
  Ordu: { tr: 'Ordu', en: 'Ordu' },
  Osmaniye: { tr: 'Osmaniye', en: 'Osmaniye' },
  Rize: { tr: 'Rize', en: 'Rize' },
  Sakarya: { tr: 'Sakarya', en: 'Sakarya' },
  Samsun: { tr: 'Samsun', en: 'Samsun' },
  Şanlıurfa: { tr: 'Şanlıurfa', en: 'Şanlıurfa' },
  Siirt: { tr: 'Siirt', en: 'Siirt' },
  Sinop: { tr: 'Sinop', en: 'Sinop' },
  Şırnak: { tr: 'Şırnak', en: 'Şırnak' },
  Sivas: { tr: 'Sivas', en: 'Sivas' },
  Tekirdağ: { tr: 'Tekirdağ', en: 'Tekirdağ' },
  Tokat: { tr: 'Tokat', en: 'Tokat' },
  Trabzon: { tr: 'Trabzon', en: 'Trabzon' },
  Tunceli: { tr: 'Tunceli', en: 'Tunceli' },
  Uşak: { tr: 'Uşak', en: 'Uşak' },
  Van: { tr: 'Van', en: 'Van' },
  Yalova: { tr: 'Yalova', en: 'Yalova' },
  Yozgat: { tr: 'Yozgat', en: 'Yozgat' },
  Zonguldak: { tr: 'Zonguldak', en: 'Zonguldak' }
};

/**
 * Turkish uppercase converter that strictly adheres to Turkish locale rules:
 * 'i' -> 'İ'
 * 'ı' -> 'I'
 * 'ç' -> 'Ç'
 * 'ğ' -> 'Ğ'
 * 'ö' -> 'Ö'
 * 'ş' -> 'Ş'
 * 'ü' -> 'Ü'
 */
export function toTurkishUpper(str: string): string {
  if (!str) return '';
  return str.toLocaleUpperCase('tr-TR');
}

/**
 * English uppercase converter:
 * Ensures standard English ASCII capitalization:
 * 'Istanbul' -> 'ISTANBUL' (never with dotted İ)
 * 'Izmir' -> 'IZMIR'
 */
export function toEnglishUpper(str: string): string {
  if (!str) return '';
  // Map common Turkish letters to English ASCII for strict EN mode
  const enAscii = str
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C');
  return enAscii.toUpperCase();
}

/**
 * Gets the correctly formatted, uppercase province label based on the active language.
 * Guarantees proper Turkish 'İ' vs English 'I'.
 */
export function getFormattedProvinceLabel(rawName: string, lang: 'tr' | 'en'): string {
  if (!rawName) return '';
  
  // Find canonical match in dictionary
  const canonicalKey = Object.keys(PROVINCE_LOCALIZED_NAMES).find(
    k => k.toLocaleLowerCase('tr-TR') === rawName.toLocaleLowerCase('tr-TR')
  );

  if (canonicalKey) {
    const entry = PROVINCE_LOCALIZED_NAMES[canonicalKey];
    if (lang === 'tr') {
      return toTurkishUpper(entry.tr);
    } else {
      return toEnglishUpper(entry.en);
    }
  }

  // Fallback
  return lang === 'tr' ? toTurkishUpper(rawName) : toEnglishUpper(rawName);
}
