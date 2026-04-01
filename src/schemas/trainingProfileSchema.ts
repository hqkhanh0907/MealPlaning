import { z } from 'zod';

const TRAINING_GOAL_VALUES = ['strength', 'hypertrophy', 'endurance', 'general'] as const;
const TRAINING_EXPERIENCE_VALUES = ['beginner', 'intermediate', 'advanced'] as const;
const EQUIPMENT_TYPE_VALUES = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands', 'kettlebell'] as const;
const BODY_REGION_VALUES = ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'] as const;
const PERIODIZATION_MODEL_VALUES = ['linear', 'undulating', 'block'] as const;
const MUSCLE_GROUP_VALUES = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'] as const;

// Numeric RadioPills fields stored as STRING enums to match RadioPills
// strict equality (field.value === option.value). Coerced to number in onSubmit.
const DAYS_PER_WEEK_STR = ['2', '3', '4', '5', '6'] as const;
const SESSION_DURATION_STR = ['30', '45', '60', '90'] as const;
const CARDIO_SESSIONS_STR = ['0', '1', '2', '3', '4', '5'] as const;
const CYCLE_WEEKS_STR = ['4', '6', '8', '12'] as const;

const MAX_PRIORITY_MUSCLES = 3;

export const trainingProfileSchema = z.object({
  trainingGoal: z.enum(TRAINING_GOAL_VALUES),

  trainingExperience: z.enum(TRAINING_EXPERIENCE_VALUES),

  daysPerWeek: z.enum(DAYS_PER_WEEK_STR, {
    error: 'Số ngày tập phải là 2, 3, 4, 5 hoặc 6',
  }),

  sessionDurationMin: z.enum(SESSION_DURATION_STR, {
    error: 'Thời lượng buổi tập phải là 30, 45, 60 hoặc 90 phút',
  }),

  availableEquipment: z.array(z.enum(EQUIPMENT_TYPE_VALUES)),

  injuryRestrictions: z.array(z.enum(BODY_REGION_VALUES)),

  cardioSessionsWeek: z.enum(CARDIO_SESSIONS_STR, {
    error: 'Số buổi cardio phải từ 0 đến 5',
  }),

  periodizationModel: z.enum(PERIODIZATION_MODEL_VALUES),

  planCycleWeeks: z.enum(CYCLE_WEEKS_STR, {
    error: 'Số tuần chu kỳ phải là 4, 6, 8 hoặc 12',
  }),

  priorityMuscles: z
    .array(z.enum(MUSCLE_GROUP_VALUES))
    .max(MAX_PRIORITY_MUSCLES, {
      error: `Chọn tối đa ${MAX_PRIORITY_MUSCLES} nhóm cơ ưu tiên`,
    }),

  avgSleepHours: z.preprocess(
    (val) => (val === '' || val === undefined || val === null || Number.isNaN(Number(val)) ? undefined : Number(val)),
    z.number()
      .min(3, { error: 'Giờ ngủ tối thiểu là 3' })
      .max(12, { error: 'Giờ ngủ tối đa là 12' })
      .optional(),
  ),
});

export type TrainingProfileFormData = z.infer<typeof trainingProfileSchema>;

export const trainingProfileDefaults: TrainingProfileFormData = {
  trainingGoal: 'hypertrophy',
  trainingExperience: 'beginner',
  daysPerWeek: '3',
  sessionDurationMin: '60',
  availableEquipment: ['bodyweight', 'dumbbell'],
  injuryRestrictions: [],
  cardioSessionsWeek: '2',
  periodizationModel: 'linear',
  planCycleWeeks: '8',
  priorityMuscles: [],
  avgSleepHours: undefined,
};
