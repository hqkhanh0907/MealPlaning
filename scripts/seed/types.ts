/**
 * Phase 1 §5.2 Vietnamese Core Seed — Shared TypeScript types.
 *
 * Three artifact kinds flow through the build pipeline:
 *   1. IngredientSeed   — atomic ingredient (single food, macros from VN sources)
 *   2. CompositeRecipe  — composite (broth, dipping sauce, base) authored as
 *                         a recipe of components; macros DERIVED at build time
 *   3. DishSeed         — a dish referencing ingredients and/or composites
 *
 * After the build, both atomic and composite ingredients land in the same
 * `ingredient` DB table (composites carry `category: 'composite'`), while
 * dishes land in `dish` + `dish_ingredient`.
 *
 * All UUIDs are FROZEN in the curated `vi-*.ts` files — never regenerated.
 */

export type IngredientCategory =
  | 'meat'
  | 'seafood'
  | 'vegetable'
  | 'fruit'
  | 'grain'
  | 'dairy'
  | 'egg'
  | 'condiment'
  | 'spice'
  | 'staple'
  | 'composite';

export type IngredientSource =
  | 'vien-dinh-duong'
  | 'wikipedia-vi'
  | 'manual'
  | 'derived'; // 'derived' is set automatically by build-composites.ts

export type MealTag = 'breakfast' | 'lunch' | 'dinner';

/**
 * Atomic ingredient as authored in `curated/vi-ingredients.ts`.
 * After build it is serialised to `src/assets/seed/ingredients.json`.
 */
export interface IngredientSeed {
  id: string;
  name_vi: string;
  name_en: string;
  category: IngredientCategory;
  /** Canonical macro basis: per 100 of this unit. Always quantity = 100. */
  nutrition_basis_unit: 'g' | 'ml';
  nutrition_basis_quantity: 100;
  /** Macro values per the basis above. */
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  /** Required if liquid + has volume units; null otherwise. */
  density_g_per_ml: number | null;
  /** FK to `unit` table — MUST be one of the seeded V1 units. */
  default_unit_id: string;
  source: IngredientSource;
  /** Free-text citation pointing into curated/sources/. Required. */
  source_citation: string;
  /** True if any macro or unit factor is an estimate. */
  is_approximate: boolean;
  /** Optional explanatory notes — required when source = 'manual'. */
  notes?: string;
}

/**
 * Composite recipe authored in `curated/vi-composites.ts`.
 * Build-time, this is reduced to an `IngredientSeed` (with category 'composite'
 * and source 'derived') by summing component macros and normalising to the
 * final basis.
 *
 * V1 enforces: components MUST be atomic ingredients (no nested composites).
 */
export interface CompositeRecipe {
  id: string;
  name_vi: string;
  category: 'composite';
  /** What the derived per-100 macro is reported per. */
  final_basis_unit: 'g' | 'ml';
  final_basis_quantity: 100;
  /** Total finished yield of the recipe. Used to normalise macro to per-100. */
  yield_total_quantity: number;
  yield_total_unit: 'g' | 'ml';
  density_g_per_ml: number | null;
  default_unit_id: string;
  components: Array<{
    ingredient_id: string;
    quantity: number;
    unit_id: string;
  }>;
  source_citation: string;
  notes?: string;
}

/**
 * Curated dish authored in `curated/vi-dishes.ts`.
 * Serialised to `src/assets/seed/dishes.json`.
 */
export interface DishSeed {
  id: string;
  name_vi: string;
  meal_tag: MealTag;
  /** Seed templates are always per-1-serving. */
  servings: 1;
  /** Q5 decision: seed dishes never default to favorite. */
  is_favorite: false;
  ingredients: Array<{
    /** FK → ingredients.json OR composites.json (both flow into `ingredient` table). */
    ingredient_id: string;
    quantity: number;
    unit_id: string;
  }>;
  source: 'curated';
  notes?: string;
}

/**
 * Build-time output of build-composites.ts.
 * Mirrors IngredientSeed but adds derivation provenance.
 */
export interface DerivedCompositeIngredient extends IngredientSeed {
  category: 'composite';
  source: 'derived';
  derived_from: {
    composite_recipe_id: string;
    component_ingredient_ids: string[];
    yield_total_g: number;
  };
}
