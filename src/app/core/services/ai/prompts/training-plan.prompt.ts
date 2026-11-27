import type { FitnessLevel } from '../../../models/user-profile.types';
import { z } from 'zod';
import { trainingPrescriptionLimits } from '../../../models/fitness-prescription';
import { isTimedExercise, workoutNumber, type Exercise } from '../../../models/fitness.types';

export const aiPlannedExerciseSchema = z
  .object({
    exercise_id: z.string().min(1),
    sets: z
      .number()
      .int()
      .min(trainingPrescriptionLimits.minSets)
      .max(trainingPrescriptionLimits.maxSets),
    reps_min: z
      .number()
      .int()
      .min(trainingPrescriptionLimits.minReps)
      .max(trainingPrescriptionLimits.maxReps),
    reps_max: z
      .number()
      .int()
      .min(trainingPrescriptionLimits.minReps)
      .max(trainingPrescriptionLimits.maxReps),
    rest_seconds: z
      .number()
      .int()
      .min(trainingPrescriptionLimits.minRestSeconds)
      .max(trainingPrescriptionLimits.maxRestSeconds),
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

export interface BuildTrainingPlanPromptInput {
  readonly fitnessLevel: FitnessLevel;
  readonly schedule?: {
    readonly weekdays: readonly number[];
    readonly minutes: number;
    readonly frequency: number | null;
  };
  readonly exercises: readonly Exercise[];
  readonly weeklyVolumeKg: number;
  readonly workoutStreakWeeks: number;
}

export function buildTrainingPlanPrompt(input: BuildTrainingPlanPromptInput): string {
  const exerciseRows = input.exercises
    .map(
      (exercise) =>
        `- id=${exercise.id}; name="${exercise.name_vi || exercise.name}"; muscle=${exercise.muscle_group}; category=${exercise.category}; equipment=${exercise.equipment ?? 'unknown'}; unit=${isTimedExercise(exercise.id) ? 'seconds' : 'repetitions'}`,
    )
    .join('\n');

  return [
    'Tạo AI custom training plan 7 ngày cho người dùng.',
    '',
    `Level: ${input.fitnessLevel}`,
    ...(input.schedule
      ? [
          'Ngày rảnh (0 là Chủ nhật): ' + input.schedule.weekdays.join(', '),
          'Thời gian tối đa mỗi buổi: ' + input.schedule.minutes + ' phút.',
          ...(input.schedule.frequency ? ['Số buổi mong muốn: ' + input.schedule.frequency] : []),
        ]
      : []),
    `Tổng tạ × số lần đã ghi trong các buổi hoàn thành tuần này: ${workoutNumber.format(input.weeklyVolumeKg)} kg. Bài tính theo giây không góp vào tổng này.`,
    `Workout streak: ${input.workoutStreakWeeks} tuần`,
    '',
    'Exercise database được phép dùng:',
    exerciseRows || '- Không có bài tập.',
    '',
    'Hướng dẫn lập giáo án:',
    '- 2-6 buổi/tuần, còn lại rest day.',
    '- Điều chỉnh số hiệp theo lịch và mức kinh nghiệm. Tổng khối lượng tuần không xác định mức tạ cho từng bài.',
    '- reps_min và reps_max dùng đơn vị unit của từng bài: seconds là giây, repetitions là số lần.',
    '- Mức kinh nghiệm chỉ là bối cảnh. Đặt ngày và lượng tập trong giới hạn người dùng cung cấp.',
    '- Để người tập chọn mức tạ. Ghi hướng dẫn kỹ thuật ngắn, tránh tự áp dụng tăng tạ hoặc tuần giảm tải.',
    '- Không dùng exercise_id ngoài danh sách.',
    '- Ghi lý do dựa trên lịch, dụng cụ và các bài có trong danh sách.',
  ].join('\n');
}

export const TRAINING_PLAN_SYSTEM_INSTRUCTION =
  'Bạn là strength coach evidence-based. Chỉ trả JSON đúng schema, tiếng Việt, không markdown.';
