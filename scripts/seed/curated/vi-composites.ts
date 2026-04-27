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
 * STATE: §5.2.4 — full broth/sauce family backing the 20 curated dishes. Each
 * composite is referenced by ≥ 1 dish (AC6 enforced by validate-seed.ts).
 */
import type { CompositeRecipe } from '../types';

// ── Atomic ingredient id aliases (kept in sync with vi-ingredients.ts) ──
const ID_NUOC_MAM      = '7c4e8b1a-0002-4000-8000-000000000001';
const ID_MUOI          = '7c4e8b1a-0002-4000-8000-000000000002';
const ID_DUONG         = '7c4e8b1a-0002-4000-8000-000000000003';
const ID_HANH_TIM      = '7c4e8b1a-0002-4000-8000-000000000005';
const ID_TOI           = '7c4e8b1a-0002-4000-8000-000000000007';
const ID_GUNG          = '7c4e8b1a-0002-4000-8000-000000000008';
const ID_SA            = '7c4e8b1a-0002-4000-8000-000000000009';
const ID_OT            = '7c4e8b1a-0002-4000-8000-00000000000a';
const ID_THIT_BO_NAC   = '7c4e8b1a-0002-4000-8000-000000000103';
const ID_SUON_HEO      = '7c4e8b1a-0002-4000-8000-000000000105';
const ID_TOM           = '7c4e8b1a-0002-4000-8000-000000000106';
const ID_CUA_DONG      = '7c4e8b1a-0002-4000-8000-00000000010c';
const ID_CA_CHUA       = '7c4e8b1a-0002-4000-8000-000000000115';
const ID_DUA           = '7c4e8b1a-0002-4000-8000-000000000119';
const ID_ME_CHUA       = '7c4e8b1a-0002-4000-8000-00000000011b';

export const VI_COMPOSITES: ReadonlyArray<CompositeRecipe> = [
  // ── Nước chấm chua ngọt (sweet-sour fish-sauce dipping base) ─────────
  // Family: bún chả, bánh xèo, gỏi cuốn, cơm tấm.
  {
    id: 'c0114c01-0001-4000-8000-000000000001',
    name_vi: 'Nước chấm chua ngọt (base)',
    category: 'composite',
    final_basis_unit: 'ml',
    final_basis_quantity: 100,
    yield_total_quantity: 250,
    yield_total_unit: 'ml',
    density_g_per_ml: 1.05,
    default_unit_id: 'tbsp',
    components: [
      { ingredient_id: ID_NUOC_MAM, quantity: 60, unit_id: 'ml' },
      { ingredient_id: ID_DUONG,    quantity: 50, unit_id: 'g'  },
      { ingredient_id: ID_TOI,      quantity: 9,  unit_id: 'g'  },
      { ingredient_id: ID_OT,       quantity: 8,  unit_id: 'g'  },
    ],
    source_citation: 'sources/wikipedia-vi.md#nuoc-cham-chua-ngot',
    notes: 'Standard Northern/Central ratio; macros approximated.',
  },

  // ── Nước dùng phở bò ─────────────────────────────────────────────────
  {
    id: 'c0114c01-0001-4000-8000-000000000002',
    name_vi: 'Nước dùng phở bò',
    category: 'composite',
    final_basis_unit: 'ml',
    final_basis_quantity: 100,
    yield_total_quantity: 2000,
    yield_total_unit: 'ml',
    density_g_per_ml: 1.02,
    default_unit_id: 'ml',
    components: [
      { ingredient_id: ID_THIT_BO_NAC, quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_HANH_TIM,    quantity: 60,  unit_id: 'g'  },
      { ingredient_id: ID_GUNG,        quantity: 30,  unit_id: 'g'  },
      { ingredient_id: ID_NUOC_MAM,    quantity: 30,  unit_id: 'ml' },
      { ingredient_id: ID_MUOI,        quantity: 10,  unit_id: 'g'  },
    ],
    source_citation: 'sources/wikipedia-vi.md#nuoc-dung-pho',
    notes: 'Light beef broth — meat trimmings simmered with charred aromatics, then strained.',
  },

  // ── Nước dùng bún bò Huế ─────────────────────────────────────────────
  {
    id: 'c0114c01-0001-4000-8000-000000000003',
    name_vi: 'Nước dùng bún bò Huế',
    category: 'composite',
    final_basis_unit: 'ml',
    final_basis_quantity: 100,
    yield_total_quantity: 2000,
    yield_total_unit: 'ml',
    density_g_per_ml: 1.03,
    default_unit_id: 'ml',
    components: [
      { ingredient_id: ID_THIT_BO_NAC, quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_SA,          quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_HANH_TIM,    quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_NUOC_MAM,    quantity: 45,  unit_id: 'ml' },
      { ingredient_id: ID_OT,          quantity: 15,  unit_id: 'g'  },
    ],
    source_citation: 'sources/wikipedia-vi.md#nuoc-dung-bun-bo-hue',
    notes: 'Spicy lemongrass beef broth — Huế signature.',
  },

  // ── Nước dùng mì Quảng ───────────────────────────────────────────────
  // Mì Quảng uses a small amount of richly reduced broth, not a soup base.
  {
    id: 'c0114c01-0001-4000-8000-000000000004',
    name_vi: 'Nước dùng mì Quảng',
    category: 'composite',
    final_basis_unit: 'ml',
    final_basis_quantity: 100,
    yield_total_quantity: 800,
    yield_total_unit: 'ml',
    density_g_per_ml: 1.05,
    default_unit_id: 'ml',
    components: [
      { ingredient_id: ID_SUON_HEO,    quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_HANH_TIM,    quantity: 40,  unit_id: 'g'  },
      { ingredient_id: ID_TOI,         quantity: 15,  unit_id: 'g'  },
      { ingredient_id: ID_NUOC_MAM,    quantity: 30,  unit_id: 'ml' },
    ],
    source_citation: 'sources/wikipedia-vi.md#nuoc-dung-mi-quang',
    notes: 'Reduced pork-bone gravy — Quảng Nam style; smaller pour than phở.',
  },

  // ── Nước canh chua ───────────────────────────────────────────────────
  {
    id: 'c0114c01-0001-4000-8000-000000000005',
    name_vi: 'Nước canh chua',
    category: 'composite',
    final_basis_unit: 'ml',
    final_basis_quantity: 100,
    yield_total_quantity: 1500,
    yield_total_unit: 'ml',
    density_g_per_ml: 1.02,
    default_unit_id: 'ml',
    components: [
      { ingredient_id: ID_ME_CHUA,  quantity: 60,  unit_id: 'g'  },
      { ingredient_id: ID_DUA,      quantity: 100, unit_id: 'g'  },
      { ingredient_id: ID_CA_CHUA,  quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_NUOC_MAM, quantity: 30,  unit_id: 'ml' },
      { ingredient_id: ID_DUONG,    quantity: 15,  unit_id: 'g'  },
    ],
    source_citation: 'sources/wikipedia-vi.md#nuoc-canh-chua',
    notes: 'Southern-style sour broth — tamarind + pineapple + tomato base.',
  },

  // ── Nước lẩu Thái ────────────────────────────────────────────────────
  {
    id: 'c0114c01-0001-4000-8000-000000000006',
    name_vi: 'Nước lẩu Thái',
    category: 'composite',
    final_basis_unit: 'ml',
    final_basis_quantity: 100,
    yield_total_quantity: 1800,
    yield_total_unit: 'ml',
    density_g_per_ml: 1.03,
    default_unit_id: 'ml',
    components: [
      { ingredient_id: ID_SA,       quantity: 100, unit_id: 'g'  },
      { ingredient_id: ID_GUNG,     quantity: 40,  unit_id: 'g'  },
      { ingredient_id: ID_OT,       quantity: 20,  unit_id: 'g'  },
      { ingredient_id: ID_ME_CHUA,  quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_NUOC_MAM, quantity: 45,  unit_id: 'ml' },
      { ingredient_id: ID_DUONG,    quantity: 25,  unit_id: 'g'  },
    ],
    source_citation: 'sources/wikipedia-vi.md#nuoc-lau-thai',
    notes: 'VN-Thai fusion hotpot base — sour + spicy aromatic.',
  },

  // ── Nước riêu cua ────────────────────────────────────────────────────
  {
    id: 'c0114c01-0001-4000-8000-000000000007',
    name_vi: 'Nước riêu cua',
    category: 'composite',
    final_basis_unit: 'ml',
    final_basis_quantity: 100,
    yield_total_quantity: 1800,
    yield_total_unit: 'ml',
    density_g_per_ml: 1.02,
    default_unit_id: 'ml',
    components: [
      { ingredient_id: ID_CUA_DONG, quantity: 250, unit_id: 'g'  },
      { ingredient_id: ID_CA_CHUA,  quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_HANH_TIM, quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_TOM,      quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_NUOC_MAM, quantity: 30,  unit_id: 'ml' },
    ],
    source_citation: 'sources/wikipedia-vi.md#nuoc-rieu-cua',
    notes: 'Field-crab broth with tomato — bún riêu signature.',
  },
];
