/**
 * Phase 1 §5.2 — Composite Vietnamese ingredients (curated recipes).
 *
 * Build-time, build-composites.ts sums each recipe's components × quantity
 * (converted via the canonical units table) and emits a derived per-100 macro
 * into composites.json (shape: IngredientSeed with category 'composite').
 *
 * Rules (V1):
 *   - components MUST reference atomic ingredients only (no nested composites)
 *   - Frozen UUIDs
 *   - source_citation = link to the recipe write-up in ./sources/
 *
 * STATE: §5.2.3 — initial set covering the dipping-sauce / broth families used
 * by the §5.2.4 dish curation. More may be added when authoring 20 dishes.
 */
import type { CompositeRecipe } from '../types';

// ── Atomic ingredient id aliases (kept in sync with vi-ingredients.ts) ──
const ID_NUOC_MAM   = '7c4e8b1a-0002-4000-8000-000000000001';
const ID_DUONG      = '7c4e8b1a-0002-4000-8000-000000000003';
const ID_TOI        = '7c4e8b1a-0002-4000-8000-000000000007';
const ID_OT         = '7c4e8b1a-0002-4000-8000-00000000000a';

export const VI_COMPOSITES: ReadonlyArray<CompositeRecipe> = [
  // ── Nước chấm chua ngọt (sweet-sour fish-sauce dipping base) ─────────
  // Family: bún chả, bánh xèo, gỏi cuốn, chả giò.
  {
    id: 'c0114c01-0001-4000-8000-000000000001',
    name_vi: 'Nước chấm chua ngọt (base)',
    category: 'composite',
    final_basis_unit: 'ml',
    final_basis_quantity: 100,
    // Conventional ratio: 4 tbsp nước mắm + 4 tbsp đường + 1 tbsp tỏi băm + 1 tbsp ớt
    // diluted with water to ~250 ml total. We capture only the seasoning yield here;
    // water dilution does not contribute macros.
    yield_total_quantity: 250,
    yield_total_unit: 'ml',
    density_g_per_ml: 1.05,
    default_unit_id: 'tbsp',
    components: [
      // 4 tbsp nước mắm  → 4 × 15 ml
      { ingredient_id: ID_NUOC_MAM, quantity: 60,   unit_id: 'ml' },
      // 4 tbsp granulated sugar ≈ 50 g
      { ingredient_id: ID_DUONG,    quantity: 50,   unit_id: 'g'  },
      // 1 tbsp minced garlic ≈ 9 g
      { ingredient_id: ID_TOI,      quantity: 9,    unit_id: 'g'  },
      // 1 tbsp minced chili ≈ 8 g
      { ingredient_id: ID_OT,       quantity: 8,    unit_id: 'g'  },
    ],
    source_citation: 'sources/wikipedia-vi.md#nuoc-cham-chua-ngot',
    notes: 'Standard Northern/Central ratio; macros approximated.',
  },
];
