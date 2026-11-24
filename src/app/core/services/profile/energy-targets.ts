import type { ActivityLevel, Gender, Goal } from '../../models/user-profile.types';

export const DEFAULT_ACTIVITY_LEVEL: ActivityLevel = 'moderate';

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
};

const CALORIE_ADJUSTMENT: Record<Goal, number> = {
  lose_weight: -500,
  gain_muscle: 300,
  maintain: 0,
  performance: 200,
};

const PROTEIN_MULTIPLIER: Record<Goal, number> = {
  lose_weight: 2.2,
  gain_muscle: 2.2,
  maintain: 1.6,
  performance: 2.0,
};

export function calculateBmr(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
}): number {
  const { weightKg, heightCm, age, gender } = input;
  if (!Number.isInteger(age) || age < 19 || age > 78) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (gender === 'male' ? 5 : -161));
}

export function getActivityFactor(level: ActivityLevel): number {
  return ACTIVITY_FACTOR[level];
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * getActivityFactor(activityLevel));
}

export function calculateTargetCalories(
  tdee: number,
  goal: Goal,
  body: { weightKg: number; heightCm: number },
): number {
  const bmi = body.weightKg / (body.heightCm / 100) ** 2;
  if (tdee <= 0 || !Number.isFinite(bmi) || (goal === 'lose_weight' && bmi <= 18.5)) return 0;
  const target = Math.round(tdee + CALORIE_ADJUSTMENT[goal]);
  return target > 1200 && target <= 6000 ? target : 0;
}

export function calculateTargetProtein(weightKg: number, goal: Goal): number {
  return Math.round(weightKg * PROTEIN_MULTIPLIER[goal]);
}

const FACTOR_TO_LEVEL: Record<string, ActivityLevel> = Object.fromEntries(
  Object.entries(ACTIVITY_FACTOR).map(([level, factor]) => [
    String(factor),
    level as ActivityLevel,
  ]),
);

export function getActivityLevelFromFactor(factor: number): ActivityLevel | undefined {
  return FACTOR_TO_LEVEL[String(factor)];
}
