ALTER TABLE workout_session ADD COLUMN origin TEXT CHECK(origin IS NULL OR origin IN ('plan_day','free','composed'));

ALTER TABLE workout_session ADD COLUMN place_id TEXT;

ALTER TABLE workout_session ADD COLUMN source_session_id TEXT;

ALTER TABLE workout_exercise ADD COLUMN original_exercise_id TEXT REFERENCES exercise(id) ON DELETE SET NULL;

ALTER TABLE workout_exercise ADD COLUMN use_at_place INTEGER CHECK(use_at_place IS NULL OR use_at_place = 1);

ALTER TABLE workout_exercise ADD COLUMN next_weight_kg REAL CHECK(next_weight_kg IS NULL OR next_weight_kg BETWEEN 0 AND 500);

ALTER TABLE workout_exercise ADD COLUMN planned_notes TEXT;

ALTER TABLE workout_exercise ADD COLUMN completion_note TEXT;

CREATE TABLE workout_preference (
        key TEXT PRIMARY KEY CHECK (key IN ('fitness_default_place','fitness_finder_schedule') OR key GLOB 'fitness_exercise_place:?*'),
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

INSERT INTO workout_preference (key, value, updated_at)
        SELECT key, value, COALESCE(updated_at, datetime('now')) FROM app_config
         WHERE key IN ('fitness_default_place','fitness_finder_schedule') AND value IS NOT NULL;

INSERT OR IGNORE INTO workout_preference (key, value, updated_at)
        SELECT 'fitness_exercise_place:' || json_extract(place.value, '$.id'), place.value, COALESCE(cfg.updated_at, datetime('now'))
        FROM app_config cfg, json_each(CASE WHEN json_valid(cfg.value) THEN cfg.value ELSE '{}' END, '$.places') AS place
        WHERE cfg.key = 'fitness_exercise_places' AND place.type = 'object'
          AND json_type(place.value, '$.id') = 'text' AND json_type(place.value, '$.name') = 'text'
          AND json_type(place.value, '$.equipment') IN ('array','null');

INSERT OR REPLACE INTO app_config (key,value)
        SELECT 'workout_preference_upload_pending', '1' WHERE EXISTS (SELECT 1 FROM workout_preference);

CREATE INDEX idx_we_movement_history ON workout_exercise(exercise_id, workout_session_id);
