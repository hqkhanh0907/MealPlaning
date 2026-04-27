/**
 * Phase 1 §5.2.4 — Tests for build-dishes.ts
 *
 * AC10  Exactly 20 dishes, distribution {breakfast: 6, lunch: 7, dinner: 7}
 * AC11  All dish ids are valid v4 UUIDs (frozen — git diff catches drift)
 * AC13  meal_tag enum
 * AC14  is_favorite always false (Q5)
 * Plus schema invariants: servings=1, source='curated', positive quantities.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildDishes, REQUIRED_DISH_DISTRIBUTION, REQUIRED_DISH_TOTAL } from '../build-dishes';
import { SeedValidationError } from '../build-ingredients';
import { VI_DISHES } from '../curated/vi-dishes';
import type { DishSeed, MealTag } from '../types';

let counter = 0;
function uuid(): string {
  counter += 1;
  const hex = counter.toString(16).padStart(12, '0');
  return `7c4e8b1a-0003-4000-8000-${hex}`;
}

const dish = (overrides: Partial<DishSeed> = {}): DishSeed => ({
  id: uuid(),
  name_vi: 'Test dish',
  meal_tag: 'lunch',
  servings: 1,
  is_favorite: false,
  ingredients: [
    { ingredient_id: '7c4e8b1a-0002-4000-8000-000000000001', quantity: 100, unit_id: 'g' },
  ],
  source: 'curated',
  ...overrides,
});

function makeDistribution(): DishSeed[] {
  const out: DishSeed[] = [];
  const tags: ReadonlyArray<[MealTag, number]> = [
    ['breakfast', REQUIRED_DISH_DISTRIBUTION.breakfast],
    ['lunch', REQUIRED_DISH_DISTRIBUTION.lunch],
    ['dinner', REQUIRED_DISH_DISTRIBUTION.dinner],
  ];
  for (const [tag, n] of tags) {
    for (let i = 0; i < n; i += 1) out.push(dish({ meal_tag: tag }));
  }
  return out;
}

test('AC10: 20-dish 6/7/7 distribution passes', () => {
  const out = buildDishes(makeDistribution());
  assert.equal(out.length, REQUIRED_DISH_TOTAL);
});

test('AC10: rejects when total dish count != 20', () => {
  assert.throws(
    () => buildDishes([dish()]),
    (err) => err instanceof SeedValidationError && /AC10.*expected exactly 20/.test(err.message),
  );
});

test('AC10: rejects when distribution is wrong (e.g. 7/7/6)', () => {
  const list = makeDistribution();
  // Flip one breakfast → dinner so distribution becomes 5/7/8.
  const idx = list.findIndex((d) => d.meal_tag === 'breakfast');
  list[idx] = { ...list[idx], meal_tag: 'dinner' };
  assert.throws(
    () => buildDishes(list),
    (err) => err instanceof SeedValidationError && /AC10/.test(err.message),
  );
});

test('AC11: rejects non-UUID-v4 dish id', () => {
  const list = makeDistribution();
  list[0] = { ...list[0], id: 'not-a-uuid' };
  assert.throws(
    () => buildDishes(list),
    (err) => err instanceof SeedValidationError && /AC11/.test(err.message),
  );
});

test('AC13: rejects invalid meal_tag', () => {
  const list = makeDistribution();
  list[0] = { ...list[0], meal_tag: 'snack' as unknown as MealTag };
  assert.throws(
    () => buildDishes(list),
    (err) => err instanceof SeedValidationError && /AC13/.test(err.message),
  );
});

test('AC14: rejects is_favorite=true (Q5 enforcement)', () => {
  const list = makeDistribution();
  list[0] = { ...list[0], is_favorite: true as unknown as false };
  assert.throws(
    () => buildDishes(list),
    (err) => err instanceof SeedValidationError && /AC14/.test(err.message),
  );
});

test('schema: rejects servings != 1', () => {
  const list = makeDistribution();
  list[0] = { ...list[0], servings: 2 as unknown as 1 };
  assert.throws(
    () => buildDishes(list),
    (err) => err instanceof SeedValidationError && /servings/.test(err.message),
  );
});

test('schema: rejects empty ingredients[]', () => {
  const list = makeDistribution();
  list[0] = { ...list[0], ingredients: [] };
  assert.throws(
    () => buildDishes(list),
    (err) => err instanceof SeedValidationError && /no ingredients/.test(err.message),
  );
});

test('schema: rejects non-positive quantity', () => {
  const list = makeDistribution();
  list[0] = {
    ...list[0],
    ingredients: [{ ingredient_id: 'x', quantity: 0, unit_id: 'g' }],
  };
  assert.throws(
    () => buildDishes(list),
    (err) => err instanceof SeedValidationError && /non-positive quantity/.test(err.message),
  );
});

test('schema: rejects duplicate dish ids', () => {
  const list = makeDistribution();
  list[1] = { ...list[1], id: list[0].id };
  assert.throws(
    () => buildDishes(list),
    (err) => err instanceof SeedValidationError && /duplicate dish id/.test(err.message),
  );
});

test('output is sorted by id (determinism)', () => {
  const list = makeDistribution();
  const out = buildDishes(list);
  const ids = out.map((d) => d.id);
  const sorted = [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  assert.deepEqual(ids, sorted);
});

test('integration: real curated VI_DISHES build cleanly', () => {
  // §5.2.4 curates the full 20-dish list. Once present, this asserts AC10 + AC11
  // + AC13 + AC14 + schema together against the production data.
  assert.doesNotThrow(() => buildDishes(VI_DISHES));
});
