import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import { useFitnessStore } from '../store/fitnessStore';

const STRENGTH_MET = 5;
const FALLBACK_CAL_PER_SET = 8;

export function useTodayCaloriesOut(): number {
  const { workouts, workoutSets } = useFitnessStore(
    useShallow(s => ({
      workouts: s.workouts,
      workoutSets: s.workoutSets,
    })),
  );
  const weightKg = useHealthProfileStore(s => s.profile?.weightKg ?? 70);

  return useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayWorkouts = workouts.filter(w => w.date === todayStr);
    const todayWorkoutIds = new Set(todayWorkouts.map(w => w.id));
    if (todayWorkoutIds.size === 0) return 0;

    const cardioCalories = workoutSets
      .filter(s => todayWorkoutIds.has(s.workoutId) && s.estimatedCalories)
      .reduce((sum, s) => sum + (s.estimatedCalories ?? 0), 0);

    const strengthSets = workoutSets.filter(
      s => todayWorkoutIds.has(s.workoutId) && !s.estimatedCalories && s.weightKg > 0,
    );

    let strengthCalories = 0;
    for (const workout of todayWorkouts) {
      const wSets = strengthSets.filter(s => s.workoutId === workout.id);
      if (wSets.length === 0) continue;
      if (workout.durationMin && workout.durationMin > 0) {
        strengthCalories += Math.round((STRENGTH_MET * weightKg * workout.durationMin) / 60);
      } else {
        strengthCalories += wSets.length * FALLBACK_CAL_PER_SET;
      }
    }

    return Math.round(cardioCalories + strengthCalories);
  }, [workouts, workoutSets, weightKg]);
}
