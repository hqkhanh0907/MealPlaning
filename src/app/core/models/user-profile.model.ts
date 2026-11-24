import type { FitnessLevel, Gender, Goal } from './user-profile.types';

export interface UserProfile {
  id: string;
  height_cm: number;
  weight_kg: number;
  birth_date: string | null;
  gender: Gender;
  goal: Goal;
  fitness_level: FitnessLevel;
  activity_factor: number;
  bmr: number;
  tdee: number;
  target_calories: number;
  calorie_target_mode?: 'auto' | 'manual';
  target_protein: number;
  protein_target_mode?: 'auto' | 'manual';
  target_carbs: number | null;
  target_fat: number | null;
  theme: 'light';
  notif_morning: number;
  notif_lunch: number;
  notif_evening: number;
  notif_weekly: number;
  onboarding_completed: number;
  created_at: string;
  updated_at: string | null;
}
