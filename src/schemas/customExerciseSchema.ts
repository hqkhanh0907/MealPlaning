import { z } from 'zod';

const EXERCISE_CATEGORIES = ['compound', 'isolation', 'cardio'] as const;

export const customExerciseSchema = z.object({
  name: z.string().trim().min(1, { message: 'Tên bài tập không được bỏ trống' }),
  muscleGroup: z.string().default(''),
  category: z.enum(EXERCISE_CATEGORIES, {
    message: 'Loại bài tập không hợp lệ',
  }).default('compound'),
  equipment: z.string().default(''),
});

export type CustomExerciseFormData = z.infer<typeof customExerciseSchema>;

export const customExerciseDefaults: CustomExerciseFormData = {
  name: '',
  muscleGroup: '',
  category: 'compound',
  equipment: '',
};
