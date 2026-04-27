/**
 * Phase 1 §5.2.4 — Tests for validate-seed.ts (cross-artifact)
 *
 * AC1   Composite components and dish ingredients resolve in atomic ∪ composite
 * AC6   Every shipped composite is referenced by ≥ 1 dish (no dead recipes)
 * AC12  Dish ingredients resolve + unit_id is in canonical units table
 * AC15  Dish-level macro per serving is finite & ≥ 0; sanity warnings non-fatal
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildComposites } from '../build-composites';
import { SeedValidationError } from '../build-ingredients';
import type {
  CompositeRecipe,
  DerivedCompositeIngredient,
  DishSeed,
  IngredientSeed,
} from '../types';
import { validateSeed } from '../validate-seed';

const ID_RICE = '7c4e8b1a-0002-4000-8000-0000000000a1';
const ID_CHICKEN = '7c4e8b1a-0002-4000-8000-0000000000a2';
const ID_BROTH_COMP = '7c4e8b1a-9999-4000-8000-0000000000c1';

const ingr = (overrides: Partial<IngredientSeed> = {}): IngredientSeed => ({
  id: ID_RICE,
  name_vi: 'Cơm trắng',
  name_en: 'White rice cooked',
  category: 'grain',
  nutrition_basis_unit: 'g',
  nutrition_basis_quantity: 100,
  calories: 130,
  protein: 2.7,
  carbs: 28,
  fat: 0.3,
  fiber: 0.4,
  density_g_per_ml: null,
  default_unit_id: 'g',
  source: 'wikipedia-vi',
  source_citation: 'sources/wikipedia-vi.md#com',
  is_approximate: false,
  ...overrides,
});

const recipe = (overrides: Partial<CompositeRecipe> = {}): CompositeRecipe => ({
  id: ID_BROTH_COMP,
  name_vi: 'Nước dùng test',
  category: 'composite',
  final_basis_unit: 'ml',
  final_basis_quantity: 100,
  yield_total_quantity: 1000,
  yield_total_unit: 'ml',
  density_g_per_ml: 1,
  default_unit_id: 'ml',
  components: [{ ingredient_id: ID_CHICKEN, quantity: 100, unit_id: 'g' }],
  source_citation: 'sources/wikipedia-vi.md#test-broth',
  ...overrides,
});

const dish = (overrides: Partial<DishSeed> = {}): DishSeed => ({
  id: '7c4e8b1a-0003-4000-8000-000000000001',
  name_vi: 'Test dish',
  meal_tag: 'lunch',
  servings: 1,
  is_favorite: false,
  ingredients: [{ ingredient_id: ID_RICE, quantity: 200, unit_id: 'g' }],
  source: 'curated',
  ...overrides,
});

function buildIndex(): {
  ingredients: IngredientSeed[];
  composites: DerivedCompositeIngredient[];
  composite_recipes: CompositeRecipe[];
} {
  const ingredients = [
    ingr({ id: ID_RICE }),
    ingr({
      id: ID_CHICKEN,
      name_vi: 'Ức gà',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    }),
  ];
  const composite_recipes = [recipe()];
  const composites = buildComposites(composite_recipes, ingredients);
  return { ingredients, composites, composite_recipes };
}

test('AC1/AC6/AC12/AC15: happy path passes with composite referenced by a dish', () => {
  const idx = buildIndex();
  const dishes = [
    dish({ ingredients: [{ ingredient_id: ID_BROTH_COMP, quantity: 300, unit_id: 'ml' }] }),
  ];
  const report = validateSeed({ ...idx, dishes });
  assert.equal(report.ok, true);
  assert.equal(report.dish_macros.length, 1);
  assert.ok(Number.isFinite(report.dish_macros[0].per_serving.calories));
  assert.ok(report.dish_macros[0].per_serving.calories >= 0);
});

test('AC6: dead composite (not referenced by any dish) is rejected', () => {
  const idx = buildIndex();
  const dishes = [dish()]; // dish references rice atomic, NOT the broth composite
  assert.throws(
    () => validateSeed({ ...idx, dishes }),
    (err) => err instanceof SeedValidationError && /AC6/.test(err.message),
  );
});

test('AC12: dish referencing unknown ingredient is rejected', () => {
  const idx = buildIndex();
  const dishes = [
    dish({
      ingredients: [
        { ingredient_id: 'unknown-id', quantity: 50, unit_id: 'g' },
        { ingredient_id: ID_BROTH_COMP, quantity: 300, unit_id: 'ml' }, // keep AC6 happy
      ],
    }),
  ];
  assert.throws(
    () => validateSeed({ ...idx, dishes }),
    (err) => err instanceof SeedValidationError && /AC12.*unknown ingredient/.test(err.message),
  );
});

test('AC12: dish using unknown unit_id is rejected', () => {
  const idx = buildIndex();
  const dishes = [
    dish({
      ingredients: [
        { ingredient_id: ID_RICE, quantity: 1, unit_id: 'fistful' },
        { ingredient_id: ID_BROTH_COMP, quantity: 300, unit_id: 'ml' }, // AC6
      ],
    }),
  ];
  assert.throws(
    () => validateSeed({ ...idx, dishes }),
    (err) => err instanceof SeedValidationError && /AC12.*Unknown unit_id/.test(err.message),
  );
});

test('AC1/AC7: composite component that is itself a composite is rejected', () => {
  // Hand-craft an in-memory composite-of-composite scenario, bypassing
  // build-composites which would already block it. validate-seed re-checks at
  // the cross-artifact layer for clearer error messages.
  const ingredients = [ingr({ id: ID_CHICKEN, name_vi: 'Ức gà' })];
  const goodRecipe = recipe();
  const composites: DerivedCompositeIngredient[] = [
    {
      ...ingr({
        id: ID_BROTH_COMP,
        name_vi: 'Nước dùng test',
        category: 'composite',
        nutrition_basis_unit: 'ml',
        density_g_per_ml: 1,
        default_unit_id: 'ml',
        source: 'derived',
      }),
      category: 'composite',
      source: 'derived',
      derived_from: {
        composite_recipe_id: ID_BROTH_COMP,
        component_ingredient_ids: [ID_CHICKEN],
        yield_total_g: 1000,
      },
    },
  ];
  const nestedRecipe: CompositeRecipe = {
    ...goodRecipe,
    id: '7c4e8b1a-9999-4000-8000-0000000000c2',
    components: [{ ingredient_id: ID_BROTH_COMP, quantity: 50, unit_id: 'ml' }],
  };
  const dishes = [
    dish({ ingredients: [{ ingredient_id: ID_BROTH_COMP, quantity: 100, unit_id: 'ml' }] }),
  ];
  assert.throws(
    () =>
      validateSeed({
        ingredients,
        composites,
        composite_recipes: [goodRecipe, nestedRecipe],
        dishes,
      }),
    (err) => err instanceof SeedValidationError && /AC7/.test(err.message),
  );
});

test('AC15: warns (non-fatal) when per-serving calories suspiciously low', () => {
  // 1 g rice ≈ 1.3 kcal + 50 ml broth ≈ 8.25 kcal — well below the 50 kcal floor.
  const idx = buildIndex();
  const dishes = [
    dish({
      ingredients: [
        { ingredient_id: ID_RICE, quantity: 1, unit_id: 'g' },
        { ingredient_id: ID_BROTH_COMP, quantity: 50, unit_id: 'ml' }, // AC6
      ],
    }),
  ];
  const report = validateSeed({ ...idx, dishes });
  assert.ok(report.warnings.some((w) => /seems low/.test(w)));
});
