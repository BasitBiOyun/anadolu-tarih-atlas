import React, { createContext, useContext } from 'react';

export type AtlasTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: AtlasTheme;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light'
});

/**
 * Light mode is the atlas' only visual theme.
 * The provider remains as a compatibility wrapper for components that consume
 * period/map styling helpers, but it no longer exposes a theme switch.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeContext.Provider value={{ theme: 'light' }}>
    {children}
  </ThemeContext.Provider>
);

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
