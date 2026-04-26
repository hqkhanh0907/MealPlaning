/**
 * Phase 1 §5.2.2 — Tests for build-ingredients.ts
 *
 * Run with: npm run seed:test
 * (which is `node --import tsx --test scripts/seed/__tests__/*.test.ts`)
 *
 * AC1 cross-ref → covered later by validate-seed.ts §5.2.4
 * AC2 staple whitelist coverage
 * AC3 source_citation non-empty
 * AC4 deterministic / byte-identical output
 * AC5 ingredient_units derived (≥1 row per ingredient with default flag)
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  VI_STAPLE_WHITELIST,
  buildIngredients,
  stableStringify,
  SeedValidationError,
} from '../build-ingredients';
import { VI_INGREDIENTS } from '../curated/vi-ingredients';
import type { IngredientSeed } from '../types';

const baseIng = (overrides: Partial<IngredientSeed> = {}): IngredientSeed => ({
  id: '00000000-0000-4000-8000-00000000aaaa',
  name_vi: 'Test ingredient',
  name_en: 'Test ingredient',
  category: 'meat',
  nutrition_basis_unit: 'g',
  nutrition_basis_quantity: 100,
  calories: 100,
  protein: 10,
  carbs: 5,
  fat: 2,
  fiber: 1,
  density_g_per_ml: null,
  default_unit_id: 'g',
  source: 'wikipedia-vi',
  source_citation: 'sources/wikipedia-vi.md#test',
  is_approximate: false,
  ...overrides,
});

const stapleSet = (): IngredientSeed[] =>
  VI_STAPLE_WHITELIST.map((name, i) =>
    baseIng({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      name_vi: name,
      name_en: name,
      category: 'staple',
      nutrition_basis_unit: name === 'dầu ăn' || name === 'nước mắm' ? 'ml' : 'g',
      density_g_per_ml: name === 'dầu ăn' || name === 'nước mắm' ? 1 : null,
    }),
  );

test('AC2: missing staple raises SeedValidationError listing the gap', () => {
  const incomplete = stapleSet().filter((ing) => ing.name_vi !== 'tỏi');
  assert.throws(
    () => buildIngredients(incomplete),
    (err) => {
      assert.ok(err instanceof SeedValidationError);
      assert.match(err.message, /AC2.*'tỏi'/);
      return true;
    },
  );
});

test('AC2: full whitelist passes', () => {
  const result = buildIngredients(stapleSet());
  assert.equal(result.ingredients.length, VI_STAPLE_WHITELIST.length);
});

test('AC3: empty source_citation raises SeedValidationError', () => {
  const inputs = [...stapleSet(), baseIng({ id: '00000000-0000-4000-8000-00000000bad3', source_citation: '' })];
  assert.throws(
    () => buildIngredients(inputs),
    (err) => err instanceof SeedValidationError && /AC3/.test(err.message),
  );
});

test('AC3: whitespace-only source_citation also fails', () => {
  const inputs = [...stapleSet(), baseIng({ id: '00000000-0000-4000-8000-00000000bad4', source_citation: '   \n  ' })];
  assert.throws(() => buildIngredients(inputs), SeedValidationError);
});

test('AC4: output is sorted by id and stable across runs', () => {
  // Author intentionally out of order.
  const reversed = [...stapleSet()].reverse();
  const a = buildIngredients(reversed);
  const b = buildIngredients(reversed);
  assert.deepEqual(a.ingredients, b.ingredients);
  // Ascending id order.
  for (let i = 1; i < a.ingredients.length; i++) {
    assert.ok(a.ingredients[i - 1].id < a.ingredients[i].id);
  }
});

test('AC4: stableStringify produces identical bytes for shuffled keys', () => {
  const x = { b: 1, a: { z: 2, y: [3, 4] } };
  const y = { a: { y: [3, 4], z: 2 }, b: 1 };
  assert.equal(stableStringify(x), stableStringify(y));
});

test('AC4: stableStringify ends with a single trailing newline', () => {
  const out = stableStringify({ a: 1 });
  assert.ok(out.endsWith('\n'));
  assert.ok(!out.endsWith('\n\n'));
});

test('AC5: every ingredient has at least one ingredient_unit row marked default', () => {
  const result = buildIngredients(stapleSet());
  for (const ing of result.ingredients) {
    const rows = result.ingredient_units.filter((r) => r.ingredient_id === ing.id);
    assert.ok(rows.length >= 1, `AC5: ingredient ${ing.id} has no unit rows`);
    assert.equal(rows.filter((r) => r.is_default).length, 1, `AC5: ingredient ${ing.id} must have exactly one default unit`);
  }
});

test('duplicate id raises SeedValidationError', () => {
  const dup = baseIng({ id: '00000000-0000-4000-8000-000000000001', name_vi: 'nước mắm', nutrition_basis_unit: 'ml', density_g_per_ml: 1 });
  const dup2 = baseIng({ id: '00000000-0000-4000-8000-000000000001', name_vi: 'muối' });
  const inputs = [
    ...stapleSet().filter((ing) => ing.name_vi !== 'nước mắm' && ing.name_vi !== 'muối'),
    dup,
    dup2,
  ];
  assert.throws(() => buildIngredients(inputs), /duplicate ingredient id/);
});

test('integration: real curated VI_INGREDIENTS passes the build', () => {
  // Once vi-ingredients.ts is fully populated (§5.2.2 onward), this must always pass.
  assert.doesNotThrow(() => buildIngredients(VI_INGREDIENTS));
  const result = buildIngredients(VI_INGREDIENTS);
  assert.ok(result.ingredients.length >= VI_STAPLE_WHITELIST.length);
});
