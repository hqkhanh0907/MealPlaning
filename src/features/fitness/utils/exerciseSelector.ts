import type { ExerciseSeed } from '../data/exerciseDatabase';
import { EXERCISES as EXERCISE_SEEDS } from '../data/exerciseDatabase';
import type {
  BodyRegion,
  EquipmentType,
  Exercise,
  ExerciseCategory,
  MuscleGroup,
  SelectedExercise,
  TrainingProfile,
} from '../types';
import { isBodyRegion } from '../types';
import { getWeekRepScheme } from './periodization';
import type { GoalType } from './volumeCalculator';
import { calculateTargetWeeklySets, distributeVolume } from './volumeCalculator';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const CATEGORY_ORDER: Record<ExerciseCategory, number> = {
  compound: 0,
  secondary: 1,
  isolation: 2,
};

const ALL_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];

/* ------------------------------------------------------------------ */
/* Seed → Exercise conversion                                          */
/* ------------------------------------------------------------------ */

export function seedToExercise(seed: ExerciseSeed): Exercise {
  return {
    ...seed,
    muscleGroup: seed.muscleGroup as MuscleGroup,
    secondaryMuscles: seed.secondaryMuscles as MuscleGroup[],
    equipment: seed.equipment as EquipmentType[],
    contraindicated: seed.contraindicated.filter(isBodyRegion),
    updatedAt: '',
  };
}

export function getDefaultExercises(): Exercise[] {
  return EXERCISE_SEEDS.map(seedToExercise);
}

/* ------------------------------------------------------------------ */
/* Volume calculation                                                  */
/* ------------------------------------------------------------------ */

export function calculateVolume(
  profile: TrainingProfile,
  healthProfile?: { age?: number; goalType?: GoalType },
): Record<MuscleGroup, number> {
  const goalType: GoalType = healthProfile?.goalType ?? 'maintain';
  const age = healthProfile?.age ?? 30;

  const result = {} as Record<MuscleGroup, number>;
  for (const muscle of ALL_MUSCLES) {
    result[muscle] = calculateTargetWeeklySets(
      muscle,
      profile.trainingExperience,
      goalType,
      age,
      profile.avgSleepHours,
      profile.priorityMuscles,
      profile.sessionDurationMin,
    );
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Session volume distribution                                         */
/* ------------------------------------------------------------------ */

interface SessionTemplate {
  muscleGroups: MuscleGroup[];
}

export function calculateSetsPerSession(
  weeklyVolume: Record<MuscleGroup, number>,
  sessions: SessionTemplate[],
): Record<MuscleGroup, number>[] {
  const muscleFrequency = {} as Record<MuscleGroup, number>;
  for (const session of sessions) {
    for (const muscle of session.muscleGroups) {
      muscleFrequency[muscle] = (muscleFrequency[muscle] ?? 0) + 1;
    }
  }

  return sessions.map(session => {
    const sets = {} as Record<MuscleGroup, number>;
    for (const muscle of session.muscleGroups) {
      const freq = muscleFrequency[muscle];
      sets[muscle] = Math.max(1, Math.round(weeklyVolume[muscle] / freq));
    }
    return sets;
  });
}

/* ------------------------------------------------------------------ */
/* Exercise selection                                                  */
/* ------------------------------------------------------------------ */

export function selectExercisesForMuscle(
  muscleGroup: MuscleGroup,
  setsNeeded: number,
  availableEquipment: EquipmentType[],
  injuries: BodyRegion[],
  exerciseDB: Exercise[],
): SelectedExercise[] {
  const eligible = exerciseDB.filter(
    ex =>
      ex.muscleGroup === muscleGroup &&
      ex.exerciseType === 'strength' &&
      ex.equipment.some(eq => availableEquipment.includes(eq)) &&
      !ex.contraindicated.some(ci => injuries.includes(ci)),
  );

  let pool = eligible;
  if (pool.length === 0 && !availableEquipment.includes('bodyweight')) {
    pool = exerciseDB.filter(
      ex =>
        ex.muscleGroup === muscleGroup &&
        ex.exerciseType === 'strength' &&
        ex.equipment.includes('bodyweight') &&
        !ex.contraindicated.some(ci => injuries.includes(ci)),
    );
  }

  if (pool.length === 0) return [];

  const sorted = [...pool].sort((a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category]);

  const maxExercises = Math.min(sorted.length, Math.max(1, Math.ceil(setsNeeded / 3)));
  const selected = sorted.slice(0, maxExercises);
  const distribution = distributeVolume(selected.length, setsNeeded);

  return selected.map((ex, i) => ({
    exercise: ex,
    sets: distribution[i],
    repsMin: ex.defaultRepsMin,
    repsMax: ex.defaultRepsMax,
    restSeconds: 90,
  }));
}

/* ------------------------------------------------------------------ */
/* Rep scheme application                                              */
/* ------------------------------------------------------------------ */

export function applyRepScheme(
  exercises: SelectedExercise[],
  profile: TrainingProfile,
  sessionIndex: number,
  weekNumber: number,
): SelectedExercise[] {
  const scheme = getWeekRepScheme(profile.periodizationModel, profile.trainingGoal, weekNumber, sessionIndex + 1);

  return exercises.map(ex => ({
    ...ex,
    repsMin: scheme.repsMin,
    repsMax: scheme.repsMax,
    restSeconds: scheme.restSeconds,
  }));
}

/* ------------------------------------------------------------------ */
/* Muscle group parsing (handles both CSV and JSON formats)            */
/* ------------------------------------------------------------------ */

const VALID_MUSCLES = new Set<string>(ALL_MUSCLES);

export function parseMuscleGroups(raw: string | undefined): MuscleGroup[] {
  if (!raw) return [];

  let candidates: string[];
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      candidates = Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      candidates = trimmed.split(',').map(s => s.trim());
    }
  } else {
    candidates = trimmed.split(',').map(s => s.trim());
  }

  return candidates.filter((c): c is MuscleGroup => VALID_MUSCLES.has(c));
}

/* ------------------------------------------------------------------ */
/* High-level: generate exercises for a single day                     */
/* ------------------------------------------------------------------ */

export function generateExercisesForDay(
  muscleGroups: MuscleGroup[],
  setsPerMuscle: Record<MuscleGroup, number>,
  profile: TrainingProfile,
  sessionIndex: number,
  exerciseDB?: Exercise[],
): SelectedExercise[] {
  const db = exerciseDB ?? getDefaultExercises();
  let allExercises: SelectedExercise[] = [];

  for (const muscle of muscleGroups) {
    const sets = setsPerMuscle[muscle] ?? 3;
    const selected = selectExercisesForMuscle(muscle, sets, profile.availableEquipment, profile.injuryRestrictions, db);
    allExercises = [...allExercises, ...selected];
  }

  return applyRepScheme(allExercises, profile, sessionIndex, 1);
}
