import type { SelectedExercise } from '../types';

const WARM_UP_MIN = 5;
const SET_DURATION_SEC = 40;
const SETUP_SEC = 30;

/**
 * Estimates the total workout duration in minutes for a list of exercises.
 * Includes 5-minute warm-up, 40s per set execution, rest between sets,
 * and 30s setup time per exercise.
 */
export function estimateDuration(exercises: SelectedExercise[]): number {
  if (exercises.length === 0) return 0;
  const totalSeconds = exercises.reduce(
    (sum, ex) => sum + ex.sets * (SET_DURATION_SEC + ex.restSeconds) + SETUP_SEC,
    0,
  );
  return Math.round(totalSeconds / 60) + WARM_UP_MIN;
}

/**
 * Trims an exercise list to fit within a target duration (minutes).
 * Removes exercises from the end first (least important / isolation),
 * then reduces sets on the last remaining exercise if still over.
 */
export function trimToFitDuration(exercises: SelectedExercise[], targetMinutes: number): SelectedExercise[] {
  if (exercises.length === 0) return exercises;

  const current = exercises.map(ex => ({ ...ex }));

  while (estimateDuration(current) > targetMinutes && current.length > 1) {
    current.pop();
  }

  if (current.length === 1 && estimateDuration(current) > targetMinutes) {
    const ex = current[0];
    while (ex.sets > 1 && estimateDuration([ex]) > targetMinutes) {
      ex.sets--;
    }
  }

  return current;
}
