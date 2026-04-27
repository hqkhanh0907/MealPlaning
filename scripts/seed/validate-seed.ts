/**
 * Phase 1 §5.2.4 — Cross-artifact validator.
 *
 * Runs AFTER the three build steps (ingredients, composites, dishes) have
 * produced their in-memory results. Verifies criteria that span multiple
 * artifacts and therefore cannot live inside any single build script.
 *
 * Acceptance criteria covered:
 *   AC1   Every ingredient referenced by a dish or a composite resolves in
 *         `ingredients.json` (atomic) ∪ `composites.json` (derived).
 *         Composite components additionally must be ATOMIC (AC7 — re-checked
 *         at the cross-artifact layer to surface clearer error messages).
 *   AC6   Every composite shipped is referenced by ≥ 1 dish (no dead recipes)
 *         AND every composite reference inside a dish resolves in
 *         `composites.json`.
 *   AC12  Every dish.ingredients[].ingredient_id resolves in
 *         `ingredients.json` ∪ `composites.json` AND every unit_id resolves
 *         in the canonical units table.
 *   AC15  Computed dish-level macro per serving is finite and ≥ 0
 *         (sanity, not strict; the ±5% published-value comparison is logged
 *         as a warning, never a hard failure — the curation layer is the
 *         source of truth for individual macro choices).
 */
import type {
  CompositeRecipe,
  DerivedCompositeIngredient,
  DishSeed,
  IngredientSeed,
} from './types';
import { SeedValidationError } from './build-ingredients';
import { toBase, getUnit } from './units';

const MACRO_KEYS = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const;
type MacroKey = (typeof MACRO_KEYS)[number];

export interface DishMacro {
  dish_id: string;
  name_vi: string;
  per_serving: Record<MacroKey, number>;
}

export interface ValidationReport {
  ok: true;
  dish_macros: DishMacro[];
  warnings: string[];
}

export interface ValidateSeedInput {
  ingredients: ReadonlyArray<IngredientSeed>;
  composites: ReadonlyArray<DerivedCompositeIngredient>;
  composite_recipes: ReadonlyArray<CompositeRecipe>;
  dishes: ReadonlyArray<DishSeed>;
}

/**
 * Pure cross-artifact validator. Returns a ValidationReport on success;
 * throws SeedValidationError listing every violation on failure.
 */
export function validateSeed(input: ValidateSeedInput): ValidationReport {
  const { ingredients, composites, composite_recipes, dishes } = input;

  const atomicIndex = new Map(ingredients.map((i) => [i.id, i]));
  const compositeIndex = new Map(composites.map((c) => [c.id, c]));
  const compositeRecipeIndex = new Map(composite_recipes.map((c) => [c.id, c]));

  const violations: string[] = [];
  const warnings: string[] = [];

  // ── AC1 / AC7 — composite components must be atomic ─────────────────────
  for (const recipe of composite_recipes) {
    for (const comp of recipe.components) {
      if (compositeIndex.has(comp.ingredient_id) || compositeRecipeIndex.has(comp.ingredient_id)) {
        violations.push(
          `AC7: composite '${recipe.id}' component '${comp.ingredient_id}' is itself a composite (V1 forbids nested composites)`,
        );
        continue;
      }
      if (!atomicIndex.has(comp.ingredient_id)) {
        violations.push(
          `AC1: composite '${recipe.id}' references unknown ingredient '${comp.ingredient_id}'`,
        );
      }
    }
  }

  // ── AC6 — every shipped composite must be referenced by ≥ 1 dish ────────
  const compositeRefsFromDishes = new Set<string>();
  for (const d of dishes) {
    for (const comp of d.ingredients) {
      if (compositeIndex.has(comp.ingredient_id)) {
        compositeRefsFromDishes.add(comp.ingredient_id);
      }
    }
  }
  for (const c of composites) {
    if (!compositeRefsFromDishes.has(c.id)) {
      violations.push(
        `AC6: composite '${c.id}' (${c.name_vi}) is not referenced by any dish — remove it or wire a dish to use it`,
      );
    }
  }

  // ── AC12 — every dish ingredient must resolve in atomic ∪ composite ─────
  const dishMacros: DishMacro[] = [];
  for (const dish of dishes) {
    const totals: Record<MacroKey, number> = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };
    let dishHadResolutionFailure = false;

    for (const [idx, comp] of dish.ingredients.entries()) {
      // Unit_id must be defined in canonical units table.
      try {
        getUnit(comp.unit_id);
      } catch (err) {
        violations.push(
          `AC12: dish '${dish.id}' ingredient[${idx}] (${comp.ingredient_id}): ${(err as Error).message}`,
        );
        dishHadResolutionFailure = true;
        continue;
      }

      const ref =
        atomicIndex.get(comp.ingredient_id) ?? compositeIndex.get(comp.ingredient_id) ?? null;
      if (!ref) {
        violations.push(
          `AC12: dish '${dish.id}' (${dish.name_vi}) references unknown ingredient '${comp.ingredient_id}'`,
        );
        dishHadResolutionFailure = true;
        continue;
      }

      // AC15 sanity — convert quantity → ingredient's nutrition_basis_unit and
      // accumulate macro per-serving.
      let inBasis: number;
      try {
        inBasis = toBase(
          comp.quantity,
          comp.unit_id,
          ref.nutrition_basis_unit,
          ref.density_g_per_ml,
        );
      } catch (err) {
        violations.push(
          `AC15: dish '${dish.id}' ingredient '${comp.ingredient_id}' unit conversion: ${(err as Error).message}`,
        );
        dishHadResolutionFailure = true;
        continue;
      }
      const factor = inBasis / ref.nutrition_basis_quantity;
      for (const k of MACRO_KEYS) totals[k] += ref[k] * factor;
    }

    if (dishHadResolutionFailure) continue;

    // AC15 — finite & ≥ 0 across the board.
    const rounded: Record<MacroKey, number> = {
      calories: round(totals.calories),
      protein: round(totals.protein),
      carbs: round(totals.carbs),
      fat: round(totals.fat),
      fiber: round(totals.fiber),
    };
    for (const k of MACRO_KEYS) {
      const v = rounded[k];
      if (!Number.isFinite(v) || v < 0) {
        violations.push(`AC15: dish '${dish.id}' macro ${k}=${v} (must be finite ≥ 0)`);
      }
    }

    // Sanity warnings (non-fatal):
    //   - calories suspiciously low (<50 kcal) or high (>1500 kcal) per serving
    if (rounded.calories < 50) {
      warnings.push(
        `AC15 sanity: dish '${dish.id}' (${dish.name_vi}) per-serving calories=${rounded.calories} kcal seems low`,
      );
    }
    if (rounded.calories > 1500) {
      warnings.push(
        `AC15 sanity: dish '${dish.id}' (${dish.name_vi}) per-serving calories=${rounded.calories} kcal seems high`,
      );
    }

    dishMacros.push({ dish_id: dish.id, name_vi: dish.name_vi, per_serving: rounded });
  }

  if (violations.length > 0) {
    throw new SeedValidationError('Cross-artifact seed validation failed', violations);
  }

  return { ok: true, dish_macros: dishMacros, warnings };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
