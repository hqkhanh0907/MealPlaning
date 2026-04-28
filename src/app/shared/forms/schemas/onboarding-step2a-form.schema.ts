/**
 * Signal Forms schema for the onboarding wizard's Step 2a (body info).
 *
 * Validation rules for body info:
 *   - heightCm: required, 130–250 cm
 *   - weightKg: required, 30–200 kg
 *   - age:      required, 13–120
 *   - gender:   required ('male' | 'female')
 *
 * Step 1 (single-choice goal) and Step 2b (radio cards) stay on plain
 * signals — Signal Forms adds no value over the existing radio-group
 * pattern there, and migrating them would force HTML inputs that don't
 * match the design (DS §8.6c: N=4 → radio cards, not a select/segmented).
 *
 * @see docs/5-development/signal-forms-migration-plan.md §B4
 */

import { schema, validate, type ValidationError } from '@angular/forms/signals';
import type { OnboardingStep2aFormValue } from '../../../features/onboarding/onboarding-form.types';

const requiredRange = (
  v: number | null,
  min: number,
  max: number,
  message: string,
): ValidationError | null => {
  if (v === null || Number.isNaN(v) || v < min || v > max) {
    return { kind: 'range', message };
  }
  return null;
};

export const onboardingStep2aSchema = schema<OnboardingStep2aFormValue>((p) => {
  validate(p.heightCm, ({ value }) =>
    requiredRange(value(), 130, 250, 'Chiều cao phải từ 130–250 cm'),
  );
  validate(p.weightKg, ({ value }) =>
    requiredRange(value(), 30, 200, 'Cân nặng phải từ 30–200 kg'),
  );
  validate(p.age, ({ value }) => requiredRange(value(), 13, 120, 'Tuổi phải từ 13–120'));
  validate(p.gender, ({ value }) => {
    if (!value()) {
      return { kind: 'required', message: 'Vui lòng chọn giới tính' };
    }
    return null;
  });
});
