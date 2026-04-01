import { z } from 'zod';

// ── Enum value tuples (match src/features/fitness/types.ts exactly) ──

const TRAINING_GOAL_VALUES = ['strength', 'hypertrophy', 'endurance', 'general'] as const;

const TRAINING_EXPERIENCE_VALUES = ['beginner', 'intermediate', 'advanced'] as const;

const EQUIPMENT_TYPE_VALUES = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'bands',
  'kettlebell',
] as const;

const BODY_REGION_VALUES = [
  'shoulders',
  'lower_back',
  'knees',
  'wrists',
  'neck',
  'hips',
] as const;

const PERIODIZATION_MODEL_VALUES = ['linear', 'undulating', 'block'] as const;

const MUSCLE_GROUP_VALUES = [
  'chest',
  'back',
  'shoulders',
  'legs',
  'arms',
  'core',
  'glutes',
] as const;

const DAYS_PER_WEEK_VALUES = [2, 3, 4, 5, 6] as const;

const SESSION_DURATION_VALUES = [30, 45, 60, 90] as const;

const CYCLE_WEEKS_VALUES = [4, 6, 8, 12] as const;

const MAX_PRIORITY_MUSCLES = 3;

// ── Full onboarding schema ──────────────────────────────────────────

export const fitnessOnboardingSchema = z.object({
  /** Step 0 – core: training goal */
  trainingGoal: z.enum(TRAINING_GOAL_VALUES),

  /** Step 0 – core: experience level */
  experience: z.enum(TRAINING_EXPERIENCE_VALUES),

  /** Step 0 – core: training days per week (discrete set) */
  daysPerWeek: z.coerce
    .number()
    .int()
    .refine(
      (v): v is (typeof DAYS_PER_WEEK_VALUES)[number] =>
        (DAYS_PER_WEEK_VALUES as readonly number[]).includes(v),
      { error: 'Days per week must be 2, 3, 4, 5, or 6' },
    ),

  /** Step 1 – session duration in minutes (discrete set, nullable = "use smart default") */
  sessionDuration: z.coerce
    .number()
    .int()
    .refine(
      (v): v is (typeof SESSION_DURATION_VALUES)[number] =>
        (SESSION_DURATION_VALUES as readonly number[]).includes(v),
      { error: 'Session duration must be 30, 45, 60, or 90' },
    )
    .nullable(),

  /** Step 2 – available equipment (multi-select) */
  equipment: z.array(z.enum(EQUIPMENT_TYPE_VALUES)),

  /** Step 3 – injury / restriction areas (multi-select) */
  injuries: z.array(z.enum(BODY_REGION_VALUES)),

  /** Step 4 – cardio sessions per week (0–5, nullable = "use smart default") */
  cardioSessions: z.coerce.number().int().min(0).max(5).nullable(),

  /**
   * Step 5 – periodization model (intermediate+ only, nullable = "use smart default").
   * Conditionally visible when experience >= 'intermediate'.
   */
  periodization: z.enum(PERIODIZATION_MODEL_VALUES).nullable(),

  /**
   * Step 6 – plan cycle length in weeks (intermediate+ only, nullable = "use smart default").
   * Conditionally visible when experience >= 'intermediate'.
   */
  cycleWeeks: z.coerce
    .number()
    .int()
    .refine(
      (v): v is (typeof CYCLE_WEEKS_VALUES)[number] =>
        (CYCLE_WEEKS_VALUES as readonly number[]).includes(v),
      { error: 'Cycle weeks must be 4, 6, 8, or 12' },
    )
    .nullable(),

  /**
   * Step 7 – priority muscle groups, max 3 (intermediate+ only).
   * Conditionally visible when experience >= 'intermediate'.
   */
  priorityMuscles: z
    .array(z.enum(MUSCLE_GROUP_VALUES))
    .max(MAX_PRIORITY_MUSCLES, {
      error: `Select at most ${MAX_PRIORITY_MUSCLES} priority muscles`,
    }),

  /**
   * Step 8 – known 1-rep-max values keyed by lift id (squat | bench | deadlift | ohp).
   * All entries optional; each value must be a non-negative number.
   */
  known1rm: z.record(z.string(), z.coerce.number().min(0)),

  /**
   * Step 9 – average sleep hours (advanced only, empty string = not provided).
   * Conditionally visible when experience === 'advanced'.
   */
  avgSleepHours: z.coerce.number().min(3).max(12).optional(),
});

export type FitnessOnboardingFormData = z.infer<typeof fitnessOnboardingSchema>;

// ── Step-specific sub-schemas for wizard validation ─────────────────
//
// Step visibility depends on experience level:
//   Steps 0–4, 8: always visible
//   Steps 5–7: visible when experience >= 'intermediate'
//   Step 9: visible only when experience === 'advanced'

export const onboardingStepSchemas = {
  /** Step 0 – core: goal + experience + days per week */
  core: fitnessOnboardingSchema.pick({
    trainingGoal: true,
    experience: true,
    daysPerWeek: true,
  }),

  /** Step 1 – session duration */
  sessionDuration: fitnessOnboardingSchema.pick({ sessionDuration: true }),

  /** Step 2 – equipment */
  equipment: fitnessOnboardingSchema.pick({ equipment: true }),

  /** Step 3 – injuries */
  injuries: fitnessOnboardingSchema.pick({ injuries: true }),

  /** Step 4 – cardio sessions per week */
  cardioSessions: fitnessOnboardingSchema.pick({ cardioSessions: true }),

  /** Step 5 – periodization model (intermediate+) */
  periodization: fitnessOnboardingSchema.pick({ periodization: true }),

  /** Step 6 – cycle weeks (intermediate+) */
  cycleWeeks: fitnessOnboardingSchema.pick({ cycleWeeks: true }),

  /** Step 7 – priority muscles (intermediate+) */
  priorityMuscles: fitnessOnboardingSchema.pick({ priorityMuscles: true }),

  /** Step 8 – known 1RM */
  known1rm: fitnessOnboardingSchema.pick({ known1rm: true }),

  /** Step 9 – average sleep hours (advanced only) */
  sleepHours: fitnessOnboardingSchema.pick({ avgSleepHours: true }),
} as const;

// ── Default values (matches FitnessOnboarding component initial state) ──

export const fitnessOnboardingDefaults: FitnessOnboardingFormData = {
  trainingGoal: 'hypertrophy',
  experience: 'beginner',
  daysPerWeek: 3,
  sessionDuration: null,
  equipment: [],
  injuries: [],
  cardioSessions: null,
  periodization: null,
  cycleWeeks: null,
  priorityMuscles: [],
  known1rm: {},
  avgSleepHours: undefined,
};
