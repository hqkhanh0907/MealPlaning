import type { BodyMeasurementsDraft } from '../../core/models/body-measurements';

export type OnboardingStep2aFormValue = BodyMeasurementsDraft;

export const EMPTY_ONBOARDING_STEP2A_FORM: OnboardingStep2aFormValue = {
  heightCm: null,
  weightKg: null,
  birthDate: '',
  gender: null,
};

export function cloneOnboardingStep2aForm(
  value: OnboardingStep2aFormValue,
): OnboardingStep2aFormValue {
  return { ...value };
}
