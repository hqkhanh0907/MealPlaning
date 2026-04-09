/**
 * Macro nutrition chart colors — CSS custom property references.
 * These resolve automatically via :root (light) and .dark (dark) in index.css.
 * Used as inline SVG stroke/fill values where Tailwind classes can't reach.
 */
export const MACRO_COLORS = {
  protein: 'var(--macro-protein)',
  fat: 'var(--macro-fat)',
  carbs: 'var(--macro-carbs)',
} as const;
