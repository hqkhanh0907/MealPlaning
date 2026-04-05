import i18n from 'i18next';
import { z } from 'zod';

// ── Enum value tuples (match src/features/fitness/types.ts exactly) ──

const TRAINING_GOAL_VALUES = ['strength', 'hypertrophy', 'endurance', 'general'] as const;
const TRAINING_EXPERIENCE_VALUES = ['beginner', 'intermediate', 'advanced'] as const;
const EQUIPMENT_TYPE_VALUES = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands', 'kettlebell'] as const;
const BODY_REGION_VALUES = ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'] as const;
const PERIODIZATION_MODEL_VALUES = ['linear', 'undulating', 'block'] as const;
const MUSCLE_GROUP_VALUES = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'] as const;

const DAYS_PER_WEEK_VALUES = [2, 3, 4, 5, 6] as const;
const SESSION_DURATION_VALUES = [30, 45, 60, 90] as const;
const CARDIO_SESSIONS_VALUES = [0, 1, 2, 3, 4, 5] as const;
const CYCLE_WEEKS_VALUES = [4, 6, 8, 12] as const;

const MAX_PRIORITY_MUSCLES = 3;

// ── Options for UI components (RadioPills / ChipSelect) ──

export const TRAINING_GOAL_OPTIONS = TRAINING_GOAL_VALUES;
export const TRAINING_EXPERIENCE_OPTIONS = TRAINING_EXPERIENCE_VALUES;
export const DAYS_PER_WEEK_OPTIONS = DAYS_PER_WEEK_VALUES;
export const SESSION_DURATION_OPTIONS = SESSION_DURATION_VALUES;
export const EQUIPMENT_OPTIONS = EQUIPMENT_TYPE_VALUES;
export const BODY_REGION_OPTIONS = BODY_REGION_VALUES;
export const CARDIO_SESSIONS_OPTIONS = CARDIO_SESSIONS_VALUES;
export const PERIODIZATION_OPTIONS = PERIODIZATION_MODEL_VALUES;
export const CYCLE_WEEKS_OPTIONS = CYCLE_WEEKS_VALUES;
export const MUSCLE_GROUP_OPTIONS = MUSCLE_GROUP_VALUES;
export { MAX_PRIORITY_MUSCLES };

// ── Unified schema — field names match TrainingProfile type exactly ──

export const trainingProfileSchema = z.object({
  trainingGoal: z.enum(TRAINING_GOAL_VALUES),

  trainingExperience: z.enum(TRAINING_EXPERIENCE_VALUES),

  daysPerWeek: z
    .number()
    .int()
    .refine(v => (DAYS_PER_WEEK_VALUES as readonly number[]).includes(v), {
      message: i18n.t('validation.trainingProfile.daysPerWeek'),
    }),

  sessionDurationMin: z
    .number()
    .int()
    .refine(v => (SESSION_DURATION_VALUES as readonly number[]).includes(v), {
      message: i18n.t('validation.trainingProfile.sessionDuration'),
    }),

  availableEquipment: z.array(z.enum(EQUIPMENT_TYPE_VALUES)),

  injuryRestrictions: z.array(z.enum(BODY_REGION_VALUES)),

  cardioSessionsWeek: z
    .number()
    .int()
    .refine(v => (CARDIO_SESSIONS_VALUES as readonly number[]).includes(v), {
      message: i18n.t('validation.trainingProfile.cardioSessions'),
    }),

  periodizationModel: z.enum(PERIODIZATION_MODEL_VALUES),

  planCycleWeeks: z
    .number()
    .int()
    .refine(v => (CYCLE_WEEKS_VALUES as readonly number[]).includes(v), {
      message: i18n.t('validation.trainingProfile.cycleWeeks'),
    }),

  priorityMuscles: z.array(z.enum(MUSCLE_GROUP_VALUES)).max(MAX_PRIORITY_MUSCLES, {
    message: i18n.t('validation.trainingProfile.priorityMusclesMax', { max: MAX_PRIORITY_MUSCLES }),
  }),

  avgSleepHours: z
    .number()
    .min(3, { message: i18n.t('validation.trainingProfile.sleepMin') })
    .max(12, { message: i18n.t('validation.trainingProfile.sleepMax') })
    .optional(),
});

export type TrainingProfileFormData = z.infer<typeof trainingProfileSchema>;

// ── Step sub-schemas for onboarding wizard validation ──

export const trainingStepSchemas = {
  core: trainingProfileSchema.pick({
    trainingGoal: true,
    trainingExperience: true,
    daysPerWeek: true,
  }),
  sessionDuration: trainingProfileSchema.pick({ sessionDurationMin: true }),
  equipment: trainingProfileSchema.pick({ availableEquipment: true }),
  injuries: trainingProfileSchema.pick({ injuryRestrictions: true }),
  cardio: trainingProfileSchema.pick({ cardioSessionsWeek: true }),
  periodization: trainingProfileSchema.pick({ periodizationModel: true }),
  cycleWeeks: trainingProfileSchema.pick({ planCycleWeeks: true }),
  priorityMuscles: trainingProfileSchema.pick({ priorityMuscles: true }),
  sleepHours: trainingProfileSchema.pick({ avgSleepHours: true }),
} as const;

// ── Default values ──

export const trainingProfileDefaults: TrainingProfileFormData = {
  trainingGoal: 'hypertrophy',
  trainingExperience: 'beginner',
  daysPerWeek: 3,
  sessionDurationMin: 60,
  availableEquipment: ['bodyweight', 'dumbbell'],
  injuryRestrictions: [],
  cardioSessionsWeek: 2,
  periodizationModel: 'linear',
  planCycleWeeks: 8,
  priorityMuscles: [],
  avgSleepHours: undefined,
};
