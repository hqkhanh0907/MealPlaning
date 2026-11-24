import { dishCatalogPrompt } from './ai-catalog';
import { z } from 'zod';
import type { DishListItem } from '../../../models/management.model';
import { NUTRIENTS, type NutritionTotals } from '../../../models/nutrition';
import { MEAL_TYPES, type MealType } from '../../../models/meal-plan.types';

export const mealPlanDayItemSchema = z
  .object({
    dish_id: z.string().min(1),
    meal_type: z.enum(MEAL_TYPES),
    servings: z.number().min(0.5).max(3),
    reason: z.string().min(1).max(160),
  })
  .strict();

export const mealPlanDayResponseSchema = z
  .object({
    items: z.array(mealPlanDayItemSchema).min(1).max(8),
  })
  .strict();

export type MealPlanDayItemResponse = z.infer<typeof mealPlanDayItemSchema>;
export type MealPlanDayResponse = z.infer<typeof mealPlanDayResponseSchema>;

export interface BuildMealPlanDayPromptInput {
  readonly date: string;
  readonly targets: NutritionTotals;
  readonly logged: { [key in keyof NutritionTotals]: number | null };
  readonly loggedMeals: readonly MealType[];
  readonly dishes: readonly DishListItem[];
}

const SYSTEM_INSTRUCTION =
  'Bạn là chuyên gia meal planning cho người Việt. Chỉ trả JSON đúng schema, không markdown, không prose.';

export function buildMealPlanDayPrompt(input: BuildMealPlanDayPromptInput): string {
  const dishRows = dishCatalogPrompt(input.dishes);

  return [
    `Lập phần lịch ăn còn lại cho ngày ${input.date}.`,
    `Bữa đã ghi: ${input.loggedMeals.join(', ') || 'chưa có'}. Các món đã ăn sẽ được giữ nguyên.`,
    '',
    'Ngân sách còn lại sau khi trừ các món đã ăn:',
    ...NUTRIENTS.map((key) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const unit = key === 'calories' ? 'kcal' : 'g';
      const target = input.targets[key];
      const logged = input.logged[key];
      if (!(target > 0)) return `- ${label}: chưa đặt`;
      if (logged === null) return `- ${label}: thiếu số liệu đã ăn, không ước đoán phần còn lại`;
      const remaining = Math.max(0, target - logged);
      return `- ${label}: ${Number(remaining.toFixed(2))} ${unit}${remaining === 0 ? ' (đã đạt)' : ''}`;
    }),
    '',
    'Danh sách món được phép chọn. Mỗi dòng ghi dinh dưỡng cho một khẩu phần:',
    dishRows || '- Không có món.',
    '',
    'Rules:',
    '- Chỉ đề xuất phần cần bổ sung. Ưu tiên bữa chưa ghi, không lên lại các món đã ăn.',
    '- Ưu tiên meal_tag đúng bữa nếu có, nhưng có thể dùng meal_type khác nếu hợp lý.',
    '- Chỉ dùng các mục tiêu đã đặt. Nếu chưa đặt, chọn món theo bữa và không áp giới hạn năng lượng.',
    '- servings nằm trong khoảng 0.5-3, dùng bước 0.5 khi hợp lý.',
    '- Không chọn dish_id ngoài danh sách.',
    '',
    'Trả JSON:',
    '{',
    '  "items": [',
    '    { "dish_id": string, "meal_type": "breakfast" | "lunch" | "dinner" | "snack", "servings": number, "reason": string }',
    '  ]',
    '}',
  ].join('\n');
}

export const MEAL_PLAN_DAY_SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION;
