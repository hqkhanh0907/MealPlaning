import type { UserProfile } from '../../../core/models/user-profile.model';

export const profile: UserProfile = {
  id: 'profile',
  height_cm: 164,
  weight_kg: 61.5,
  birth_date: '1996-02-29',
  gender: 'female',
  goal: 'maintain',
  fitness_level: 'intermediate',
  activity_factor: 1.31,
  bmr: 1340,
  tdee: 2000,
  target_calories: 0,
  calorie_target_mode: 'auto',
  target_protein: 100,
  protein_target_mode: 'manual',
  target_carbs: 0,
  target_fat: null,
  theme: 'light',
  notif_morning: 1,
  notif_lunch: 0,
  notif_evening: 0,
  notif_weekly: 1,
  onboarding_completed: 1,
  created_at: '2026-11-28',
  updated_at: null,
};

export const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
