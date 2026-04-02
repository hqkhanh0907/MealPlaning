import {
  CALORIE_MIN_SCORE,
  CALORIE_THRESHOLDS,
  DEFAULT_MINIMUM_SCORE,
  PROTEIN_MIN_SCORE,
  PROTEIN_THRESHOLDS,
  SCORE_COLOR_THRESHOLDS,
  SCORE_WEIGHTS,
  STREAK_MAX_BONUS,
  STREAK_MULTIPLIER,
  WEIGHT_LOG_SCORES,
  WORKOUT_SCORES,
} from '../constants';
import type { ScoreColor, ScoreInput, ScoreResult } from '../types';

export function calculateCalorieScore(actual: number, target: number): number {
  const deviation = Math.abs(actual - target);
  for (const threshold of CALORIE_THRESHOLDS) {
    if (deviation <= threshold.maxDeviation) {
      return threshold.score;
    }
  }
  return CALORIE_MIN_SCORE;
}

export function calculateProteinScore(actual: number, target: number): number {
  if (target <= 0) {
    return PROTEIN_THRESHOLDS[0].score;
  }
  const ratio = actual / target;
  for (const threshold of PROTEIN_THRESHOLDS) {
    if (ratio >= threshold.minRatio) {
      return threshold.score;
    }
  }
  return PROTEIN_MIN_SCORE;
}

export function calculateWorkoutScore(completed: boolean, isRestDay: boolean, isBeforeEvening: boolean): number {
  if (completed) return WORKOUT_SCORES.completed;
  if (isRestDay) return WORKOUT_SCORES.restDay;
  if (isBeforeEvening) return WORKOUT_SCORES.notYet;
  return WORKOUT_SCORES.missed;
}

export function calculateWeightLogScore(loggedToday: boolean, loggedYesterday: boolean): number {
  if (loggedToday) return WEIGHT_LOG_SCORES.today;
  if (loggedYesterday) return WEIGHT_LOG_SCORES.yesterday;
  return WEIGHT_LOG_SCORES.none;
}

export function calculateStreakBonus(streakDays: number): number {
  return Math.min(Math.max(streakDays, 0) * STREAK_MULTIPLIER, STREAK_MAX_BONUS);
}

export function getScoreColor(score: number): ScoreColor {
  if (score >= SCORE_COLOR_THRESHOLDS.emerald) return 'emerald';
  if (score >= SCORE_COLOR_THRESHOLDS.amber) return 'amber';
  return 'slate';
}

interface WeightedFactor {
  weight: number;
  score: number;
}

export function calculateDailyScore(input: ScoreInput): ScoreResult {
  const factors: ScoreResult['factors'] = {
    calories: null,
    protein: null,
    workout: null,
    weightLog: null,
    streak: null,
  };

  const weighted: WeightedFactor[] = [];

  if (input.actualCalories != null && input.targetCalories != null) {
    const score = calculateCalorieScore(input.actualCalories, input.targetCalories);
    factors.calories = score;
    weighted.push({ weight: SCORE_WEIGHTS.calories, score });
  }

  if (input.actualProteinG != null && input.targetProteinG != null) {
    const score = calculateProteinScore(input.actualProteinG, input.targetProteinG);
    factors.protein = score;
    weighted.push({ weight: SCORE_WEIGHTS.protein, score });
  }

  if (input.workoutCompleted != null) {
    const score = calculateWorkoutScore(
      input.workoutCompleted,
      input.isRestDay ?? false,
      input.isBeforeEvening ?? true,
    );
    factors.workout = score;
    weighted.push({ weight: SCORE_WEIGHTS.workout, score });
  }

  if (input.weightLoggedToday != null || input.weightLoggedYesterday != null) {
    const score = calculateWeightLogScore(input.weightLoggedToday ?? false, input.weightLoggedYesterday ?? false);
    factors.weightLog = score;
    weighted.push({ weight: SCORE_WEIGHTS.weightLog, score });
  }

  if (input.streakDays != null) {
    const score = calculateStreakBonus(input.streakDays);
    factors.streak = score;
    weighted.push({ weight: SCORE_WEIGHTS.streak, score });
  }

  const availableFactors = weighted.length;

  if (availableFactors === 0) {
    return {
      totalScore: DEFAULT_MINIMUM_SCORE,
      factors,
      color: getScoreColor(DEFAULT_MINIMUM_SCORE),
      availableFactors: 0,
    };
  }

  const totalWeight = weighted.reduce((sum, f) => sum + f.weight, 0);
  const rawScore = weighted.reduce((sum, f) => sum + f.score * (f.weight / totalWeight), 0);
  const totalScore = Math.max(Math.round(rawScore), 1);

  return {
    totalScore,
    factors,
    color: getScoreColor(totalScore),
    availableFactors,
  };
}
