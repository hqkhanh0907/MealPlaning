ALTER TABLE workout_set ADD COLUMN duration_seconds INTEGER CHECK (duration_seconds > 0);

ALTER TABLE workout_set ADD COLUMN legacy_unit_unknown INTEGER NOT NULL DEFAULT 0;

UPDATE workout_set SET legacy_unit_unknown = 1 WHERE workout_exercise_id IN (
         SELECT id FROM workout_exercise WHERE exercise_id IN (
           'ex_plank','ex_farmer_carry','ex_treadmill_run','ex_stationary_bike','ex_rowing_machine'));

UPDATE workout_exercise SET total_volume = 0 WHERE id IN
         (SELECT workout_exercise_id FROM workout_set WHERE legacy_unit_unknown = 1);

UPDATE workout_session SET total_volume = (SELECT COALESCE(SUM(we.total_volume), 0)
         FROM workout_exercise we WHERE we.workout_session_id = workout_session.id)
         WHERE id IN (SELECT we.workout_session_id FROM workout_exercise we JOIN workout_set ws
           ON ws.workout_exercise_id = we.id WHERE ws.legacy_unit_unknown = 1);

UPDATE workout_session SET training_day_name = 'Tập tự do'
         WHERE mode = 'free' AND training_day_name = 'Free Workout';

ALTER TABLE workout_exercise ADD COLUMN planned_sets INTEGER;

ALTER TABLE workout_exercise ADD COLUMN planned_min INTEGER;

ALTER TABLE workout_exercise ADD COLUMN planned_max INTEGER;

ALTER TABLE workout_exercise ADD COLUMN planned_rest INTEGER;

UPDATE workout_exercise SET (planned_sets, planned_min, planned_max, planned_rest) =
        (SELECT pe.sets, pe.reps_min, pe.reps_max, pe.rest_seconds FROM planned_exercise pe
          JOIN workout_session s ON s.training_plan_day_id = pe.training_plan_day_id
          WHERE s.id = workout_exercise.workout_session_id AND pe.exercise_id = workout_exercise.exercise_id)
        WHERE workout_session_id IN (SELECT id FROM workout_session WHERE status = 'active' AND mode = 'guided');
