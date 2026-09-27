import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AtlasTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: AtlasTheme;
  setTheme: (theme: AtlasTheme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'atlas-theme';

function getInitialTheme(): AtlasTheme {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => undefined,
  toggleTheme: () => undefined
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AtlasTheme>(getInitialTheme);

  const setTheme = (nextTheme: AtlasTheme) => {
    setThemeState(nextTheme);
  };

  const toggleTheme = () => {
    setThemeState(current => (current === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Theme persistence is optional; the UI still works when storage is blocked.
    }

    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = theme === 'dark' ? '#11100E' : '#FAF7F2';
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
