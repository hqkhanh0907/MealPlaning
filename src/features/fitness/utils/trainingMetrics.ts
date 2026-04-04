import type { Workout, WorkoutSet } from '../types';

export type { Workout, WorkoutSet } from '../types';

/** Exercise volume (total weight × reps for all sets) */
export function calculateExerciseVolume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, s) => sum + (s.reps ?? 0) * s.weightKg, 0);
}

/** Weekly volume across all workouts */
export function calculateWeeklyVolume(workouts: Workout[], allSets: WorkoutSet[]): number {
  return workouts.reduce((total, w) => {
    const workoutSets = allSets.filter(s => s.workoutId === w.id);
    return total + calculateExerciseVolume(workoutSets);
  }, 0);
}

/** Sessions count in last N days */
export function getSessionsInPeriod(workouts: Workout[], days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return workouts.filter(w => new Date(w.date) >= cutoff).length;
}

/** 1RM estimation (Brzycki formula — ±5% for <10 reps) */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight / (1.0278 - 0.0278 * reps));
}

/** Volume per muscle group from workout data */
export function getVolumeByMuscleGroup(
  sets: WorkoutSet[],
  exerciseMuscleMap: Record<string, string>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const set of sets) {
    if (!set.exerciseId) continue;
    const muscle = exerciseMuscleMap[set.exerciseId];
    if (muscle) {
      result[muscle] = (result[muscle] ?? 0) + (set.reps ?? 0);
    }
  }
  return result;
}

/** Personal record detection */
export function isPersonalRecord(
  exerciseId: string,
  weight: number,
  reps: number,
  historicalSets: WorkoutSet[],
): boolean {
  const exerciseSets = historicalSets.filter(s => s.exerciseId === exerciseId);
  const maxEstimated1RM = Math.max(0, ...exerciseSets.map(s => estimate1RM(s.weightKg, s.reps ?? 0)));
  const current1RM = estimate1RM(weight, reps);
  return current1RM > maxEstimated1RM;
}
