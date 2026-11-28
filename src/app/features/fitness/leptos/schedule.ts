import { exercisePurpose } from '../../../core/models/exercise-guides';
import type { TrainingPlanDayWithExercises } from '../../../core/models/fitness.types';
export function workoutDay(
  day: TrainingPlanDayWithExercises,
  last?: (id: string) => string | null | undefined,
): object {
  return {
    id: day.id,
    name: day.name,
    is_rest_day: day.is_rest_day,
    day_of_week: day.day_of_week,
    exercises: day.exercises.map((e) => ({
      exercise_id: e.exercise_id,
      exercise_name: e.exercise_name,
      exercise_name_vi: e.exercise_name_vi,
      sets: e.sets,
      reps_min: e.reps_min,
      reps_max: e.reps_max,
      rest_seconds: e.rest_seconds,
      notes: e.notes,
      purpose: exercisePurpose(e),
      last: last?.(e.exercise_id) ?? null,
    })),
  };
}
