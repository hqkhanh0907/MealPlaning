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
  name: string;
  gender: Gender;
  age: number;
  dateOfBirth: string | null;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  bodyFatPct?: number;
  bmrOverride?: number;
  proteinRatio: number;
  fatPct: number;
  targetCalories: number;
  updatedAt: string;
}

export function getAge(profile: HealthProfile): number {
  if (profile.dateOfBirth) {
    const dob = new Date(profile.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }
  return profile.age;
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
  name: '',
  gender: 'male',
  age: 30,
  dateOfBirth: null,
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'moderate',
  proteinRatio: 2.0,
  fatPct: 0.25,
  targetCalories: 1500,
  updatedAt: new Date().toISOString(),
};
