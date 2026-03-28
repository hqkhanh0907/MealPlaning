import { z } from 'zod';

const CARDIO_TYPE_VALUES = [
  'running',
  'cycling',
  'swimming',
  'hiit',
  'walking',
  'elliptical',
  'rowing',
] as const;

const DISTANCE_TYPES: ReadonlySet<string> = new Set([
  'running',
  'cycling',
  'swimming',
]);

const INTENSITY_VALUES = ['low', 'moderate', 'high'] as const;

export const cardioLoggerSchema = z
  .object({
    selectedType: z.enum(CARDIO_TYPE_VALUES),
    isStopwatchMode: z.boolean(),
    manualDuration: z.coerce.number().min(0).default(0),
    distanceKm: z.coerce.number().min(0).optional(),
    avgHeartRate: z.coerce.number().int().min(30).max(250).optional(),
    intensity: z.enum(INTENSITY_VALUES),
  })
  .refine(
    (data) => {
      if (DISTANCE_TYPES.has(data.selectedType) && data.distanceKm !== undefined) {
        return data.distanceKm >= 0;
      }
      return true;
    },
    {
      message: 'Distance must be a non-negative number for running, cycling, or swimming',
      path: ['distanceKm'],
    },
  );

export type CardioLoggerFormData = z.infer<typeof cardioLoggerSchema>;

export const cardioLoggerDefaults: CardioLoggerFormData = {
  selectedType: 'running',
  isStopwatchMode: true,
  manualDuration: 0,
  distanceKm: undefined,
  avgHeartRate: undefined,
  intensity: 'moderate',
};
