/** Design token hex values — keep in sync with CSS custom properties in index.css */
export const COLORS = {
  emerald400: '#34d399',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber600: '#d97706',
  blue400: '#60a5fa',
  blue500: '#3b82f6',
  red500: '#ef4444',
} as const;

export const MACRO_COLORS = {
  protein: { light: COLORS.emerald500, dark: COLORS.emerald400 },
  fat: { light: COLORS.amber500, dark: COLORS.amber400 },
  carbs: { light: COLORS.blue500, dark: COLORS.blue400 },
} as const;
