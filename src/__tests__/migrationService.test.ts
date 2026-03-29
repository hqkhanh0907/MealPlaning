import { createDatabaseService, type DatabaseService } from '../services/databaseService';
import {
  migrateFromLocalStorage,
  isMigrationNeeded,
  isMigrationCompleted,
  migrateFitnessData,
  isFitnessMigrationCompleted,
} from '../services/migrationService';
import { createSchema } from '../services/schema';

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

const SAMPLE_INGREDIENT = {
  id: 'ing-1',
  name: { vi: 'Gạo', en: 'Rice' },
  caloriesPer100: 130,
  proteinPer100: 2.7,
  carbsPer100: 28,
  fatPer100: 0.3,
  fiberPer100: 0.4,
  unit: { vi: 'gram', en: 'g' },
};

const SAMPLE_INGREDIENT_NO_EN = {
  id: 'ing-2',
  name: { vi: 'Thịt bò' },
  caloriesPer100: 250,
  proteinPer100: 26,
  carbsPer100: 0,
  fatPer100: 17,
  fiberPer100: 0,
  unit: { vi: 'gram' },
};

const SAMPLE_DISH = {
  id: 'dish-1',
  name: { vi: 'Cơm gà', en: 'Chicken rice' },
  ingredients: [
    { ingredientId: 'ing-1', amount: 200 },
    { ingredientId: 'ing-2', amount: 150 },
  ],
  tags: ['lunch', 'dinner'],
  rating: 4,
  notes: 'Món ngon',
};

const SAMPLE_DAY_PLAN = {
  date: '2024-06-15',
  breakfastDishIds: ['dish-1'],
  lunchDishIds: ['dish-1'],
  dinnerDishIds: [],
  servings: { 'dish-1': 2 },
};

const SAMPLE_USER_PROFILE = {
  weight: 83,
  proteinRatio: 2,
  targetCalories: 1500,
};

const SAMPLE_MEAL_TEMPLATE = {
  id: 'tpl-1',
  name: 'Chế độ giảm cân',
  breakfastDishIds: ['dish-1'],
  lunchDishIds: ['dish-1'],
  dinnerDishIds: [],
  createdAt: '2024-06-01T00:00:00.000Z',
  tags: ['diet'],
};

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */
describe('migrationService', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    localStorage.clear();
    db = createDatabaseService();
    await db.initialize();
    await createSchema(db);
  });

  /* --- Ingredient migration --- */

  it('migrates ingredients correctly (LocalizedString → flat columns)', async () => {
    setZustandItem('mp-ingredients', 'ingredients', [SAMPLE_INGREDIENT, SAMPLE_INGREDIENT_NO_EN]);

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.ingredients).toBe(2);

    const rows = await db.query<Record<string, unknown>>(
      'SELECT * FROM ingredients ORDER BY id',
    );
    expect(rows).toHaveLength(2);
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
  });

  /* --- Dish migration --- */

  it('migrates dishes correctly (splits into dishes + dish_ingredients)', async () => {
    setZustandItem('mp-ingredients', 'ingredients', [SAMPLE_INGREDIENT, SAMPLE_INGREDIENT_NO_EN]);
    setZustandItem('mp-dishes', 'dishes', [SAMPLE_DISH]);

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.dishes).toBe(1);
    expect(result.migratedCounts?.dishIngredients).toBe(2);

    const dishes = await db.query<Record<string, unknown>>('SELECT * FROM dishes');
    expect(dishes).toHaveLength(1);
    expect(dishes[0]).toMatchObject({
      id: 'dish-1',
      nameVi: 'Cơm gà',
      nameEn: 'Chicken rice',
      tags: '["lunch","dinner"]',
      rating: 4,
      notes: 'Món ngon',
    });

    const dishIngs = await db.query<Record<string, unknown>>(
      'SELECT * FROM dish_ingredients ORDER BY ingredient_id',
    );
    expect(dishIngs).toHaveLength(2);
    expect(dishIngs[0]).toMatchObject({ dishId: 'dish-1', ingredientId: 'ing-1', amount: 200 });
    expect(dishIngs[1]).toMatchObject({ dishId: 'dish-1', ingredientId: 'ing-2', amount: 150 });
  });

  /* --- Day plan migration --- */

  it('migrates day plans correctly (arrays → JSON strings)', async () => {
    setZustandItem('mp-day-plans', 'dayPlans', [SAMPLE_DAY_PLAN]);

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.dayPlans).toBe(1);

    const plans = await db.query<Record<string, unknown>>('SELECT * FROM day_plans');
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({
      date: '2024-06-15',
      breakfastDishIds: '["dish-1"]',
      lunchDishIds: '["dish-1"]',
      dinnerDishIds: '[]',
      servings: '{"dish-1":2}',
    });
  });

  /* --- User profile migration --- */

  it('migrates user profile with defaults for missing fields', async () => {
    setZustandItem('mp-user-profile', 'userProfile', SAMPLE_USER_PROFILE);

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.userProfile).toBe(true);

    const profile = await db.queryOne<Record<string, unknown>>(
      'SELECT * FROM user_profile WHERE id = ?',
      ['default'],
    );
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

  /* --- Meal template migration --- */

  it('migrates meal templates', async () => {
    setZustandItem('meal-templates', 'templates', [SAMPLE_MEAL_TEMPLATE]);

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.mealTemplates).toBe(1);

    const templates = await db.query<Record<string, unknown>>('SELECT * FROM meal_templates');
    expect(templates).toHaveLength(1);
    expect(templates[0]).toMatchObject({
      id: 'tpl-1',
      name: 'Chế độ giảm cân',
    });

    const data = JSON.parse(templates[0].data as string) as Record<string, unknown>;
    expect(data.breakfastDishIds).toEqual(['dish-1']);
    expect(data.tags).toEqual(['diet']);
  });

  /* --- Full migration in transaction --- */

  it('full migration in transaction — all data present', async () => {
    setZustandItem('mp-ingredients', 'ingredients', [SAMPLE_INGREDIENT, SAMPLE_INGREDIENT_NO_EN]);
    setZustandItem('mp-dishes', 'dishes', [SAMPLE_DISH]);
    setZustandItem('mp-day-plans', 'dayPlans', [SAMPLE_DAY_PLAN]);
    setZustandItem('mp-user-profile', 'userProfile', SAMPLE_USER_PROFILE);
    setZustandItem('meal-templates', 'templates', [SAMPLE_MEAL_TEMPLATE]);

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts).toEqual({
      ingredients: 2,
      dishes: 1,
      dishIngredients: 2,
      dayPlans: 1,
      userProfile: true,
      mealTemplates: 1,
    });

    const ingCount = await db.query<Record<string, unknown>>('SELECT COUNT(*) as c FROM ingredients');
    expect(ingCount[0].c).toBe(2);
    const dishCount = await db.query<Record<string, unknown>>('SELECT COUNT(*) as c FROM dishes');
    expect(dishCount[0].c).toBe(1);
    const diCount = await db.query<Record<string, unknown>>('SELECT COUNT(*) as c FROM dish_ingredients');
    expect(diCount[0].c).toBe(2);
    const dpCount = await db.query<Record<string, unknown>>('SELECT COUNT(*) as c FROM day_plans');
    expect(dpCount[0].c).toBe(1);
    const upCount = await db.query<Record<string, unknown>>('SELECT COUNT(*) as c FROM user_profile');
    expect(upCount[0].c).toBe(1);
    const mtCount = await db.query<Record<string, unknown>>('SELECT COUNT(*) as c FROM meal_templates');
    expect(mtCount[0].c).toBe(1);
  });

  /* --- Rollback on error --- */

  it('rolls back on error (simulate FK violation)', async () => {
    const dishWithBadIngredient = {
      id: 'dish-bad',
      name: { vi: 'Bad dish' },
      ingredients: [{ ingredientId: 'non-existent-ingredient', amount: 100 }],
      tags: ['lunch'],
    };
    setZustandItem('mp-dishes', 'dishes', [dishWithBadIngredient]);

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    const dishes = await db.query<Record<string, unknown>>('SELECT * FROM dishes');
    expect(dishes).toHaveLength(0);
  });

  /* --- Skips if already migrated --- */

  it('skips if already migrated', async () => {
    localStorage.setItem('mp-migrated-to-sqlite', Date.now().toString());
    setZustandItem('mp-ingredients', 'ingredients', [SAMPLE_INGREDIENT]);

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts).toBeUndefined();

    const rows = await db.query<Record<string, unknown>>('SELECT * FROM ingredients');
    expect(rows).toHaveLength(0);
  });

  /* --- Handles empty localStorage --- */

  it('handles empty localStorage gracefully', async () => {
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

  /* --- Handles malformed JSON --- */

  it('handles malformed JSON', async () => {
    localStorage.setItem('mp-ingredients', 'not valid json {{{');

    const result = await migrateFromLocalStorage(db);

    // Malformed JSON is gracefully skipped (returns null from parseZustand)
    expect(result.success).toBe(true);
    expect(result.migratedCounts?.ingredients).toBe(0);
  });

  /* --- Sets migration flag on success --- */

  it('sets migration flag on success', async () => {
    setZustandItem('mp-ingredients', 'ingredients', [SAMPLE_INGREDIENT]);

    await migrateFromLocalStorage(db);

    expect(localStorage.getItem('mp-migrated-to-sqlite')).not.toBeNull();
  });

  /* --- Returns correct counts --- */

  it('returns correct counts', async () => {
    setZustandItem('mp-ingredients', 'ingredients', [SAMPLE_INGREDIENT]);
    setZustandItem('mp-dishes', 'dishes', [
      {
        id: 'dish-a',
        name: { vi: 'Dish A' },
        ingredients: [{ ingredientId: 'ing-1', amount: 50 }],
        tags: ['breakfast'],
      },
      {
        id: 'dish-b',
        name: { vi: 'Dish B' },
        ingredients: [{ ingredientId: 'ing-1', amount: 100 }],
        tags: ['dinner'],
      },
    ]);
    setZustandItem('meal-templates', 'templates', [SAMPLE_MEAL_TEMPLATE]);

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.ingredients).toBe(1);
    expect(result.migratedCounts?.dishes).toBe(2);
    expect(result.migratedCounts?.dishIngredients).toBe(2);
    expect(result.migratedCounts?.mealTemplates).toBe(1);
    expect(result.migratedCounts?.dayPlans).toBe(0);
    expect(result.migratedCounts?.userProfile).toBe(false);
  });

  /* --- isMigrationNeeded --- */

  it('isMigrationNeeded() returns true when data exists', () => {
    setZustandItem('mp-ingredients', 'ingredients', [SAMPLE_INGREDIENT]);

    expect(isMigrationNeeded()).toBe(true);
  });

  it('isMigrationNeeded() returns false when already migrated', () => {
    localStorage.setItem('mp-migrated-to-sqlite', Date.now().toString());
    setZustandItem('mp-ingredients', 'ingredients', [SAMPLE_INGREDIENT]);

    expect(isMigrationNeeded()).toBe(false);
  });

  it('isMigrationNeeded() returns false when localStorage is empty', () => {
    expect(isMigrationNeeded()).toBe(false);
  });

  /* --- readZustandState edge cases (branch coverage) --- */

  it('handles localStorage value that is valid JSON but not an object (e.g. string)', async () => {
    localStorage.setItem('mp-ingredients', '"just a string"');

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.ingredients).toBe(0);
  });

  it('handles localStorage value that is valid JSON null', async () => {
    localStorage.setItem('mp-ingredients', 'null');

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.ingredients).toBe(0);
  });

  it('handles Zustand state property being null', async () => {
    localStorage.setItem('mp-ingredients', JSON.stringify({ state: null, version: 0 }));

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.ingredients).toBe(0);
  });

  it('handles Zustand state property missing the expected key', async () => {
    localStorage.setItem(
      'mp-ingredients',
      JSON.stringify({ state: { somethingElse: [] }, version: 0 }),
    );

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.ingredients).toBe(0);
  });

  /* --- readZustandState legacy array format (lines 60-61) --- */

  it('handles legacy format — raw array stored without Zustand wrapper', async () => {
    localStorage.setItem('mp-ingredients', JSON.stringify([SAMPLE_INGREDIENT]));

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.ingredients).toBe(1);
  });

  it('handles legacy format — raw array for day plans', async () => {
    localStorage.setItem('mp-day-plans', JSON.stringify([SAMPLE_DAY_PLAN]));

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.dayPlans).toBe(1);
  });

  it('returns null for object with no state and not an array', async () => {
    localStorage.setItem('mp-ingredients', JSON.stringify({ noState: true }));

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.ingredients).toBe(0);
  });

  /* --- Day plan with no servings (line 115 branch) --- */

  it('migrates day plan with undefined servings', async () => {
    const planNoServings = {
      date: '2024-07-01',
      breakfastDishIds: [],
      lunchDishIds: [],
      dinnerDishIds: [],
    };
    setZustandItem('mp-day-plans', 'dayPlans', [planNoServings]);

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(true);
    expect(result.migratedCounts?.dayPlans).toBe(1);

    const plans = await db.query<Record<string, unknown>>('SELECT * FROM day_plans');
    expect(plans[0].servings).toBeNull();
  });

  /* --- Non-Error thrown in catch (line 218 branch) --- */

  it('handles non-Error thrown during migration', async () => {
    setZustandItem('mp-ingredients', 'ingredients', [SAMPLE_INGREDIENT]);
    const originalTransaction = db.transaction.bind(db);
    db.transaction = async (fn: () => Promise<void>) => {
      await originalTransaction(async () => {
        await fn();
        throw 'string error';
      });
    };

    const result = await migrateFromLocalStorage(db);

    expect(result.success).toBe(false);
    expect(result.error).toBe('string error');
  });

  /* --- isMigrationCompleted --- */

  it('isMigrationCompleted() returns false initially', () => {
    expect(isMigrationCompleted()).toBe(false);
  });

  it('isMigrationCompleted() returns true after migration', async () => {
    setZustandItem('mp-ingredients', 'ingredients', [SAMPLE_INGREDIENT]);
    await migrateFromLocalStorage(db);

    expect(isMigrationCompleted()).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  Fitness migration tests                                             */
/* ------------------------------------------------------------------ */
describe('migrateFitnessData', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    localStorage.clear();
    db = createDatabaseService();
    await db.initialize();
    await createSchema(db);
  });

  it('migrates localStorage fitness data to SQLite', async () => {
    localStorage.setItem(
      'fitness-storage',
      JSON.stringify({
        state: {
          trainingProfile: {
            trainingExperience: 'intermediate',
            trainingGoal: 'strength',
            daysPerWeek: 4,
          },
          workouts: [
            {
              id: 'w1',
              date: '2026-03-20',
              name: 'Push',
              durationMin: 45,
              createdAt: '2026-03-20T10:00:00Z',
              updatedAt: '2026-03-20T10:00:00Z',
            },
          ],
          workoutSets: [
            {
              id: 's1',
              workoutId: 'w1',
              exerciseId: 'bench',
              setNumber: 1,
              reps: 8,
              weightKg: 80,
              updatedAt: '2026-03-20T10:00:00Z',
            },
          ],
        },
        version: 1,
      }),
    );

    const result = await migrateFitnessData(db);

    expect(result.migrated).toBe(true);
    expect(result.recordCount).toBe(3);
  });

  it('inserts profile into fitness_profiles table', async () => {
    localStorage.setItem(
      'fitness-storage',
      JSON.stringify({
        state: {
          trainingProfile: {
            trainingExperience: 'advanced',
            trainingGoal: 'hypertrophy',
            daysPerWeek: 5,
          },
        },
        version: 1,
      }),
    );

    await migrateFitnessData(db);

    const profiles = await db.query<Record<string, unknown>>(
      'SELECT * FROM fitness_profiles WHERE id = ?',
      ['default'],
    );
    expect(profiles).toHaveLength(1);
    expect(profiles[0].experience).toBe('advanced');
    expect(profiles[0].goal).toBe('hypertrophy');
    expect(profiles[0].daysPerWeek).toBe(5);
  });

  it('inserts workouts into workouts table', async () => {
    localStorage.setItem(
      'fitness-storage',
      JSON.stringify({
        state: {
          workouts: [
            {
              id: 'w1',
              date: '2026-03-20',
              name: 'Push',
              durationMin: 45,
              notes: 'Good session',
              createdAt: '2026-03-20T10:00:00Z',
              updatedAt: '2026-03-20T10:00:00Z',
            },
          ],
        },
        version: 1,
      }),
    );

    await migrateFitnessData(db);

    const rows = await db.query<Record<string, unknown>>('SELECT * FROM workouts WHERE id = ?', [
      'w1',
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Push');
    expect(rows[0].durationMin).toBe(45);
  });

  it('inserts workout sets into workout_sets table', async () => {
    localStorage.setItem(
      'fitness-storage',
      JSON.stringify({
        state: {
          workouts: [
            {
              id: 'w1',
              date: '2026-03-20',
              name: 'Push',
              createdAt: '2026-03-20T10:00:00Z',
              updatedAt: '2026-03-20T10:00:00Z',
            },
          ],
          workoutSets: [
            {
              id: 's1',
              workoutId: 'w1',
              exerciseId: 'bench',
              setNumber: 1,
              reps: 8,
              weightKg: 80,
              rpe: 8.5,
              restSeconds: 120,
              updatedAt: '2026-03-20T10:00:00Z',
            },
          ],
        },
        version: 1,
      }),
    );

    await migrateFitnessData(db);

    const rows = await db.query<Record<string, unknown>>(
      'SELECT * FROM workout_sets WHERE id = ?',
      ['s1'],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].workoutId).toBe('w1');
    expect(rows[0].reps).toBe(8);
    expect(rows[0].weightKg).toBe(80);
  });

  it('skips migration if already done', async () => {
    localStorage.setItem('fitness_migrated_to_sqlite', 'true');
    localStorage.setItem(
      'fitness-storage',
      JSON.stringify({
        state: {
          workouts: [
            {
              id: 'w1',
              date: '2026-03-20',
              name: 'Push',
              createdAt: '2026-03-20T10:00:00Z',
              updatedAt: '2026-03-20T10:00:00Z',
            },
          ],
        },
        version: 1,
      }),
    );

    const result = await migrateFitnessData(db);

    expect(result.migrated).toBe(false);
    expect(result.recordCount).toBe(0);
  });

  it('sets migration flag after successful migration', async () => {
    localStorage.setItem(
      'fitness-storage',
      JSON.stringify({
        state: { workouts: [] },
        version: 1,
      }),
    );

    await migrateFitnessData(db);

    expect(isFitnessMigrationCompleted()).toBe(true);
  });

  it('handles empty fitness-storage (no localStorage key)', async () => {
    const result = await migrateFitnessData(db);

    expect(result.migrated).toBe(false);
    expect(result.recordCount).toBe(0);
    expect(isFitnessMigrationCompleted()).toBe(true);
  });

  it('handles malformed JSON in fitness-storage', async () => {
    localStorage.setItem('fitness-storage', 'not valid json {{{');

    const result = await migrateFitnessData(db);

    expect(result.migrated).toBe(false);
    expect(result.recordCount).toBe(0);
  });

  it('handles fitness-storage with null state', async () => {
    localStorage.setItem(
      'fitness-storage',
      JSON.stringify({ state: null, version: 1 }),
    );

    const result = await migrateFitnessData(db);

    expect(result.migrated).toBe(false);
    expect(result.recordCount).toBe(0);
  });

  it('handles fitness-storage that is not an object', async () => {
    localStorage.setItem('fitness-storage', '"just a string"');

    const result = await migrateFitnessData(db);

    expect(result.migrated).toBe(false);
    expect(result.recordCount).toBe(0);
  });

  it('handles profile with missing fields using defaults', async () => {
    localStorage.setItem(
      'fitness-storage',
      JSON.stringify({
        state: {
          trainingProfile: {},
        },
        version: 1,
      }),
    );

    await migrateFitnessData(db);

    const profiles = await db.query<Record<string, unknown>>(
      'SELECT * FROM fitness_profiles WHERE id = ?',
      ['default'],
    );
    expect(profiles).toHaveLength(1);
    expect(profiles[0].experience).toBe('beginner');
    expect(profiles[0].goal).toBe('general');
    expect(profiles[0].daysPerWeek).toBe(3);
  });

  it('handles workouts with missing optional fields', async () => {
    localStorage.setItem(
      'fitness-storage',
      JSON.stringify({
        state: {
          workouts: [
            {
              id: 'w-minimal',
              date: '2026-03-20',
              name: 'Quick session',
            },
          ],
        },
        version: 1,
      }),
    );

    await migrateFitnessData(db);

    const rows = await db.query<Record<string, unknown>>('SELECT * FROM workouts WHERE id = ?', [
      'w-minimal',
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].durationMin).toBeNull();
    expect(rows[0].notes).toBeNull();
  });

  it('isFitnessMigrationCompleted returns false initially', () => {
    expect(isFitnessMigrationCompleted()).toBe(false);
  });

  it('isFitnessMigrationCompleted returns true after migration flag is set', () => {
    localStorage.setItem('fitness_migrated_to_sqlite', Date.now().toString());
    expect(isFitnessMigrationCompleted()).toBe(true);
  });

  it('rolls back on transaction failure and returns error', async () => {
    localStorage.setItem(
      'fitness-storage',
      JSON.stringify({
        state: {
          workouts: [
            {
              id: 'w1',
              date: '2026-03-20',
              name: 'Push',
              createdAt: '2026-03-20T10:00:00Z',
              updatedAt: '2026-03-20T10:00:00Z',
            },
          ],
        },
        version: 1,
      }),
    );

    const originalTransaction = db.transaction.bind(db);
    db.transaction = async (fn: () => Promise<void>) => {
      await originalTransaction(async () => {
        await fn();
        throw new Error('forced rollback');
      });
    };

    const result = await migrateFitnessData(db);

    expect(result.migrated).toBe(false);
    expect(result.error).toContain('forced rollback');

    const rows = await db.query<Record<string, unknown>>('SELECT * FROM workouts WHERE id = ?', [
      'w1',
    ]);
    expect(rows).toHaveLength(0);
  });

  it('handles non-Error thrown during migration', async () => {
    localStorage.setItem(
      'fitness-storage',
      JSON.stringify({
        state: { workouts: [] },
        version: 1,
      }),
    );

    const originalTransaction = db.transaction.bind(db);
    db.transaction = async (fn: () => Promise<void>) => {
      await originalTransaction(async () => {
        await fn();
        throw 'string error';
      });
    };

    const result = await migrateFitnessData(db);

    expect(result.migrated).toBe(false);
    expect(result.error).toBe('string error');
  });
});
