import { ActivityLevel, Gender, Goal, GymExperience } from '../../core/models/user-profile.types';

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

const GYM_TO_LEVEL = {
  never: 'beginner',
  under_6m: 'beginner',
  '6m_2y': 'intermediate',
  over_2y: 'advanced',
} as const;

export function calculateBmr(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
}): number {
  const { weightKg, heightCm, age, gender } = input;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (gender === 'male' ? 5 : -161));
}

export function getActivityFactor(level: ActivityLevel): number {
  return ACTIVITY_FACTOR[level];
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * getActivityFactor(activityLevel));
}

export function calculateTargetCalories(tdee: number, goal: Goal): number {
  return Math.round(tdee + CALORIE_ADJUSTMENT[goal]);
}

export function calculateTargetProtein(weightKg: number, goal: Goal): number {
  return Math.round(weightKg * PROTEIN_MULTIPLIER[goal]);
}

export function deriveFitnessLevel(
  gymExperience: GymExperience,
): 'beginner' | 'intermediate' | 'advanced' {
  return GYM_TO_LEVEL[gymExperience];
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
