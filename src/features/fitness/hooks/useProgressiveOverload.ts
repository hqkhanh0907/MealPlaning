import { useCallback, useMemo } from 'react';
import { useFitnessStore } from '../../../store/fitnessStore';
import type { WorkoutSet, TrainingExperience, SetSuggestion } from '../types';
import { getOverloadIncrement } from '../utils/periodization';
import { EXERCISES } from '../data/exerciseDatabase';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface OverloadSuggestion extends SetSuggestion {
  isPlateaued?: boolean;
  isOvertraining?: boolean;
  plateauWeeks?: number;
  avgRpe?: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const LOWER_BODY_MUSCLES = new Set(['legs', 'glutes']);
const EXERCISE_MAP = new Map(EXERCISES.map((e) => [e.id, e]));

/* ------------------------------------------------------------------ */
/*  Pure functions (exported for testing)                                */
/* ------------------------------------------------------------------ */

export function isLowerBodyExercise(exerciseId: string): boolean {
  const exercise = EXERCISE_MAP.get(exerciseId);
  if (!exercise) return false;
  return LOWER_BODY_MUSCLES.has(exercise.muscleGroup);
}

export function suggestNextSet(
  lastSets: WorkoutSet[],
  experience: TrainingExperience,
  targetRepsMin: number,
  targetRepsMax: number,
  isLower: boolean,
): OverloadSuggestion {
  if (lastSets.length === 0) {
    return { weight: 0, reps: targetRepsMin, source: 'manual' };
  }

  const lastSet = lastSets[lastSets.length - 1];
  const lastReps = lastSet.reps ?? 0;

  if (lastReps >= targetRepsMax) {
    return {
      weight: lastSet.weightKg + getOverloadIncrement(experience, !isLower),
      reps: targetRepsMin,
      source: 'progressive_overload',
    };
  }

  return {
    weight: lastSet.weightKg,
    reps: lastReps + 1,
    source: 'rep_progression',
  };
}

export function detectPlateau(
  historySets: WorkoutSet[][],
  threshold = 3,
): { isPlateaued: boolean; weeks: number } {
  if (historySets.length < threshold) {
    return { isPlateaued: false, weeks: 0 };
  }

  const maxWeights = historySets.map((sets) =>
    sets.length > 0 ? Math.max(...sets.map((s) => s.weightKg)) : 0,
  );

  let streakCount = 1;
  const latestMax = maxWeights[maxWeights.length - 1];

  for (let i = maxWeights.length - 2; i >= 0; i--) {
    if (maxWeights[i] === latestMax) {
      streakCount++;
    } else {
      break;
    }
  }

  return {
    isPlateaued: streakCount >= threshold,
    weeks: streakCount,
  };
}

function hasRpe(s: WorkoutSet): s is WorkoutSet & { rpe: number } {
  return s.rpe != null;
}

export function detectOvertraining(
  sets: WorkoutSet[],
  rpeThreshold = 9,
): { isOvertraining: boolean; avgRpe: number } {
  const setsWithRpe = sets.filter(hasRpe);

  if (setsWithRpe.length === 0) {
    return { isOvertraining: false, avgRpe: 0 };
  }

  const totalRpe = setsWithRpe.reduce((sum, s) => sum + s.rpe, 0);
  const avgRpe =
    Math.round((totalRpe / setsWithRpe.length) * 100) / 100;

  return {
    isOvertraining: avgRpe > rpeThreshold,
    avgRpe,
  };
}

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */

export function useProgressiveOverload(): {
  suggestNextSet: (
    exerciseId: string,
    targetRepsMin: number,
    targetRepsMax: number,
  ) => OverloadSuggestion;
  getLastSets: (exerciseId: string) => WorkoutSet[];
  checkPlateau: (
    exerciseId: string,
  ) => { isPlateaued: boolean; weeks: number };
  checkOvertraining: (
    exerciseId: string,
    recentSets: WorkoutSet[],
  ) => { isOvertraining: boolean; avgRpe: number };
} {
  const workoutSets = useFitnessStore((state) => state.workoutSets);
  const workouts = useFitnessStore((state) => state.workouts);
  const trainingProfile = useFitnessStore((state) => state.trainingProfile);

  const workoutSetsByWorkoutId = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>();
    for (const s of workoutSets) {
      const arr = map.get(s.workoutId) ?? [];
      arr.push(s);
      map.set(s.workoutId, arr);
    }
    return map;
  }, [workoutSets]);

  const getLastSets = useCallback(
    (exerciseId: string): WorkoutSet[] => {
      const exerciseSets = workoutSets.filter(
        (s) => s.exerciseId === exerciseId,
      );
      if (exerciseSets.length === 0) return [];

      const workoutIdSet = new Set(exerciseSets.map((s) => s.workoutId));
      const relevantWorkouts = workouts
        .filter((w) => workoutIdSet.has(w.id))
        .sort((a, b) => b.date.localeCompare(a.date));

      if (relevantWorkouts.length === 0) return [];

      return (workoutSetsByWorkoutId.get(relevantWorkouts[0].id) ?? [])
        .filter((s) => s.exerciseId === exerciseId)
        .sort((a, b) => a.setNumber - b.setNumber);
    },
    [workoutSets, workouts, workoutSetsByWorkoutId],
  );

  const checkPlateauFn = useCallback(
    (exerciseId: string): { isPlateaued: boolean; weeks: number } => {
      const exerciseSets = workoutSets.filter(
        (s) => s.exerciseId === exerciseId,
      );
      if (exerciseSets.length === 0) return { isPlateaued: false, weeks: 0 };

      const workoutIdSet = new Set(exerciseSets.map((s) => s.workoutId));
      const relevantWorkouts = workouts
        .filter((w) => workoutIdSet.has(w.id))
        .sort((a, b) => a.date.localeCompare(b.date));

      const groupedSets = relevantWorkouts.map((w) =>
        (workoutSetsByWorkoutId.get(w.id) ?? []).filter(
          (s) => s.exerciseId === exerciseId,
        ),
      );

      return detectPlateau(groupedSets);
    },
    [workoutSets, workouts, workoutSetsByWorkoutId],
  );

  const checkOvertrainingFn = useCallback(
    (
      exerciseId: string,
      recentSets: WorkoutSet[],
    ): { isOvertraining: boolean; avgRpe: number } => {
      const exerciseSets = recentSets.filter(
        (s) => s.exerciseId === exerciseId,
      );
      return detectOvertraining(exerciseSets);
    },
    [],
  );

  const suggestNextSetFn = useCallback(
    (
      exerciseId: string,
      targetRepsMin: number,
      targetRepsMax: number,
    ): OverloadSuggestion => {
      const lastSets = getLastSets(exerciseId);
      const experience =
        trainingProfile?.trainingExperience ?? 'beginner';
      const isLower = isLowerBodyExercise(exerciseId);

      const suggestion = suggestNextSet(
        lastSets,
        experience,
        targetRepsMin,
        targetRepsMax,
        isLower,
      );

      const plateauResult = checkPlateauFn(exerciseId);
      const overtrainingResult = detectOvertraining(lastSets);

      return {
        ...suggestion,
        ...(plateauResult.isPlateaued
          ? { isPlateaued: true, plateauWeeks: plateauResult.weeks }
          : {}),
        ...(overtrainingResult.isOvertraining
          ? { isOvertraining: true, avgRpe: overtrainingResult.avgRpe }
          : {}),
      };
    },
    [getLastSets, trainingProfile, checkPlateauFn],
  );

  return {
    suggestNextSet: suggestNextSetFn,
    getLastSets,
    checkPlateau: checkPlateauFn,
    checkOvertraining: checkOvertrainingFn,
  };
}
