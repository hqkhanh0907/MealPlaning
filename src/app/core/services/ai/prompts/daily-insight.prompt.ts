import { z } from 'zod';
import { NUTRIENTS, type NutritionTotals } from '../../../models/nutrition';
import { workoutNumber } from '../../../models/fitness.types';
import type { FitnessLevel } from '../../../models/user-profile.types';

const TONES = ['info', 'warning', 'success'] as const;

export type DailyInsightLevel = FitnessLevel;

export const dailyInsightResponseSchema = z
  .object({
    tone: z.enum(TONES),
    title: z.string().trim().min(1).max(80),
    body: z.string().trim().min(1).max(260),
    action: z.string().trim().min(1).max(120),
  })
  .strict();

export type DailyInsightResponse = z.infer<typeof dailyInsightResponseSchema>;

export interface BuildDailyInsightPromptInput {
  readonly date: string;
  readonly level: DailyInsightLevel;
  readonly totals: NutritionTotals;
  readonly logged: NutritionTotals;
  readonly targets: NutritionTotals;
  readonly workoutVolumeKg: number;
  readonly workoutStreakWeeks: number;
}

export function buildDailyInsightPrompt(input: BuildDailyInsightPromptInput): string {
  return [
    `Viết insight ngày ${input.date} cho user level=${input.level}.`,
    '',
    'Dinh dưỡng hôm nay. Theo lịch là tổng dự kiến cả ngày, đã bao gồm các món đã ăn.',
    ...NUTRIENTS.map((key) => {
      const unit = key === 'calories' ? 'kcal' : 'g';
      const target = input.targets[key] > 0 ? `${round(input.targets[key])} ${unit}` : 'chưa đặt';
      return `${key}: đã ăn ${round(input.logged[key])} ${unit}, theo lịch ${round(input.totals[key])} ${unit}, mục tiêu ${target}.`;
    }),
    'Chỉ so sánh với mục tiêu đã đặt. Không tự đề xuất mức năng lượng hoặc chế độ giảm cân.',
    '',
    'Tập luyện:',
    `- Tổng tạ × số lần trong các hiệp đã ghi của buổi đã hoàn thành tuần này: ${workoutNumber.format(input.workoutVolumeKg)} kg. Bài tính theo giây không góp vào tổng này.`,
    `- Workout streak: ${input.workoutStreakWeeks} tuần`,
    '',
    'Rules:',
    '- Không phán xét, không gây guilt.',
    '- Beginner: thân thiện, ít thuật ngữ.',
    '- Intermediate: coach rõ ràng, actionable.',
    '- Advanced: có số liệu/macro cụ thể.',
    '- action phải là một việc nhỏ người dùng làm ngay hôm nay.',
  ].join('\n');
}

function round(value: number): number {
  return Math.round(Number.isFinite(value) ? value : 0);
}

export const DAILY_INSIGHT_SYSTEM_INSTRUCTION =
  'Bạn là HealthMate AI coach. Chỉ trả JSON đúng schema, tiếng Việt, không markdown.';
