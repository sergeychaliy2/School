/**
 * Design tokens. Everything visual resolves from here so light/dark stay in
 * lockstep and no component invents its own colour.
 */

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const duration = {
  fast: 160,
  base: 260,
  slow: 420,
} as const;

/** Subject accent families, tuned so each reads clearly on its own surface. */
export const accents = {
  language: { dark: '#FF8A9B', light: '#D6264A' },
  math: { dark: '#7FA8FF', light: '#2A55D6' },
  physics: { dark: '#A99BFF', light: '#5A3FD6' },
  chemistry: { dark: '#5FD4C4', light: '#0E8577' },
  biology: { dark: '#6FD08C', light: '#1E8449' },
  geography: { dark: '#F0B45E', light: '#A96A06' },
  history: { dark: '#F5A26B', light: '#B85C10' },
  foreign: { dark: '#5FC9E8', light: '#0A7695' },
  computing: { dark: '#C58DF0', light: '#7B2FB5' },
  sport: { dark: '#9BD75A', light: '#4F7A12' },
  craft: { dark: '#C9A88A', light: '#8A6240' },
  art: { dark: '#F58FD0', light: '#B32A80' },
  safety: { dark: '#FF9C8A', light: '#C13A22' },
  neutral: { dark: '#9AA3BD', light: '#5A6480' },
} as const;

export type AccentName = keyof typeof accents;

const dark = {
  mode: 'dark',
  bg: '#0B1020',
  bgElevated: '#121A30',
  card: '#161F38',
  cardPressed: '#1C2745',
  surface: '#1C2745',
  border: '#24304F',
  text: '#F2F5FF',
  textDim: '#A6B0CC',
  textFaint: '#6E78A0',
  accent: '#6E8BFF',
  accentSoft: 'rgba(110,139,255,0.18)',
  success: '#48D188',
  warning: '#F0B45E',
  danger: '#FF6B6B',
  scrim: 'rgba(0,0,0,0.55)',
} as const;

const light = {
  mode: 'light',
  bg: '#F4F6FC',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardPressed: '#ECEFF9',
  surface: '#EDF0F9',
  border: '#DDE3F2',
  text: '#101426',
  textDim: '#5A6480',
  textFaint: '#8A93AC',
  accent: '#3A5BEF',
  accentSoft: 'rgba(58,91,239,0.12)',
  success: '#12A05C',
  warning: '#A96A06',
  danger: '#D6264A',
  scrim: 'rgba(16,20,38,0.35)',
} as const;

export type Palette = {
  mode: 'dark' | 'light';
  bg: string;
  bgElevated: string;
  card: string;
  cardPressed: string;
  surface: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  scrim: string;
};

export const palettes: { dark: Palette; light: Palette } = { dark, light };
