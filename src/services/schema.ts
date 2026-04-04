import type { DatabaseService } from './databaseService';

export const SCHEMA_VERSION = 6;

export const SCHEMA_TABLES = new Set([
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
]);

export async function getSchemaVersion(db: DatabaseService): Promise<number> {
  const rows = await db.query<{ userVersion: number }>('PRAGMA user_version');
  if (rows.length === 0) return 0;
  return rows[0].userVersion;
}

export async function createSchema(db: DatabaseService): Promise<void> {
  await db.execute('PRAGMA foreign_keys = ON');

  // --- Migrated tables (from localStorage) ---

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      name_vi TEXT NOT NULL,
      name_en TEXT,
      calories_per_100 REAL NOT NULL,
      protein_per_100 REAL NOT NULL,
      carbs_per_100 REAL NOT NULL,
      fat_per_100 REAL NOT NULL,
      fiber_per_100 REAL NOT NULL,
      unit_vi TEXT NOT NULL,
      unit_en TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS dishes (
      id TEXT PRIMARY KEY,
      name_vi TEXT NOT NULL,
      name_en TEXT,
      tags TEXT NOT NULL,
      rating INTEGER,
      notes TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS dish_ingredients (
      dish_id TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
      ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
      amount REAL NOT NULL,
      PRIMARY KEY (dish_id, ingredient_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS day_plans (
      date TEXT PRIMARY KEY,
      breakfast_dish_ids TEXT NOT NULL,
      lunch_dish_ids TEXT NOT NULL,
      dinner_dish_ids TEXT NOT NULL,
      servings TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS meal_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      data TEXT NOT NULL
    )
  `);

  // --- New tables ---

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY DEFAULT 'default',
      gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
      age INTEGER NOT NULL,
      height_cm REAL NOT NULL,
      weight_kg REAL NOT NULL,
      activity_level TEXT NOT NULL DEFAULT 'moderate'
        CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'extra_active')),
      name TEXT DEFAULT '',
      date_of_birth TEXT,
      body_fat_pct REAL,
      bmr_override REAL,
      protein_ratio REAL NOT NULL DEFAULT 2.0,
      fat_pct REAL NOT NULL DEFAULT 0.25,
      target_calories INTEGER DEFAULT 1500,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('cut', 'bulk', 'maintain')),
      rate_of_change TEXT NOT NULL DEFAULT 'moderate'
        CHECK (rate_of_change IN ('conservative', 'moderate', 'aggressive')),
      target_weight_kg REAL,
      calorie_offset INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS training_profile (
      id TEXT PRIMARY KEY DEFAULT 'default',
      training_experience TEXT NOT NULL
        CHECK (training_experience IN ('beginner', 'intermediate', 'advanced')),
      days_per_week INTEGER NOT NULL CHECK (days_per_week BETWEEN 2 AND 6),
      session_duration_min INTEGER NOT NULL CHECK (session_duration_min IN (30, 45, 60, 90)),
      training_goal TEXT NOT NULL
        CHECK (training_goal IN ('strength', 'hypertrophy', 'endurance', 'general')),
      available_equipment TEXT NOT NULL DEFAULT '[]',
      injury_restrictions TEXT DEFAULT '[]',
      periodization_model TEXT NOT NULL DEFAULT 'linear'
        CHECK (periodization_model IN ('linear', 'undulating', 'block')),
      plan_cycle_weeks INTEGER NOT NULL DEFAULT 4 CHECK (plan_cycle_weeks IN (4, 6, 8, 12)),
      priority_muscles TEXT DEFAULT '[]',
      cardio_sessions_week INTEGER NOT NULL DEFAULT 0
        CHECK (cardio_sessions_week BETWEEN 0 AND 5),
      cardio_type_pref TEXT DEFAULT 'mixed'
        CHECK (cardio_type_pref IN ('liss', 'hiit', 'mixed')),
      cardio_duration_min INTEGER DEFAULT 30 CHECK (cardio_duration_min IN (15, 20, 30, 45, 60)),
      known_1rm TEXT,
      avg_sleep_hours REAL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS training_plans (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
      split_type TEXT NOT NULL,
      duration_weeks INTEGER NOT NULL,
      current_week INTEGER DEFAULT 1,
      start_date TEXT NOT NULL,
      end_date TEXT,
      template_id TEXT,
      training_days TEXT,
      rest_days TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS training_plan_days (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      plan_id TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
      session_order INTEGER NOT NULL DEFAULT 1,
      workout_type TEXT NOT NULL,
      muscle_groups TEXT,
      exercises TEXT,
      original_exercises TEXT,
      is_user_assigned INTEGER DEFAULT 0,
      original_day_of_week INTEGER,
      notes TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name_vi TEXT NOT NULL,
      name_en TEXT,
      muscle_group TEXT NOT NULL,
      secondary_muscles TEXT DEFAULT '[]',
      category TEXT NOT NULL CHECK (category IN ('compound', 'secondary', 'isolation')),
      equipment TEXT NOT NULL DEFAULT '[]',
      contraindicated TEXT DEFAULT '[]',
      exercise_type TEXT NOT NULL CHECK (exercise_type IN ('strength', 'cardio')),
      default_reps_min INTEGER NOT NULL DEFAULT 8,
      default_reps_max INTEGER NOT NULL DEFAULT 12,
      is_custom INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      plan_day_id TEXT REFERENCES training_plan_days(id),
      duration_min INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id TEXT REFERENCES exercises(id) ON DELETE SET NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER,
      weight_kg REAL DEFAULT 0,
      rpe REAL,
      rest_seconds INTEGER,
      duration_min REAL,
      distance_km REAL,
      avg_heart_rate INTEGER,
      intensity TEXT CHECK (intensity IN ('low', 'moderate', 'high')),
      estimated_calories REAL,
      updated_at TEXT NOT NULL,
      UNIQUE(workout_id, exercise_id, set_number)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS weight_log (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      weight_kg REAL NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS daily_log (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      target_calories REAL NOT NULL,
      actual_calories REAL NOT NULL,
      target_protein REAL NOT NULL,
      actual_protein REAL NOT NULL,
      target_fat REAL,
      actual_fat REAL DEFAULT 0,
      target_carbs REAL,
      actual_carbs REAL DEFAULT 0,
      adherence_cal INTEGER NOT NULL DEFAULT 0,
      adherence_protein INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS adjustments (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      reason TEXT NOT NULL,
      old_target_cal REAL NOT NULL,
      new_target_cal REAL NOT NULL,
      trigger_type TEXT NOT NULL CHECK (trigger_type IN ('auto', 'manual')),
      moving_avg_weight REAL,
      applied INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  // --- Fitness module tables ---

  await db.execute(`
    CREATE TABLE IF NOT EXISTS fitness_profiles (
      id TEXT PRIMARY KEY DEFAULT 'default',
      experience TEXT NOT NULL DEFAULT 'beginner',
      goal TEXT NOT NULL DEFAULT 'general',
      days_per_week INTEGER NOT NULL DEFAULT 3,
      body_weight_kg REAL,
      height_cm REAL,
      gender TEXT,
      birthdate TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS fitness_preferences (
      id TEXT PRIMARY KEY DEFAULT 'default',
      unit_system TEXT NOT NULL DEFAULT 'metric',
      rest_timer_enabled INTEGER NOT NULL DEFAULT 1,
      default_rest_seconds INTEGER NOT NULL DEFAULT 90,
      show_rpe INTEGER NOT NULL DEFAULT 1,
      enable_notifications INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS workout_drafts (
      id TEXT PRIMARY KEY DEFAULT 'current',
      exercises_json TEXT NOT NULL DEFAULT '[]',
      sets_json TEXT NOT NULL DEFAULT '[]',
      start_time TEXT NOT NULL,
      plan_day_id TEXT,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS grocery_checked (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // --- Performance indexes ---

  await db.execute('CREATE INDEX IF NOT EXISTS idx_workout_sets_workout ON workout_sets(workout_id)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_weight_log_date ON weight_log(date)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_daily_log_date ON daily_log(date)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(is_active)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_adjustments_date ON adjustments(date)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_dish_ingredients_dish ON dish_ingredients(dish_id)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_dish_ingredients_ingredient ON dish_ingredients(ingredient_id)');
  await db.execute(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_day_session ON training_plan_days(plan_id, day_of_week, session_order)',
  );

  // --- Plan templates table ---
  await db.execute(`
    CREATE TABLE IF NOT EXISTS plan_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      split_type TEXT NOT NULL,
      days_per_week INTEGER NOT NULL,
      experience_level TEXT,
      training_goal TEXT,
      equipment_required TEXT,
      description TEXT,
      day_configs TEXT NOT NULL,
      popularity_score INTEGER DEFAULT 0,
      is_builtin INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // --- Schema version ---

  await db.execute(`PRAGMA user_version = ${String(SCHEMA_VERSION)}`);
}

export async function runSchemaMigrations(db: DatabaseService): Promise<void> {
  const currentVersion = await getSchemaVersion(db);
  if (currentVersion >= SCHEMA_VERSION) return;

  // Migration v1 → v2: Fitness plan flexibility (multi-session, plan editing)
  if (currentVersion < 2) {
    // 1. Add session_order and original_exercises to training_plan_days
    await db.execute('ALTER TABLE training_plan_days ADD COLUMN session_order INTEGER NOT NULL DEFAULT 1');
    await db.execute('ALTER TABLE training_plan_days ADD COLUMN original_exercises TEXT');

    // 2. Backfill original_exercises from exercises for existing data
    await db.execute('UPDATE training_plan_days SET original_exercises = exercises WHERE original_exercises IS NULL');

    // 3. Recreate table with fixed CHECK constraint (0-6 → 1-7)
    await db.execute(`CREATE TABLE training_plan_days_v2 (
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
    await db.execute(
      'INSERT INTO training_plan_days_v2 SELECT id, plan_id, day_of_week, session_order, workout_type, muscle_groups, exercises, original_exercises, notes FROM training_plan_days',
    );
    await db.execute('DROP TABLE training_plan_days');
    await db.execute('ALTER TABLE training_plan_days_v2 RENAME TO training_plan_days');

    // 4. UNIQUE index for max 3 sessions/day
    await db.execute(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_day_session ON training_plan_days(plan_id, day_of_week, session_order)',
    );

    // 5. Add plan_day_id to workouts
    await db.execute('ALTER TABLE workouts ADD COLUMN plan_day_id TEXT REFERENCES training_plan_days(id)');

    await db.execute('PRAGMA user_version = 2');
  }

  // Migration v2 → v3: Add name and date_of_birth to user_profile
  if (currentVersion < 3) {
    await db.execute("ALTER TABLE user_profile ADD COLUMN name TEXT DEFAULT ''");
    await db.execute('ALTER TABLE user_profile ADD COLUMN date_of_birth TEXT');
    await db.execute('PRAGMA user_version = 3');
  }

  // Migration v3 → v4: Full Plan Editor (schedule editor, split changer, templates)
  if (currentVersion < 4) {
    // 1. Add new columns to training_plan_days
    await db.execute('ALTER TABLE training_plan_days ADD COLUMN is_user_assigned INTEGER DEFAULT 0');
    await db.execute('ALTER TABLE training_plan_days ADD COLUMN original_day_of_week INTEGER');

    // 2. Add new columns to training_plans
    await db.execute('ALTER TABLE training_plans ADD COLUMN template_id TEXT');
    await db.execute('ALTER TABLE training_plans ADD COLUMN training_days TEXT');
    await db.execute('ALTER TABLE training_plans ADD COLUMN rest_days TEXT');

    // 3. Backfill original_day_of_week from current day_of_week
    await db.execute(
      'UPDATE training_plan_days SET original_day_of_week = day_of_week WHERE original_day_of_week IS NULL',
    );

    // 4. Normalize existing split_type values
    await db.execute(
      "UPDATE training_plans SET split_type = 'full_body' WHERE LOWER(REPLACE(REPLACE(split_type, ' ', '_'), '/', '_')) LIKE '%full%body%'",
    );
    await db.execute(
      "UPDATE training_plans SET split_type = 'upper_lower' WHERE LOWER(REPLACE(REPLACE(split_type, ' ', '_'), '/', '_')) LIKE '%upper%lower%'",
    );
    await db.execute(
      "UPDATE training_plans SET split_type = 'ppl' WHERE LOWER(REPLACE(REPLACE(split_type, ' ', '_'), '/', '_')) LIKE '%push%' OR LOWER(split_type) = 'ppl'",
    );
    await db.execute(
      "UPDATE training_plans SET split_type = 'bro_split' WHERE LOWER(REPLACE(REPLACE(split_type, ' ', '_'), '/', '_')) LIKE '%bro%'",
    );
    await db.execute(
      "UPDATE training_plans SET split_type = 'custom' WHERE split_type NOT IN ('full_body', 'upper_lower', 'ppl', 'bro_split', 'custom')",
    );

    // 5. Backfill training_days and rest_days from existing plan days
    const plans = await db.query<{ id: string }>('SELECT id FROM training_plans WHERE training_days IS NULL');
    for (const plan of plans) {
      const days = await db.query<{ day_of_week: number }>(
        'SELECT DISTINCT day_of_week FROM training_plan_days WHERE plan_id = ?',
        [plan.id],
      );
      const trainingDays = days.map(d => d.day_of_week).sort((a, b) => a - b);
      const restDays = [1, 2, 3, 4, 5, 6, 7].filter(d => !trainingDays.includes(d));
      await db.execute('UPDATE training_plans SET training_days = ?, rest_days = ? WHERE id = ?', [
        JSON.stringify(trainingDays),
        JSON.stringify(restDays),
        plan.id,
      ]);
    }

    // 6. Create plan_templates table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS plan_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        split_type TEXT NOT NULL,
        days_per_week INTEGER NOT NULL,
        experience_level TEXT,
        training_goal TEXT,
        equipment_required TEXT,
        description TEXT,
        day_configs TEXT NOT NULL,
        popularity_score INTEGER DEFAULT 0,
        is_builtin INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    await db.execute('PRAGMA user_version = 4');
  }

  if (currentVersion < 5) {
    const cols = await db.query<{ name: string }>("PRAGMA table_info('training_plans')");
    if (!cols.some(c => c.name === 'current_week')) {
      await db.execute('ALTER TABLE training_plans ADD COLUMN current_week INTEGER DEFAULT 1');
    }
    await db.execute('PRAGMA user_version = 5');
  }

  // Migration v5 → v6: Make workout_sets.exercise_id nullable + ON DELETE SET NULL
  if (currentVersion < 6) {
    const tables = await db.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='workout_sets'",
    );
    if (tables.length > 0) {
      await db.transaction(async () => {
        await db.execute(`CREATE TABLE workout_sets_new (
          id TEXT PRIMARY KEY,
          workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
          exercise_id TEXT REFERENCES exercises(id) ON DELETE SET NULL,
          set_number INTEGER NOT NULL,
          reps INTEGER,
          weight_kg REAL DEFAULT 0,
          rpe REAL,
          rest_seconds INTEGER,
          duration_min REAL,
          distance_km REAL,
          avg_heart_rate INTEGER,
          intensity TEXT CHECK (intensity IN ('low', 'moderate', 'high')),
          estimated_calories REAL,
          updated_at TEXT NOT NULL,
          UNIQUE(workout_id, exercise_id, set_number)
        )`);
        await db.execute('INSERT INTO workout_sets_new SELECT * FROM workout_sets');
        await db.execute('DROP TABLE workout_sets');
        await db.execute('ALTER TABLE workout_sets_new RENAME TO workout_sets');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_workout_sets_workout ON workout_sets(workout_id)');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id)');
      });
    }
    await db.execute('PRAGMA user_version = 6');
  }
}
