// ─────────────────────────────────────────────
// Armimo / አርምሞ — Design Tokens & Theme Colors
// ─────────────────────────────────────────────

import { ThemeMode } from '../types';

// ── Raw Color Palette ─────────────────────────
export const Palette = {
  // Blues
  blue50:  '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue800: '#1E40AF',
  blue900: '#1E3A5F',

  // Greens (Calm — desaturated)
  green400: '#4ADE80',
  green500: '#22C55E',
  green600: '#4CAF7D', // main accent
  green700: '#15803D',

  // Oranges (Soft)
  orange400: '#FB923C',
  orange500: '#F97316',
  orange600: '#E8884A', // main accent
  orange700: '#C2410C',

  // Grays
  gray50:  '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Neutrals (Dark surfaces)
  neutral900: '#111318',
  neutral950: '#0D1117',
  amoledBlack: '#000000',
  amoledSurface: '#0A0A0A',
  amoledSurface2: '#111111',
  amoledBorder: '#1A1A1A',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error:   '#EF4444',
  info:    '#3B82F6',

  // Whites
  white: '#FFFFFF',
  white90: 'rgba(255,255,255,0.9)',
  white60: 'rgba(255,255,255,0.6)',
  white30: 'rgba(255,255,255,0.3)',
  white10: 'rgba(255,255,255,0.1)',
  white05: 'rgba(255,255,255,0.05)',

  // Blacks
  black: '#000000',
  black80: 'rgba(0,0,0,0.8)',
  black50: 'rgba(0,0,0,0.5)',
  black20: 'rgba(0,0,0,0.2)',
} as const;

// ── Theme Color Tokens ─────────────────────────
export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surface2: string;
  surface3: string;
  overlay: string;

  // Borders
  border: string;
  borderStrong: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textDisabled: string;

  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Accents
  accentGreen: string;
  accentOrange: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Status backgrounds
  successBg: string;
  warningBg: string;
  errorBg: string;
  infoBg: string;

  // Tab bar
  tabBarBg: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Card
  cardBg: string;
  cardBorder: string;

  // Input
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  placeholder: string;

  // Misc
  shimmer: string;
  ripple: string;
}

// ── Light Theme ───────────────────────────────
export const LightColors: ThemeColors = {
  background:    Palette.gray50,
  surface:       Palette.white,
  surface2:      Palette.gray100,
  surface3:      Palette.gray200,
  overlay:       Palette.black50,

  border:        Palette.gray200,
  borderStrong:  Palette.gray300,

  textPrimary:   Palette.gray900,
  textSecondary: Palette.gray600,
  textTertiary:  Palette.gray400,
  textInverse:   Palette.white,
  textDisabled:  Palette.gray300,

  primary:       Palette.blue600,
  primaryLight:  Palette.blue100,
  primaryDark:   Palette.blue800,

  accentGreen:   Palette.green600,
  accentOrange:  Palette.orange600,

  success:       Palette.success,
  warning:       Palette.warning,
  error:         Palette.error,
  info:          Palette.info,

  successBg:     '#F0FDF4',
  warningBg:     '#FFFBEB',
  errorBg:       '#FEF2F2',
  infoBg:        '#EFF6FF',

  tabBarBg:      Palette.white,
  tabBarActive:  Palette.blue600,
  tabBarInactive: Palette.gray400,

  cardBg:        Palette.white,
  cardBorder:    Palette.gray200,

  inputBg:       Palette.gray50,
  inputBorder:   Palette.gray200,
  inputFocusBorder: Palette.blue600,
  placeholder:   Palette.gray400,

  shimmer:       Palette.gray200,
  ripple:        Palette.black20,
};

// ── Dark Theme ────────────────────────────────
export const DarkColors: ThemeColors = {
  background:    Palette.neutral950,
  surface:       Palette.neutral900,
  surface2:      '#1A1F2E',
  surface3:      '#222732',
  overlay:       Palette.black80,

  border:        '#2A2D35',
  borderStrong:  '#3A3D47',

  textPrimary:   Palette.gray50,
  textSecondary: Palette.gray400,
  textTertiary:  Palette.gray600,
  textInverse:   Palette.gray900,
  textDisabled:  Palette.gray700,

  primary:       Palette.blue500,
  primaryLight:  '#1E3A5F',
  primaryDark:   Palette.blue400,

  accentGreen:   '#4CAF7D',
  accentOrange:  '#E8884A',

  success:       '#4ADE80',
  warning:       '#FCD34D',
  error:         '#F87171',
  info:          Palette.blue400,

  successBg:     '#052E16',
  warningBg:     '#1C1400',
  errorBg:       '#1F0707',
  infoBg:        '#0C1A30',

  tabBarBg:      '#111318',
  tabBarActive:  Palette.blue400,
  tabBarInactive: Palette.gray600,

  cardBg:        '#161B22',
  cardBorder:    '#2A2D35',

  inputBg:       '#161B22',
  inputBorder:   '#2A2D35',
  inputFocusBorder: Palette.blue400,
  placeholder:   Palette.gray600,

  shimmer:       '#2A2D35',
  ripple:        Palette.white10,
};

// ── AMOLED Theme ──────────────────────────────
export const AmoledColors: ThemeColors = {
  ...DarkColors,
  background:    Palette.amoledBlack,
  surface:       Palette.amoledSurface,
  surface2:      Palette.amoledSurface2,
  surface3:      '#181818',
  border:        Palette.amoledBorder,
  borderStrong:  '#222222',
  tabBarBg:      Palette.amoledBlack,
  cardBg:        Palette.amoledSurface,
  cardBorder:    Palette.amoledBorder,
  inputBg:       Palette.amoledSurface,
  inputBorder:   Palette.amoledBorder,
};

// ── Theme Color Map ───────────────────────────
export const ThemeColorMap: Record<ThemeMode, ThemeColors> = {
  light:  LightColors,
  dark:   DarkColors,
  amoled: AmoledColors,
};

// ── Spacing ───────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
} as const;

// ── Border Radius ─────────────────────────────
export const Radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  full: 9999,
} as const;

// ── Typography ────────────────────────────────
export const FontFamily = {
  regular:    'Inter_400Regular',
  medium:     'Inter_500Medium',
  semiBold:   'Inter_600SemiBold',
  bold:       'Inter_700Bold',
  // Fallbacks
  system: 'System',
} as const;

export const FontSize = {
  xs:   11,
  sm:   12,
  md:   14,
  base: 15,
  lg:   16,
  xl:   18,
  xxl:  22,
  xxxl: 28,
  display: 32,
} as const;

export const LineHeight = {
  xs:   16,
  sm:   18,
  md:   20,
  base: 22,
  lg:   24,
  xl:   28,
  xxl:  32,
  xxxl: 38,
  display: 44,
} as const;

export const FontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semiBold: '600' as const,
  bold:     '700' as const,
};

// ── Typography Presets ────────────────────────
export const Typography = {
  display: {
    fontSize: FontSize.display,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.display,
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.xxxl,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.semiBold,
    lineHeight: LineHeight.xl,
    letterSpacing: -0.1,
  },
  titleMd: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    lineHeight: LineHeight.lg,
  },
  body: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.base,
  },
  bodyMedium: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.base,
  },
  bodySm: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.md,
  },
  caption: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.sm,
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.xs,
    letterSpacing: 0.5,
  },
} as const;

// ── Shadows ───────────────────────────────────
export const Shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  // Dark-mode-aware (lighter shadows)
  smDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  mdDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ── Z-Index ───────────────────────────────────
export const ZIndex = {
  base:    0,
  card:    10,
  header:  50,
  modal:   100,
  overlay: 200,
  toast:   300,
} as const;

// ── Icon Sizes ────────────────────────────────
export const IconSize = {
  xs:  14,
  sm:  18,
  md:  22,
  lg:  26,
  xl:  32,
  xxl: 48,
} as const;

// ── Touch Targets (accessibility) ─────────────
export const TouchTarget = {
  min: 44, // minimum accessible touch target
  md:  48,
  lg:  56,
} as const;

// ── Animation Durations ───────────────────────
export const Duration = {
  fast:   150,
  normal: 250,
  slow:   400,
  verySlow: 600,
} as const;
