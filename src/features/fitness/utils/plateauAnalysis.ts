import type { Workout, WorkoutSet } from '../types';

export interface PlateauResult {
  strengthPlateau: boolean;
  volumePlateau: boolean;
  messageKey: string;
  message: string;
}

export function analyzePlateau(_workouts: Workout[], sets: WorkoutSet[], exerciseId: string): PlateauResult {
  const exerciseSets = sets.filter(s => s.exerciseId === exerciseId);

  if (exerciseSets.length < 6) {
    return {
      strengthPlateau: false,
      volumePlateau: false,
      messageKey: 'fitness.coaching.plateau.insufficientData',
      message: '',
    };
  }

  const sorted = [...exerciseSets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Strength plateau: 3+ sessions no weight increase on top set
  const topWeights = sorted.slice(0, 9).map(s => s.weightKg);
  const maxRecent = Math.max(...topWeights.slice(0, 3));
  const maxPrevious = Math.max(...topWeights.slice(3, 9));
  const strengthPlateau = maxRecent <= maxPrevious;

  // Volume plateau: weekly volume not increasing
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const thisWeekVol = sorted
    .filter(s => now - new Date(s.updatedAt).getTime() < weekMs)
    .reduce((sum, s) => sum + (s.reps ?? 0) * s.weightKg, 0);

  const lastWeekVol = sorted
    .filter(s => {
      const age = now - new Date(s.updatedAt).getTime();
      return age >= weekMs && age < 2 * weekMs;
    })
    .reduce((sum, s) => sum + (s.reps ?? 0) * s.weightKg, 0);

  const volumePlateau = lastWeekVol > 0 && thisWeekVol <= lastWeekVol;

  let messageKey: string;
  if (strengthPlateau && volumePlateau) {
    messageKey = 'fitness.coaching.plateau.both';
  } else if (strengthPlateau) {
    messageKey = 'fitness.coaching.plateau.strength';
  } else if (volumePlateau) {
    messageKey = 'fitness.coaching.plateau.volume';
  } else {
    messageKey = 'fitness.coaching.plateau.none';
  }

  return {
    strengthPlateau,
    volumePlateau,
    messageKey,
    message: '',
  };
}
