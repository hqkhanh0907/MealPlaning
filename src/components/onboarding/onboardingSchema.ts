import { z } from 'zod';

export const onboardingSchema = z.object({
  // Section 2a: Basic Info
  name: z.string().min(1).max(50),
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.string().min(1).refine(
    (v) => {
      const d = new Date(v);
      return !isNaN(d.getTime()) && d < new Date();
    },
    { message: 'onboarding.validation.dobInvalid' }
  ),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),

  // Section 2b: Activity Level
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'extra_active']),

  // Section 2c: Nutrition Goal
  goalType: z.enum(['cut', 'maintain', 'bulk']),
  rateOfChange: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  targetWeightKg: z.number().min(30).max(300).optional(),

  // Section 2d: Advanced (optional)
  bodyFatPct: z.number().min(3).max(60).optional(),
  bmrOverride: z.number().min(500).max(5000).optional(),
  proteinRatio: z.number().min(0.8).max(4.0).optional(),

  // Section 3: Training Core
  trainingGoal: z.enum(['strength', 'hypertrophy', 'endurance', 'general']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number().min(2).max(6),

  // Section 4: Training Details
  sessionDuration: z.number().optional(),
  equipment: z.array(z.string()).optional(),
  injuries: z.array(z.string()).optional(),
  cardioSessions: z.number().optional(),
  periodization: z.string().optional(),
  cycleWeeks: z.number().optional(),
  priorityMuscles: z.array(z.string()).optional(),
  known1rm: z.record(z.string(), z.number()).optional(),
  sleepHours: z.number().optional(),
}).superRefine((data, ctx) => {
  // Cross-field: goal direction must match target weight
  if (data.goalType === 'cut' && data.targetWeightKg != null && data.targetWeightKg >= data.weightKg) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['targetWeightKg'],
      message: 'onboarding.validation.cutTargetTooHigh',
    });
  }
  if (data.goalType === 'bulk' && data.targetWeightKg != null && data.targetWeightKg <= data.weightKg) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['targetWeightKg'],
      message: 'onboarding.validation.bulkTargetTooLow',
    });
  }

  // Cross-field: BMI sanity check (warning-level, uses custom code)
  const bmi = data.weightKg / Math.pow(data.heightCm / 100, 2);
  if (bmi < 12 || bmi > 60) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
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
  '3': ['trainingGoal', 'experience', 'daysPerWeek'] as const,
  '4-sessionDuration': ['sessionDuration'] as const,
  '4-equipment': ['equipment'] as const,
  '4-injuries': ['injuries'] as const,
  '4-cardio': ['cardioSessions'] as const,
  '4-periodization': ['periodization'] as const,
  '4-cycleWeeks': ['cycleWeeks'] as const,
  '4-priorityMuscles': ['priorityMuscles'] as const,
  '4-known1rm': ['known1rm'] as const,
  '4-sleepHours': ['sleepHours'] as const,
} as const;
