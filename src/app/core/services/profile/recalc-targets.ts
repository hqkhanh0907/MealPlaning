import {
  calculateBmr,
  calculateTdee,
  calculateTargetCalories,
  calculateTargetProtein,
} from '../../../features/onboarding/onboarding-calculation';
import { ActivityLevel, Goal } from '../../models/user-profile.types';

const FACTOR_TO_LEVEL: Record<number, ActivityLevel> = {
  1.2: 'sedentary',
  1.375: 'light',
  1.55: 'moderate',
  1.725: 'heavy',
};

export interface RecalcInput {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: 'male' | 'female';
  goal: Goal;
  activity_factor: number;
}

export interface RecalcOutput {
  bmr: number;
  tdee: number;
  target_calories: number;
  target_protein: number;
}

export function recalcTargets(i: RecalcInput): RecalcOutput {
  const bmr = calculateBmr({
    weightKg: i.weight_kg,
    heightCm: i.height_cm,
    age: i.age,
    gender: i.gender,
  });
  const level: ActivityLevel = FACTOR_TO_LEVEL[i.activity_factor] ?? 'moderate';
  const tdee = calculateTdee(bmr, level);
  return {
    bmr,
    tdee,
    target_calories: calculateTargetCalories(tdee, i.goal),
    target_protein: calculateTargetProtein(i.weight_kg, i.goal),
  };
}
