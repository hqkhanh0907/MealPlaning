import i18n from 'i18next';
import { z } from 'zod';

const GENDER_VALUES = ['male', 'female'] as const;

const ACTIVITY_LEVEL_VALUES = ['sedentary', 'light', 'moderate', 'active', 'extra_active'] as const;

export const healthProfileSchema = z
  .object({
    name: z
      .string()
      .min(1, { error: i18n.t('validation.healthProfile.nameRequired') })
      .max(50, { error: i18n.t('validation.healthProfile.nameMax') }),
    dateOfBirth: z
      .string()
      .min(1, { error: i18n.t('validation.healthProfile.dobRequired') })
      .refine(
        v => {
          const d = new Date(v);
          return !Number.isNaN(d.getTime()) && d < new Date();
        },
        { error: i18n.t('validation.healthProfile.dobInvalid') },
      ),
    gender: z.enum(GENDER_VALUES),
    heightCm: z.coerce
      .number()
      .min(100, { error: i18n.t('validation.healthProfile.heightMin') })
      .max(250, { error: i18n.t('validation.healthProfile.heightMax') }),
    weightKg: z.coerce
      .number()
      .min(30, { error: i18n.t('validation.healthProfile.weightMin') })
      .max(300, { error: i18n.t('validation.healthProfile.weightMax') }),
    bodyFatPct: z.coerce
      .number()
      .min(3, { error: i18n.t('validation.healthProfile.bodyFatMin') })
      .max(60, { error: i18n.t('validation.healthProfile.bodyFatMax') })
      .optional()
      .or(z.literal('')),
    activityLevel: z.enum(ACTIVITY_LEVEL_VALUES),
    bmrOverrideEnabled: z.boolean(),
    bmrOverride: z.coerce
      .number()
      .positive({ error: i18n.t('validation.healthProfile.bmrPositive') })
      .optional(),
    proteinRatio: z.coerce
      .number()
      .min(0.8, { error: i18n.t('validation.healthProfile.proteinRatioMin') })
      .max(4, { error: i18n.t('validation.healthProfile.proteinRatioMax') }),
  })
  .refine(data => !data.bmrOverrideEnabled || (data.bmrOverride !== undefined && data.bmrOverride > 0), {
    error: i18n.t('validation.healthProfile.bmrOverrideRequired'),
    path: ['bmrOverride'],
  });

export type HealthProfileFormData = z.infer<typeof healthProfileSchema>;

export const healthProfileDefaults: HealthProfileFormData = {
  name: '',
  dateOfBirth: '',
  gender: 'male',
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'moderate',
  bodyFatPct: undefined,
  bmrOverrideEnabled: false,
  bmrOverride: undefined,
  proteinRatio: 2,
};
