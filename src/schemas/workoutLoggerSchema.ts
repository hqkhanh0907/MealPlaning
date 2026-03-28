import { z } from 'zod';

/** Schema for individual set input (what user fills per set) */
export const setInputSchema = z.object({
  weight: z.coerce.number().min(0),
  reps: z.coerce.number().int().min(0),
  rpe: z.coerce.number().min(1).max(10).optional(),
});

/** Schema for the overall workout form state — setInputs keyed by exerciseId */
export const workoutLoggerSchema = z.object({
  setInputs: z.record(z.string(), setInputSchema),
});

export type SetInputData = z.infer<typeof setInputSchema>;
export type WorkoutLoggerFormData = z.infer<typeof workoutLoggerSchema>;

export const setInputDefaults: SetInputData = { weight: 0, reps: 0 };
