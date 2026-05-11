import { z } from 'zod';
import type { NutritionTotals } from '../../nutrition/nutrition-query';

const TONES = ['info', 'warning', 'success'] as const;
export type DailyInsightLevel = 'beginner' | 'intermediate' | 'advanced';

export const dailyInsightResponseSchema = z
  .object({
    tone: z.enum(TONES),
    title: z.string().min(1).max(80),
    body: z.string().min(1).max(260),
    action: z.string().min(1).max(120),
  })
  .strict();

export type DailyInsightResponse = z.infer<typeof dailyInsightResponseSchema>;

export const dailyInsightGeminiSchema = {
  type: 'OBJECT',
  properties: {
    tone: { type: 'STRING', enum: TONES },
    title: { type: 'STRING' },
    body: { type: 'STRING' },
    action: { type: 'STRING' },
  },
  required: ['tone', 'title', 'body', 'action'],
} as const;

export interface BuildDailyInsightPromptInput {
  readonly date: string;
  readonly level: DailyInsightLevel;
  readonly totals: NutritionTotals;
  readonly targets: NutritionTotals;
  readonly workoutVolumeKg: number;
  readonly workoutStreakWeeks: number;
}

export function buildDailyInsightPrompt(input: BuildDailyInsightPromptInput): string {
  return [
    `Viết insight ngày ${input.date} cho user level=${input.level}.`,
    '',
    'Dinh dưỡng hôm nay:',
    `- Calories: ${round(input.totals.calories)}/${round(input.targets.calories)} kcal`,
    `- Protein: ${round(input.totals.protein)}/${round(input.targets.protein)}g`,
    `- Carbs: ${round(input.totals.carbs)}/${round(input.targets.carbs)}g`,
    `- Fat: ${round(input.totals.fat)}/${round(input.targets.fat)}g`,
    `- Fiber: ${round(input.totals.fiber)}/${round(input.targets.fiber)}g`,
    '',
    'Tập luyện:',
    `- Volume tuần này: ${round(input.workoutVolumeKg)} kg`,
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
