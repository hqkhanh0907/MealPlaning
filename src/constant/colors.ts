/** Design token hex values — monochrome grayscale palette */
export const COLORS = {
  gray950: '#0a0a0a',
  gray800: '#262626',
  gray700: '#404040',
  gray600: '#525252',
  gray500: '#737373',
  gray400: '#a3a3a3',
  gray300: '#d4d4d4',
  gray200: '#e5e5e5',
  gray50: '#fafafa',
  red600: '#dc2626',
} as const;

export const MACRO_COLORS = {
  protein: { light: COLORS.gray950, dark: COLORS.gray50 },
  fat: { light: COLORS.gray600, dark: COLORS.gray400 },
  carbs: { light: COLORS.gray500, dark: COLORS.gray300 },
} as const;
