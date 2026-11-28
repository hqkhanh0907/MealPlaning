ALTER TABLE workout_session ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE workout_session ADD COLUMN cancelled_at TEXT;

UPDATE workout_session SET status = 'completed' WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ws_status ON workout_session(status);
