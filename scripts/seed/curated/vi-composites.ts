/**
 * Phase 1 §5.2 — Composite Vietnamese ingredients (curated recipes).
 *
 * Build-time, build-composites.ts sums each recipe's components × quantity
 * (converted via ingredient_unit) and emits a derived per-100 macro into
 * composites.json (shape: IngredientSeed with category 'composite').
 *
 * Rules (V1):
 *   - components MUST reference atomic ingredients only (no nested composites)
 *   - Frozen UUIDs
 *   - source_citation = link to the recipe write-up in ./sources/
 *
 * STATE: §5.2.1 scaffolding — single demo recipe (Nước dùng phở bò).
 */
import type { CompositeRecipe } from '../types';

export const VI_COMPOSITES: ReadonlyArray<CompositeRecipe> = [
  {
    id: '7c4e8b1a-0002-4000-8000-000000000001',
    name_vi: 'Nước dùng phở bò',
    category: 'composite',
    final_basis_unit: 'ml',
    final_basis_quantity: 100,
    yield_total_quantity: 3000,
    yield_total_unit: 'ml',
    density_g_per_ml: 1.0,
    default_unit_id: 'ml',
    components: [
      // §5.2.1 placeholder — real components added in §5.2.3.
      // Demo only references existing atomic ingredients above so build-composites
      // smoke test in §5.2.3 has something resolvable.
      {
        ingredient_id: '7c4e8b1a-0001-4000-8000-000000000002', // Nước mắm
        quantity: 30,
        unit_id: 'ml',
      },
    ],
    source_citation: 'sources/wikipedia-vi.md#nuoc-dung-pho',
    notes: 'Placeholder recipe — final composition curated in §5.2.3.',
  },
];
