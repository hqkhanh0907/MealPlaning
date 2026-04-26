/**
 * Phase 1 §5.2.3 — Tests for build-composites.ts
 *
 * AC6 cross-ref vs dishes → covered later in validate-seed.ts §5.2.4
 * AC7 nested composites rejected
 * AC8 derived per-100 macro is finite & ≥ 0
 * AC9 unit conversion uses the canonical units table
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildComposites } from '../build-composites';
import { SeedValidationError } from '../build-ingredients';
import { VI_COMPOSITES } from '../curated/vi-composites';
import { VI_INGREDIENTS } from '../curated/vi-ingredients';
import type { CompositeRecipe, IngredientSeed } from '../types';
import { toBase, toGrams } from '../units';

const atomic = (overrides: Partial<IngredientSeed> = {}): IngredientSeed => ({
  id: '00000000-0000-4000-8000-0000000000a1',
  name_vi: 'Ức gà',
  name_en: 'Chicken breast',
  category: 'meat',
  nutrition_basis_unit: 'g',
  nutrition_basis_quantity: 100,
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  fiber: 0,
  density_g_per_ml: null,
  default_unit_id: 'g',
  source: 'wikipedia-vi',
  source_citation: 'sources/wikipedia-vi.md#test',
  is_approximate: false,
  ...overrides,
});

const composite = (overrides: Partial<CompositeRecipe> = {}): CompositeRecipe => ({
  id: '00000000-0000-4000-8000-0000000000c1',
  name_vi: 'Test composite',
  category: 'composite',
  final_basis_unit: 'ml',
  final_basis_quantity: 100,
  yield_total_quantity: 1000,
  yield_total_unit: 'ml',
  density_g_per_ml: 1,
  default_unit_id: 'ml',
  components: [
    { ingredient_id: '00000000-0000-4000-8000-0000000000a1', quantity: 100, unit_id: 'g' },
  ],
  source_citation: 'sources/wikipedia-vi.md#test-composite',
  ...overrides,
});

test('AC9: unit table — toGrams(1, tbsp, density 1.2) = 18 g', () => {
  assert.equal(toGrams(1, 'tbsp', 1.2), 18);
});

test('AC9: unit table — toBase(1, kg, g, null) = 1000 g (no density needed)', () => {
  assert.equal(toBase(1, 'kg', 'g', null), 1000);
});

test('AC9: unit table rejects volume→g without density', () => {
  assert.throws(() => toGrams(1, 'tbsp', null), /density_g_per_ml is null/);
});

test('AC7: nested composite reference is rejected', () => {
  const c1 = composite({ id: 'c1', components: [{ ingredient_id: 'c2', quantity: 50, unit_id: 'g' }] });
  const c2 = composite({ id: 'c2' });
  assert.throws(
    () => buildComposites([c1, c2], [atomic()]),
    (err) => err instanceof SeedValidationError && /AC7/.test(err.message),
  );
});

test('unknown component id is rejected with a clear error', () => {
  const c = composite({
    components: [{ ingredient_id: 'does-not-exist', quantity: 100, unit_id: 'g' }],
  });
  assert.throws(
    () => buildComposites([c], [atomic()]),
    /references unknown ingredient/,
  );
});

test('AC8: derived per-100 macro is finite and ≥ 0 for the simple case', () => {
  // 100 g chicken (165 kcal) yielded into 1000 ml → 16.5 kcal per 100 ml.
  const [d] = buildComposites([composite()], [atomic()]);
  assert.ok(Number.isFinite(d.calories));
  assert.ok(d.calories >= 0);
  assert.equal(d.calories, 16.5);
  assert.equal(d.protein, 3.1);
});

test('AC9: unit-table volume conversion — 1 cup (240 ml) of water = 240 g', () => {
  // Composite of "water" (calories 0, density 1) with yield 100 ml.
  const water = atomic({
    id: 'water',
    name_vi: 'Nước',
    nutrition_basis_unit: 'ml',
    density_g_per_ml: 1,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });
  const c = composite({
    components: [{ ingredient_id: 'water', quantity: 1, unit_id: 'cup' }],
    yield_total_quantity: 240,
    yield_total_unit: 'ml',
    density_g_per_ml: 1,
  });
  const [d] = buildComposites([c], [water]);
  assert.equal(d.calories, 0);
  assert.equal(d.derived_from.yield_total_g, 240);
});

test('AC8: zero-yield composite is rejected (would divide by zero)', () => {
  const c = composite({ yield_total_quantity: 0 });
  assert.throws(
    () => buildComposites([c], [atomic()]),
    (err) => err instanceof SeedValidationError && /yield/.test(err.message),
  );
});

test('integration: real curated VI_COMPOSITES build cleanly with VI_INGREDIENTS', () => {
  // §5.2.3 just needs the build to succeed; AC6 (coverage vs dishes)
  // is enforced later by validate-seed.ts in §5.2.4.
  assert.doesNotThrow(() => buildComposites(VI_COMPOSITES, VI_INGREDIENTS));
});

test('output is sorted by id (determinism)', () => {
  const c1 = composite({ id: 'zzz' });
  const c2 = composite({ id: 'aaa' });
  const out = buildComposites([c1, c2], [atomic()]);
  assert.deepEqual(out.map((d) => d.id), ['aaa', 'zzz']);
});
