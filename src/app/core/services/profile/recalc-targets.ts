import { ageOnDate } from './profile-birth-date';
import {
  DEFAULT_ACTIVITY_LEVEL,
  calculateBmr,
  calculateTdee,
  calculateTargetCalories,
  calculateTargetProtein,
  getActivityLevelFromFactor,
} from './energy-targets';
import type { UserProfile } from '../../models/user-profile.model';
import type { Gender, Goal } from '../../models/user-profile.types';

// snake_case fields are intentional at this boundary: they match the DB row shape.
export interface RecalcInput {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: Gender;
  goal: Goal;
  activity_factor: number;
}

export interface RecalcOutput {
  bmr: number;
  tdee: number;
  target_calories: number;
  target_protein: number;
  energyNote: string | null;
}

export function recalcTargets(i: RecalcInput): RecalcOutput {
  const bmr = calculateBmr({
    weightKg: i.weight_kg,
    heightCm: i.height_cm,
    age: i.age,
    gender: i.gender,
  });
  const level = getActivityLevelFromFactor(i.activity_factor) ?? DEFAULT_ACTIVITY_LEVEL;
  const protein = calculateTargetProtein(i.weight_kg, i.goal);
  const tdee = calculateTdee(bmr, level);
  const target = calculateTargetCalories(tdee, i.goal, {
    weightKg: i.weight_kg,
    heightCm: i.height_cm,
  });
  let energyNote: string | null = null;
  if (!bmr) {
    energyNote = 'Ứng dụng chỉ ước tính năng lượng cho người từ 19 đến 78 tuổi.';
  } else if (!target) {
    energyNote = 'Ứng dụng chưa có mức năng lượng phù hợp để đề xuất cho hồ sơ này.';
  }
  return {
    bmr,
    tdee,
    target_calories: target,
    target_protein: i.age >= 18 && protein >= 20 && protein <= 400 ? protein : 0,
    energyNote,
  };
}

export function profileCalculationInput(
  profile: Omit<RecalcInput, 'age'> & Pick<UserProfile, 'birth_date'>,
  today: Date,
): RecalcInput {
  const age = ageOnDate(profile.birth_date, today);
  if (age === null) throw new Error('Ngày sinh không hợp lệ.');
  return {
    weight_kg: profile.weight_kg,
    height_cm: profile.height_cm,
    gender: profile.gender,
    activity_factor: profile.activity_factor,
    goal: profile.goal,
    age,
  };
}

export function automaticTargetUpdate(
  profile: RecalcInput &
    Pick<
      UserProfile,
      'calorie_target_mode' | 'target_calories' | 'protein_target_mode' | 'target_protein'
    >,
  next: RecalcOutput,
): Pick<UserProfile, 'bmr' | 'tdee'> &
  Partial<Pick<UserProfile, 'target_calories' | 'target_protein'>> {
  const previous = recalcTargets(profile);
  const autoCalories =
    profile.calorie_target_mode === 'auto' ||
    (profile.calorie_target_mode === undefined &&
      profile.target_calories === previous.target_calories);
  const autoProtein =
    profile.protein_target_mode === 'auto' ||
    (profile.protein_target_mode === undefined &&
      profile.target_protein === previous.target_protein);

  return {
    bmr: next.bmr,
    tdee: next.tdee,
    ...(autoCalories ? { target_calories: next.target_calories } : {}),
    ...(autoProtein ? { target_protein: next.target_protein } : {}),
  };
}
