/**
 * Phase 1 §5.2.2 — Build atomic ingredients into a deterministic seed artifact.
 *
 * Pure transform (no I/O) so it is unit-testable. The CLI wrapper at the bottom
 * runs only when this file is the entrypoint (npm run seed:build invokes
 * scripts/seed/build.ts which calls buildIngredientsToDisk()).
 *
 * Acceptance criteria covered here:
 *   AC2  Vietnamese staple whitelist must all be present
 *   AC3  Every ingredient has non-empty source_citation
 *   AC4  Re-running build produces byte-identical JSON (sort + stable stringify)
 *   AC5  Every ingredient gets at least 1 row in the derived ingredient_units list
 *
 * (AC1 cross-ref against dishes/composites lives in validate-seed.ts §5.2.4.)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { VI_INGREDIENTS } from './curated/vi-ingredients';
import type { DerivedCompositeIngredient, IngredientSeed } from './types';
import { toGrams } from './units';
import type { SeedIngredientRecord } from '../../src/app/core/services/seed/seed-records';

/**
 * Mandatory Vietnamese kitchen staples. Whitelisted by name_vi (lowercased).
 * AC2 enforces every entry exists in the seed even if no dish references it.
 */
export const VI_STAPLE_WHITELIST: ReadonlyArray<string> = Object.freeze([
  'nước mắm',
  'muối',
  'đường',
  'dầu ăn',
  'hành tím',
  'hành lá',
  'tỏi',
  'gừng',
  'sả',
  'ớt',
  'tiêu',
  'bột ngọt',
]);

export interface IngredientUnitRow {
  ingredient_id: string;
  unit_id: string;
  /** How many of `nutrition_basis_unit` make up 1 of `unit_id`. */
  quantity_per_unit: number;
  is_default: boolean;
}

export interface BuildIngredientsResult {
  ingredients: IngredientSeed[];
  ingredient_units: IngredientUnitRow[];
}

export class SeedValidationError extends Error {
  constructor(
    message: string,
    public readonly violations: string[],
  ) {
    super(`${message}\n  - ${violations.join('\n  - ')}`);
    this.name = 'SeedValidationError';
  }
}

/**
 * Pure transform: validate + normalise + derive ingredient_units.
 * Throws SeedValidationError on AC2/AC3 violations.
 */
export function buildIngredients(input: ReadonlyArray<IngredientSeed>): BuildIngredientsResult {
  // AC3 — source_citation non-empty.
  const ac3: string[] = input
    .filter((ing) => !ing.source_citation || ing.source_citation.trim() === '')
    .map((ing) => `AC3: ingredient '${ing.id}' (${ing.name_vi}) has empty source_citation`);

  // Duplicate-id guard (not in ACs but a build correctness invariant).
  const seenIds = new Set<string>();
  const dupIds: string[] = [];
  for (const ing of input) {
    if (seenIds.has(ing.id)) {
      dupIds.push(`duplicate ingredient id '${ing.id}' (${ing.name_vi})`);
    }
    seenIds.add(ing.id);
  }

  // AC2 — staple whitelist coverage by lowercased name_vi.
  const namesLower = new Set(input.map((ing) => ing.name_vi.trim().toLowerCase()));
  const ac2: string[] = VI_STAPLE_WHITELIST.filter((staple) => !namesLower.has(staple)).map(
    (missing) => `AC2: required Vietnamese staple missing from vi-ingredients.ts: '${missing}'`,
  );

  const violations = [...dupIds, ...ac2, ...ac3];
  if (violations.length > 0) {
    throw new SeedValidationError('Ingredient build failed', violations);
  }

  // AC4 — deterministic order: sort by id ascending.
  const ingredients = [...input].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // AC5 — derive ingredient_units: at least one row (default unit) per ingredient.
  const ingredient_units: IngredientUnitRow[] = ingredients.map((ing) => ({
    ingredient_id: ing.id,
    unit_id: ing.default_unit_id,
    // Default unit equals the nutrition basis unit when default_unit_id matches it.
    // For non-basis defaults (e.g. tbsp) the conversion factor lives in scripts/seed/units
    // (added in §5.2.3 alongside composite math). Until then we emit 1 as a placeholder
    // and mark it as the default; downstream §5.2.4 validator will assert no NaN.
    quantity_per_unit: 1,
    is_default: true,
  }));

  return { ingredients, ingredient_units };
}

/**
 * JSON serialisation with stable key order (alphabetical within each object).
 * Required for AC4 byte-identical re-runs across machines and Node versions.
 */
export function stableStringify(value: unknown, indent = 2): string {
  const seen = new WeakSet<object>();
  const sortKeys = (val: unknown): unknown => {
    if (val === null || typeof val !== 'object') return val;
    if (seen.has(val as object)) {
      throw new Error('stableStringify: circular reference');
    }
    seen.add(val as object);
    if (Array.isArray(val)) return val.map(sortKeys);
    const entries = Object.entries(val as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    return Object.fromEntries(entries.map(([k, v]) => [k, sortKeys(v)]));
  };
  return JSON.stringify(sortKeys(value), null, indent) + '\n';
}

export function ingredientPer100g(ingredient: IngredientSeed | DerivedCompositeIngredient) {
  const basisGrams = toGrams(
    ingredient.nutrition_basis_quantity,
    ingredient.nutrition_basis_unit,
    ingredient.density_g_per_ml,
  );
  if (!Number.isFinite(basisGrams) || basisGrams <= 0) {
    throw new Error(`Ingredient '${ingredient.name_vi}' has an invalid gram basis`);
  }
  const per100g = (value: number) => Number(((value * 100) / basisGrams).toFixed(2));
  const record = {
    id: ingredient.id,
    name_vi: ingredient.name_vi,
    name_en: ingredient.name_en,
    category: ingredient.category,
    source: ingredient.source,
    source_citation: ingredient.source_citation,
    notes: ingredient.notes,
    calories: per100g(ingredient.calories),
    protein: per100g(ingredient.protein),
    carbs: per100g(ingredient.carbs),
    fat: per100g(ingredient.fat),
    fiber: per100g(ingredient.fiber),
    ...('derived_from' in ingredient ? { derived_from: ingredient.derived_from } : {}),
  };
  return record satisfies SeedIngredientRecord;
}

export function writeSeedArtifact(path: string, value: unknown): void {
  const json = stableStringify(value);
  if (existsSync(path)) {
    const previous: unknown = JSON.parse(readFileSync(path, 'utf8'));
    if (stableStringify(previous) === json) return;
  }
  writeFileSync(path, json, 'utf8');
}

/**
 * CLI entrypoint: build + write JSON files. Invoked by scripts/seed/build.ts.
 */
export function buildIngredientsToDisk(
  outDir: string,
  result = buildIngredients(VI_INGREDIENTS),
): BuildIngredientsResult {
  mkdirSync(outDir, { recursive: true });
  writeSeedArtifact(resolve(outDir, 'ingredients.json'), result.ingredients.map(ingredientPer100g));
  writeSeedArtifact(resolve(outDir, 'ingredient-units.json'), result.ingredient_units);
  return result;
}

// Run only when invoked directly: `tsx scripts/seed/build-ingredients.ts`.
const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = resolve(here, '../../src/assets/seed');
  const { ingredients, ingredient_units } = buildIngredientsToDisk(outDir);
  // eslint-disable-next-line no-console
  console.log(
    `[ingredients] wrote ${ingredients.length} ingredients, ${ingredient_units.length} unit rows → ${outDir}`,
  );
}
