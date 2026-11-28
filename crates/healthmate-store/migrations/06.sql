ALTER TABLE workout_set ADD COLUMN status TEXT NOT NULL DEFAULT 'logged';

ALTER TABLE workout_set ADD COLUMN completed_at TEXT;

UPDATE workout_set SET completed_at = created_at WHERE status = 'logged';

CREATE INDEX IF NOT EXISTS idx_ws_set_status ON workout_set(status);
