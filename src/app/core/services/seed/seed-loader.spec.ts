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
    calories: 100,
    protein: 10,
    carbs: 5,
    fat: 5,
    fiber: 1,
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
    calories: 50,
    protein: 1,
    carbs: 10,
    fat: 0,
    fiber: 0,
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
    ingredients: [{ ingredient_id: ingredientId, gram_weight: 100 }],
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

  describe('upgrading the raw chicken seed', () => {
    const rawChicken: SeedIngredientRecord = {
      id: '7c4e8b1a-0002-4000-8000-000000000101',
      name_vi: 'ức gà sống bỏ da, bỏ xương',
      category: 'meat',
      calories: 120,
      protein: 22.5,
      carbs: 0,
      fat: 2.62,
      fiber: 0,
    };

    async function applySeed(): Promise<{ ingredients: number; dishes: number }> {
      const pending = loader.run();
      flushSeeds([rawChicken], [], []);
      return pending;
    }

    beforeEach(async () => {
      await db.execute(
        `INSERT INTO ingredient (id, name, category, calories, protein, carbs, fat, fiber, source)
         VALUES (?, 'ức gà', 'Thịt', 165, 31, 0, 3.6, 0, 'db')`,
        [rawChicken.id],
      );
      await db.execute(
        `INSERT INTO seed_artifact (artifact_id, artifact_type, seed_version, fingerprint_hash)
         VALUES (?, 'ingredient', '1.1.0', 'original')`,
        [rawChicken.id],
      );
    });

    it('updates a pristine legacy ingredient once with raw values per 100 g', async () => {
      expect((await applySeed()).ingredients).toBe(1);
      const row = await db.getOne(
        'SELECT name, calories, protein, fat FROM ingredient WHERE id = ?',
        [rawChicken.id],
      );
      expect(row).toEqual({ name: rawChicken.name_vi, calories: 120, protein: 22.5, fat: 2.62 });
      expect((await applySeed()).ingredients).toBe(0);
      expect(loader.dataRevision()).toBe(1);
    });

    it('preserves a local edit and leaves its nutritional values intact on later launches', async () => {
      await db.execute('UPDATE ingredient SET protein = 25 WHERE id = ?', [rawChicken.id]);
      expect((await applySeed()).ingredients).toBe(0);
      expect((await applySeed()).ingredients).toBe(0);
      expect(
        await db.getOne('SELECT calories, protein FROM ingredient WHERE id = ?', [rawChicken.id]),
      ).toEqual({ calories: 165, protein: 25 });
    });

    it('respects a deletion when the seed version changes', async () => {
      await db.execute('DELETE FROM ingredient WHERE id = ?', [rawChicken.id]);
      expect((await applySeed()).ingredients).toBe(0);
      expect(await count('ingredient')).toBe(0);
      expect(await count('seed_artifact')).toBe(1);
    });
  });

  describe('upgrading fish sauce and its prepared recipes', () => {
    const fishSauce = makeIngredient('01', {
      id: '7c4e8b1a-0002-4000-8000-000000000001',
      name_vi: 'nước mắm',
      category: 'staple',
      calories: 35,
      protein: 5.1,
      carbs: 3.6,
      fat: 0.01,
      fiber: 0,
    });
    const dippingSauce = makeComposite('01', {
      id: 'c0114c01-0001-4000-8000-000000000001',
      name_vi: 'Nước chấm chua ngọt (base)',
      calories: 89.64,
      protein: 1.68,
      carbs: 21.44,
      fat: 0.03,
      fiber: 0.11,
    });
    const oldFishSauce = { ...fishSauce, calories: 29.17, protein: 4.25, carbs: 3, fat: 0 };
    const oldDippingSauce = { ...dippingSauce, calories: 88.04, protein: 1.45, carbs: 21.28 };
    const dish = makeDish('31', dippingSauce.id);

    async function apply(
      sauce: SeedIngredientRecord,
      dip: SeedIngredientRecord,
    ): ReturnType<SeedLoader['run']> {
      const pending = loader.run();
      flushSeeds([sauce], [dip], [dish]);
      return pending;
    }

    for (const oldVersion of ['1.1.0', '1.2.0']) {
      describe('from ' + oldVersion, () => {
        beforeEach(async () => {
          await apply(oldFishSauce, oldDippingSauce);
          await db.execute('UPDATE seed_artifact SET seed_version = ?', [oldVersion]);
        });

        it('corrects the ingredient and live recipe once and keeps the eaten meal intact', async () => {
          await db.execute(
            "INSERT INTO day_plan (id, date, target_calories, target_protein) VALUES ('day', '2026-01-01', 1800, 70)",
          );
          await db.execute(
            "INSERT INTO meal_slot (id, day_plan_id, meal_type) VALUES ('slot', 'day', 'lunch')",
          );
          await db.execute(
            `INSERT INTO planned_dish (id, meal_slot_id, dish_id, is_completed, completed_at, calories, protein, carbs, fat, fiber)
             SELECT 'meal', 'slot', id, 1, '2026-01-01T12:00:00', total_calories, total_protein, total_carbs, total_fat, total_fiber
             FROM dish_with_totals WHERE id = ?`,
            [dish.id],
          );
          const stored =
            "SELECT completed_at, calories, protein, carbs, fat, fiber FROM planned_dish WHERE id = 'meal'";
          const snapshot = await db.getOne(stored);
          expect(snapshot).toEqual({
            completed_at: '2026-01-01T12:00:00',
            calories: 88.04,
            protein: 1.45,
            carbs: 21.28,
            fat: 0.03,
            fiber: 0.11,
          });
          expect(await apply(fishSauce, dippingSauce)).toEqual({ ingredients: 2, dishes: 0 });
          expect(
            await db.getOne(
              'SELECT calories, protein, carbs, fat, fiber FROM ingredient WHERE id = ?',
              [fishSauce.id],
            ),
          ).toEqual({ calories: 35, protein: 5.1, carbs: 3.6, fat: 0.01, fiber: 0 });
          expect(
            await db.getOne(
              'SELECT total_calories, total_protein FROM dish_with_totals WHERE id = ?',
              [dish.id],
            ),
          ).toEqual({ total_calories: 89.64, total_protein: 1.68 });
          expect(await db.getOne(stored)).toEqual(snapshot);
          expect((await apply(fishSauce, dippingSauce)).ingredients).toBe(0);
        });

        it('preserves a deleted ingredient and an edited prepared sauce across launches', async () => {
          await db.execute('DELETE FROM ingredient WHERE id = ?', [fishSauce.id]);
          await db.execute('UPDATE ingredient SET protein = 2 WHERE id = ?', [dippingSauce.id]);
          expect((await apply(fishSauce, dippingSauce)).ingredients).toBe(0);
          expect((await apply(fishSauce, dippingSauce)).ingredients).toBe(0);
          expect(await count('ingredient')).toBe(1);
          expect(
            await db.getOne('SELECT calories, protein FROM ingredient WHERE id = ?', [
              dippingSauce.id,
            ]),
          ).toEqual({ calories: 88.04, protein: 2 });
        });
      });
    }
  });

  it('fresh DB inserts every ingredient + composite + dish and tracker grows by N+M+D', async () => {
    const ing1 = makeIngredient('01');
    const ing2 = makeIngredient('02', { category: 'staple' });
    const comp = makeComposite('11');
    const dish1 = makeDish('21', ing1.id);
    const dish2 = makeDish('22', comp.id, {
      ingredients: [{ ingredient_id: comp.id, gram_weight: 50 }],
    });

    const promise = loader.run();
    flushSeeds([ing1, ing2], [comp], [dish1, dish2]);
    const result = await promise;

    expect(result).toEqual({ ingredients: 3, dishes: 2 });
    expect(loader.dataRevision()).toBe(1);
    expect(await count('ingredient')).toBe(3);
    expect(await count('dish')).toBe(2);
    expect(await count('seed_artifact')).toBe(5);
    expect(await count('dish_ingredient')).toBe(2);
  });

  it('second run on populated DB inserts zero', async () => {
    const ing1 = makeIngredient('01');
    const dish1 = makeDish('21', ing1.id);

    const p1 = loader.run();
    flushSeeds([ing1], [], [dish1]);
    await p1;

    const querySpy = spyOn(db, 'query').and.callThrough();
    const p2 = loader.run();
    flushSeeds([ing1], [], [dish1]);
    const result = await p2;
    const artifactLookupCalls = querySpy.calls
      .allArgs()
      .filter(([sql]) =>
        String(sql).startsWith('SELECT artifact_id, seed_version FROM seed_artifact'),
      );

    expect(result).toEqual({ ingredients: 0, dishes: 0 });
    expect(loader.dataRevision()).toBe(1);
    expect(artifactLookupCalls.length).toBe(1);
    expect(String(artifactLookupCalls[0]?.[0])).toContain('WHERE artifact_id IN (?, ?)');
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
