DROP INDEX IF EXISTS idx_planned_dish_completed_at;

DROP INDEX IF EXISTS idx_planned_dish_completed;

DROP INDEX IF EXISTS idx_planned_dish_dish;

DROP INDEX IF EXISTS idx_planned_dish_meal_slot;

ALTER TABLE planned_dish RENAME TO planned_dish_v2_backup;

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
  );

INSERT INTO planned_dish
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
   FROM planned_dish_v2_backup;

DROP TABLE planned_dish_v2_backup;

CREATE INDEX idx_planned_dish_meal_slot   ON planned_dish(meal_slot_id);

CREATE INDEX idx_planned_dish_dish        ON planned_dish(dish_id);

CREATE INDEX idx_planned_dish_completed
     ON planned_dish(is_completed, meal_slot_id) WHERE is_completed = 1;

CREATE INDEX idx_planned_dish_completed_at
     ON planned_dish(completed_at DESC) WHERE is_completed = 1;
