/**
 * Vietnamese-aware fuzzy matching utilities for F-02 AI auto-fill (Q5-C).
 *
 * Pure functions, no Angular DI. Reference: phase-1.5b §2-bis Q5-C.
 *
 * IMPORTANT: This is a SEPARATE utility from `nutrition-ai.normalizeIngredientName`
 * (F-01 ingredient lookup). F-01 keeps Vietnamese diacritics; F-02 strips them
 * for fuzzy matching. Per audit finding A6, do NOT consolidate.
 */

/**
 * Normalize a Vietnamese ingredient/dish name for fuzzy matching.
 *
 * Steps: NFD-decompose → strip combining diacritics → đ/Đ → d/d →
 * lowercase → trim → collapse multi-space.
 */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
