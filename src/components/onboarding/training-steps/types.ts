import type { UseFormReturn } from 'react-hook-form';
import type { OnboardingFormData } from '../onboardingSchema';

export interface StepProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
}
