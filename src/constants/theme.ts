/**
 * Parket! design tokens — spacing, typography, layout, and semantic colours.
 */

import '@/global.css';

import { Platform } from 'react-native';

import { ParkingPalette } from '@/constants/brand';

/* ── Semantic colour schemes ─────────────────────── */

export const Colors = {
  light: {
    text: ParkingPalette.ink,
    background: '#F5F8FB',
    backgroundElement: '#E8F0F7',
    backgroundSelected: '#CEDFEF',
    textSecondary: '#5F7288',
  },
  dark: {
    text: '#F0F4F8',
    background: '#0C1420',
    backgroundElement: '#162232',
    backgroundSelected: '#1F3650',
    textSecondary: '#93A8BD',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/* ── Typography ──────────────────────────────────── */

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/* ── Spacing scale ───────────────────────────────── */

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/* ── Radius scale ────────────────────────────────── */

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

/* ── Layout ──────────────────────────────────────── */

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
