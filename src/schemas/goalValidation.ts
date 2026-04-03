import type { Resolver } from 'react-hook-form';
import { z } from 'zod';

import type { Goal, GoalType } from '@/features/health-profile/types';
import { getCalorieOffset } from '@/services/nutritionEngine';

export const GOAL_TYPE_VALUES = ['cut', 'maintain', 'bulk'] as const;
export const RATE_OF_CHANGE_VALUES = ['conservative', 'moderate', 'aggressive'] as const;

/**
 * Validate target weight against current weight based on goal direction.
 * Returns an i18n error key if invalid, or null if valid.
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

/* ------------------------------------------------------------------ */
/* ONE schema — single source of truth for all goal forms             */
/* ------------------------------------------------------------------ */

/**
 * Complete goal form schema used by BOTH onboarding and settings.
 * - Core fields: goalType, rateOfChange, targetWeightKg (number types matching DB)
 * - Settings-only fields: manualOverride, customOffset (optional, ignored by onboarding)
 */
export const goalFormSchema = z.object({
  goalType: z.enum(GOAL_TYPE_VALUES),
  rateOfChange: z.enum(RATE_OF_CHANGE_VALUES).optional(),
  targetWeightKg: z.number().min(30).max(300).optional(),
  manualOverride: z.boolean(),
  customOffset: z.string().optional(),
});

export type GoalFormData = z.infer<typeof goalFormSchema>;

/**
 * Custom RHF resolver that wraps zodResolver(goalFormSchema) and adds
 * cross-field direction validation (cut→target<current, bulk→target>current).
 *
 * This runs INSIDE RHF's validation cycle, so it doesn't get overwritten
 * by zodResolver's async error clearing (the root cause of the timing bug
 * when using manual form.setError + zodResolver mode:'onChange').
 */
export function goalFormResolver(currentWeight: number): Resolver<GoalFormData> {
  return async (values, _ctx, options) => {
    const { zodResolver } = await import('@hookform/resolvers/zod');
    const base = await zodResolver(goalFormSchema)(values, _ctx, options);

    // Add direction validation on top of Zod schema validation
    if (values.goalType !== 'maintain' && values.targetWeightKg != null) {
      const error = validateTargetWeight(values.goalType, currentWeight, values.targetWeightKg);
      if (error) {
        const existing = (base.errors.targetWeightKg as Record<string, unknown>) ?? {};
        base.errors.targetWeightKg = { ...existing, message: error, type: 'custom' };
      }
    }

    return base;
  };
}

/** Sub-schema for onboarding — only core goal fields via .pick() */
export const goalOnboardingFields = goalFormSchema.pick({
  goalType: true,
  rateOfChange: true,
  targetWeightKg: true,
});

/**
 * Generate form default values from an existing Goal (loaded from DB/store).
 * Returns hardcoded defaults when no active goal exists.
 */
export function goalFormDefaults(activeGoal: Goal | null): GoalFormData {
  if (!activeGoal) {
    return {
      goalType: 'maintain',
      rateOfChange: 'moderate',
      targetWeightKg: undefined,
      manualOverride: false,
      customOffset: undefined,
    };
  }

  const autoOffset = getCalorieOffset(activeGoal.type, activeGoal.rateOfChange);
  const isManual = activeGoal.calorieOffset !== autoOffset;

  return {
    goalType: activeGoal.type,
    rateOfChange: activeGoal.rateOfChange,
    targetWeightKg: activeGoal.targetWeightKg,
    manualOverride: isManual,
    customOffset: isManual ? String(activeGoal.calorieOffset) : undefined,
  };
}

/**
 * Build a Zod schema for goal fields with current-weight-aware cross-field validation.
 * @deprecated Use goalFormSchema directly + manual validateTargetWeight() calls
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
