import type { ActivityLevel } from '../../health-profile/types';
import type { Workout, WorkoutSet } from '../types';

export interface ActivityAnalysis {
  weeklyStrengthSessions: number;
  weeklyCardioMinutes: number;
  weeklyTotalVolume: number;
  suggestedLevel: ActivityLevel;
  currentLevel: ActivityLevel;
  needsAdjustment: boolean;
  confidence: 'low' | 'medium' | 'high';
}

const STRENGTH_MET = 5.0;

/**
 * Calculate confidence based on data availability.
 * low: <2 weeks or no workouts, medium: 2-3 weeks, high: 4+ weeks
 */
export function getConfidence(
  workouts: Workout[],
  weeksAnalyzed: number,
): 'low' | 'medium' | 'high' {
  if (workouts.length === 0 || weeksAnalyzed < 2) return 'low';
  if (weeksAnalyzed < 4) return 'medium';
  return 'high';
}

/**
 * Map workout frequency + intensity to ActivityLevel.
 *
 * - sedentary: 0-1 sessions/week, <30 min cardio
 * - light: 1-2 sessions/week OR 30-90 min cardio
 * - moderate: 3-4 sessions/week OR 90-150 min cardio
 * - active: 4-5 sessions/week AND >90 min cardio, OR 5+ sessions
 * - extra_active: 6+ sessions/week OR >150 min cardio with volume
 */
export function mapToActivityLevel(
  strengthSessionsPerWeek: number,
  cardioMinutesPerWeek: number,
  totalVolumePerWeek: number,
): ActivityLevel {
  if (strengthSessionsPerWeek >= 6) return 'extra_active';
  if (cardioMinutesPerWeek > 150 && totalVolumePerWeek > 0)
    return 'extra_active';

  if (strengthSessionsPerWeek >= 5) return 'active';
  if (strengthSessionsPerWeek >= 4 && cardioMinutesPerWeek > 90)
    return 'active';

  if (strengthSessionsPerWeek >= 3 || cardioMinutesPerWeek >= 90)
    return 'moderate';

  if (strengthSessionsPerWeek >= 1 || cardioMinutesPerWeek >= 30)
    return 'light';

  return 'sedentary';
}

/**
 * Analyze actual workout data to suggest activity level.
 * Filters workouts within the analysis window, computes weekly averages,
 * and maps them to the closest ActivityLevel.
 */
export function analyzeActivityLevel(
  workouts: Workout[],
  workoutSets: WorkoutSet[],
  currentLevel: ActivityLevel,
  weeksToAnalyze = 4,
): ActivityAnalysis {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeksToAnalyze * 7);

  const recentWorkouts = workouts.filter(
    (w) => new Date(w.date) >= cutoffDate,
  );

  const recentWorkoutIds = new Set(recentWorkouts.map((w) => w.id));
  const recentSets = workoutSets.filter((s) =>
    recentWorkoutIds.has(s.workoutId),
  );

  const strengthWorkoutCount = recentWorkouts.filter((w) => {
    const sets = recentSets.filter((s) => s.workoutId === w.id);
    return sets.some((s) => s.weightKg > 0 && (s.reps ?? 0) > 0);
  }).length;

  const totalCardioMinutes = recentSets.reduce(
    (sum, s) => sum + (s.durationMin ?? 0),
    0,
  );

  const totalVolume = recentSets.reduce(
    (sum, s) => sum + (s.reps ?? 0) * s.weightKg,
    0,
  );

  const weeks = Math.max(weeksToAnalyze, 1);
  const weeklyStrengthSessions = strengthWorkoutCount / weeks;
  const weeklyCardioMinutes = totalCardioMinutes / weeks;
  const weeklyTotalVolume = totalVolume / weeks;

  const suggestedLevel = mapToActivityLevel(
    weeklyStrengthSessions,
    weeklyCardioMinutes,
    weeklyTotalVolume,
  );

  const confidence = getConfidence(recentWorkouts, weeksToAnalyze);

  return {
    weeklyStrengthSessions,
    weeklyCardioMinutes,
    weeklyTotalVolume,
    suggestedLevel,
    currentLevel,
    needsAdjustment: suggestedLevel !== currentLevel,
    confidence,
  };
}

/**
 * Calculate the TDEE adjustment calories from actual exercise.
 * Sums estimated cardio calories from sets and estimates strength
 * training burn from workout duration using MET values.
 */
export function calculateExerciseAdjustment(
  workouts: Workout[],
  workoutSets: WorkoutSet[],
  weightKg: number,
  daysInPeriod = 7,
): number {
  if (workouts.length === 0 || daysInPeriod <= 0) return 0;

  let totalCalories = 0;

  for (const workout of workouts) {
    const sets = workoutSets.filter((s) => s.workoutId === workout.id);

    const estimatedCalories = sets.reduce(
      (sum, s) => sum + (s.estimatedCalories ?? 0),
      0,
    );
    totalCalories += estimatedCalories;

    const hasStrengthWork = sets.some(
      (s) => s.weightKg > 0 && (s.reps ?? 0) > 0 && !s.estimatedCalories,
    );
    if (hasStrengthWork && workout.durationMin) {
      totalCalories += Math.round(
        (STRENGTH_MET * weightKg * workout.durationMin) / 60,
      );
    }
  }

  return Math.round(totalCalories / daysInPeriod);
}
