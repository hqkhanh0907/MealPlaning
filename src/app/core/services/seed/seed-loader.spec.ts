import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Database } from '../database/database';
import { WebDatabase } from '../database/web-database';
import { SeedLoader, type SeedDishRecord, type SeedIngredientRecord } from './seed-loader';

interface CountRow {
  c: number;
}

function makeIngredient(
  idSuffix: string,
  overrides: Partial<SeedIngredientRecord> = {},
): SeedIngredientRecord {
  return {
    id: `aaaaaaaa-0000-4000-8000-0000000000${idSuffix}`,
    name_vi: `Test ${idSuffix}`,
    category: 'meat',
    nutrition_basis_unit: 'g',
    nutrition_basis_quantity: 100,
    calories: 100,
    protein: 10,
    carbs: 5,
    fat: 5,
    fiber: 1,
    density_g_per_ml: null,
    ...overrides,
  };
}

function makeComposite(
  idSuffix: string,
  overrides: Partial<SeedIngredientRecord> = {},
): SeedIngredientRecord {
  return {
    id: `bbbbbbbb-0000-4000-8000-0000000000${idSuffix}`,
    name_vi: `Composite ${idSuffix}`,
    category: 'composite',
    nutrition_basis_unit: 'ml',
    nutrition_basis_quantity: 100,
    calories: 50,
    protein: 1,
    carbs: 10,
    fat: 0,
    fiber: 0,
    density_g_per_ml: 1.0,
    ...overrides,
  };
}

function makeDish(
  idSuffix: string,
  ingredientId: string,
  overrides: Partial<SeedDishRecord> = {},
): SeedDishRecord {
  return {
    id: `cccccccc-0000-4000-8000-0000000000${idSuffix}`,
    name_vi: `Dish ${idSuffix}`,
    meal_tag: 'lunch',
    servings: 1,
    is_favorite: false,
    ingredients: [{ ingredient_id: ingredientId, quantity: 100, unit_id: 'g' }],
    ...overrides,
  };
}

describe('SeedLoaderService', () => {
  let loader: SeedLoader;
  let db: Database;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        SeedLoader,
        { provide: Database, useClass: WebDatabase },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    db = TestBed.inject(Database);
    await db.initialize();

    loader = TestBed.inject(SeedLoader);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushSeeds(
    ingredients: SeedIngredientRecord[],
    composites: SeedIngredientRecord[],
    dishes: SeedDishRecord[],
  ): void {
    httpMock.expectOne('assets/seed/ingredients.json').flush(ingredients);
    httpMock.expectOne('assets/seed/composites.json').flush(composites);
    httpMock.expectOne('assets/seed/dishes.json').flush(dishes);
  }

  async function count(table: string): Promise<number> {
    const rows = await db.query<CountRow>(`SELECT COUNT(*) AS c FROM ${table}`);
    return rows[0]?.c ?? 0;
  }

  it('fresh DB inserts every ingredient + composite + dish and tracker grows by N+M+D', async () => {
    const ing1 = makeIngredient('01');
    const ing2 = makeIngredient('02', { nutrition_basis_unit: 'ml', category: 'staple' });
    const comp = makeComposite('11');
    const dish1 = makeDish('21', ing1.id);
    const dish2 = makeDish('22', comp.id, {
      ingredients: [{ ingredient_id: comp.id, quantity: 50, unit_id: 'ml' }],
    });

    const promise = loader.run();
    flushSeeds([ing1, ing2], [comp], [dish1, dish2]);
    const result = await promise;

    expect(result).toEqual({ ingredients: 3, dishes: 2 });
    expect(await count('ingredient')).toBe(3);
    expect(await count('dish')).toBe(2);
    expect(await count('seed_artifact')).toBe(5);
    expect(await count('dish_ingredient')).toBe(2);
    expect(await count('ingredient_unit')).toBe(3);
  });

  it('second run on populated DB inserts zero', async () => {
    const ing1 = makeIngredient('01');
    const dish1 = makeDish('21', ing1.id);

    const p1 = loader.run();
    flushSeeds([ing1], [], [dish1]);
    await p1;

    const p2 = loader.run();
    flushSeeds([ing1], [], [dish1]);
    const result = await p2;

    expect(result).toEqual({ ingredients: 0, dishes: 0 });
    expect(await count('ingredient')).toBe(1);
    expect(await count('dish')).toBe(1);
    expect(await count('seed_artifact')).toBe(2);
  });

  it('deleting a seeded dish then re-running does NOT re-add it', async () => {
    const ing1 = makeIngredient('01');
    const dish1 = makeDish('21', ing1.id);

    const p1 = loader.run();
    flushSeeds([ing1], [], [dish1]);
    await p1;

    await db.execute('DELETE FROM dish WHERE id = ?', [dish1.id]);
    expect(await count('dish')).toBe(0);
    const trackerBefore = await count('seed_artifact');

    const p2 = loader.run();
    flushSeeds([ing1], [], [dish1]);
    const result = await p2;

    expect(result).toEqual({ ingredients: 0, dishes: 0 });
    expect(await count('dish')).toBe(0);
    expect(await count('seed_artifact')).toBe(trackerBefore);
  });

  it('a new ingredient added to JSON inserts exactly that one row on next run', async () => {
    const ing1 = makeIngredient('01');
    const ing2 = makeIngredient('02');

    const p1 = loader.run();
    flushSeeds([ing1, ing2], [], []);
    await p1;

    const ingBefore = await count('ingredient');
    const trackerBefore = await count('seed_artifact');

    const ing3 = makeIngredient('03');
    const p2 = loader.run();
    flushSeeds([ing1, ing2, ing3], [], []);
    const result = await p2;

    expect(result).toEqual({ ingredients: 1, dishes: 0 });
    expect(await count('ingredient')).toBe(ingBefore + 1);
    expect(await count('seed_artifact')).toBe(trackerBefore + 1);
  });
});
