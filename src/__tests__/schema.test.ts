import { createDatabaseService, type DatabaseService } from '../services/databaseService';
import { createSchema, getSchemaVersion, runSchemaMigrations, SCHEMA_VERSION } from '../services/schema';

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
  'plan_templates',
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

  it('creates all 22 tables', async () => {
    const tables = await db.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );
    expect(tables).toHaveLength(22);
  });

  it.each(EXPECTED_TABLES)('table "%s" exists in sqlite_master', async tableName => {
    const result = await db.query<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [
      tableName,
    ]);
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
    const indexNames = indexes.map(row => row.name);
    for (const expected of EXPECTED_INDEXES) {
      expect(indexNames).toContain(expected);
    }
    expect(indexes).toHaveLength(EXPECTED_INDEXES.length);
  });

  it('sets schema version to current SCHEMA_VERSION', async () => {
    const version = await getSchemaVersion(db);
    expect(version).toBe(SCHEMA_VERSION);
    expect(version).toBe(5);
  });

  it('is idempotent — running createSchema twice does not error', async () => {
    await expect(createSchema(db)).resolves.toBeUndefined();

    const tables = await db.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );
    expect(tables).toHaveLength(22);
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

/* ================================================================== */
/* runSchemaMigrations tests */
/* ================================================================== */

async function createV1Schema(db: DatabaseService): Promise<void> {
  await db.execute('PRAGMA foreign_keys = ON');

  await db.execute(`CREATE TABLE IF NOT EXISTS training_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    split_type TEXT NOT NULL DEFAULT '',
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    current_week INTEGER NOT NULL DEFAULT 1,
    start_date TEXT NOT NULL DEFAULT '',
    end_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS training_plan_days (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    plan_id TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
    workout_type TEXT NOT NULL,
    muscle_groups TEXT,
    exercises TEXT,
    notes TEXT
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    duration_min INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    gender TEXT NOT NULL CHECK(gender IN ('male','female')) DEFAULT 'male',
    age INTEGER NOT NULL DEFAULT 30,
    height_cm REAL NOT NULL DEFAULT 170,
    weight_kg REAL NOT NULL DEFAULT 70,
    activity_level TEXT NOT NULL DEFAULT 'moderate',
    body_fat_pct REAL,
    bmr_override REAL,
    protein_ratio REAL NOT NULL DEFAULT 2.0,
    fat_pct REAL NOT NULL DEFAULT 0.25,
    target_calories INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await db.execute('PRAGMA user_version = 1');
}

async function createV2Schema(db: DatabaseService): Promise<void> {
  await db.execute('PRAGMA foreign_keys = ON');

  await db.execute(`CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    gender TEXT NOT NULL CHECK(gender IN ('male','female')) DEFAULT 'male',
    age INTEGER NOT NULL DEFAULT 30,
    height_cm REAL NOT NULL DEFAULT 170,
    weight_kg REAL NOT NULL DEFAULT 70,
    activity_level TEXT NOT NULL DEFAULT 'moderate',
    body_fat_pct REAL,
    bmr_override REAL,
    protein_ratio REAL NOT NULL DEFAULT 2.0,
    fat_pct REAL NOT NULL DEFAULT 0.25,
    target_calories INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS training_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    split_type TEXT NOT NULL DEFAULT '',
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    current_week INTEGER NOT NULL DEFAULT 1,
    start_date TEXT NOT NULL DEFAULT '',
    end_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS training_plan_days (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    plan_id TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
    session_order INTEGER NOT NULL DEFAULT 1,
    workout_type TEXT NOT NULL,
    muscle_groups TEXT,
    exercises TEXT,
    original_exercises TEXT,
    notes TEXT
  )`);

  await db.execute('PRAGMA user_version = 2');
}

describe('runSchemaMigrations', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = createDatabaseService();
    await db.initialize();
  });

  it('returns early when schema version is already current', async () => {
    await createSchema(db);
    const versionBefore = await getSchemaVersion(db);
    expect(versionBefore).toBe(SCHEMA_VERSION);

    await runSchemaMigrations(db);

    const versionAfter = await getSchemaVersion(db);
    expect(versionAfter).toBe(SCHEMA_VERSION);
  });

  it('migrates from v1 → v2 → v3', async () => {
    await createV1Schema(db);
    expect(await getSchemaVersion(db)).toBe(1);

    await db.execute(`INSERT INTO training_plans (id, name, start_date)
                      VALUES ('plan-1', 'Test Plan', '2024-01-01')`);
    await db.execute(`INSERT INTO training_plan_days (id, plan_id, day_of_week, workout_type, exercises)
                      VALUES ('day-1', 'plan-1', 1, 'push', '["bench","ohp"]')`);
    await db.execute(`INSERT INTO user_profile (id, gender, age, height_cm, weight_kg, updated_at)
                      VALUES ('default', 'male', 30, 175, 70, '2024-01-01')`);

    await runSchemaMigrations(db);

    expect(await getSchemaVersion(db)).toBe(SCHEMA_VERSION);

    const days = await db.query<Record<string, unknown>>('SELECT * FROM training_plan_days WHERE id = ?', ['day-1']);
    expect(days).toHaveLength(1);
    expect(days[0].sessionOrder).toBe(1);
    expect(days[0].originalExercises).toBe('["bench","ohp"]');

    const workoutCols = await db.query<{ name: string }>('PRAGMA table_info(workouts)');
    const colNames = workoutCols.map(c => c.name);
    expect(colNames).toContain('plan_day_id');

    const profileCols = await db.query<{ name: string }>('PRAGMA table_info(user_profile)');
    const profileColNames = profileCols.map(c => c.name);
    expect(profileColNames).toContain('name');
    expect(profileColNames).toContain('date_of_birth');
  });

  it('migrates from v2 → v3 only', async () => {
    await createV2Schema(db);
    expect(await getSchemaVersion(db)).toBe(2);

    await db.execute(`INSERT INTO user_profile (id, gender, age, height_cm, weight_kg, updated_at)
                      VALUES ('default', 'female', 25, 165, 55, '2024-06-01')`);

    await runSchemaMigrations(db);

    expect(await getSchemaVersion(db)).toBe(SCHEMA_VERSION);

    const profileCols = await db.query<{ name: string }>('PRAGMA table_info(user_profile)');
    const colNames = profileCols.map(c => c.name);
    expect(colNames).toContain('name');
    expect(colNames).toContain('date_of_birth');
  });

  it('getSchemaVersion returns 0 when PRAGMA user_version yields no rows', async () => {
    const mockDb: DatabaseService = {
      initialize: vi.fn().mockResolvedValue(undefined),
      execute: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi.fn().mockResolvedValue(null),
      transaction: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      exportToJSON: vi.fn().mockResolvedValue('{}'),
      importFromJSON: vi.fn().mockResolvedValue(undefined),
    };
    const version = await getSchemaVersion(mockDb);
    expect(version).toBe(0);
  });
});
