import { isTimedExercise, type TrainingPlanExerciseDraft } from './fitness.types';

type TrainingPrescription = Pick<
  TrainingPlanExerciseDraft,
  'sets' | 'repsMin' | 'repsMax' | 'restSeconds'
>;

export const trainingPrescriptionLimits = {
  minSets: 1,
  maxSets: 10,
  minReps: 1,
  maxReps: 50,
  minRestSeconds: 30,
  maxRestSeconds: 600,
} as const;

export function defaultTrainingRange(
  exerciseId: string,
): Pick<TrainingPrescription, 'repsMin' | 'repsMax'> {
  return isTimedExercise(exerciseId) ? { repsMin: 30, repsMax: 45 } : { repsMin: 8, repsMax: 12 };
}

export function normalizeTrainingPrescription(input: TrainingPrescription): TrainingPrescription {
  const limits = trainingPrescriptionLimits;
  return {
    sets: clampInteger(input.sets, limits.minSets, limits.maxSets),
    repsMin: clampInteger(input.repsMin, limits.minReps, limits.maxReps),
    repsMax: clampInteger(Math.max(input.repsMin, input.repsMax), limits.minReps, limits.maxReps),
    restSeconds: clampInteger(input.restSeconds, limits.minRestSeconds, limits.maxRestSeconds),
  };
}

function clampInteger(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : min;
}
