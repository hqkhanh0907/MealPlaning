import { ActivityLevel, Gender, GymExperience } from '../../core/models/user-profile.types';

export interface Step2aErrors {
  heightCm: string;
  weightKg: string;
  age: string;
  gender: string;
}

export interface Step2bErrors {
  activityLevel: string;
  gymExperience: string;
}

export const EMPTY_2A: Step2aErrors = {
  heightCm: '',
  weightKg: '',
  age: '',
  gender: '',
};

export const EMPTY_2B: Step2bErrors = {
  activityLevel: '',
  gymExperience: '',
};

export function validateStep2a(input: {
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  gender: Gender | null;
}): Step2aErrors {
  const errors: Step2aErrors = { ...EMPTY_2A };

  if (!input.heightCm || input.heightCm < 130 || input.heightCm > 250) {
    errors.heightCm = 'Chiều cao phải từ 130–250 cm';
  }
  if (!input.weightKg || input.weightKg < 30 || input.weightKg > 200) {
    errors.weightKg = 'Cân nặng phải từ 30–200 kg';
  }
  if (!input.age || input.age < 13 || input.age > 120) {
    errors.age = 'Tuổi phải từ 13–120';
  }
  if (!input.gender) {
    errors.gender = 'Vui lòng chọn giới tính';
  }

  return errors;
}

export function validateStep2b(input: {
  activityLevel: ActivityLevel | null;
  gymExperience: GymExperience | null;
}): Step2bErrors {
  const errors: Step2bErrors = { ...EMPTY_2B };

  if (!input.activityLevel) {
    errors.activityLevel = 'Vui lòng chọn mức vận động';
  }
  if (!input.gymExperience) {
    errors.gymExperience = 'Vui lòng chọn kinh nghiệm gym';
  }

  return errors;
}
