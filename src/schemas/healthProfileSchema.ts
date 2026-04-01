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
    age: z.coerce
      .number()
      .min(10, { message: 'Tuổi tối thiểu là 10' })
      .max(100, { message: 'Tuổi tối đa là 100' }),
    heightCm: z.coerce
      .number()
      .min(100, { message: 'Chiều cao tối thiểu là 100 cm' })
      .max(250, { message: 'Chiều cao tối đa là 250 cm' }),
    weightKg: z.coerce
      .number()
      .min(30, { message: 'Cân nặng tối thiểu là 30 kg' })
      .max(300, { message: 'Cân nặng tối đa là 300 kg' }),
    bodyFatPct: z.coerce
      .number()
      .min(3, { message: 'Tỉ lệ mỡ tối thiểu là 3%' })
      .max(60, { message: 'Tỉ lệ mỡ tối đa là 60%' })
      .optional()
      .or(z.literal('')),
    activityLevel: z.enum(ACTIVITY_LEVEL_VALUES),
    bmrOverrideEnabled: z.boolean(),
    bmrOverride: z.coerce
      .number()
      .positive({ message: 'BMR phải là số dương' })
      .optional(),
    proteinRatio: z.coerce
      .number()
      .min(0.8, { message: 'Tỉ lệ protein tối thiểu là 0.8 g/kg' })
      .max(4, { message: 'Tỉ lệ protein tối đa là 4 g/kg' }),
  })
  .refine(
    (data) =>
      !data.bmrOverrideEnabled ||
      (data.bmrOverride !== undefined && data.bmrOverride > 0),
    {
      message: 'Vui lòng nhập giá trị BMR khi bật ghi đè',
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
  proteinRatio: 2,
};
