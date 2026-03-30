import { z } from 'zod';

/** Schema for individual set input (what user fills per set) */
export const setInputSchema = z.object({
  weight: z.union([z.number().min(0), z.nan()]),
  reps: z.union([z.number().int().min(0), z.nan()]),
  rpe: z.coerce.number().min(1).max(10).optional(),
});

/** Schema for the overall workout form state — setInputs keyed by exerciseId */
export const workoutLoggerSchema = z.object({
  setInputs: z.record(z.string(), setInputSchema),
});

export type SetInputData = z.infer<typeof setInputSchema>;
export type WorkoutLoggerFormData = z.infer<typeof workoutLoggerSchema>;

export const setInputDefaults: SetInputData = { weight: 0, reps: 0 };
