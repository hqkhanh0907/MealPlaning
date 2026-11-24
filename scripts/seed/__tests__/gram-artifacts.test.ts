import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildComposites, buildCompositesToDisk } from '../build-composites';
import { buildDishesToDisk } from '../build-dishes';
import { buildIngredientsToDisk, ingredientPer100g } from '../build-ingredients';
import { VI_INGREDIENTS } from '../curated/vi-ingredients';
import { VI_COMPOSITES } from '../curated/vi-composites';
import { toGrams } from '../units';

test('converts a liquid label from 100 ml to 100 g using its density', () => {
  const result = ingredientPer100g({
    ...VI_INGREDIENTS[0],
    nutrition_basis_unit: 'ml',
    density_g_per_ml: 1.25,
    calories: 50,
    protein: 10,
  });
  assert.equal(result.calories, 40);
  assert.equal(result.protein, 8);
});

test('uses the published gram values for fish sauce and its density for recipe volumes', () => {
  const fishSauce = VI_INGREDIENTS.find((item) => item.name_vi === 'nước mắm');
  assert.ok(fishSauce);
  assert.equal(fishSauce.nutrition_basis_unit, 'g');
  assert.equal(fishSauce.nutrition_basis_quantity, 100);
  assert.match(fishSauce.source_citation, /VTN_FCT_2007\.pdf#page=542$/);
  assert.match(fishSauce.notes ?? '', /13017/);
  const { calories, protein, carbs, fat, fiber } = ingredientPer100g(fishSauce);
  assert.deepEqual([calories, protein, carbs, fat, fiber], [35, 5.1, 3.6, 0.01, 0]);
  assert.equal(toGrams(60, 'ml', fishSauce.density_g_per_ml), 72);

  const prepared = buildComposites(VI_COMPOSITES, VI_INGREDIENTS).map(ingredientPer100g);
  assert.deepEqual(prepared.map((row) => [row.calories, row.protein, row.carbs]), [
    [89.64, 1.68, 21.44], [28.42, 2.74, 0.82], [31.08, 2.81, 1.55],
    [73.54, 4.88, 1.54], [18.2, 0.31, 4.57], [20.18, 0.38, 4.98], [20.76, 2.99, 1.24],
  ]);
});

test('rebuilds the released gram-based artifacts in two empty directories', (t) => {
  const directories = Array.from({ length: 2 }, () =>
    mkdtempSync(join(tmpdir(), 'mealplan-seed-')),
  );
  t.after(() => directories.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

  for (const directory of directories) {
    buildIngredientsToDisk(directory);
    buildCompositesToDisk(directory);
    buildDishesToDisk(directory);
  }
  for (const file of ['ingredients.json', 'composites.json', 'dishes.json']) {
    const generated = readFileSync(join(directories[0], file), 'utf8');
    assert.equal(generated, readFileSync(join(directories[1], file), 'utf8'));
    const released = readFileSync(
      new URL('../../../src/assets/seed/' + file, import.meta.url),
      'utf8',
    );
    assert.deepEqual(JSON.parse(generated), JSON.parse(released));
  }
  const dishes = JSON.parse(readFileSync(join(directories[0], 'dishes.json'), 'utf8')) as {
    name_vi: string;
    ingredients: { ingredient_id: string; gram_weight: number }[];
  }[];
  const broth = dishes
    .find((dish) => dish.name_vi === 'Phở bò')
    ?.ingredients.find((item) => item.ingredient_id === 'c0114c01-0001-4000-8000-000000000002');
  assert.deepEqual(broth, {
    ingredient_id: 'c0114c01-0001-4000-8000-000000000002',
    gram_weight: 408,
  });
  for (const dish of dishes) {
    assert.ok(
      dish.ingredients.every((item) => Number.isFinite(item.gram_weight) && item.gram_weight > 0),
    );
  }
});
