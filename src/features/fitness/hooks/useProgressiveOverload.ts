import { useCallback, useMemo } from 'react';
import { useFitnessStore } from '../../../store/fitnessStore';
import type { WorkoutSet, TrainingExperience, SetSuggestion } from '../types';
import { getOverloadIncrement } from '../utils/periodization';
import { EXERCISES } from '../data/exerciseDatabase';
import { analyzePlateau } from '../utils/plateauAnalysis';
import type { PlateauResult } from '../utils/plateauAnalysis';

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

export function isWeightSimilar(
  a: number,
  b: number,
  tolerance = 0.02,
): boolean {
  if (a === b) return true;
  const reference = Math.max(Math.abs(a), Math.abs(b));
  if (reference === 0) return true;
  return Math.abs(a - b) / reference <= tolerance;
}

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

  const lastSet = lastSets.at(-1)!;
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
  const latestMax = maxWeights.at(-1)!;

  for (let i = maxWeights.length - 2; i >= 0; i--) {
    if (isWeightSimilar(maxWeights[i], latestMax)) {
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

export type FatigueLevel = 'none' | 'moderate' | 'high';

export function detectAcuteFatigue(
  recentSets: WorkoutSet[],
): { level: FatigueLevel; message: string } {
  if (recentSets.length < 3) return { level: 'none', message: '' };
  const last3Rpes = recentSets
    .slice(-9)
    .map((s) => s.rpe ?? 0)
    .filter((r) => r > 0);
  if (last3Rpes.length === 0) return { level: 'none', message: '' };
  const avgRpe = last3Rpes.reduce((a, b) => a + b, 0) / last3Rpes.length;
  const lastSessionVolume = recentSets
    .slice(-3)
    .reduce((sum, s) => sum + (s.reps ?? 0) * s.weightKg, 0);
  const avgSessionVolume =
    recentSets
      .slice(-9, -3)
      .reduce((sum, s) => sum + (s.reps ?? 0) * s.weightKg, 0) / 2;
  const volumeSpikeRatio =
    avgSessionVolume > 0 ? lastSessionVolume / avgSessionVolume : 1;
  if (avgRpe >= 9.0 || volumeSpikeRatio > 1.3) {
    return {
      level: 'high',
      message: `Acute fatigue: avg RPE ${avgRpe.toFixed(1)}, volume spike ${Math.round(volumeSpikeRatio * 100)}%`,
    };
  }
  if (avgRpe >= 8.0) {
    return {
      level: 'moderate',
      message: `Moderate fatigue: avg RPE ${avgRpe.toFixed(1)}`,
    };
  }
  return { level: 'none', message: '' };
}

export function detectChronicOvertraining(
  historySets: WorkoutSet[],
): { level: FatigueLevel; message: string } {
  if (historySets.length < 12) return { level: 'none', message: '' };
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const weeklyVolumes: number[] = [];
  for (let w = 0; w < 6; w++) {
    const weekStart = now - (w + 1) * weekMs;
    const weekEnd = now - w * weekMs;
    const weekSets = historySets.filter((s) => {
      const t = new Date(s.updatedAt).getTime();
      return t >= weekStart && t < weekEnd;
    });
    weeklyVolumes.unshift(
      weekSets.reduce((sum, s) => sum + (s.reps ?? 0) * s.weightKg, 0),
    );
  }
  let decliningWeeks = 0;
  for (let i = 1; i < weeklyVolumes.length; i++) {
    if (weeklyVolumes[i] < weeklyVolumes[i - 1] * 0.95) decliningWeeks++;
    else decliningWeeks = 0;
  }
  if (decliningWeeks >= 4) {
    return {
      level: 'high',
      message: `Chronic overtraining: ${decliningWeeks} weeks declining`,
    };
  }
  if (decliningWeeks >= 2) {
    return {
      level: 'moderate',
      message: `Watch: ${decliningWeeks} weeks declining`,
    };
  }
  return { level: 'none', message: '' };
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
  analyzeExercisePlateau: (exerciseId: string) => PlateauResult;
  checkAcuteFatigue: (
    exerciseId: string,
    recentSets: WorkoutSet[],
  ) => { level: FatigueLevel; message: string };
  checkChronicOvertraining: (
    exerciseId: string,
  ) => { level: FatigueLevel; message: string };
  acuteFatigue: { level: FatigueLevel; message: string };
  chronicOvertraining: { level: FatigueLevel; message: string };
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

  const acuteFatigue = useMemo(
    () => detectAcuteFatigue(workoutSets),
    [workoutSets],
  );

  const chronicOvertraining = useMemo(
    () => detectChronicOvertraining(workoutSets),
    [workoutSets],
  );

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

  const analyzeExercisePlateauFn = useCallback(
    (exerciseId: string): PlateauResult =>
      analyzePlateau(workouts, workoutSets, exerciseId),
    [workouts, workoutSets],
  );

  const checkAcuteFatigueFn = useCallback(
    (
      exerciseId: string,
      recentSets: WorkoutSet[],
    ): { level: FatigueLevel; message: string } => {
      const exerciseSets = recentSets.filter(
        (s) => s.exerciseId === exerciseId,
      );
      return detectAcuteFatigue(exerciseSets);
    },
    [],
  );

  const checkChronicOvertrainingFn = useCallback(
    (
      exerciseId: string,
    ): { level: FatigueLevel; message: string } => {
      const exerciseSets = workoutSets.filter(
        (s) => s.exerciseId === exerciseId,
      );
      return detectChronicOvertraining(exerciseSets);
    },
    [workoutSets],
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
      const exerciseSets = workoutSets.filter(
        (s) => s.exerciseId === exerciseId,
      );
      const fatigueResult = detectAcuteFatigue(exerciseSets);
      const setsWithRpe = exerciseSets.filter(
        (s) => s.rpe != null && s.rpe > 0,
      );
      const avgRpe =
        setsWithRpe.length > 0
          ? Math.round(
              (setsWithRpe.reduce((sum, s) => sum + (s.rpe ?? 0), 0) /
                setsWithRpe.length) *
                100,
            ) / 100
          : 0;

      return {
        ...suggestion,
        ...(plateauResult.isPlateaued
          ? { isPlateaued: true, plateauWeeks: plateauResult.weeks }
          : {}),
        ...(fatigueResult.level !== 'none'
          ? { isOvertraining: true, avgRpe }
          : {}),
      };
    },
    [getLastSets, trainingProfile, checkPlateauFn, workoutSets],
  );

  return {
    suggestNextSet: suggestNextSetFn,
    getLastSets,
    checkPlateau: checkPlateauFn,
    analyzeExercisePlateau: analyzeExercisePlateauFn,
    checkAcuteFatigue: checkAcuteFatigueFn,
    checkChronicOvertraining: checkChronicOvertrainingFn,
    acuteFatigue,
    chronicOvertraining,
  };
}
