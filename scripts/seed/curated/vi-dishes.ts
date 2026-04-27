/**
 * Phase 1 §5.2 — Curated Vietnamese dishes (target: exactly 20).
 *
 * Distribution (enforced by build-dishes.ts AC10):
 *   breakfast: 6, lunch: 7, dinner: 7
 *
 * Rules:
 *   - Frozen UUIDs
 *   - meal_tag REQUIRED
 *   - is_favorite is always false (Q5 decision)
 *   - servings always 1 for seed templates
 *   - ingredients[].ingredient_id must resolve in vi-ingredients.ts OR vi-composites.ts
 *
 * STATE: §5.2.4 — full 20-dish curated set.
 */
import type { DishSeed } from '../types';

// ── Atomic id aliases ─────────────────────────────────────────────────────
const ID_NUOC_MAM     = '7c4e8b1a-0002-4000-8000-000000000001';
const ID_DAU_AN       = '7c4e8b1a-0002-4000-8000-000000000004';
const ID_HANH_TIM     = '7c4e8b1a-0002-4000-8000-000000000005';
const ID_HANH_LA      = '7c4e8b1a-0002-4000-8000-000000000006';
const ID_DUONG        = '7c4e8b1a-0002-4000-8000-000000000003';
const ID_UC_GA        = '7c4e8b1a-0002-4000-8000-000000000101';
const ID_BANH_PHO     = '7c4e8b1a-0002-4000-8000-000000000102';
const ID_THIT_BO_NAC  = '7c4e8b1a-0002-4000-8000-000000000103';
const ID_THIT_HEO     = '7c4e8b1a-0002-4000-8000-000000000104';
const ID_SUON_HEO     = '7c4e8b1a-0002-4000-8000-000000000105';
const ID_TOM          = '7c4e8b1a-0002-4000-8000-000000000106';
const ID_MUC          = '7c4e8b1a-0002-4000-8000-000000000107';
const ID_CA_LOC       = '7c4e8b1a-0002-4000-8000-000000000108';
const ID_CA_BASA      = '7c4e8b1a-0002-4000-8000-000000000109';
const ID_TRUNG_GA     = '7c4e8b1a-0002-4000-8000-00000000010a';
const ID_CHA_LUA      = '7c4e8b1a-0002-4000-8000-00000000010b';
const ID_CUA_DONG     = '7c4e8b1a-0002-4000-8000-00000000010c';
const ID_COM_TRANG    = '7c4e8b1a-0002-4000-8000-00000000010d';
const ID_BUN_TUOI     = '7c4e8b1a-0002-4000-8000-00000000010e';
const ID_MI_TRUNG     = '7c4e8b1a-0002-4000-8000-00000000010f';
const ID_MI_QUANG     = '7c4e8b1a-0002-4000-8000-000000000110';
const ID_BANH_MI      = '7c4e8b1a-0002-4000-8000-000000000111';
const ID_XOI          = '7c4e8b1a-0002-4000-8000-000000000112';
const ID_BANH_TRANG   = '7c4e8b1a-0002-4000-8000-000000000113';
const ID_BOT_GAO      = '7c4e8b1a-0002-4000-8000-000000000114';
const ID_CA_CHUA      = '7c4e8b1a-0002-4000-8000-000000000115';
const ID_DUA_CHUA     = '7c4e8b1a-0002-4000-8000-000000000116';
const ID_RAU_SONG     = '7c4e8b1a-0002-4000-8000-000000000117';
const ID_NAM_ROM      = '7c4e8b1a-0002-4000-8000-000000000118';
const ID_GIA_DO       = '7c4e8b1a-0002-4000-8000-00000000011a';

// ── Composite id aliases ──────────────────────────────────────────────────
const ID_CMP_NUOC_CHAM     = 'c0114c01-0001-4000-8000-000000000001';
const ID_CMP_PHO           = 'c0114c01-0001-4000-8000-000000000002';
const ID_CMP_BUN_BO_HUE    = 'c0114c01-0001-4000-8000-000000000003';
const ID_CMP_MI_QUANG      = 'c0114c01-0001-4000-8000-000000000004';
const ID_CMP_CANH_CHUA     = 'c0114c01-0001-4000-8000-000000000005';
const ID_CMP_LAU_THAI      = 'c0114c01-0001-4000-8000-000000000006';
const ID_CMP_RIEU_CUA      = 'c0114c01-0001-4000-8000-000000000007';

export const VI_DISHES: ReadonlyArray<DishSeed> = [
  // ─── BREAKFAST (6) ──────────────────────────────────────────────────────
  {
    id: '7c4e8b1a-0003-4000-8000-000000000001',
    name_vi: 'Phở bò',
    meal_tag: 'breakfast',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_BANH_PHO,    quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_THIT_BO_NAC, quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_CMP_PHO,     quantity: 400, unit_id: 'ml' },
      { ingredient_id: ID_HANH_LA,     quantity: 15,  unit_id: 'g'  },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000002',
    name_vi: 'Bánh mì trứng ốp la',
    meal_tag: 'breakfast',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_BANH_MI,  quantity: 100, unit_id: 'g'  },
      { ingredient_id: ID_TRUNG_GA, quantity: 100, unit_id: 'g'  },
      { ingredient_id: ID_DAU_AN,   quantity: 5,   unit_id: 'ml' },
      { ingredient_id: ID_RAU_SONG, quantity: 20,  unit_id: 'g'  },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000003',
    name_vi: 'Bún bò Huế',
    meal_tag: 'breakfast',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_BUN_TUOI,       quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_THIT_BO_NAC,    quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_CMP_BUN_BO_HUE, quantity: 400, unit_id: 'ml' },
      { ingredient_id: ID_RAU_SONG,       quantity: 30,  unit_id: 'g'  },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000004',
    name_vi: 'Xôi mặn',
    meal_tag: 'breakfast',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_XOI,       quantity: 200, unit_id: 'g' },
      { ingredient_id: ID_CHA_LUA,   quantity: 50,  unit_id: 'g' },
      { ingredient_id: ID_HANH_TIM,  quantity: 30,  unit_id: 'g' },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000005',
    name_vi: 'Cháo gà',
    meal_tag: 'breakfast',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_COM_TRANG, quantity: 150, unit_id: 'g'  },
      { ingredient_id: ID_UC_GA,     quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_HANH_LA,   quantity: 30,  unit_id: 'g'  },
      { ingredient_id: ID_NUOC_MAM,  quantity: 30,  unit_id: 'ml' },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000006',
    name_vi: 'Bánh cuốn nhân thịt',
    meal_tag: 'breakfast',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_BOT_GAO,        quantity: 100, unit_id: 'g'  },
      { ingredient_id: ID_THIT_HEO,       quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_NAM_ROM,        quantity: 30,  unit_id: 'g'  },
      { ingredient_id: ID_HANH_TIM,       quantity: 20,  unit_id: 'g'  },
      { ingredient_id: ID_CHA_LUA,        quantity: 30,  unit_id: 'g'  },
      { ingredient_id: ID_CMP_NUOC_CHAM,  quantity: 30,  unit_id: 'ml' },
    ],
    source: 'curated',
  },

  // ─── LUNCH (7) ──────────────────────────────────────────────────────────
  {
    id: '7c4e8b1a-0003-4000-8000-000000000007',
    name_vi: 'Cơm tấm sườn nướng',
    meal_tag: 'lunch',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_COM_TRANG,     quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_SUON_HEO,      quantity: 150, unit_id: 'g'  },
      { ingredient_id: ID_DUA_CHUA,      quantity: 30,  unit_id: 'g'  },
      { ingredient_id: ID_CMP_NUOC_CHAM, quantity: 30,  unit_id: 'ml' },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000008',
    name_vi: 'Bún chả',
    meal_tag: 'lunch',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_BUN_TUOI,      quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_THIT_HEO,      quantity: 100, unit_id: 'g'  },
      { ingredient_id: ID_RAU_SONG,      quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_CMP_NUOC_CHAM, quantity: 50,  unit_id: 'ml' },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000009',
    name_vi: 'Bún thịt nướng',
    meal_tag: 'lunch',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_BUN_TUOI,      quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_THIT_HEO,      quantity: 120, unit_id: 'g'  },
      { ingredient_id: ID_RAU_SONG,      quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_GIA_DO,        quantity: 30,  unit_id: 'g'  },
      { ingredient_id: ID_CMP_NUOC_CHAM, quantity: 30,  unit_id: 'ml' },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-00000000000a',
    name_vi: 'Mì Quảng',
    meal_tag: 'lunch',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_MI_QUANG,     quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_TOM,          quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_THIT_HEO,     quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_CMP_MI_QUANG, quantity: 200, unit_id: 'ml' },
      { ingredient_id: ID_RAU_SONG,     quantity: 30,  unit_id: 'g'  },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-00000000000b',
    name_vi: 'Cơm gà xối mỡ',
    meal_tag: 'lunch',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_COM_TRANG, quantity: 250, unit_id: 'g'  },
      { ingredient_id: ID_UC_GA,     quantity: 150, unit_id: 'g'  },
      { ingredient_id: ID_DAU_AN,    quantity: 10,  unit_id: 'ml' },
      { ingredient_id: ID_DUA_CHUA,  quantity: 30,  unit_id: 'g'  },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-00000000000c',
    name_vi: 'Bánh xèo',
    meal_tag: 'lunch',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_BOT_GAO,       quantity: 120, unit_id: 'g'  },
      { ingredient_id: ID_TOM,           quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_THIT_HEO,      quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_GIA_DO,        quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_RAU_SONG,      quantity: 30,  unit_id: 'g'  },
      { ingredient_id: ID_CMP_NUOC_CHAM, quantity: 30,  unit_id: 'ml' },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-00000000000d',
    name_vi: 'Gỏi cuốn tôm thịt',
    meal_tag: 'lunch',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_BANH_TRANG,    quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_TOM,           quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_THIT_HEO,      quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_BUN_TUOI,      quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_RAU_SONG,      quantity: 30,  unit_id: 'g'  },
      { ingredient_id: ID_CMP_NUOC_CHAM, quantity: 50,  unit_id: 'ml' },
    ],
    source: 'curated',
  },

  // ─── DINNER (7) ─────────────────────────────────────────────────────────
  {
    id: '7c4e8b1a-0003-4000-8000-00000000000e',
    name_vi: 'Cá kho tộ + cơm trắng',
    meal_tag: 'dinner',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_COM_TRANG, quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_CA_BASA,   quantity: 150, unit_id: 'g'  },
      { ingredient_id: ID_NUOC_MAM,  quantity: 15,  unit_id: 'ml' },
      { ingredient_id: ID_DUONG,     quantity: 20,  unit_id: 'g'  },
      { ingredient_id: ID_HANH_TIM,  quantity: 15,  unit_id: 'g'  },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-00000000000f',
    name_vi: 'Canh chua cá lóc',
    meal_tag: 'dinner',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_COM_TRANG,     quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_CA_LOC,        quantity: 150, unit_id: 'g'  },
      { ingredient_id: ID_CMP_CANH_CHUA, quantity: 400, unit_id: 'ml' },
      { ingredient_id: ID_RAU_SONG,      quantity: 30,  unit_id: 'g'  },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000010',
    name_vi: 'Thịt kho tàu + cơm',
    meal_tag: 'dinner',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_COM_TRANG, quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_THIT_HEO,  quantity: 150, unit_id: 'g'  },
      { ingredient_id: ID_TRUNG_GA,  quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_NUOC_MAM,  quantity: 15,  unit_id: 'ml' },
      { ingredient_id: ID_DUONG,     quantity: 20,  unit_id: 'g'  },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000011',
    name_vi: 'Bò lúc lắc + cơm',
    meal_tag: 'dinner',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_COM_TRANG,    quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_THIT_BO_NAC,  quantity: 150, unit_id: 'g'  },
      { ingredient_id: ID_CA_CHUA,      quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_HANH_TIM,     quantity: 20,  unit_id: 'g'  },
      { ingredient_id: ID_DAU_AN,       quantity: 10,  unit_id: 'ml' },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000012',
    name_vi: 'Lẩu Thái hải sản',
    meal_tag: 'dinner',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_TOM,          quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_MUC,          quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_BUN_TUOI,     quantity: 100, unit_id: 'g'  },
      { ingredient_id: ID_CMP_LAU_THAI, quantity: 400, unit_id: 'ml' },
      { ingredient_id: ID_NAM_ROM,      quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_RAU_SONG,     quantity: 50,  unit_id: 'g'  },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000013',
    name_vi: 'Bún riêu cua',
    meal_tag: 'dinner',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_BUN_TUOI,      quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_CUA_DONG,      quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_CHA_LUA,       quantity: 30,  unit_id: 'g'  },
      { ingredient_id: ID_CMP_RIEU_CUA,  quantity: 400, unit_id: 'ml' },
      { ingredient_id: ID_RAU_SONG,      quantity: 30,  unit_id: 'g'  },
    ],
    source: 'curated',
  },
  {
    id: '7c4e8b1a-0003-4000-8000-000000000014',
    name_vi: 'Mì xào hải sản',
    meal_tag: 'dinner',
    servings: 1,
    is_favorite: false,
    ingredients: [
      { ingredient_id: ID_MI_TRUNG, quantity: 200, unit_id: 'g'  },
      { ingredient_id: ID_TOM,      quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_MUC,      quantity: 80,  unit_id: 'g'  },
      { ingredient_id: ID_RAU_SONG, quantity: 50,  unit_id: 'g'  },
      { ingredient_id: ID_DAU_AN,   quantity: 15,  unit_id: 'ml' },
      { ingredient_id: ID_HANH_LA,  quantity: 30,  unit_id: 'g'  },
    ],
    source: 'curated',
  },
];
