DROP INDEX IF EXISTS idx_planned_dish_slot;

DROP INDEX IF EXISTS idx_meal_slot_day;

DROP INDEX IF EXISTS idx_day_plan_date;

DROP TABLE IF EXISTS planned_dish;

DROP TABLE IF EXISTS meal_slot;

DROP TABLE IF EXISTS day_plan;

CREATE TABLE day_plan (
    id                TEXT PRIMARY KEY,
    date              TEXT NOT NULL,
    target_calories   REAL NOT NULL,
    target_protein    REAL NOT NULL,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT,
    UNIQUE(date)
  );

CREATE INDEX idx_day_plan_date ON day_plan(date);

CREATE TABLE meal_slot (
    id                TEXT PRIMARY KEY,
    day_plan_id       TEXT NOT NULL REFERENCES day_plan(id) ON DELETE CASCADE,
    meal_type         TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    position          INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(day_plan_id, meal_type)
  );

CREATE INDEX idx_meal_slot_day_plan ON meal_slot(day_plan_id);

CREATE TABLE planned_dish (
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
  );

CREATE INDEX idx_planned_dish_meal_slot   ON planned_dish(meal_slot_id);

CREATE INDEX idx_planned_dish_dish        ON planned_dish(dish_id);

CREATE INDEX idx_planned_dish_completed
     ON planned_dish(is_completed, meal_slot_id) WHERE is_completed = 1;

CREATE INDEX idx_planned_dish_completed_at
     ON planned_dish(completed_at DESC) WHERE is_completed = 1;

CREATE INDEX IF NOT EXISTS idx_dish_favorite
     ON dish(is_favorite) WHERE is_favorite = 1;
