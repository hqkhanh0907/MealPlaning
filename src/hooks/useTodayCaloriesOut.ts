import { useMemo } from 'react';

import { useFitnessStore } from '../store/fitnessStore';

export function useTodayCaloriesOut(): number {
  const workouts = useFitnessStore(s => s.workouts);
  const workoutSets = useFitnessStore(s => s.workoutSets);

  return useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayWorkoutIds = new Set(workouts.filter(w => w.date === todayStr).map(w => w.id));
    if (todayWorkoutIds.size === 0) return 0;
    const cardioCalories = workoutSets
      .filter(s => todayWorkoutIds.has(s.workoutId) && s.estimatedCalories)
      .reduce((sum, s) => sum + (s.estimatedCalories ?? 0), 0);
    const strengthSets = workoutSets.filter(
      s => todayWorkoutIds.has(s.workoutId) && !s.estimatedCalories && s.weightKg > 0,
    );
    const strengthCalories = strengthSets.length * 8;
    return Math.round(cardioCalories + strengthCalories);
  }, [workouts, workoutSets]);
}
