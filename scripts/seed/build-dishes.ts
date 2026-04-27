/**
 * Phase 1 §5.2.4 — Build curated Vietnamese dishes into a deterministic seed
 * artifact.
 *
 * Pure transform (no I/O). The CLI wrapper at the bottom only fires when the
 * file is the entrypoint; production callers use `buildDishesToDisk` from
 * `build.ts`.
 *
 * Acceptance criteria covered HERE (cross-ref AC1/AC6/AC12 lives in
 * `validate-seed.ts`):
 *   AC10  Exactly 20 dishes with distribution {breakfast: 6, lunch: 7, dinner: 7}
 *   AC11  All dish ids are valid v4 UUIDs (frozen at the curation layer; CI
 *         catches drift via `git diff --exit-code` after `npm run seed:build`)
 *   AC13  Every dish.meal_tag ∈ {breakfast, lunch, dinner}
 *   AC14  Every dish.is_favorite === false (Q5)
 *
 *   Schema invariants (not tied to a specific AC#) but enforced:
 *     - servings === 1 (seed templates are always per-1-serving)
 *     - source === 'curated'
 *     - ingredients[] non-empty, every component has positive quantity
 *     - duplicate dish ids rejected
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SeedValidationError, stableStringify } from './build-ingredients';
import { VI_DISHES } from './curated/vi-dishes';
import type { DishSeed, MealTag } from './types';

const MEAL_TAGS: ReadonlyArray<MealTag> = ['breakfast', 'lunch', 'dinner'];
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const REQUIRED_DISH_DISTRIBUTION: Readonly<Record<MealTag, number>> = Object.freeze({
  breakfast: 6,
  lunch: 7,
  dinner: 7,
});
export const REQUIRED_DISH_TOTAL = 20;

/**
 * Pure transform: validate + normalise + sort. Throws SeedValidationError on
 * any AC10/AC11/AC13/AC14 or schema violation.
 */
export function buildDishes(input: ReadonlyArray<DishSeed>): DishSeed[] {
  const violations: string[] = [];

  // Duplicate-id guard.
  const seenIds = new Set<string>();
  for (const d of input) {
    if (seenIds.has(d.id)) {
      violations.push(`duplicate dish id '${d.id}' (${d.name_vi})`);
    }
    seenIds.add(d.id);

    // AC11 — frozen UUID v4 shape.
    if (!UUID_V4_RE.test(d.id)) {
      violations.push(`AC11: dish '${d.id}' (${d.name_vi}) is not a valid v4 UUID`);
    }

    // AC13 — meal_tag enum.
    if (!MEAL_TAGS.includes(d.meal_tag)) {
      violations.push(`AC13: dish '${d.id}' (${d.name_vi}) has invalid meal_tag '${d.meal_tag}'`);
    }

    // AC14 — is_favorite always false (Q5 decision).
    if (d.is_favorite !== false) {
      violations.push(
        `AC14: dish '${d.id}' (${d.name_vi}) has is_favorite=${d.is_favorite}; seed dishes must be false`,
      );
    }

    // Schema — servings always 1.
    if (d.servings !== 1) {
      violations.push(
        `dish '${d.id}' (${d.name_vi}) has servings=${d.servings}; seed templates must be 1`,
      );
    }

    // Schema — source curated.
    if (d.source !== 'curated') {
      violations.push(
        `dish '${d.id}' (${d.name_vi}) has source='${d.source}'; expected 'curated'`,
      );
    }

    // Schema — ingredients non-empty.
    if (!Array.isArray(d.ingredients) || d.ingredients.length === 0) {
      violations.push(`dish '${d.id}' (${d.name_vi}) has no ingredients`);
      continue;
    }

    // Schema — every ingredient has positive quantity + non-empty unit_id +
    //          non-empty ingredient_id.
    for (const [idx, comp] of d.ingredients.entries()) {
      if (!comp.ingredient_id || typeof comp.ingredient_id !== 'string') {
        violations.push(`dish '${d.id}' ingredient[${idx}] has empty ingredient_id`);
      }
      if (!comp.unit_id || typeof comp.unit_id !== 'string') {
        violations.push(`dish '${d.id}' ingredient[${idx}] has empty unit_id`);
      }
      if (!Number.isFinite(comp.quantity) || comp.quantity <= 0) {
        violations.push(
          `dish '${d.id}' ingredient[${idx}] (${comp.ingredient_id}) has non-positive quantity ${comp.quantity}`,
        );
      }
    }
  }

  // AC10 — exact total + distribution.
  if (input.length !== REQUIRED_DISH_TOTAL) {
    violations.push(
      `AC10: expected exactly ${REQUIRED_DISH_TOTAL} dishes, got ${input.length}`,
    );
  }
  const counts: Record<MealTag, number> = { breakfast: 0, lunch: 0, dinner: 0 };
  for (const d of input) {
    if (MEAL_TAGS.includes(d.meal_tag)) counts[d.meal_tag] += 1;
  }
  for (const tag of MEAL_TAGS) {
    if (counts[tag] !== REQUIRED_DISH_DISTRIBUTION[tag]) {
      violations.push(
        `AC10: meal_tag '${tag}' has ${counts[tag]} dishes; expected ${REQUIRED_DISH_DISTRIBUTION[tag]}`,
      );
    }
  }

  if (violations.length > 0) {
    throw new SeedValidationError('Dish build failed', violations);
  }

  // Determinism: sort by id; freeze ingredient order within each dish (sort by
  // ingredient_id) to remove human-author noise from the JSON diff.
  return [...input]
    .map((d) => ({
      ...d,
      ingredients: [...d.ingredients].sort((a, b) =>
        a.ingredient_id < b.ingredient_id ? -1 : a.ingredient_id > b.ingredient_id ? 1 : 0,
      ),
    }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function buildDishesToDisk(outDir: string): DishSeed[] {
  const dishes = buildDishes(VI_DISHES);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'dishes.json'), stableStringify(dishes), 'utf8');
  return dishes;
}

// Run only when invoked directly: `tsx scripts/seed/build-dishes.ts`.
const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = resolve(here, '../../src/assets/seed');
  const dishes = buildDishesToDisk(outDir);
  // eslint-disable-next-line no-console
  console.log(`[dishes] wrote ${dishes.length} dishes → ${outDir}`);
}
