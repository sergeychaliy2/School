import { useColorScheme } from 'react-native';

import { useApp } from '@/store/app';
import { accents, palettes, type AccentName, type Palette } from './tokens';

export * from './tokens';

export type Theme = {
  palette: Palette;
  isDark: boolean;
  /** Resolves a subject accent family against the active palette. */
  accentFor: (name: AccentName) => string;
};

export function useTheme(): Theme {
  const { themePref } = useApp();
  const system = useColorScheme();

  const isDark = themePref === 'system' ? system !== 'light' : themePref === 'dark';
  const palette = isDark ? palettes.dark : palettes.light;

  return {
    palette,
    isDark,
    accentFor: (name: AccentName) => accents[name][isDark ? 'dark' : 'light'],
  };
}
