import { z } from 'zod';

import { goalOnboardingFields, validateTargetWeight } from '@/schemas/goalValidation';

export const onboardingSchema = z
  .object({
    // Section 2a: Basic Info
    name: z.string().min(1).max(50),
    gender: z.enum(['male', 'female']),
    dateOfBirth: z
      .string()
      .min(1)
      .refine(
        v => {
          const d = new Date(v);
          return !Number.isNaN(d.getTime()) && d < new Date();
        },
        { error: 'onboarding.validation.dobInvalid' },
      ),
    heightCm: z.number().min(100).max(250),
    weightKg: z.number().min(30).max(300),

    // Section 2b: Activity Level
    activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'extra_active']),

    // Section 2c: Nutrition Goal (shared with settings via goalValidation)
    ...goalOnboardingFields.shape,

    // Section 2d: Advanced (optional)
    bodyFatPct: z.number().min(3).max(60).optional(),
    bmrOverride: z.number().min(500).max(5000).optional(),
    proteinRatio: z.number().min(0.8).max(4).optional(),

    // Section 3: Training Core
    trainingGoal: z.enum(['strength', 'hypertrophy', 'endurance', 'general']),
    trainingExperience: z.enum(['beginner', 'intermediate', 'advanced']),
    daysPerWeek: z.number().min(2).max(6),

    // Section 4: Training Details
    sessionDurationMin: z.number().optional(),
    availableEquipment: z
      .array(z.enum(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands', 'kettlebell']))
      .optional(),
    injuryRestrictions: z.array(z.enum(['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'])).optional(),
    cardioSessionsWeek: z.number().optional(),
    periodizationModel: z.enum(['linear', 'undulating', 'block']).optional(),
    planCycleWeeks: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(12)]).optional(),
    priorityMuscles: z
      .array(z.enum(['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes']))
      .max(3)
      .optional(),
    avgSleepHours: z.number().min(3).max(12).optional(),
  })
  .superRefine((data, ctx) => {
    // Cross-field: goal direction must match target weight (shared validation)
    if (data.goalType !== 'maintain' && data.targetWeightKg != null) {
      const error = validateTargetWeight(data.goalType, data.weightKg, data.targetWeightKg);
      if (error) {
        ctx.addIssue({
          code: 'custom',
          path: ['targetWeightKg'],
          message: error,
        });
      }
    }

    // Cross-field: BMI sanity check (warning-level, uses custom code)
    const bmi = data.weightKg / Math.pow(data.heightCm / 100, 2);
    if (bmi < 12 || bmi > 60) {
      ctx.addIssue({
        code: 'custom',
        path: ['weightKg'],
        message: 'onboarding.validation.bmiWarning',
      });
    }
  });

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

// Step-level field groups for partial validation via trigger()
export const STEP_FIELDS = {
  '2a': ['name', 'gender', 'dateOfBirth', 'heightCm', 'weightKg'] as const,
  '2b': ['activityLevel'] as const,
  '2c': ['goalType', 'rateOfChange', 'targetWeightKg'] as const,
  '2d': ['bodyFatPct', 'bmrOverride', 'proteinRatio'] as const,
  '3': ['trainingGoal', 'trainingExperience', 'daysPerWeek'] as const,
  '4-sessionDuration': ['sessionDurationMin'] as const,
  '4-equipment': ['availableEquipment'] as const,
  '4-injuries': ['injuryRestrictions'] as const,
  '4-cardio': ['cardioSessionsWeek'] as const,
  '4-periodization': ['periodizationModel'] as const,
  '4-cycleWeeks': ['planCycleWeeks'] as const,
  '4-priorityMuscles': ['priorityMuscles'] as const,
  '4-sleepHours': ['avgSleepHours'] as const,
} as const;
