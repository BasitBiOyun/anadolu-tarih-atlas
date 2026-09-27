import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../types/settlement';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (tr: string, en: string) => string;
}

const STORAGE_KEY = 'anadolu_atlas_lang';

const LanguageContext = createContext<LanguageContextType>({
  lang: 'tr',
  setLang: () => {},
  t: (tr) => tr
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'tr' || stored === 'en') {
        return stored;
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    return 'tr';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
    try {
      localStorage.setItem(STORAGE_KEY, nextLang);
    } catch {
      // Ignore storage errors
    }
  };

  const t = (tr: string, en: string) => {
    return lang === 'en' ? en : tr;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  return useContext(LanguageContext);
}
