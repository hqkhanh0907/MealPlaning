import { isTimedExercise, type WorkoutSet, type WorkoutEffort } from './fitness.types';

export interface WorkoutSetInput {
  weightKg: number;
  reps: number;
  durationSeconds?: number;
  restSeconds: number;
  effort: WorkoutEffort | null;
  notes: string | null;
}

export const workoutSetLimits = {
  maxWeightKg: 500,
  maxReps: 100,
  maxDurationSeconds: 86_400,
  maxRestSeconds: 600,
} as const;

type WorkoutSetIssue = 'weight' | 'duration' | 'reps' | 'rest';

export function workoutSetIssue(
  exerciseId: string,
  input: WorkoutSetInput,
): WorkoutSetIssue | null {
  if (
    !Number.isFinite(input.weightKg) ||
    input.weightKg < 0 ||
    input.weightKg > workoutSetLimits.maxWeightKg
  ) {
    return 'weight';
  }
  if (isTimedExercise(exerciseId)) {
    if (
      input.reps !== 0 ||
      !integerWithin(input.durationSeconds, 1, workoutSetLimits.maxDurationSeconds)
    ) {
      return 'duration';
    }
  } else if (
    input.durationSeconds != null ||
    !integerWithin(input.reps, 1, workoutSetLimits.maxReps)
  ) {
    return 'reps';
  }
  return integerWithin(input.restSeconds, 0, workoutSetLimits.maxRestSeconds) ? null : 'rest';
}

function integerWithin(value: number | undefined, min: number, max: number): boolean {
  return value != null && Number.isInteger(value) && value >= min && value <= max;
}

export function isLoggedSet(set: WorkoutSet): boolean {
  return set.status === 'logged';
}
