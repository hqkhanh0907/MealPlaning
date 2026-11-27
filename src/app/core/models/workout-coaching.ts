import { exerciseGuideText } from './exercise-guide-texts';
import {
  isTimedExercise,
  type WorkoutExerciseDetail,
  type TrainingPlanExerciseDraft,
} from './fitness.types';

export function loadFactor(exerciseId: string): number {
  return exerciseGuideText(exerciseId)?.loadTotalOfTwo ? 2 : 1;
}

export function loadLabel(exerciseId: string): string {
  return loadFactor(exerciseId) === 2 ? 'Tạ mỗi tay (kg)' : 'Mức tạ (kg)';
}

export function progressionLoad(exercise: WorkoutExerciseDetail): number | null {
  const sets = exercise.sets;
  const target = exercise.planned_max;
  if (
    !target ||
    !exercise.planned_sets ||
    sets.length < exercise.planned_sets ||
    isTimedExercise(exercise.exercise_id) ||
    sets.at(-1)?.effort !== 'easy'
  )
    return null;
  const weight = sets[0].weight_kg;
  return weight > 0 &&
    sets.every(
      (set) =>
        set.status === 'logged' &&
        !set.legacy_unit_unknown &&
        set.duration_seconds == null &&
        set.weight_kg === weight &&
        set.reps >= target,
    )
    ? weight
    : null;
}

export interface LastWorkoutSet {
  date?: string;
  exercise_id: string;
  place_id: string | null;
  weight_kg: number;
  next_weight_kg: number | null;
  reps: number;
  duration_seconds: number | null;
}

export interface WorkoutMovementSource {
  exerciseId: string;
  originalExerciseId?: string | null;
  sets?: number | null;
  repsMin?: number | null;
  repsMax?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
}

export interface WorkoutVenuePreview {
  placeId: string | null;
  placeName: string | null;
  equipment: readonly string[] | null;
  prescriptionSnapshot?: string;
  movements: readonly {
    sourceId: string;
    exerciseId: string;
    originalExerciseId?: string | null;
  }[];
}

export interface ComposedWorkoutPreview extends WorkoutVenuePreview {
  draft: readonly TrainingPlanExerciseDraft[];
}

export function venueMovements(
  sources: readonly WorkoutMovementSource[],
  rules: ReadonlyMap<string, string>,
): WorkoutVenuePreview['movements'] {
  const movements = sources.map((source) => {
    const original = source.originalExerciseId;
    const basis = original && rules.has(original) ? original : source.exerciseId;
    const target = rules.get(basis) ?? source.exerciseId;
    return {
      sourceId: source.exerciseId,
      exerciseId: target,
      originalExerciseId: target === basis ? (rules.has(basis) ? null : (original ?? null)) : basis,
    };
  });
  let reverted: boolean;
  do {
    reverted = false;
    const destinations = new Map<string, Set<string>>();
    for (const movement of movements) {
      const group = destinations.get(movement.exerciseId) ?? new Set<string>();
      group.add(movement.sourceId);
      destinations.set(movement.exerciseId, group);
    }
    for (const [index, movement] of movements.entries()) {
      if (
        movement.exerciseId !== movement.sourceId &&
        destinations.get(movement.exerciseId)!.size > 1
      ) {
        movement.exerciseId = movement.sourceId;
        movement.originalExerciseId = sources[index].originalExerciseId ?? null;
        reverted = true;
      }
    }
  } while (reverted);
  return movements;
}

export function sameVenuePreview(
  expected: WorkoutVenuePreview,
  actual: WorkoutVenuePreview,
): boolean {
  return (
    expected.placeId === actual.placeId &&
    (expected.prescriptionSnapshot === undefined ||
      expected.prescriptionSnapshot === actual.prescriptionSnapshot) &&
    JSON.stringify(expected.equipment) === JSON.stringify(actual.equipment) &&
    expected.movements.length === actual.movements.length &&
    expected.movements.every((old, index) => {
      const next = actual.movements[index];
      return (
        old.sourceId === next.sourceId &&
        old.exerciseId === next.exerciseId &&
        (old.originalExerciseId ?? null) === (next.originalExerciseId ?? null)
      );
    })
  );
}
