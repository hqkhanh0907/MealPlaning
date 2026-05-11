import { z } from 'zod';
import type { Exercise } from '../../../models/fitness.types';

const DAY_NAMES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'] as const;

export const aiPlannedExerciseSchema = z
  .object({
    exercise_id: z.string().min(1),
    sets: z.number().int().min(1).max(10),
    reps_min: z.number().int().min(1).max(50),
    reps_max: z.number().int().min(1).max(50),
    rest_seconds: z.number().int().min(30).max(600),
    notes: z.string().max(160).nullable(),
  })
  .strict()
  .refine((value) => value.reps_min <= value.reps_max, 'reps_min must be <= reps_max');

export const aiTrainingDaySchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    name: z.string().min(1).max(80),
    is_rest_day: z.boolean(),
    exercises: z.array(aiPlannedExerciseSchema).max(8),
  })
  .strict();

export const aiTrainingPlanResponseSchema = z
  .object({
    name: z.string().min(1).max(80),
    description: z.string().min(1).max(240),
    frequency: z.number().int().min(2).max(6),
    rationale: z.string().min(1).max(360),
    days: z.array(aiTrainingDaySchema).length(7),
  })
  .strict();

export type AiTrainingPlanResponse = z.infer<typeof aiTrainingPlanResponseSchema>;

export const aiTrainingPlanGeminiSchema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    description: { type: 'STRING' },
    frequency: { type: 'NUMBER' },
    rationale: { type: 'STRING' },
    days: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          day_of_week: { type: 'NUMBER' },
          name: { type: 'STRING' },
          is_rest_day: { type: 'BOOLEAN' },
          exercises: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                exercise_id: { type: 'STRING' },
                sets: { type: 'NUMBER' },
                reps_min: { type: 'NUMBER' },
                reps_max: { type: 'NUMBER' },
                rest_seconds: { type: 'NUMBER' },
                notes: { type: 'STRING', nullable: true },
              },
              required: ['exercise_id', 'sets', 'reps_min', 'reps_max', 'rest_seconds', 'notes'],
            },
          },
        },
        required: ['day_of_week', 'name', 'is_rest_day', 'exercises'],
      },
    },
  },
  required: ['name', 'description', 'frequency', 'rationale', 'days'],
} as const;

export interface BuildTrainingPlanPromptInput {
  readonly fitnessLevel: string;
  readonly goal: string;
  readonly exercises: readonly Exercise[];
  readonly weeklyVolumeKg: number;
  readonly workoutStreakWeeks: number;
}

export function buildTrainingPlanPrompt(input: BuildTrainingPlanPromptInput): string {
  const exerciseRows = input.exercises
    .slice(0, 80)
    .map(
      (exercise) =>
        `- id=${exercise.id}; name="${exercise.name_vi || exercise.name}"; muscle=${exercise.muscle_group}; category=${exercise.category}; equipment=${exercise.equipment ?? 'unknown'}`,
    )
    .join('\n');

  return [
    'Tạo AI custom training plan 7 ngày cho người dùng.',
    '',
    `Level: ${input.fitnessLevel}`,
    `Goal: ${input.goal}`,
    `Current weekly volume: ${Math.round(input.weeklyVolumeKg)} kg`,
    `Workout streak: ${input.workoutStreakWeeks} tuần`,
    '',
    'Exercise database được phép dùng:',
    exerciseRows || '- Không có bài tập.',
    '',
    'Science rules bắt buộc:',
    '- 2-6 buổi/tuần, còn lại rest day.',
    '- Mỗi nhóm cơ chính nên có 10-20 working sets/tuần nếu level phù hợp.',
    '- Beginner ưu tiên Full Body 3x, kỹ thuật, volume thấp.',
    '- Intermediate/advanced có thể dùng Upper/Lower hoặc PPL.',
    '- Có progressive overload note cụ thể.',
    '- Không dùng exercise_id ngoài danh sách.',
    `- Tên ngày nên thuộc nhóm: ${DAY_NAMES.join(', ')} khi hợp lý.`,
  ].join('\n');
}

export const TRAINING_PLAN_SYSTEM_INSTRUCTION =
  'Bạn là strength coach evidence-based. Chỉ trả JSON đúng schema, tiếng Việt, không markdown.';
