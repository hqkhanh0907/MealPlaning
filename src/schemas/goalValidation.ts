import { z } from 'zod';

import type { GoalType } from '@/features/health-profile/types';

export const GOAL_TYPE_VALUES = ['cut', 'maintain', 'bulk'] as const;
export const RATE_OF_CHANGE_VALUES = ['conservative', 'moderate', 'aggressive'] as const;

/**
 * Validate target weight against current weight based on goal direction.
 * Returns an i18n error key if invalid, or null if valid.
 *
 * Rules:
 * - maintain: target weight is not applicable (should be hidden)
 * - cut: target weight must be strictly less than current weight
 * - bulk: target weight must be strictly greater than current weight
 */
export function validateTargetWeight(
  goalType: GoalType,
  currentWeight: number | undefined,
  targetWeight: number | undefined,
): string | null {
  if (goalType === 'maintain') return null;
  if (targetWeight == null || currentWeight == null) return null;

  if (goalType === 'cut' && targetWeight >= currentWeight) {
    return 'onboarding.validation.cutTargetTooHigh';
  }
  if (goalType === 'bulk' && targetWeight <= currentWeight) {
    return 'onboarding.validation.bulkTargetTooLow';
  }
  return null;
}

/**
 * Build a Zod schema for goal fields with current-weight-aware cross-field validation.
 * Used by both onboarding and settings goal forms.
 */
export function createGoalFieldsSchema(getCurrentWeight: () => number | undefined) {
  return z
    .object({
      goalType: z.enum(GOAL_TYPE_VALUES),
      rateOfChange: z.enum(RATE_OF_CHANGE_VALUES).optional(),
      targetWeightKg: z.number().min(30).max(300).optional(),
    })
    .superRefine((data, ctx) => {
      const currentWeight = getCurrentWeight();
      if (data.goalType !== 'maintain' && data.targetWeightKg != null && currentWeight != null) {
        const error = validateTargetWeight(data.goalType, currentWeight, data.targetWeightKg);
        if (error) {
          ctx.addIssue({
            code: 'custom',
            path: ['targetWeightKg'],
            message: error,
          });
        }
      }
    });
}
