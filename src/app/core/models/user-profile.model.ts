export interface UserProfile {
  id: string;
  height_cm: number;
  weight_kg: number;
  age: number;
  gender: 'male' | 'female';
  goal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'performance';
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  activity_factor: number;
  bmr: number;
  tdee: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number | null;
  target_fat: number | null;
  theme: 'light' | 'dark' | 'system';
  notif_morning: number;
  notif_lunch: number;
  notif_evening: number;
  notif_weekly: number;
  onboarding_completed: number;
  created_at: string;
  updated_at: string | null;
}
