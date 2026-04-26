/**
 * Phase 1 §5.2.3 — Build composite Vietnamese recipes into derived ingredients.
 *
 * For each CompositeRecipe we:
 *   1. Look up every component in the atomic ingredient index.
 *   2. Convert component quantity → ingredient's nutrition_basis_unit using
 *      the canonical units table (AC9).
 *   3. Compute component macro contribution = (component_amount_in_basis / 100)
 *      * macro_per_100.
 *   4. Sum across components, normalise to per-100 of the recipe's `final_basis_unit`
 *      using `yield_total_quantity` + density.
 *   5. Emit a DerivedCompositeIngredient (category 'composite', source 'derived').
 *
 * Acceptance criteria covered:
 *   AC7  every component_id resolves to an ATOMIC ingredient (no nested composites)
 *   AC8  derived per-100 macro is finite and ≥ 0 across the board
 *   AC9  unit conversion goes through scripts/seed/units.ts (single source of truth)
 *   (AC6 cross-ref vs dishes lives in validate-seed.ts §5.2.4.)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { stableStringify, SeedValidationError } from './build-ingredients';
import { VI_COMPOSITES } from './curated/vi-composites';
import { VI_INGREDIENTS } from './curated/vi-ingredients';
import type { CompositeRecipe, DerivedCompositeIngredient, IngredientSeed } from './types';
import { toBase } from './units';

const MACRO_KEYS = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const;
type MacroKey = (typeof MACRO_KEYS)[number];

export function buildComposites(
  composites: ReadonlyArray<CompositeRecipe>,
  atomics: ReadonlyArray<IngredientSeed>,
): DerivedCompositeIngredient[] {
  const atomicIndex = new Map(atomics.map((a) => [a.id, a]));
  const violations: string[] = [];
  const derived: DerivedCompositeIngredient[] = [];

  // Quick lookup: composite ids — used to flag nested composites (AC7).
  const compositeIds = new Set(composites.map((c) => c.id));

  for (const recipe of composites) {
    const totals: Record<MacroKey, number> = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };
    const componentIds: string[] = [];

    let recipeFailed = false;

    for (const comp of recipe.components) {
      // AC7 — component must be atomic, not another composite.
      if (compositeIds.has(comp.ingredient_id)) {
        violations.push(
          `AC7: composite '${recipe.id}' references another composite '${comp.ingredient_id}' — V1 forbids nested composites`,
        );
        recipeFailed = true;
        continue;
      }
      const atomic = atomicIndex.get(comp.ingredient_id);
      if (!atomic) {
        violations.push(
          `composite '${recipe.id}' references unknown ingredient '${comp.ingredient_id}'`,
        );
        recipeFailed = true;
        continue;
      }

      // AC9 — convert via canonical units table.
      let componentInBasis: number;
      try {
        componentInBasis = toBase(
          comp.quantity,
          comp.unit_id,
          atomic.nutrition_basis_unit,
          atomic.density_g_per_ml,
        );
      } catch (err) {
        violations.push(
          `composite '${recipe.id}' component '${comp.ingredient_id}': ${(err as Error).message}`,
        );
        recipeFailed = true;
        continue;
      }

      const factor = componentInBasis / atomic.nutrition_basis_quantity;
      for (const k of MACRO_KEYS) totals[k] += atomic[k] * factor;
      componentIds.push(comp.ingredient_id);
    }

    if (recipeFailed) continue;

    // Normalise yield → per-100 of final_basis_unit.
    let yieldInFinalBasis: number;
    try {
      yieldInFinalBasis = toBase(
        recipe.yield_total_quantity,
        recipe.yield_total_unit,
        recipe.final_basis_unit,
        recipe.density_g_per_ml,
      );
    } catch (err) {
      violations.push(`composite '${recipe.id}' yield conversion: ${(err as Error).message}`);
      continue;
    }
    if (yieldInFinalBasis <= 0) {
      violations.push(`composite '${recipe.id}' yield resolves to ${yieldInFinalBasis}`);
      continue;
    }

    const per100Factor = 100 / yieldInFinalBasis;
    const macros: Record<MacroKey, number> = {
      calories: round(totals.calories * per100Factor),
      protein: round(totals.protein * per100Factor),
      carbs: round(totals.carbs * per100Factor),
      fat: round(totals.fat * per100Factor),
      fiber: round(totals.fiber * per100Factor),
    };

    // AC8 — finite and ≥ 0.
    for (const k of MACRO_KEYS) {
      const v = macros[k];
      if (!Number.isFinite(v) || v < 0) {
        violations.push(`AC8: composite '${recipe.id}' macro ${k} = ${v} (must be finite ≥ 0)`);
      }
    }

    // Compute total grams for provenance — useful for downstream sanity tests.
    let yield_total_g: number;
    try {
      yield_total_g = toBase(
        recipe.yield_total_quantity,
        recipe.yield_total_unit,
        'g',
        recipe.density_g_per_ml,
      );
    } catch {
      // Fall back to recording the yield in its own basis if no density available.
      yield_total_g = NaN;
    }

    derived.push({
      id: recipe.id,
      name_vi: recipe.name_vi,
      name_en: recipe.name_vi, // composites typically have no English name
      category: 'composite',
      nutrition_basis_unit: recipe.final_basis_unit,
      nutrition_basis_quantity: 100,
      ...macros,
      density_g_per_ml: recipe.density_g_per_ml,
      default_unit_id: recipe.default_unit_id,
      source: 'derived',
      source_citation: recipe.source_citation,
      is_approximate: true,
      notes: recipe.notes,
      derived_from: {
        composite_recipe_id: recipe.id,
        component_ingredient_ids: componentIds,
        yield_total_g,
      },
    });
  }

  if (violations.length > 0) {
    throw new SeedValidationError('Composite build failed', violations);
  }

  return derived.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function round(n: number): number {
  // 2 decimals — sufficient for kcal and macro grams in seed data.
  return Math.round(n * 100) / 100;
}

export function buildCompositesToDisk(outDir: string): DerivedCompositeIngredient[] {
  const composites = buildComposites(VI_COMPOSITES, VI_INGREDIENTS);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'composites.json'), stableStringify(composites), 'utf8');
  return composites;
}
