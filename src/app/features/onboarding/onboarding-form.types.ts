import { Gender } from '../../core/models/user-profile.types';

export interface OnboardingStep2aFormValue {
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  gender: Gender | null;
}

export const EMPTY_ONBOARDING_STEP2A_FORM: OnboardingStep2aFormValue = {
  heightCm: null,
  weightKg: null,
  age: null,
  gender: null,
};

export function cloneOnboardingStep2aForm(
  value: OnboardingStep2aFormValue,
): OnboardingStep2aFormValue {
  return { ...value };
}
