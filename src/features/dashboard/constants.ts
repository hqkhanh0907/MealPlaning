import type { InsightPriority } from './types';

export const SCORE_WEIGHTS = {
  calories: 0.3,
  protein: 0.25,
  workout: 0.25,
  weightLog: 0.1,
  streak: 0.1,
} as const;

export const CALORIE_THRESHOLDS = [
  { maxDeviation: 50, score: 100 },
  { maxDeviation: 100, score: 90 },
  { maxDeviation: 200, score: 70 },
  { maxDeviation: 500, score: 40 },
] as const;

export const CALORIE_MIN_SCORE = 10;

export const PROTEIN_THRESHOLDS = [
  { minRatio: 1, score: 100 },
  { minRatio: 0.9, score: 80 },
  { minRatio: 0.7, score: 60 },
  { minRatio: 0.5, score: 40 },
] as const;

export const PROTEIN_MIN_SCORE = 20;

export const WORKOUT_SCORES = {
  completed: 100,
  restDay: 100,
  notYet: 50,
  missed: 0,
} as const;

export const WEIGHT_LOG_SCORES = {
  today: 100,
  yesterday: 50,
  none: 0,
} as const;

export const STREAK_MULTIPLIER = 5;
export const STREAK_MAX_BONUS = 100;

export const SCORE_COLOR_THRESHOLDS = {
  emerald: 80,
  amber: 50,
} as const;

export const DEFAULT_MINIMUM_SCORE = 50;

export const INSIGHT_PRIORITIES: Record<InsightPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const DAILY_TIPS_VI_KEYS: readonly string[] = Array.from({ length: 20 }, (_, i) => `dashboard.dailyTip.${i}`);
