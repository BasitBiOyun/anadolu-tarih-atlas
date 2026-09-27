import type { CSSProperties } from 'react';
import type { PeriodConfig } from '../data/periods';
import type { AtlasTheme } from '../context/ThemeContext';

function normalizeHex(hex: string): string {
  const raw = String(hex || '').trim().replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return '#' + raw.toUpperCase();
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return '#' + raw.split('').map(char => char + char).join('').toUpperCase();
  }
  return '#8A4526';
}

export function mixHexColors(
  foreground: string,
  background: string,
  foregroundWeight: number
): string {
  const fg = normalizeHex(foreground).slice(1);
  const bg = normalizeHex(background).slice(1);
  const weight = Math.min(1, Math.max(0, foregroundWeight));

  const channel = (index: number) => {
    const foregroundValue = parseInt(fg.slice(index, index + 2), 16);
    const backgroundValue = parseInt(bg.slice(index, index + 2), 16);
    return Math.round(
      foregroundValue * weight + backgroundValue * (1 - weight)
    );
  };

  return (
    '#' +
    [0, 2, 4]
      .map(index => channel(index).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function getThemeAccentColor(color: string, theme: AtlasTheme): string {
  if (theme === 'light') return normalizeHex(color);
  return mixHexColors(color, '#FFF7EC', 0.62);
}

export function getPeriodChipStyle(
  config: PeriodConfig,
  theme: AtlasTheme
): CSSProperties {
  if (theme === 'light') {
    return {
      backgroundColor: config.bgLight,
      borderColor: config.borderColor,
      color: config.color
    };
  }

  return {
    backgroundColor: mixHexColors(config.color, '#171411', 0.18),
    borderColor: mixHexColors(config.color, '#5B4D40', 0.5),
    color: mixHexColors(config.color, '#FFF7EC', 0.3)
  };
}

export function getPeriodDotColor(
  color: string,
  theme: AtlasTheme
): string {
  return theme === 'light' ? normalizeHex(color) : getThemeAccentColor(color, theme);
}
