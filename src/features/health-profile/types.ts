export type Gender = 'male' | 'female';
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'extra_active';
export type GoalType = 'cut' | 'bulk' | 'maintain';
export type RateOfChange = 'conservative' | 'moderate' | 'aggressive';

export interface HealthProfile {
  id: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  bodyFatPct?: number;
  bmrOverride?: number;
  proteinRatio: number;
  fatPct: number;
  updatedAt: string;
}

export interface Goal {
  id: string;
  type: GoalType;
  rateOfChange: RateOfChange;
  targetWeightKg?: number;
  calorieOffset: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_HEALTH_PROFILE: HealthProfile = {
  id: 'default',
  gender: 'male',
  age: 30,
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'moderate',
  proteinRatio: 2.0,
  fatPct: 0.25,
  updatedAt: new Date().toISOString(),
};
