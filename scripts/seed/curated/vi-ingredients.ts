/**
 * Phase 1 §5.2 — Atomic Vietnamese ingredients (curated).
 *
 * Editing rules:
 *   - UUIDs are FROZEN. Never regenerate. Add new entries with new uuids.
 *   - Macro values are per 100 g (or 100 ml for liquids), per `nutrition_basis_unit`.
 *   - Every entry MUST have `source_citation` pointing into ./sources/.
 *   - For staples (whitelist below), `category: 'staple'` is allowed even if no dish references them.
 *   - Determinism: keep array sorted by `id` (build script also sorts before serialising).
 *
 * STATE: §5.2.1 scaffolding — only a tiny demo set lives here so the build pipeline
 * can be wired end-to-end. Full curation happens in §5.2.2.
 */
import type { IngredientSeed } from '../types';

export const VI_INGREDIENTS: ReadonlyArray<IngredientSeed> = [
  {
    id: '7c4e8b1a-0001-4000-8000-000000000001',
    name_vi: 'Ức gà',
    name_en: 'Chicken breast, raw',
    category: 'meat',
    nutrition_basis_unit: 'g',
    nutrition_basis_quantity: 100,
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    density_g_per_ml: null,
    default_unit_id: 'g',
    source: 'wikipedia-vi',
    source_citation: 'sources/wikipedia-vi.md#chicken-breast',
    is_approximate: false,
  },
  {
    id: '7c4e8b1a-0001-4000-8000-000000000002',
    name_vi: 'Nước mắm',
    name_en: 'Vietnamese fish sauce',
    category: 'staple',
    nutrition_basis_unit: 'ml',
    nutrition_basis_quantity: 100,
    calories: 35,
    protein: 5.1,
    carbs: 3.6,
    fat: 0,
    fiber: 0,
    density_g_per_ml: 1.2,
    default_unit_id: 'tbsp',
    source: 'manual',
    source_citation: 'sources/wikipedia-vi.md#nuoc-mam',
    is_approximate: true,
    notes: 'Average across 35°N grade. Refine in §5.2.2.',
  },
  {
    id: '7c4e8b1a-0001-4000-8000-000000000003',
    name_vi: 'Phở (bánh phở tươi)',
    name_en: 'Fresh rice noodles for phở',
    category: 'grain',
    nutrition_basis_unit: 'g',
    nutrition_basis_quantity: 100,
    calories: 109,
    protein: 1.8,
    carbs: 25.0,
    fat: 0.2,
    fiber: 0.4,
    density_g_per_ml: null,
    default_unit_id: 'g',
    source: 'wikipedia-vi',
    source_citation: 'sources/wikipedia-vi.md#banh-pho',
    is_approximate: true,
  },
];
