/**
 * Phase 1 §5.2 — Curated Vietnamese dishes (target: exactly 20).
 *
 * Distribution (enforced by validate-seed.ts in §5.2.4):
 *   breakfast: 6, lunch: 7, dinner: 7
 *
 * Rules:
 *   - Frozen UUIDs
 *   - meal_tag REQUIRED
 *   - is_favorite is always false (Q5 decision)
 *   - servings always 1 for seed templates
 *   - ingredients[].ingredient_id must resolve in vi-ingredients.ts OR vi-composites.ts
 *
 * STATE: §5.2.1 scaffolding — single demo dish. Full 20 món curated in §5.2.4.
 */
import type { DishSeed } from '../types';

export const VI_DISHES: ReadonlyArray<DishSeed> = [
  {
    id: '7c4e8b1a-0003-4000-8000-000000000001',
    name_vi: 'Phở bò',
    meal_tag: 'breakfast',
    servings: 1,
    is_favorite: false,
    ingredients: [
      {
        ingredient_id: '7c4e8b1a-0001-4000-8000-000000000003', // Bánh phở tươi
        quantity: 200,
        unit_id: 'g',
      },
      {
        ingredient_id: '7c4e8b1a-0001-4000-8000-000000000001', // Ức gà (placeholder, real recipe uses bò)
        quantity: 80,
        unit_id: 'g',
      },
      {
        ingredient_id: '7c4e8b1a-0002-4000-8000-000000000001', // Nước dùng phở bò
        quantity: 400,
        unit_id: 'ml',
      },
    ],
    source: 'curated',
    notes: 'Placeholder — real recipe + correct meat curated in §5.2.4.',
  },
];
