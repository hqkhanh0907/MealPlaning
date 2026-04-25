/**
 * Database Schema — HealthMate AI
 *
 * 18 tables total, organized by domain:
 *   User (2): user_profile, weight_log
 *   Nutrition (6): ingredient, dish, dish_ingredient, day_plan, meal_slot, planned_dish
 *   Fitness (7): exercise, training_plan, training_plan_day, planned_exercise,
 *                workout_session, workout_exercise, workout_set
 *   AI & Streak (2): ai_chat_log, streak_log
 *   Config (1): app_config
 *
 * Source: docs/3-design/data-model.md
 */

export const SCHEMA_VERSION = 1;

/**
 * Array of DDL statements. Each string is a single CREATE TABLE / CREATE INDEX.
 * Executed sequentially during DatabaseService.initialize().
 *
 * Using IF NOT EXISTS so the DDL is idempotent (safe to re-run).
 */
export const SCHEMA_DDL: string[] = [
  // =========================================================================
  // USER
  // =========================================================================

  `CREATE TABLE IF NOT EXISTS user_profile (
    id                TEXT PRIMARY KEY,
    height_cm         REAL NOT NULL,
    weight_kg         REAL NOT NULL,
    age               INTEGER NOT NULL,
    gender            TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    goal              TEXT NOT NULL CHECK (goal IN ('lose_weight', 'gain_muscle', 'maintain', 'performance')),
    fitness_level     TEXT NOT NULL CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    activity_factor   REAL NOT NULL DEFAULT 1.55,
    bmr               REAL NOT NULL,
    tdee              REAL NOT NULL,
    target_calories   REAL NOT NULL,
    target_protein    REAL NOT NULL,
    target_carbs      REAL,
    target_fat        REAL,
    theme             TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    notif_morning     INTEGER NOT NULL DEFAULT 1,
    notif_lunch       INTEGER NOT NULL DEFAULT 1,
    notif_evening     INTEGER NOT NULL DEFAULT 1,
    notif_weekly      INTEGER NOT NULL DEFAULT 1,
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS weight_log (
    id                TEXT PRIMARY KEY,
    weight_kg         REAL NOT NULL,
    date              TEXT NOT NULL,
    notes             TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(date)
  )`,

  // =========================================================================
  // NUTRITION
  // =========================================================================

  `CREATE TABLE IF NOT EXISTS ingredient (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    category          TEXT NOT NULL CHECK (category IN (
                        'Thịt', 'Cá & Hải sản', 'Trứng & Sữa', 'Rau củ',
                        'Ngũ cốc & Tinh bột', 'Đậu & Hạt', 'Dầu & Mỡ',
                        'Gia vị', 'Nước dùng & Nước chấm', 'Trái cây', 'Khác'
                      )),
    nutrition_basis_unit     TEXT NOT NULL CHECK (nutrition_basis_unit IN ('g', 'ml')),
    nutrition_basis_quantity REAL NOT NULL DEFAULT 100,
    calories          REAL NOT NULL,
    protein           REAL NOT NULL DEFAULT 0,
    carbs             REAL NOT NULL DEFAULT 0,
    fat               REAL NOT NULL DEFAULT 0,
    fiber             REAL NOT NULL DEFAULT 0,
    default_entry_unit TEXT NOT NULL CHECK (default_entry_unit IN ('g', 'ml', 'piece')),
    grams_per_unit    REAL,
    ml_per_unit       REAL,
    source            TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'db')),
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT
  )`,

  `CREATE INDEX IF NOT EXISTS idx_ingredient_name ON ingredient(name)`,
  `CREATE INDEX IF NOT EXISTS idx_ingredient_category ON ingredient(category)`,

  // dish: total_* DROPPED — derived via VIEW dish_with_totals.
  // 'quick' DROPPED from type enum (Quick Add removed from V1).
  `CREATE TABLE IF NOT EXISTS dish (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    description       TEXT,
    type              TEXT NOT NULL CHECK (type IN ('ingredient_based', 'ai_autofill')),
    servings          REAL NOT NULL DEFAULT 1,
    image_url         TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT
  )`,

  `CREATE INDEX IF NOT EXISTS idx_dish_name ON dish(name)`,

  // dish_ingredient: store user input (amount_value + amount_unit) AND
  // normalized_amount in basis unit. Macro snapshot DROPPED — totals computed
  // on-the-fly via VIEW dish_with_totals (single source of truth).
  `CREATE TABLE IF NOT EXISTS dish_ingredient (
    id                TEXT PRIMARY KEY,
    dish_id           TEXT NOT NULL REFERENCES dish(id) ON DELETE CASCADE,
    ingredient_id     TEXT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
    amount_value      REAL NOT NULL,
    amount_unit       TEXT NOT NULL CHECK (amount_unit IN ('g', 'ml', 'piece')),
    normalized_amount REAL NOT NULL,
    UNIQUE(dish_id, ingredient_id)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_dish_ingredient_dish ON dish_ingredient(dish_id)`,

  // VIEW dish_with_totals — single source of truth for dish-level macros.
  // Multiplier = normalized_amount / nutrition_basis_quantity, applied to
  // each macro per ingredient, then SUM grouped by dish.
  // Repositories MUST read totals from this view; never persist totals on `dish`.
  `CREATE VIEW IF NOT EXISTS dish_with_totals AS
    SELECT
      d.id,
      d.name,
      d.description,
      d.type,
      d.servings,
      d.image_url,
      d.created_at,
      d.updated_at,
      COALESCE(SUM(i.calories * di.normalized_amount / i.nutrition_basis_quantity), 0) AS total_calories,
      COALESCE(SUM(i.protein  * di.normalized_amount / i.nutrition_basis_quantity), 0) AS total_protein,
      COALESCE(SUM(i.carbs    * di.normalized_amount / i.nutrition_basis_quantity), 0) AS total_carbs,
      COALESCE(SUM(i.fat      * di.normalized_amount / i.nutrition_basis_quantity), 0) AS total_fat,
      COALESCE(SUM(i.fiber    * di.normalized_amount / i.nutrition_basis_quantity), 0) AS total_fiber
    FROM dish d
    LEFT JOIN dish_ingredient di ON di.dish_id = d.id
    LEFT JOIN ingredient i ON i.id = di.ingredient_id
    GROUP BY d.id`,

  `CREATE TABLE IF NOT EXISTS day_plan (
    id                TEXT PRIMARY KEY,
    date              TEXT NOT NULL,
    target_calories   REAL NOT NULL,
    target_protein    REAL NOT NULL,
    total_calories    REAL NOT NULL DEFAULT 0,
    total_protein     REAL NOT NULL DEFAULT 0,
    total_carbs       REAL NOT NULL DEFAULT 0,
    total_fat         REAL NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT,
    UNIQUE(date)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_day_plan_date ON day_plan(date)`,

  `CREATE TABLE IF NOT EXISTS meal_slot (
    id                TEXT PRIMARY KEY,
    day_plan_id       TEXT NOT NULL REFERENCES day_plan(id) ON DELETE CASCADE,
    meal_type         TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    total_calories    REAL NOT NULL DEFAULT 0,
    total_protein     REAL NOT NULL DEFAULT 0,
    total_carbs       REAL NOT NULL DEFAULT 0,
    total_fat         REAL NOT NULL DEFAULT 0,
    UNIQUE(day_plan_id, meal_type)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_meal_slot_day ON meal_slot(day_plan_id)`,

  `CREATE TABLE IF NOT EXISTS planned_dish (
    id                TEXT PRIMARY KEY,
    meal_slot_id      TEXT NOT NULL REFERENCES meal_slot(id) ON DELETE CASCADE,
    dish_id           TEXT NOT NULL REFERENCES dish(id) ON DELETE RESTRICT,
    servings          REAL NOT NULL DEFAULT 1,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    is_completed      INTEGER NOT NULL DEFAULT 0,
    completed_at      TEXT,
    calories          REAL NOT NULL,
    protein           REAL NOT NULL DEFAULT 0,
    carbs             REAL NOT NULL DEFAULT 0,
    fat               REAL NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_planned_dish_slot ON planned_dish(meal_slot_id)`,

  // =========================================================================
  // FITNESS
  // =========================================================================

  `CREATE TABLE IF NOT EXISTS exercise (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    name_vi           TEXT,
    muscle_group      TEXT NOT NULL CHECK (muscle_group IN (
                        'chest', 'back', 'shoulders', 'biceps', 'triceps',
                        'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'forearms', 'full_body'
                      )),
    category          TEXT NOT NULL CHECK (category IN ('compound', 'isolation', 'cardio')),
    equipment         TEXT,
    instructions      TEXT,
    source            TEXT NOT NULL DEFAULT 'db' CHECK (source IN ('db', 'custom', 'ai')),
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_exercise_muscle ON exercise(muscle_group)`,
  `CREATE INDEX IF NOT EXISTS idx_exercise_name ON exercise(name)`,

  `CREATE TABLE IF NOT EXISTS training_plan (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    type              TEXT NOT NULL CHECK (type IN ('full_body', 'upper_lower', 'ppl', 'ai_custom')),
    frequency         INTEGER NOT NULL,
    is_active         INTEGER NOT NULL DEFAULT 0,
    description       TEXT,
    source            TEXT NOT NULL DEFAULT 'preset' CHECK (source IN ('preset', 'ai', 'custom')),
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS training_plan_day (
    id                TEXT PRIMARY KEY,
    training_plan_id  TEXT NOT NULL REFERENCES training_plan(id) ON DELETE CASCADE,
    day_of_week       INTEGER NOT NULL,
    name              TEXT NOT NULL,
    is_rest_day       INTEGER NOT NULL DEFAULT 0,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    UNIQUE(training_plan_id, day_of_week)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_tpd_plan ON training_plan_day(training_plan_id)`,

  `CREATE TABLE IF NOT EXISTS planned_exercise (
    id                TEXT PRIMARY KEY,
    training_plan_day_id TEXT NOT NULL REFERENCES training_plan_day(id) ON DELETE CASCADE,
    exercise_id       TEXT NOT NULL REFERENCES exercise(id) ON DELETE RESTRICT,
    sets              INTEGER NOT NULL,
    reps_min          INTEGER NOT NULL,
    reps_max          INTEGER NOT NULL,
    rest_seconds      INTEGER NOT NULL DEFAULT 90,
    notes             TEXT,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    UNIQUE(training_plan_day_id, exercise_id)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_pe_day ON planned_exercise(training_plan_day_id)`,

  `CREATE TABLE IF NOT EXISTS workout_session (
    id                TEXT PRIMARY KEY,
    date              TEXT NOT NULL,
    training_plan_day_id TEXT REFERENCES training_plan_day(id) ON DELETE SET NULL,
    training_day_name TEXT,
    mode              TEXT NOT NULL CHECK (mode IN ('guided', 'free')),
    total_volume      REAL NOT NULL DEFAULT 0,
    duration_minutes  INTEGER,
    started_at        TEXT NOT NULL,
    completed_at      TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_ws_date ON workout_session(date)`,

  `CREATE TABLE IF NOT EXISTS workout_exercise (
    id                TEXT PRIMARY KEY,
    workout_session_id TEXT NOT NULL REFERENCES workout_session(id) ON DELETE CASCADE,
    exercise_id       TEXT NOT NULL REFERENCES exercise(id) ON DELETE RESTRICT,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    total_volume      REAL NOT NULL DEFAULT 0
  )`,

  `CREATE INDEX IF NOT EXISTS idx_we_session ON workout_exercise(workout_session_id)`,

  `CREATE TABLE IF NOT EXISTS workout_set (
    id                TEXT PRIMARY KEY,
    workout_exercise_id TEXT NOT NULL REFERENCES workout_exercise(id) ON DELETE CASCADE,
    set_number        INTEGER NOT NULL,
    weight_kg         REAL NOT NULL,
    reps              INTEGER NOT NULL,
    rest_seconds      INTEGER,
    effort            TEXT CHECK (effort IN ('easy', 'just_right', 'hard', 'maxed')),
    notes             TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_ws_exercise ON workout_set(workout_exercise_id)`,

  // =========================================================================
  // AI & STREAK
  // =========================================================================

  `CREATE TABLE IF NOT EXISTS ai_chat_log (
    id                TEXT PRIMARY KEY,
    feature           TEXT NOT NULL CHECK (feature IN (
                        'image_analysis', 'menu_suggestion', 'meal_plan_day',
                        'meal_plan_week', 'daily_insight', 'weekly_review',
                        'training_plan', 'dish_autofill', 'ingredient_lookup'
                      )),
    prompt            TEXT NOT NULL,
    response          TEXT NOT NULL,
    model             TEXT,
    tokens_used       INTEGER,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_ai_log_feature ON ai_chat_log(feature)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_log_date ON ai_chat_log(created_at)`,

  `CREATE TABLE IF NOT EXISTS streak_log (
    id                TEXT PRIMARY KEY,
    date              TEXT NOT NULL,
    nutrition_hit     INTEGER NOT NULL DEFAULT 0,
    workout_hit       INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(date)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_streak_date ON streak_log(date)`,

  // =========================================================================
  // CONFIG
  // =========================================================================

  `CREATE TABLE IF NOT EXISTS app_config (
    key               TEXT PRIMARY KEY,
    value             TEXT NOT NULL,
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  // Seed db_version if not exists
  `INSERT OR IGNORE INTO app_config (key, value) VALUES ('db_version', '1')`,
];
