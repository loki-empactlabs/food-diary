/**
 * Food Diary Color Palette
 * Dark-only theme matching Pencil design system
 */

const palette = {
  // Dark backgrounds (warm dark)
  bgPrimary: '#161514',
  bgSurface: '#1C1B1A',
  bgCard: '#211F1E',
  bgCardElevated: '#2A2928',

  // Accent
  accent: '#FF6B6B',
  accentMedium: '#FF6B6B40',
  accentSoft: '#FF6B6B20',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#999999',
  textMuted: '#555555',
  textOnAccent: '#FFFFFF',

  // Borders
  borderSubtle: '#2E2D2B',
  borderCard: '#3A3836',

  // Rating & stars
  starFilled: '#FFB800',
  starEmpty: '#333333',
  ratingRed: '#FF4444',
  ratingOrange: '#FF8844',
  ratingYellow: '#FFBB33',
  ratingLime: '#88CC44',
  ratingGreen: '#44DD66',

  // Semantic
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF6B6B',
  info: '#007AFF',
} as const;

export const colors = {
  light: {
    primary: palette.accent,
    primaryLight: palette.accentSoft,
    primaryMedium: palette.accentMedium,
    primaryDark: palette.bgPrimary,

    background: palette.bgPrimary,
    backgroundSecondary: palette.bgSurface,
    surface: palette.bgCard,
    surfaceSecondary: palette.bgCardElevated,

    text: palette.textPrimary,
    textSecondary: palette.textSecondary,
    textTertiary: palette.textMuted,
    textOnPrimary: palette.textOnAccent,

    border: palette.borderCard,
    borderLight: palette.borderSubtle,

    icon: palette.textSecondary,
    iconActive: palette.accent,

    starFilled: palette.starFilled,
    starEmpty: palette.starEmpty,

    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,

    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: 'rgba(0, 0, 0, 0.3)',

    // Card-specific
    cardGlass: '#1A1A1A99',
    cardGlassBorder: '#FFFFFF12',
  },
  dark: {
    primary: palette.accent,
    primaryLight: palette.accentSoft,
    primaryMedium: palette.accentMedium,
    primaryDark: palette.bgPrimary,

    background: palette.bgPrimary,
    backgroundSecondary: palette.bgSurface,
    surface: palette.bgCard,
    surfaceSecondary: palette.bgCardElevated,

    text: palette.textPrimary,
    textSecondary: palette.textSecondary,
    textTertiary: palette.textMuted,
    textOnPrimary: palette.textOnAccent,

    border: palette.borderCard,
    borderLight: palette.borderSubtle,

    icon: palette.textSecondary,
    iconActive: palette.accent,

    starFilled: palette.starFilled,
    starEmpty: palette.starEmpty,

    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,

    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: 'rgba(0, 0, 0, 0.3)',

    cardGlass: '#1A1A1A99',
    cardGlassBorder: '#FFFFFF12',
  },
} as const;

export type ThemeColors = (typeof colors)['dark'];
export type ThemeColorKeys = keyof (typeof colors)['dark'];
export { palette };
