import { ActivityLevel, GymExperience } from '../../core/models/user-profile.types';

export interface Step2bErrors {
  activityLevel: string;
  gymExperience: string;
}

export const EMPTY_2B: Step2bErrors = {
  activityLevel: '',
  gymExperience: '',
};

/**
 * Step 2b validation (radio cards) — kept as a plain helper because the
 * radio-card UI does not use Signal Forms (DS §8.6c: N=4 → radio cards,
 * not select). Step 2a uses `onboardingStep2aSchema` instead.
 */
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
