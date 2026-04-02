import { z } from 'zod';

const GENDER_VALUES = ['male', 'female'] as const;

const ACTIVITY_LEVEL_VALUES = ['sedentary', 'light', 'moderate', 'active', 'extra_active'] as const;

export const healthProfileSchema = z
  .object({
    name: z.string().min(1, { error: 'Vui lòng nhập tên' }).max(50, { error: 'Tên tối đa 50 ký tự' }),
    dateOfBirth: z
      .string()
      .min(1, { error: 'Vui lòng nhập ngày sinh' })
      .refine(
        v => {
          const d = new Date(v);
          return !Number.isNaN(d.getTime()) && d < new Date();
        },
        { error: 'Ngày sinh không hợp lệ' },
      ),
    gender: z.enum(GENDER_VALUES),
    heightCm: z.coerce
      .number()
      .min(100, { error: 'Chiều cao tối thiểu là 100 cm' })
      .max(250, { error: 'Chiều cao tối đa là 250 cm' }),
    weightKg: z.coerce
      .number()
      .min(30, { error: 'Cân nặng tối thiểu là 30 kg' })
      .max(300, { error: 'Cân nặng tối đa là 300 kg' }),
    bodyFatPct: z.coerce
      .number()
      .min(3, { error: 'Tỉ lệ mỡ tối thiểu là 3%' })
      .max(60, { error: 'Tỉ lệ mỡ tối đa là 60%' })
      .optional()
      .or(z.literal('')),
    activityLevel: z.enum(ACTIVITY_LEVEL_VALUES),
    bmrOverrideEnabled: z.boolean(),
    bmrOverride: z.coerce.number().positive({ error: 'BMR phải là số dương' }).optional(),
    proteinRatio: z.coerce
      .number()
      .min(0.8, { error: 'Tỉ lệ protein tối thiểu là 0.8 g/kg' })
      .max(4, { error: 'Tỉ lệ protein tối đa là 4 g/kg' }),
  })
  .refine(data => !data.bmrOverrideEnabled || (data.bmrOverride !== undefined && data.bmrOverride > 0), {
    error: 'Vui lòng nhập giá trị BMR khi bật ghi đè',
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
