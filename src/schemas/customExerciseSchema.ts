import i18n from 'i18next';
import { z } from 'zod';

const EXERCISE_CATEGORIES = ['compound', 'isolation', 'cardio'] as const;

export const customExerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: i18n.t('validation.exercise.nameRequired') }),
  muscleGroup: z.string().default(''),
  category: z
    .enum(EXERCISE_CATEGORIES, {
      error: i18n.t('validation.exercise.categoryInvalid'),
    })
    .default('compound'),
  equipment: z.string().default(''),
});

export type CustomExerciseFormData = z.infer<typeof customExerciseSchema>;

export const customExerciseDefaults: CustomExerciseFormData = {
  name: '',
  muscleGroup: '',
  category: 'compound',
  equipment: '',
};
