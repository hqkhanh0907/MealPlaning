import type { DatabaseService } from './databaseService';

export const SCHEMA_VERSION = 1;

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
      body_fat_pct REAL,
      bmr_override REAL,
      protein_ratio REAL NOT NULL DEFAULT 2.0,
      fat_pct REAL NOT NULL DEFAULT 0.25,
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
      start_date TEXT NOT NULL,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS training_plan_days (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      plan_id TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      workout_type TEXT NOT NULL,
      muscle_groups TEXT,
      exercises TEXT,
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
      exercise_id TEXT NOT NULL REFERENCES exercises(id),
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

  // --- Performance indexes ---

  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_workout_sets_workout ON workout_sets(workout_id)',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id)',
  );
  await db.execute('CREATE INDEX IF NOT EXISTS idx_weight_log_date ON weight_log(date)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_daily_log_date ON daily_log(date)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(is_active)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_adjustments_date ON adjustments(date)');
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_dish_ingredients_dish ON dish_ingredients(dish_id)',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_dish_ingredients_ingredient ON dish_ingredients(ingredient_id)',
  );

  // --- Schema version ---

  await db.execute(`PRAGMA user_version = ${String(SCHEMA_VERSION)}`);
}
