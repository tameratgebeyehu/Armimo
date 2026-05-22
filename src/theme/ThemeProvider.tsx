// ─────────────────────────────────────────────
// Armimo / አርምሞ — Theme Context & Provider
// ─────────────────────────────────────────────

import React, { createContext, useContext, ReactNode } from 'react';
import { ThemeColors, ThemeColorMap, Spacing, Radius, Shadows, Typography, FontFamily } from './tokens';
import { ThemeMode } from '../types';
import { useSettingsStore } from '../store/settingsStore';

// ── Theme Shape ───────────────────────────────
export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof Spacing;
  radius: typeof Radius;
  shadows: typeof Shadows;
  typography: typeof Typography;
  fonts: typeof FontFamily;
  isDark: boolean;
  isAmoled: boolean;
  /** Imperatively switch theme mode (syncs to settings store) */
  setTheme: (mode: ThemeMode) => void;
}

// ── Context ───────────────────────────────────
const ThemeContext = createContext<Theme | null>(null);

// ── Provider ──────────────────────────────────
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeMode = useSettingsStore((s) => s.settings.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  const theme: Theme = {
    mode: themeMode,
    colors: ThemeColorMap[themeMode],
    spacing: Spacing,
    radius: Radius,
    shadows: Shadows,
    typography: Typography,
    fonts: FontFamily,
    isDark: themeMode === 'dark' || themeMode === 'amoled',
    isAmoled: themeMode === 'amoled',
    setTheme: setThemeMode,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────
export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
