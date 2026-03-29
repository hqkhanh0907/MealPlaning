import { createDatabaseService, type DatabaseService } from '../services/databaseService';
import { createSchema, getSchemaVersion, SCHEMA_VERSION } from '../services/schema';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

vi.mock('sql.js', async () => {
  const real = await vi.importActual<typeof import('sql.js')>('sql.js');
  return { default: () => real.default() };
});

const EXPECTED_TABLES = [
  'ingredients',
  'dishes',
  'dish_ingredients',
  'day_plans',
  'meal_templates',
  'user_profile',
  'goals',
  'training_profile',
  'training_plans',
  'training_plan_days',
  'exercises',
  'workouts',
  'workout_sets',
  'weight_log',
  'daily_log',
  'adjustments',
  'fitness_profiles',
  'fitness_preferences',
  'workout_drafts',
  'app_settings',
  'grocery_checked',
];

const EXPECTED_INDEXES = [
  'idx_workout_sets_workout',
  'idx_workout_sets_exercise',
  'idx_weight_log_date',
  'idx_daily_log_date',
  'idx_workouts_date',
  'idx_goals_active',
  'idx_adjustments_date',
  'idx_dish_ingredients_dish',
  'idx_dish_ingredients_ingredient',
  'idx_plan_day_session',
];

describe('createSchema', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = createDatabaseService();
    await db.initialize();
    await createSchema(db);
  });

  it('creates all 21 tables', async () => {
    const tables = await db.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );
    expect(tables).toHaveLength(21);
  });

  it.each(EXPECTED_TABLES)('table "%s" exists in sqlite_master', async (tableName) => {
    const result = await db.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName],
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe(tableName);
  });

  it('enforces FK constraints — invalid dish_id in dish_ingredients is rejected', async () => {
    await db.execute(
      `INSERT INTO ingredients (id, name_vi, calories_per_100, protein_per_100, carbs_per_100, fat_per_100, fiber_per_100, unit_vi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['ing-1', 'Gạo', 130, 2.7, 28, 0.3, 0.4, 'gram'],
    );

    await expect(
      db.execute('INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?, ?, ?)', [
        'non-existent-dish',
        'ing-1',
        100,
      ]),
    ).rejects.toThrow();
  });

  it('enforces CHECK constraints — invalid gender in user_profile is rejected', async () => {
    await expect(
      db.execute(
        `INSERT INTO user_profile (id, gender, age, height_cm, weight_kg, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['test', 'invalid', 25, 175, 70, '2024-01-01'],
      ),
    ).rejects.toThrow();
  });

  it('creates all performance indexes', async () => {
    const indexes = await db.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'",
    );
    const indexNames = indexes.map((row) => row.name);
    for (const expected of EXPECTED_INDEXES) {
      expect(indexNames).toContain(expected);
    }
    expect(indexes).toHaveLength(EXPECTED_INDEXES.length);
  });

  it('sets schema version to current SCHEMA_VERSION', async () => {
    const version = await getSchemaVersion(db);
    expect(version).toBe(SCHEMA_VERSION);
    expect(version).toBe(3);
  });

  it('is idempotent — running createSchema twice does not error', async () => {
    await expect(createSchema(db)).resolves.toBeUndefined();

    const tables = await db.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );
    expect(tables).toHaveLength(21);
  });

  it('enforces UNIQUE constraint — duplicate date in weight_log is rejected', async () => {
    await db.execute(
      `INSERT INTO weight_log (id, date, weight_kg, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['wl-1', '2024-01-01', 70.5, null, '2024-01-01', '2024-01-01'],
    );

    await expect(
      db.execute(
        `INSERT INTO weight_log (id, date, weight_kg, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['wl-2', '2024-01-01', 71.0, null, '2024-01-02', '2024-01-02'],
      ),
    ).rejects.toThrow();
  });
});
