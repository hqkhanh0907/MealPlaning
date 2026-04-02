import { createDatabaseService, type DatabaseService } from '../../services/databaseService';
import { isMigrationCompleted, isMigrationNeeded, migrateFromLocalStorage } from '../../services/migrationService';
import { createSchema, SCHEMA_TABLES } from '../../services/schema';
import type { V2ExportPayload } from '../../services/syncV2Utils';
import { buildLegacyFormat, createV2Export, detectVersion, importV2Data } from '../../services/syncV2Utils';

/* ------------------------------------------------------------------ */
/*  Mocks                                                               */
/* ------------------------------------------------------------------ */
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

vi.mock('sql.js', async () => {
  const real = await vi.importActual<typeof import('sql.js')>('sql.js');
  return { default: () => real.default() };
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
function setZustandItem(key: string, stateProp: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify({ state: { [stateProp]: value }, version: 0 }));
}

/* ------------------------------------------------------------------ */
/*  Realistic sample data fixtures                                      */
/* ------------------------------------------------------------------ */
const INGREDIENTS = [
  {
    id: 'ing-1',
    name: { vi: 'Gạo', en: 'Rice' },
    caloriesPer100: 130,
    proteinPer100: 2.7,
    carbsPer100: 28,
    fatPer100: 0.3,
    fiberPer100: 0.4,
    unit: { vi: 'gram', en: 'g' },
  },
  {
    id: 'ing-2',
    name: { vi: 'Thịt bò' },
    caloriesPer100: 250,
    proteinPer100: 26,
    carbsPer100: 0,
    fatPer100: 17,
    fiberPer100: 0,
    unit: { vi: 'gram' },
  },
  {
    id: 'ing-3',
    name: { vi: 'Trứng gà', en: 'Chicken egg' },
    caloriesPer100: 155,
    proteinPer100: 13,
    carbsPer100: 1.1,
    fatPer100: 11,
    fiberPer100: 0,
    unit: { vi: 'quả', en: 'egg' },
  },
  {
    id: 'ing-4',
    name: { vi: 'Sữa tươi', en: 'Fresh milk' },
    caloriesPer100: 42,
    proteinPer100: 3.4,
    carbsPer100: 5,
    fatPer100: 1,
    fiberPer100: 0,
    unit: { vi: 'ml', en: 'ml' },
  },
  {
    id: 'ing-5',
    name: { vi: 'Ức gà', en: 'Chicken breast' },
    caloriesPer100: 165,
    proteinPer100: 31,
    carbsPer100: 0,
    fatPer100: 3.6,
    fiberPer100: 0,
    unit: { vi: 'gram', en: 'g' },
  },
];

const DISHES = [
  {
    id: 'dish-1',
    name: { vi: 'Cơm gà', en: 'Chicken rice' },
    ingredients: [
      { ingredientId: 'ing-1', amount: 200 },
      { ingredientId: 'ing-5', amount: 150 },
    ],
    tags: ['lunch', 'dinner'] as const,
    rating: 4,
    notes: 'Món ăn chính',
  },
  {
    id: 'dish-2',
    name: { vi: 'Trứng chiên' },
    ingredients: [{ ingredientId: 'ing-3', amount: 120 }],
    tags: ['breakfast'] as const,
  },
  {
    id: 'dish-3',
    name: { vi: 'Bò xào', en: 'Stir-fried beef' },
    ingredients: [
      { ingredientId: 'ing-2', amount: 200 },
      { ingredientId: 'ing-1', amount: 100 },
    ],
    tags: ['lunch', 'dinner'] as const,
    rating: 5,
    notes: 'Cần thêm rau',
  },
];

const DAY_PLANS = [
  {
    date: '2024-06-15',
    breakfastDishIds: ['dish-2'],
    lunchDishIds: ['dish-1', 'dish-3'],
    dinnerDishIds: ['dish-1'],
    servings: { 'dish-1': 2, 'dish-3': 1 },
  },
  {
    date: '2024-06-16',
    breakfastDishIds: ['dish-2'],
    lunchDishIds: ['dish-3'],
    dinnerDishIds: [],
  },
];

const USER_PROFILE = {
  weight: 83,
  proteinRatio: 2,
  targetCalories: 1500,
};

const MEAL_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'Chế độ giảm cân',
    breakfastDishIds: ['dish-2'],
    lunchDishIds: ['dish-1'],
    dinnerDishIds: ['dish-3'],
    createdAt: '2024-06-01T00:00:00.000Z',
    tags: ['diet'],
  },
  {
    id: 'tpl-2',
    name: 'Bulk plan',
    breakfastDishIds: ['dish-2', 'dish-1'],
    lunchDishIds: ['dish-1', 'dish-3'],
    dinnerDishIds: ['dish-1', 'dish-3'],
    createdAt: '2024-06-10T00:00:00.000Z',
    tags: ['bulk', 'high-protein'],
  },
];

/* ------------------------------------------------------------------ */
/*  Setup all localStorage keys with full data                          */
/* ------------------------------------------------------------------ */
function setupFullLocalStorage() {
  setZustandItem('mp-ingredients', 'ingredients', INGREDIENTS);
  setZustandItem('mp-dishes', 'dishes', DISHES);
  setZustandItem('mp-day-plans', 'dayPlans', DAY_PLANS);
  setZustandItem('mp-user-profile', 'userProfile', USER_PROFILE);
  setZustandItem('meal-templates', 'templates', MEAL_TEMPLATES);
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */
describe('Migration Integration — Full Pipeline', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    localStorage.clear();
    db = createDatabaseService();
    await db.initialize();
    await createSchema(db);
  });

  /* ================================================================ */
  /*  Scenario 1: Full localStorage → SQLite with realistic data       */
  /* ================================================================ */
  describe('Scenario 1: Full localStorage → SQLite migration', () => {
    it('migrates all data types and returns correct counts', async () => {
      setupFullLocalStorage();

      const result = await migrateFromLocalStorage(db);

      expect(result.success).toBe(true);
      expect(result.migratedCounts).toEqual({
        ingredients: 5,
        dishes: 3,
        dishIngredients: 5,
        dayPlans: 2,
        userProfile: true,
        mealTemplates: 2,
      });
    });

    it('verifies all ingredients in SQLite match source data', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const rows = await db.query<Record<string, unknown>>('SELECT * FROM ingredients ORDER BY id');
      expect(rows).toHaveLength(5);

      expect(rows[0]).toMatchObject({
        id: 'ing-1',
        nameVi: 'Gạo',
        nameEn: 'Rice',
        caloriesPer_100: 130,
        proteinPer_100: 2.7,
        carbsPer_100: 28,
        fatPer_100: 0.3,
        fiberPer_100: 0.4,
        unitVi: 'gram',
        unitEn: 'g',
      });

      expect(rows[1]).toMatchObject({
        id: 'ing-2',
        nameVi: 'Thịt bò',
        nameEn: null,
        unitEn: null,
      });

      expect(rows[4]).toMatchObject({
        id: 'ing-5',
        nameVi: 'Ức gà',
        nameEn: 'Chicken breast',
        caloriesPer_100: 165,
        proteinPer_100: 31,
      });
    });

    it('splits dish_ingredients into separate rows correctly', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const dishIngs = await db.query<Record<string, unknown>>(
        'SELECT * FROM dish_ingredients ORDER BY dish_id, ingredient_id',
      );
      expect(dishIngs).toHaveLength(5);

      expect(dishIngs[0]).toMatchObject({ dishId: 'dish-1', ingredientId: 'ing-1', amount: 200 });
      expect(dishIngs[1]).toMatchObject({ dishId: 'dish-1', ingredientId: 'ing-5', amount: 150 });
      expect(dishIngs[2]).toMatchObject({ dishId: 'dish-2', ingredientId: 'ing-3', amount: 120 });
      expect(dishIngs[3]).toMatchObject({ dishId: 'dish-3', ingredientId: 'ing-1', amount: 100 });
      expect(dishIngs[4]).toMatchObject({ dishId: 'dish-3', ingredientId: 'ing-2', amount: 200 });
    });

    it('flattens LocalizedString fields (name.vi → name_vi, name.en → name_en)', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const dishes = await db.query<Record<string, unknown>>('SELECT * FROM dishes ORDER BY id');
      expect(dishes).toHaveLength(3);

      expect(dishes[0]).toMatchObject({
        id: 'dish-1',
        nameVi: 'Cơm gà',
        nameEn: 'Chicken rice',
      });
      expect(dishes[1]).toMatchObject({
        id: 'dish-2',
        nameVi: 'Trứng chiên',
        nameEn: null,
      });
    });

    it('serializes arrays and objects as JSON strings', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const plans = await db.query<Record<string, unknown>>('SELECT * FROM day_plans ORDER BY date');
      expect(plans).toHaveLength(2);

      expect(plans[0]).toMatchObject({
        date: '2024-06-15',
        breakfastDishIds: '["dish-2"]',
        lunchDishIds: '["dish-1","dish-3"]',
        dinnerDishIds: '["dish-1"]',
        servings: '{"dish-1":2,"dish-3":1}',
      });

      expect(plans[1]).toMatchObject({
        date: '2024-06-16',
        servings: null,
      });
    });

    it('stores meal templates with full JSON data', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const tpls = await db.query<Record<string, unknown>>('SELECT * FROM meal_templates ORDER BY id');
      expect(tpls).toHaveLength(2);

      const data1 = JSON.parse(tpls[0].data as string) as Record<string, unknown>;
      expect(data1.name).toBe('Chế độ giảm cân');
      expect(data1.breakfastDishIds).toEqual(['dish-2']);
      expect(data1.tags).toEqual(['diet']);

      const data2 = JSON.parse(tpls[1].data as string) as Record<string, unknown>;
      expect(data2.name).toBe('Bulk plan');
      expect(data2.tags).toEqual(['bulk', 'high-protein']);
    });

    it('migrates user profile with hardcoded defaults', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const profile = await db.queryOne<Record<string, unknown>>('SELECT * FROM user_profile WHERE id = ?', [
        'default',
      ]);
      expect(profile).not.toBeNull();
      expect(profile).toMatchObject({
        id: 'default',
        gender: 'male',
        age: 30,
        heightCm: 170,
        weightKg: 83,
        activityLevel: 'moderate',
        proteinRatio: 2,
        fatPct: 0.25,
      });
      expect(profile?.updatedAt).toBeDefined();
    });

    it('sets mp-migrated-to-sqlite flag after successful migration', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      expect(localStorage.getItem('mp-migrated-to-sqlite')).not.toBeNull();
      expect(isMigrationCompleted()).toBe(true);
    });
  });

  /* ================================================================ */
  /*  Scenario 2: Migration with empty/missing data                    */
  /* ================================================================ */
  describe('Scenario 2: Migration with empty/missing data', () => {
    it('succeeds when all localStorage keys are missing', async () => {
      const result = await migrateFromLocalStorage(db);

      expect(result.success).toBe(true);
      expect(result.migratedCounts).toEqual({
        ingredients: 0,
        dishes: 0,
        dishIngredients: 0,
        dayPlans: 0,
        userProfile: false,
        mealTemplates: 0,
      });
    });

    it('succeeds with only ingredients present (partial data)', async () => {
      setZustandItem('mp-ingredients', 'ingredients', [INGREDIENTS[0]]);

      const result = await migrateFromLocalStorage(db);

      expect(result.success).toBe(true);
      expect(result.migratedCounts?.ingredients).toBe(1);
      expect(result.migratedCounts?.dishes).toBe(0);
      expect(result.migratedCounts?.dayPlans).toBe(0);
      expect(result.migratedCounts?.userProfile).toBe(false);
      expect(result.migratedCounts?.mealTemplates).toBe(0);

      const rows = await db.query<Record<string, unknown>>('SELECT * FROM ingredients');
      expect(rows).toHaveLength(1);
    });

    it('succeeds with empty arrays for some data types', async () => {
      setZustandItem('mp-ingredients', 'ingredients', INGREDIENTS);
      setZustandItem('mp-dishes', 'dishes', []);
      setZustandItem('mp-day-plans', 'dayPlans', []);

      const result = await migrateFromLocalStorage(db);

      expect(result.success).toBe(true);
      expect(result.migratedCounts?.ingredients).toBe(5);
      expect(result.migratedCounts?.dishes).toBe(0);
      expect(result.migratedCounts?.dayPlans).toBe(0);
    });

    it('succeeds when only user profile and templates exist', async () => {
      setZustandItem('mp-user-profile', 'userProfile', USER_PROFILE);
      setZustandItem('meal-templates', 'templates', MEAL_TEMPLATES);

      const result = await migrateFromLocalStorage(db);

      expect(result.success).toBe(true);
      expect(result.migratedCounts?.userProfile).toBe(true);
      expect(result.migratedCounts?.mealTemplates).toBe(2);
      expect(result.migratedCounts?.ingredients).toBe(0);
    });
  });

  /* ================================================================ */
  /*  Scenario 3: Migration rollback on failure                        */
  /* ================================================================ */
  describe('Scenario 3: Migration rollback on failure', () => {
    it('rolls back transaction on FK violation (dish references non-existent ingredient)', async () => {
      const dishWithBadRef = {
        id: 'dish-bad',
        name: { vi: 'Bad dish' },
        ingredients: [{ ingredientId: 'non-existent-ing', amount: 100 }],
        tags: ['lunch'],
      };
      setZustandItem('mp-dishes', 'dishes', [dishWithBadRef]);

      const result = await migrateFromLocalStorage(db);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      const dishes = await db.query<Record<string, unknown>>('SELECT * FROM dishes');
      expect(dishes).toHaveLength(0);

      const dishIngs = await db.query<Record<string, unknown>>('SELECT * FROM dish_ingredients');
      expect(dishIngs).toHaveLength(0);
    });

    it('preserves localStorage unchanged after rollback', async () => {
      const dishWithBadRef = {
        id: 'dish-bad',
        name: { vi: 'Bad dish' },
        ingredients: [{ ingredientId: 'non-existent-ing', amount: 100 }],
        tags: ['lunch'],
      };
      setZustandItem('mp-ingredients', 'ingredients', [INGREDIENTS[0]]);
      setZustandItem('mp-dishes', 'dishes', [dishWithBadRef]);

      const ingredientsBefore = localStorage.getItem('mp-ingredients');
      const dishesBefore = localStorage.getItem('mp-dishes');

      await migrateFromLocalStorage(db);

      expect(localStorage.getItem('mp-ingredients')).toBe(ingredientsBefore);
      expect(localStorage.getItem('mp-dishes')).toBe(dishesBefore);
      expect(localStorage.getItem('mp-migrated-to-sqlite')).toBeNull();
    });

    it('leaves no partial data in SQLite after rollback', async () => {
      const dishWithBadRef = {
        id: 'dish-bad',
        name: { vi: 'Bad dish' },
        ingredients: [{ ingredientId: 'ghost-ingredient', amount: 100 }],
        tags: ['dinner'],
      };
      setZustandItem('mp-ingredients', 'ingredients', INGREDIENTS);
      setZustandItem('mp-dishes', 'dishes', [dishWithBadRef]);
      setZustandItem('mp-user-profile', 'userProfile', USER_PROFILE);

      const result = await migrateFromLocalStorage(db);
      expect(result.success).toBe(false);

      const ingredients = await db.query<Record<string, unknown>>('SELECT * FROM ingredients');
      expect(ingredients).toHaveLength(0);

      const userProfile = await db.query<Record<string, unknown>>('SELECT * FROM user_profile');
      expect(userProfile).toHaveLength(0);
    });
  });

  /* ================================================================ */
  /*  Scenario 4: v1.x → v2.0 format upgrade via syncV2Utils           */
  /* ================================================================ */
  describe('Scenario 4: v1.x → v2.0 format upgrade', () => {
    it('detects v1.x data and auto-upgrades on import', async () => {
      const legacyData: Record<string, unknown> = {
        'mp-ingredients': [
          {
            id: 'ing-1',
            name: { vi: 'Gạo', en: 'Rice' },
            caloriesPer100: 130,
            proteinPer100: 2.7,
            carbsPer100: 28,
            fatPer100: 0.3,
            fiberPer100: 0.4,
            unit: { vi: 'g', en: 'g' },
          },
        ],
        'mp-dishes': [
          {
            id: 'dish-1',
            name: { vi: 'Cơm gà', en: 'Chicken rice' },
            ingredients: [{ ingredientId: 'ing-1', amount: 200 }],
            tags: ['lunch'],
            rating: 4,
          },
        ],
        'mp-day-plans': [
          {
            date: '2024-06-15',
            breakfastDishIds: ['dish-1'],
            lunchDishIds: [],
            dinnerDishIds: [],
          },
        ],
        'mp-user-profile': {
          weight: 83,
          proteinRatio: 2,
          targetCalories: 1500,
        },
        'meal-templates': [
          {
            id: 'tpl-1',
            name: 'Diet plan',
            breakfastDishIds: ['dish-1'],
            lunchDishIds: [],
            dinnerDishIds: [],
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      expect(detectVersion(legacyData)).toBe('1.x');

      const result = await importV2Data(db, legacyData);

      expect(result.success).toBe(true);
      expect(result.importedCounts?.ingredients).toBe(1);
      expect(result.importedCounts?.dishes).toBe(1);
      expect(result.importedCounts?.dish_ingredients).toBe(1);
      expect(result.importedCounts?.day_plans).toBe(1);
      expect(result.importedCounts?.user_profile).toBe(1);
      expect(result.importedCounts?.meal_templates).toBe(1);
    });

    it('imports v1.x data and verifies it in v2.0 flat column format', async () => {
      const legacyData: Record<string, unknown> = {
        'mp-ingredients': [
          {
            id: 'ing-1',
            name: { vi: 'Gạo', en: 'Rice' },
            caloriesPer100: 130,
            proteinPer100: 2.7,
            carbsPer100: 28,
            fatPer100: 0.3,
            fiberPer100: 0.4,
            unit: { vi: 'g', en: 'g' },
          },
        ],
        'mp-dishes': [
          {
            id: 'dish-1',
            name: { vi: 'Cơm gà' },
            ingredients: [{ ingredientId: 'ing-1', amount: 200 }],
            tags: ['lunch'],
          },
        ],
      };

      await importV2Data(db, legacyData);

      const ingredients = await db.query<Record<string, unknown>>('SELECT * FROM ingredients');
      expect(ingredients).toHaveLength(1);
      expect(ingredients[0]).toMatchObject({
        id: 'ing-1',
        nameVi: 'Gạo',
        nameEn: 'Rice',
        caloriesPer_100: 130,
      });

      const dishIngs = await db.query<Record<string, unknown>>('SELECT * FROM dish_ingredients');
      expect(dishIngs).toHaveLength(1);
      expect(dishIngs[0]).toMatchObject({
        dishId: 'dish-1',
        ingredientId: 'ing-1',
        amount: 200,
      });
    });

    it('v2.0 payload imports directly without transformation', async () => {
      const v2Payload: V2ExportPayload = {
        _version: '2.0',
        _exportedAt: new Date().toISOString(),
        _format: 'sqlite-json',
        tables: {
          ingredients: [
            {
              id: 'ing-1',
              name_vi: 'Gạo',
              name_en: 'Rice',
              calories_per_100: 130,
              protein_per_100: 2.7,
              carbs_per_100: 28,
              fat_per_100: 0.3,
              fiber_per_100: 0.4,
              unit_vi: 'g',
              unit_en: 'g',
            },
          ],
          dishes: [{ id: 'dish-1', name_vi: 'Cơm gà', name_en: null, tags: '["lunch"]', rating: null, notes: null }],
          dish_ingredients: [{ dish_id: 'dish-1', ingredient_id: 'ing-1', amount: 200 }],
        },
      };

      expect(detectVersion(v2Payload)).toBe('2.0');

      const result = await importV2Data(db, v2Payload as unknown as Record<string, unknown>);

      expect(result.success).toBe(true);
      expect(result.importedCounts?.ingredients).toBe(1);
      expect(result.importedCounts?.dish_ingredients).toBe(1);
    });
  });

  /* ================================================================ */
  /*  Scenario 5: Data integrity after migration                       */
  /* ================================================================ */
  describe('Scenario 5: Data integrity after migration', () => {
    it('FK constraints hold — dish_ingredients reference valid dishes and ingredients', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const dishIngs = await db.query<Record<string, unknown>>(
        `SELECT di.dish_id, di.ingredient_id
         FROM dish_ingredients di
         INNER JOIN dishes d ON d.id = di.dish_id
         INNER JOIN ingredients i ON i.id = di.ingredient_id`,
      );
      expect(dishIngs).toHaveLength(5);

      const dishIngAll = await db.query<Record<string, unknown>>('SELECT * FROM dish_ingredients');
      expect(dishIngAll).toHaveLength(dishIngs.length);
    });

    it('data types are correct (REAL for numbers, TEXT for strings)', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const ing = await db.queryOne<Record<string, unknown>>('SELECT * FROM ingredients WHERE id = ?', ['ing-1']);
      expect(typeof ing?.caloriesPer_100).toBe('number');
      expect(typeof ing?.proteinPer_100).toBe('number');
      expect(typeof ing?.nameVi).toBe('string');

      const profile = await db.queryOne<Record<string, unknown>>('SELECT * FROM user_profile WHERE id = ?', [
        'default',
      ]);
      expect(typeof profile?.weightKg).toBe('number');
      expect(typeof profile?.age).toBe('number');
      expect(typeof profile?.gender).toBe('string');
      expect(typeof profile?.fatPct).toBe('number');
    });

    it('performance indexes exist and are functional', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const indexes = await db.query<Record<string, unknown>>(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name",
      );
      const indexNames = indexes.map(idx => idx.name);

      expect(indexNames).toContain('idx_dish_ingredients_dish');
      expect(indexNames).toContain('idx_dish_ingredients_ingredient');

      const queryViaIndex = await db.query<Record<string, unknown>>(
        'SELECT * FROM dish_ingredients WHERE dish_id = ?',
        ['dish-1'],
      );
      expect(queryViaIndex).toHaveLength(2);
    });

    it('JSON fields are parseable after migration', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const plans = await db.query<Record<string, unknown>>('SELECT * FROM day_plans');
      for (const plan of plans) {
        expect(() => JSON.parse(plan.breakfastDishIds as string)).not.toThrow();
        expect(() => JSON.parse(plan.lunchDishIds as string)).not.toThrow();
        expect(() => JSON.parse(plan.dinnerDishIds as string)).not.toThrow();
        if (plan.servings !== null) {
          expect(() => JSON.parse(plan.servings as string)).not.toThrow();
        }
      }

      const dishes = await db.query<Record<string, unknown>>('SELECT * FROM dishes');
      for (const dish of dishes) {
        expect(() => JSON.parse(dish.tags as string)).not.toThrow();
      }
    });
  });

  /* ================================================================ */
  /*  Scenario 6: Idempotency                                          */
  /* ================================================================ */
  describe('Scenario 6: Idempotency', () => {
    it('second migration run does not duplicate data or error', async () => {
      setupFullLocalStorage();

      const firstResult = await migrateFromLocalStorage(db);
      expect(firstResult.success).toBe(true);
      expect(firstResult.migratedCounts?.ingredients).toBe(5);

      const secondResult = await migrateFromLocalStorage(db);
      expect(secondResult.success).toBe(true);
      expect(secondResult.migratedCounts).toBeUndefined();

      const ingredients = await db.query<Record<string, unknown>>('SELECT * FROM ingredients');
      expect(ingredients).toHaveLength(5);

      const dishes = await db.query<Record<string, unknown>>('SELECT * FROM dishes');
      expect(dishes).toHaveLength(3);

      const dishIngs = await db.query<Record<string, unknown>>('SELECT * FROM dish_ingredients');
      expect(dishIngs).toHaveLength(5);
    });

    it('isMigrationNeeded returns false after first migration', async () => {
      setupFullLocalStorage();
      expect(isMigrationNeeded()).toBe(true);

      await migrateFromLocalStorage(db);

      expect(isMigrationNeeded()).toBe(false);
      expect(isMigrationCompleted()).toBe(true);
    });

    it('data remains consistent after idempotent run', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const ingredientsBefore = await db.query<Record<string, unknown>>('SELECT * FROM ingredients ORDER BY id');
      const dishesBefore = await db.query<Record<string, unknown>>('SELECT * FROM dishes ORDER BY id');

      await migrateFromLocalStorage(db);

      const ingredientsAfter = await db.query<Record<string, unknown>>('SELECT * FROM ingredients ORDER BY id');
      const dishesAfter = await db.query<Record<string, unknown>>('SELECT * FROM dishes ORDER BY id');

      expect(ingredientsAfter).toEqual(ingredientsBefore);
      expect(dishesAfter).toEqual(dishesBefore);
    });
  });

  /* ================================================================ */
  /*  Scenario: Round-trip migration → export → import                  */
  /* ================================================================ */
  describe('Round-trip: localStorage → SQLite → V2 export → import', () => {
    it('full round-trip preserves data integrity', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const exported = await createV2Export(db);

      expect(exported._version).toBe('2.0');
      expect(exported._format).toBe('sqlite-json');
      expect(exported.tables['ingredients']).toHaveLength(5);
      expect(exported.tables['dishes']).toHaveLength(3);
      expect(exported.tables['dish_ingredients']).toHaveLength(5);

      const db2 = createDatabaseService();
      await db2.initialize();
      await createSchema(db2);

      const importResult = await importV2Data(db2, exported as unknown as Record<string, unknown>);
      expect(importResult.success).toBe(true);

      const ingredients = await db2.query<Record<string, unknown>>('SELECT * FROM ingredients ORDER BY id');
      expect(ingredients).toHaveLength(5);
      expect(ingredients[0]).toMatchObject({ id: 'ing-1', nameVi: 'Gạo' });

      const dishIngs = await db2.query<Record<string, unknown>>(
        'SELECT * FROM dish_ingredients ORDER BY dish_id, ingredient_id',
      );
      expect(dishIngs).toHaveLength(5);
    });

    it('buildLegacyFormat reconstructs v1.x structure from migrated data', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const exported = await createV2Export(db);
      const legacy = buildLegacyFormat(exported.tables);

      const legacyIngredients = legacy['mp-ingredients'] as Array<Record<string, unknown>>;
      expect(legacyIngredients).toHaveLength(5);
      expect(legacyIngredients[0]).toMatchObject({
        id: 'ing-1',
        name: { vi: 'Gạo', en: 'Rice' },
        caloriesPer100: 130,
      });

      const legacyDishes = legacy['mp-dishes'] as Array<Record<string, unknown>>;
      expect(legacyDishes).toHaveLength(3);
      const dish1Ings = legacyDishes[0].ingredients as Array<Record<string, unknown>>;
      expect(dish1Ings).toHaveLength(2);
      expect(dish1Ings[0]).toMatchObject({ ingredientId: 'ing-1', amount: 200 });

      const legacyProfile = legacy['mp-user-profile'] as Record<string, unknown>;
      expect(legacyProfile.weight).toBe(83);
      expect(legacyProfile.proteinRatio).toBe(2);
    });

    it('v1.x legacy format can be re-imported as v1.x and still work', async () => {
      setupFullLocalStorage();
      await migrateFromLocalStorage(db);

      const exported = await createV2Export(db);
      const legacy = buildLegacyFormat(exported.tables);

      const db3 = createDatabaseService();
      await db3.initialize();
      await createSchema(db3);

      const result = await importV2Data(db3, legacy);
      expect(result.success).toBe(true);
      expect(result.importedCounts?.ingredients).toBe(5);
      expect(result.importedCounts?.dishes).toBe(3);

      const ingredientsInDb3 = await db3.query<Record<string, unknown>>('SELECT * FROM ingredients ORDER BY id');
      expect(ingredientsInDb3).toHaveLength(5);
    });
  });

  /* ================================================================ */
  /*  Scenario: Schema completeness                                     */
  /* ================================================================ */
  describe('Schema completeness', () => {
    it('all 19 SCHEMA_TABLES exist after initialization', async () => {
      const tables = await db.query<Record<string, unknown>>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      );
      const tableNames = new Set(tables.map(t => t.name));

      for (const expected of SCHEMA_TABLES) {
        expect(tableNames).toContain(expected);
      }
    });

    it('V2 export includes all 19 table keys', async () => {
      const exported = await createV2Export(db);

      for (const tableName of SCHEMA_TABLES) {
        expect(exported.tables).toHaveProperty(tableName);
        expect(Array.isArray(exported.tables[tableName])).toBe(true);
      }
    });
  });
});
