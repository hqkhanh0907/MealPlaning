import type { MuscleGroup, CardioType, CardioIntensity } from './types';

// Day labels (Monday-first, Vietnamese)
export const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;
// Sunday-first variant for Date.getDay() alignment
export const DAY_LABELS_SUNDAY_FIRST = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;

// RPE scale options
export const RPE_OPTIONS = [6, 7, 8, 9, 10] as const;

// Weight/Reps increments
export const WEIGHT_INCREMENT = 2.5;
export const REPS_INCREMENT = 1;
export const MIN_WEIGHT_KG = 0;
export const MIN_REPS = 1;
export const DEFAULT_REST_SECONDS = 90;

// Body weight tracking limits
export const BODY_WEIGHT_MIN_KG = 30;
export const BODY_WEIGHT_MAX_KG = 300;

// Muscle group constants
export const ALL_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];
export const UPPER_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms'];
export const LOWER_MUSCLES: MuscleGroup[] = ['legs', 'glutes', 'core'];
export const PUSH_MUSCLES: MuscleGroup[] = ['chest', 'shoulders'];
export const PULL_MUSCLES: MuscleGroup[] = ['back', 'arms'];
export const LEG_MUSCLES: MuscleGroup[] = ['legs', 'glutes', 'core'];

// Cardio types
export const CARDIO_TYPES: { type: CardioType; emoji: string; i18nKey: string }[] = [
  { type: 'running', emoji: '🏃', i18nKey: 'fitness.cardio.running' },
  { type: 'cycling', emoji: '🚴', i18nKey: 'fitness.cardio.cycling' },
  { type: 'swimming', emoji: '🏊', i18nKey: 'fitness.cardio.swimming' },
  { type: 'hiit', emoji: '⚡', i18nKey: 'fitness.cardio.hiit' },
  { type: 'walking', emoji: '🚶', i18nKey: 'fitness.cardio.walking' },
  { type: 'elliptical', emoji: '🏋️', i18nKey: 'fitness.cardio.elliptical' },
  { type: 'rowing', emoji: '🚣', i18nKey: 'fitness.cardio.rowing' },
];
export const DISTANCE_CARDIO_TYPES: CardioType[] = ['running', 'cycling', 'swimming'];

export const INTENSITY_OPTIONS: { value: CardioIntensity; i18nKey: string }[] = [
  { value: 'low', i18nKey: 'fitness.cardio.low' },
  { value: 'moderate', i18nKey: 'fitness.cardio.moderate' },
  { value: 'high', i18nKey: 'fitness.cardio.high' },
];

// Dashboard time ranges
export const TIME_RANGES = ['1W', '1M', '3M', 'all'] as const;
