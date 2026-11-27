/**
 * Database Schema — HealthMate AI
 *
 * Schema versioning:
 *   v1 (2026-05-08, Story 2.6) — gram-only canonical schema
 *   v2 (2026-05-09, D8 audit)  — Hybrid policy enforcement + drop ghost columns
 *
 * SCHEMA_DDL below is the *current canonical* shape (post-v2). It is applied
 * with `CREATE TABLE IF NOT EXISTS` at startup so a fresh install lands on
 * the final state in one go. For dev DBs already at user_version=1, the
 * MigrationRunner will execute `buildHybridPolicySchemaMigration()` (v2)
 * which DROPs and recreates the 3 affected tables. Shipped migrations are
 * immutable from v2 onward.
 *
 * 18 tables, 1 view (unchanged):
 *   User (2)       : user_profile, weight_log
 *   Nutrition (5)  : ingredient, dish, dish_ingredient, day_plan, meal_slot, planned_dish
 *   Fitness (7)    : exercise, training_plan, training_plan_day, planned_exercise,
 *                    workout_session, workout_exercise, workout_set
 *   AI & Streak (2): ai_chat_log, streak_log
 *   Config (1)     : app_config
 *   Seed (1)       : seed_artifact
 *   View (1)       : dish_with_totals
 *
 * Sources of truth:
 *   docs/3-design/data-model.md
 *   docs/4-architecture/business-rules.md
 *   docs/4-architecture/decisions/calendar-tracking.md (D8 v2)
 */

import { profileWeightLogTriggerSql } from './profile-weight-log-trigger';

export const SCHEMA_VERSION = 13;

/**
 * Final DDL — gram-only nutrition, light-only theme. Idempotent
 * (`CREATE … IF NOT EXISTS`) so re-running the migration on a partially
 * initialized DB is safe.
 */
export const SCHEMA_DDL: readonly string[] = [
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
    theme             TEXT NOT NULL DEFAULT 'light' CHECK (theme = 'light'),
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
  // NUTRITION — gram-only (no basis unit, no density, no unit-conversion table)
  // =========================================================================

  `CREATE TABLE IF NOT EXISTS ingredient (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL CHECK (category IN (
                   'Thịt', 'Cá & Hải sản', 'Trứng & Sữa', 'Rau củ',
                   'Ngũ cốc & Tinh bột', 'Đậu & Hạt', 'Dầu & Mỡ',
                   'Gia vị', 'Nước dùng & Nước chấm', 'Trái cây', 'Khác'
                 )),
    calories     REAL NOT NULL CHECK (calories >= 0),
    protein      REAL NOT NULL DEFAULT 0 CHECK (protein >= 0),
    carbs        REAL NOT NULL DEFAULT 0 CHECK (carbs   >= 0),
    fat          REAL NOT NULL DEFAULT 0 CHECK (fat     >= 0),
    fiber        REAL NOT NULL DEFAULT 0 CHECK (fiber   >= 0),
    source       TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'db')),
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT
  )`,

  `CREATE INDEX IF NOT EXISTS idx_ingredient_name     ON ingredient(name COLLATE NOCASE)`,
  `CREATE INDEX IF NOT EXISTS idx_ingredient_category ON ingredient(category)`,

  `CREATE TABLE IF NOT EXISTS dish (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    description       TEXT,
    type              TEXT NOT NULL CHECK (type IN ('ingredient_based', 'ai_autofill')),
    source            TEXT NOT NULL DEFAULT 'custom' CHECK (source IN ('db', 'custom', 'ai')),
    servings          REAL NOT NULL DEFAULT 1,
    image_url         TEXT,
    meal_tag          TEXT CHECK (meal_tag IN ('breakfast', 'lunch', 'dinner')),
    is_favorite       INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT
  )`,

  `CREATE INDEX IF NOT EXISTS idx_dish_name     ON dish(name)`,
  `CREATE INDEX IF NOT EXISTS idx_dish_meal_tag ON dish(meal_tag)`,

  `CREATE TABLE IF NOT EXISTS dish_ingredient (
    id            TEXT PRIMARY KEY,
    dish_id       TEXT NOT NULL REFERENCES dish(id)       ON DELETE CASCADE,
    ingredient_id TEXT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
    gram_weight   REAL NOT NULL CHECK (gram_weight > 0),
    sort_order    INTEGER NOT NULL DEFAULT 0,
    UNIQUE(dish_id, ingredient_id)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_dish_ingredient_dish       ON dish_ingredient(dish_id)`,
  `CREATE INDEX IF NOT EXISTS idx_dish_ingredient_ingredient ON dish_ingredient(ingredient_id)`,

  // VIEW dish_with_totals — single source of truth for dish macros.
  // Macros computed per-100g, multiplied by gram_weight.
  // Repositories MUST read totals from this view; never persist on `dish`.
  `CREATE VIEW IF NOT EXISTS dish_with_totals AS
    SELECT
      d.id,
      d.name,
      d.description,
      d.type,
      d.source,
      d.servings,
      d.image_url,
      d.meal_tag,
      d.is_favorite,
      d.created_at,
      d.updated_at,
      COALESCE(SUM(i.calories * di.gram_weight / 100.0), 0) AS total_calories,
      COALESCE(SUM(i.protein  * di.gram_weight / 100.0), 0) AS total_protein,
      COALESCE(SUM(i.carbs    * di.gram_weight / 100.0), 0) AS total_carbs,
      COALESCE(SUM(i.fat      * di.gram_weight / 100.0), 0) AS total_fat,
      COALESCE(SUM(i.fiber    * di.gram_weight / 100.0), 0) AS total_fiber
    FROM dish d
    LEFT JOIN dish_ingredient di ON di.dish_id = d.id
    LEFT JOIN ingredient      i  ON i.id       = di.ingredient_id
    GROUP BY d.id`,

  `CREATE TABLE IF NOT EXISTS day_plan (
    id                TEXT PRIMARY KEY,
    date              TEXT NOT NULL,
    target_calories   REAL NOT NULL,
    target_protein    REAL NOT NULL,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT,
    UNIQUE(date)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_day_plan_date ON day_plan(date)`,

  `CREATE TABLE IF NOT EXISTS meal_slot (
    id                TEXT PRIMARY KEY,
    day_plan_id       TEXT NOT NULL REFERENCES day_plan(id) ON DELETE CASCADE,
    meal_type         TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    position          INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(day_plan_id, meal_type)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_meal_slot_day_plan ON meal_slot(day_plan_id)`,

  `CREATE TABLE IF NOT EXISTS planned_dish (
    id                TEXT PRIMARY KEY,
    meal_slot_id      TEXT NOT NULL REFERENCES meal_slot(id) ON DELETE CASCADE,
    dish_id           TEXT NOT NULL REFERENCES dish(id)      ON DELETE RESTRICT,
    servings          REAL NOT NULL DEFAULT 1
                      CHECK (servings BETWEEN 0.1 AND 20),
    sort_order        INTEGER NOT NULL DEFAULT 0,
    is_completed      INTEGER NOT NULL DEFAULT 0
                      CHECK (is_completed IN (0, 1)),
    completed_at      TEXT,
    calories          REAL,
    protein           REAL,
    carbs             REAL,
    fat               REAL,
    fiber             REAL,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (
      (is_completed = 0
         AND calories IS NULL AND protein IS NULL
         AND carbs IS NULL AND fat IS NULL AND fiber IS NULL
         AND completed_at IS NULL)
      OR
      (is_completed = 1
         AND calories IS NOT NULL AND protein IS NOT NULL
         AND carbs IS NOT NULL AND fat IS NOT NULL
         AND completed_at IS NOT NULL)
    )
  )`,

  `CREATE INDEX IF NOT EXISTS idx_planned_dish_meal_slot   ON planned_dish(meal_slot_id)`,
  `CREATE INDEX IF NOT EXISTS idx_planned_dish_dish        ON planned_dish(dish_id)`,
  `CREATE INDEX IF NOT EXISTS idx_planned_dish_completed
     ON planned_dish(is_completed, meal_slot_id) WHERE is_completed = 1`,
  `CREATE INDEX IF NOT EXISTS idx_planned_dish_completed_at
     ON planned_dish(completed_at DESC) WHERE is_completed = 1`,
  `CREATE INDEX IF NOT EXISTS idx_dish_favorite
     ON dish(is_favorite) WHERE is_favorite = 1`,

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
  `CREATE INDEX IF NOT EXISTS idx_exercise_name   ON exercise(name)`,

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
    exercise_id       TEXT NOT NULL REFERENCES exercise(id)             ON DELETE RESTRICT,
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
    exercise_id       TEXT NOT NULL REFERENCES exercise(id)         ON DELETE RESTRICT,
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
  `CREATE INDEX IF NOT EXISTS idx_ai_log_date    ON ai_chat_log(created_at)`,

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

  `CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key)`,

  // =========================================================================
  // SEED ARTIFACT — track inserted seed batches (Vietnamese curated set)
  // =========================================================================

  `CREATE TABLE IF NOT EXISTS seed_artifact (
    artifact_id      TEXT PRIMARY KEY,
    artifact_type    TEXT NOT NULL CHECK (artifact_type IN ('ingredient', 'dish')),
    seed_version     TEXT NOT NULL,
    inserted_at      TEXT NOT NULL DEFAULT (datetime('now')),
    fingerprint_hash TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_seed_artifact_type ON seed_artifact(artifact_type)`,
];

/**
 * Migration v1 — initial schema (canonical, IMMUTABLE).
 *
 * Re-applies SCHEMA_DDL idempotently (`IF NOT EXISTS`). On dev DBs already
 * at user_version=1 this is a no-op; only fresh installs hit it. The
 * subsequent v2 migration (`buildHybridPolicySchemaMigration`) corrects
 * planned_dish/meal_slot/day_plan for the Hybrid policy.
 */
export function buildInitialSchemaMigration(): {
  version: number;
  statements: readonly string[];
} {
  return {
    version: 1,
    statements: SCHEMA_DDL,
  };
}

/**
 * Migration v2 (2026-05-09, D8 DEC-11) — Hybrid policy enforcement.
 *
 * Drops legacy planned_dish/meal_slot/day_plan and recreates them with:
 *  - planned_dish: bidirectional CHECK (RULE-PLANNED-DISH-HYBRID), servings
 *    BETWEEN 0.1 AND 20, snapshot columns nullable, partial indexes for
 *    completed-only access patterns (D8 DEC-06).
 *  - meal_slot: drops cached total_* columns (DEC-07), adds position +
 *    created_at (sync data-model §4.5), index renamed to
 *    idx_meal_slot_day_plan.
 *  - day_plan: drops cached total_* columns (DEC-07).
 *  - dish: adds idx_dish_favorite partial index (DEC-08, supports F-04 M3).
 *
 * Pre-release: dev DBs lose seed data in the 3 affected tables. dish/
 * ingredient/exercise/etc. remain untouched.
 */
export const HYBRID_POLICY_DDL: readonly string[] = [
  // Drop in dependency order (planned_dish → meal_slot → day_plan)
  'DROP INDEX IF EXISTS idx_planned_dish_slot',
  'DROP INDEX IF EXISTS idx_meal_slot_day',
  'DROP INDEX IF EXISTS idx_day_plan_date',
  'DROP TABLE IF EXISTS planned_dish',
  'DROP TABLE IF EXISTS meal_slot',
  'DROP TABLE IF EXISTS day_plan',

  // Recreate per data-model §4.4–4.6 (current canonical shape)
  `CREATE TABLE day_plan (
    id                TEXT PRIMARY KEY,
    date              TEXT NOT NULL,
    target_calories   REAL NOT NULL,
    target_protein    REAL NOT NULL,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT,
    UNIQUE(date)
  )`,
  `CREATE INDEX idx_day_plan_date ON day_plan(date)`,

  `CREATE TABLE meal_slot (
    id                TEXT PRIMARY KEY,
    day_plan_id       TEXT NOT NULL REFERENCES day_plan(id) ON DELETE CASCADE,
    meal_type         TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    position          INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(day_plan_id, meal_type)
  )`,
  `CREATE INDEX idx_meal_slot_day_plan ON meal_slot(day_plan_id)`,

  `CREATE TABLE planned_dish (
    id                TEXT PRIMARY KEY,
    meal_slot_id      TEXT NOT NULL REFERENCES meal_slot(id) ON DELETE CASCADE,
    dish_id           TEXT NOT NULL REFERENCES dish(id)      ON DELETE RESTRICT,
    servings          REAL NOT NULL DEFAULT 1
                      CHECK (servings BETWEEN 0.1 AND 20),
    sort_order        INTEGER NOT NULL DEFAULT 0,
    is_completed      INTEGER NOT NULL DEFAULT 0
                      CHECK (is_completed IN (0, 1)),
    completed_at      TEXT,
    calories          REAL,
    protein           REAL,
    carbs             REAL,
    fat               REAL,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (
      (is_completed = 0
         AND calories IS NULL AND protein IS NULL
         AND carbs IS NULL AND fat IS NULL
         AND completed_at IS NULL)
      OR
      (is_completed = 1
         AND calories IS NOT NULL AND protein IS NOT NULL
         AND carbs IS NOT NULL AND fat IS NOT NULL
         AND completed_at IS NOT NULL)
    )
  )`,
  `CREATE INDEX idx_planned_dish_meal_slot   ON planned_dish(meal_slot_id)`,
  `CREATE INDEX idx_planned_dish_dish        ON planned_dish(dish_id)`,
  `CREATE INDEX idx_planned_dish_completed
     ON planned_dish(is_completed, meal_slot_id) WHERE is_completed = 1`,
  `CREATE INDEX idx_planned_dish_completed_at
     ON planned_dish(completed_at DESC) WHERE is_completed = 1`,

  // DEC-08: dish.is_favorite already exists (v1) — partial index for F-04 M3.
  `CREATE INDEX IF NOT EXISTS idx_dish_favorite
     ON dish(is_favorite) WHERE is_favorite = 1`,
];

export function buildHybridPolicySchemaMigration(): {
  version: number;
  statements: readonly string[];
} {
  return {
    version: 2,
    statements: HYBRID_POLICY_DDL,
  };
}

const FIBER_SNAPSHOT_DDL = [
  `DROP INDEX IF EXISTS idx_planned_dish_completed_at`,
  `DROP INDEX IF EXISTS idx_planned_dish_completed`,
  `DROP INDEX IF EXISTS idx_planned_dish_dish`,
  `DROP INDEX IF EXISTS idx_planned_dish_meal_slot`,
  `ALTER TABLE planned_dish RENAME TO planned_dish_v2_backup`,
  `CREATE TABLE planned_dish (
    id                TEXT PRIMARY KEY,
    meal_slot_id      TEXT NOT NULL REFERENCES meal_slot(id) ON DELETE CASCADE,
    dish_id           TEXT NOT NULL REFERENCES dish(id)      ON DELETE RESTRICT,
    servings          REAL NOT NULL DEFAULT 1
                      CHECK (servings BETWEEN 0.1 AND 20),
    sort_order        INTEGER NOT NULL DEFAULT 0,
    is_completed      INTEGER NOT NULL DEFAULT 0
                      CHECK (is_completed IN (0, 1)),
    completed_at      TEXT,
    calories          REAL,
    protein           REAL,
    carbs             REAL,
    fat               REAL,
    fiber             REAL,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (
      (is_completed = 0
         AND calories IS NULL AND protein IS NULL
         AND carbs IS NULL AND fat IS NULL AND fiber IS NULL
         AND completed_at IS NULL)
      OR
      (is_completed = 1
         AND calories IS NOT NULL AND protein IS NOT NULL
         AND carbs IS NOT NULL AND fat IS NOT NULL
         AND completed_at IS NOT NULL)
    )
  )`,
  `INSERT INTO planned_dish
     (id, meal_slot_id, dish_id, servings, sort_order, is_completed,
      completed_at, calories, protein, carbs, fat, fiber, created_at)
   SELECT
     id,
     meal_slot_id,
     dish_id,
     servings,
     sort_order,
     is_completed,
     completed_at,
     calories,
     protein,
     carbs,
     fat,
     NULL AS fiber,
     created_at
   FROM planned_dish_v2_backup`,
  `DROP TABLE planned_dish_v2_backup`,
  `CREATE INDEX idx_planned_dish_meal_slot   ON planned_dish(meal_slot_id)`,
  `CREATE INDEX idx_planned_dish_dish        ON planned_dish(dish_id)`,
  `CREATE INDEX idx_planned_dish_completed
     ON planned_dish(is_completed, meal_slot_id) WHERE is_completed = 1`,
  `CREATE INDEX idx_planned_dish_completed_at
     ON planned_dish(completed_at DESC) WHERE is_completed = 1`,
];

export function buildFiberSnapshotSchemaMigration(): {
  version: number;
  statements: readonly string[];
} {
  return {
    version: 3,
    statements: FIBER_SNAPSHOT_DDL,
  };
}

const WORKOUT_SET_UPDATED_AT_DDL = [
  // F-012: WorkoutRepository.updateSet writes updated_at, but the column was
  // never added to the workout_set DDL. Without this migration, every "Sửa
  // set" attempt throws a SQLite "no such column: updated_at" error.
  // Nullable so existing rows (created before this migration) remain valid.
  `ALTER TABLE workout_set ADD COLUMN updated_at TEXT`,
] as const;

export function buildWorkoutSetUpdatedAtMigration(): {
  version: number;
  statements: readonly string[];
} {
  return {
    version: 4,
    statements: WORKOUT_SET_UPDATED_AT_DDL,
  };
}

const WORKOUT_SESSION_STATUS_DDL = [
  // p3-1: workout_session.status state machine + cancelled_at for soft delete.
  //
  // Pre-v5 cancelSession() hard-deleted the row (and its child sets/exercises),
  // so undo was impossible. v5 introduces a 3-state status column
  // (active / completed / cancelled) and a cancelled_at timestamp. cancelSession
  // now flips status='cancelled' + sets cancelled_at; undoCancel reverts. The
  // hard purge path is still available for explicit user delete.
  //
  // Backfill maps existing rows by completed_at:
  //   completed_at IS NULL     -> active  (in-progress at the time of upgrade)
  //   completed_at IS NOT NULL -> completed
  // No row can be 'cancelled' on upgrade because v4 had no soft-cancel path.
  `ALTER TABLE workout_session ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`,
  `ALTER TABLE workout_session ADD COLUMN cancelled_at TEXT`,
  `UPDATE workout_session SET status = 'completed' WHERE completed_at IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_ws_status ON workout_session(status)`,
] as const;

export function buildWorkoutSessionStatusMigration(): {
  version: number;
  statements: readonly string[];
} {
  return {
    version: 5,
    statements: WORKOUT_SESSION_STATUS_DDL,
  };
}

const WORKOUT_SET_STATUS_DDL = [
  // p3-2: workout_set.status state machine + completed_at.
  //
  // Pre-v6: every persisted set was implicitly "logged" — no distinction
  // between completed reps and intentionally-skipped sets. v6 introduces a
  // 2-state status ('logged' | 'skipped') so UI can render skip indicators,
  // exclude skipped sets from totals/PR calc, and let the user resume a
  // partially-skipped session deterministically.
  //
  // completed_at preserves the actual log time (vs. created_at which is set
  // server-side on INSERT and used for ordering). Skipped sets have
  // completed_at NULL.
  //
  // Backfill: all pre-v6 rows are 'logged' (they got persisted via addSet,
  // which had no skip path). completed_at backfilled from created_at so
  // historical sets keep a sensible timestamp.
  `ALTER TABLE workout_set ADD COLUMN status TEXT NOT NULL DEFAULT 'logged'`,
  `ALTER TABLE workout_set ADD COLUMN completed_at TEXT`,
  `UPDATE workout_set SET completed_at = created_at WHERE status = 'logged'`,
  `CREATE INDEX IF NOT EXISTS idx_ws_set_status ON workout_set(status)`,
] as const;

export function buildWorkoutSetStatusMigration(): {
  version: number;
  statements: readonly string[];
} {
  return {
    version: 6,
    statements: WORKOUT_SET_STATUS_DDL,
  };
}

export function buildCalorieTargetModeMigration(): {
  version: number;
  statements: readonly string[];
} {
  return {
    version: 7,
    statements: [
      `ALTER TABLE user_profile ADD COLUMN calorie_target_mode TEXT NOT NULL DEFAULT 'manual'
         CHECK (calorie_target_mode IN ('auto', 'manual'))`,
      `UPDATE user_profile SET calorie_target_mode = 'auto'
         WHERE target_calories < 800 OR target_calories = ROUND(tdee + CASE goal
           WHEN 'lose_weight' THEN -500 WHEN 'gain_muscle' THEN 300 WHEN 'performance' THEN 200 ELSE 0 END)`,
      `UPDATE user_profile SET target_calories = 0
         WHERE calorie_target_mode = 'auto' AND (
           age NOT BETWEEN 19 AND 78 OR target_calories <= 1200 OR target_calories > 6000 OR
           (goal = 'lose_weight' AND weight_kg * 10000 <= 18.5 * height_cm * height_cm))`,
      `UPDATE user_profile SET bmr = 0, tdee = 0 WHERE age NOT BETWEEN 19 AND 78`,
    ],
  };
}

export function buildWorkoutMeasuresMigration(): {
  version: number;
  statements: readonly string[];
} {
  return {
    version: 8,
    statements: [
      `ALTER TABLE workout_set ADD COLUMN duration_seconds INTEGER CHECK (duration_seconds > 0)`,
      `ALTER TABLE workout_set ADD COLUMN legacy_unit_unknown INTEGER NOT NULL DEFAULT 0`,
      `UPDATE workout_set SET legacy_unit_unknown = 1 WHERE workout_exercise_id IN (
         SELECT id FROM workout_exercise WHERE exercise_id IN (
           'ex_plank','ex_farmer_carry','ex_treadmill_run','ex_stationary_bike','ex_rowing_machine'))`,
      `UPDATE workout_exercise SET total_volume = 0 WHERE id IN
         (SELECT workout_exercise_id FROM workout_set WHERE legacy_unit_unknown = 1)`,
      `UPDATE workout_session SET total_volume = (SELECT COALESCE(SUM(we.total_volume), 0)
         FROM workout_exercise we WHERE we.workout_session_id = workout_session.id)
         WHERE id IN (SELECT we.workout_session_id FROM workout_exercise we JOIN workout_set ws
           ON ws.workout_exercise_id = we.id WHERE ws.legacy_unit_unknown = 1)`,
      `UPDATE workout_session SET training_day_name = 'Tập tự do'
         WHERE mode = 'free' AND training_day_name = 'Free Workout'`,
      `ALTER TABLE workout_exercise ADD COLUMN planned_sets INTEGER`,
      `ALTER TABLE workout_exercise ADD COLUMN planned_min INTEGER`,
      `ALTER TABLE workout_exercise ADD COLUMN planned_max INTEGER`,
      `ALTER TABLE workout_exercise ADD COLUMN planned_rest INTEGER`,
      `UPDATE workout_exercise SET (planned_sets, planned_min, planned_max, planned_rest) =
        (SELECT pe.sets, pe.reps_min, pe.reps_max, pe.rest_seconds FROM planned_exercise pe
          JOIN workout_session s ON s.training_plan_day_id = pe.training_plan_day_id
          WHERE s.id = workout_exercise.workout_session_id AND pe.exercise_id = workout_exercise.exercise_id)
        WHERE workout_session_id IN (SELECT id FROM workout_session WHERE status = 'active' AND mode = 'guided')`,
    ],
  };
}

export function buildProteinTargetModeMigration(): {
  version: number;
  statements: readonly string[];
} {
  return {
    version: 9,
    statements: [
      `ALTER TABLE user_profile ADD COLUMN protein_target_mode TEXT NOT NULL DEFAULT 'manual'
         CHECK (protein_target_mode IN ('auto', 'manual'))`,
      `UPDATE user_profile SET protein_target_mode = 'auto'
         WHERE target_protein = ROUND(weight_kg * CASE goal
           WHEN 'lose_weight' THEN 2.2 WHEN 'gain_muscle' THEN 2.2
           WHEN 'performance' THEN 2.0 ELSE 1.6 END)`,
      `UPDATE user_profile SET target_protein = 0
         WHERE protein_target_mode = 'auto' AND (age < 18 OR target_protein NOT BETWEEN 20 AND 400)`,
    ],
  };
}

export function buildProfileBirthDateMigration(): {
  version: number;
  statements: readonly string[];
} {
  return {
    version: 10,
    statements: [
      `ALTER TABLE user_profile ADD COLUMN birth_date TEXT CHECK (
         birth_date IS NULL OR
         (birth_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
          AND date(birth_date, '+0 days') IS birth_date))`,
      profileWeightLogTriggerSql(),
    ],
  };
}

export function buildRequiredBirthDateMigration(): {
  version: number;
  statements: readonly string[];
} {
  const fields = `id, height_cm, weight_kg, birth_date, gender, goal, fitness_level, activity_factor,
     bmr, tdee, target_calories, target_protein, target_carbs, target_fat, theme,
     notif_morning, notif_lunch, notif_evening, notif_weekly, onboarding_completed, created_at, updated_at, calorie_target_mode, protein_target_mode`;
  return {
    // Version 11 required all existing profiles to already have a birth date.
    version: 12,
    statements: [
      `CREATE TABLE profile_with_birth_date (
    id                TEXT PRIMARY KEY,
    height_cm         REAL NOT NULL,
    weight_kg         REAL NOT NULL,
    birth_date        TEXT CHECK (birth_date IS NULL OR (
      birth_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
      AND date(birth_date, '+0 days') IS birth_date)),
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
    theme             TEXT NOT NULL DEFAULT 'light' CHECK (theme = 'light'),
    notif_morning     INTEGER NOT NULL DEFAULT 1,
    notif_lunch       INTEGER NOT NULL DEFAULT 1,
    notif_evening     INTEGER NOT NULL DEFAULT 1,
    notif_weekly      INTEGER NOT NULL DEFAULT 1,
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT,
    calorie_target_mode TEXT NOT NULL DEFAULT 'manual' CHECK (calorie_target_mode IN ('auto','manual')),
    protein_target_mode TEXT NOT NULL DEFAULT 'manual' CHECK (protein_target_mode IN ('auto','manual'))
  )`,
      `INSERT INTO profile_with_birth_date (${fields}) SELECT ${fields} FROM user_profile`,
      'DROP TABLE user_profile',
      'ALTER TABLE profile_with_birth_date RENAME TO user_profile',
      `CREATE TRIGGER require_new_profile_birth_date BEFORE INSERT ON user_profile
         WHEN NEW.birth_date IS NULL BEGIN SELECT RAISE(ABORT,'Birth date required'); END`,
      `CREATE TRIGGER retain_profile_birth_date BEFORE UPDATE OF birth_date ON user_profile
         WHEN NEW.birth_date IS NULL AND OLD.birth_date IS NOT NULL
         BEGIN SELECT RAISE(ABORT,'Birth date required'); END`,
      profileWeightLogTriggerSql(),
    ],
  };
}

export function buildWorkoutCoachingMigration(): {
  version: number;
  statements: readonly string[];
} {
  return {
    version: 13,
    statements: [
      "ALTER TABLE workout_session ADD COLUMN origin TEXT CHECK(origin IS NULL OR origin IN ('plan_day','free','composed'))",
      'ALTER TABLE workout_session ADD COLUMN place_id TEXT',
      'ALTER TABLE workout_session ADD COLUMN source_session_id TEXT',
      'ALTER TABLE workout_exercise ADD COLUMN original_exercise_id TEXT REFERENCES exercise(id) ON DELETE SET NULL',
      'ALTER TABLE workout_exercise ADD COLUMN use_at_place INTEGER CHECK(use_at_place IS NULL OR use_at_place = 1)',
      'ALTER TABLE workout_exercise ADD COLUMN next_weight_kg REAL CHECK(next_weight_kg IS NULL OR next_weight_kg BETWEEN 0 AND 500)',
      'ALTER TABLE workout_exercise ADD COLUMN planned_notes TEXT',
      'ALTER TABLE workout_exercise ADD COLUMN completion_note TEXT',
      `CREATE TABLE workout_preference (
        key TEXT PRIMARY KEY CHECK (key IN ('fitness_default_place','fitness_finder_schedule') OR key GLOB 'fitness_exercise_place:?*'),
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `INSERT INTO workout_preference (key, value, updated_at)
        SELECT key, value, COALESCE(updated_at, datetime('now')) FROM app_config
         WHERE key IN ('fitness_default_place','fitness_finder_schedule') AND value IS NOT NULL`,
      `INSERT OR IGNORE INTO workout_preference (key, value, updated_at)
        SELECT 'fitness_exercise_place:' || json_extract(place.value, '$.id'), place.value, COALESCE(cfg.updated_at, datetime('now'))
        FROM app_config cfg, json_each(CASE WHEN json_valid(cfg.value) THEN cfg.value ELSE '{}' END, '$.places') AS place
        WHERE cfg.key = 'fitness_exercise_places' AND place.type = 'object'
          AND json_type(place.value, '$.id') = 'text' AND json_type(place.value, '$.name') = 'text'
          AND json_type(place.value, '$.equipment') IN ('array','null')`,
      `INSERT OR REPLACE INTO app_config (key,value)
        SELECT 'workout_preference_upload_pending', '1' WHERE EXISTS (SELECT 1 FROM workout_preference)`,
      'CREATE INDEX idx_we_movement_history ON workout_exercise(exercise_id, workout_session_id)',
    ],
  };
}
