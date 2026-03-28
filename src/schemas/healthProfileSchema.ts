import { z } from 'zod';

const GENDER_VALUES = ['male', 'female'] as const;

const ACTIVITY_LEVEL_VALUES = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'extra_active',
] as const;

export const healthProfileSchema = z
  .object({
    gender: z.enum(GENDER_VALUES),
    age: z.coerce.number().min(10).max(100),
    heightCm: z.coerce.number().min(100).max(250),
    weightKg: z.coerce.number().min(30).max(300),
    bodyFatPct: z.coerce
      .number()
      .min(3)
      .max(60)
      .optional()
      .or(z.literal('')),
    activityLevel: z.enum(ACTIVITY_LEVEL_VALUES),
    bmrOverrideEnabled: z.boolean(),
    bmrOverride: z.coerce.number().positive().optional(),
    proteinRatio: z.coerce.number().min(0.8).max(4),
  })
  .refine(
    (data) =>
      !data.bmrOverrideEnabled ||
      (data.bmrOverride !== undefined && data.bmrOverride > 0),
    {
      message: 'BMR override is required when enabled',
      path: ['bmrOverride'],
    },
  );

export type HealthProfileFormData = z.infer<typeof healthProfileSchema>;

export const healthProfileDefaults: HealthProfileFormData = {
  gender: 'male',
  age: 30,
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'moderate',
  bodyFatPct: undefined,
  bmrOverrideEnabled: false,
  bmrOverride: undefined,
  proteinRatio: 2.0,
};
