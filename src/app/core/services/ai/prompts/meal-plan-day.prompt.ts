import { z } from 'zod';
import type { DishListItem } from '../../../repositories/dish.repository';
import type { NutritionTotals } from '../../nutrition/nutrition-query';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

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

export const mealPlanDayGeminiSchema = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          dish_id: { type: 'STRING' },
          meal_type: { type: 'STRING', enum: MEAL_TYPES },
          servings: { type: 'NUMBER' },
          reason: { type: 'STRING' },
        },
        required: ['dish_id', 'meal_type', 'servings', 'reason'],
      },
    },
  },
  required: ['items'],
} as const;

export interface BuildMealPlanDayPromptInput {
  readonly date: string;
  readonly targets: NutritionTotals;
  readonly dishes: readonly DishListItem[];
}

const SYSTEM_INSTRUCTION =
  'Bạn là chuyên gia meal planning cho người Việt. Chỉ trả JSON đúng schema, không markdown, không prose.';

export function buildMealPlanDayPrompt(input: BuildMealPlanDayPromptInput): string {
  const dishRows = input.dishes
    .slice(0, 80)
    .map(
      (dish) =>
        `- id=${dish.id}; name="${dish.name}"; meal_tag=${dish.meal_tag ?? 'any'}; kcal=${Math.round(dish.total_calories)}; Protein=${Math.round(dish.total_protein)}g; Carbs=${Math.round(dish.total_carbs)}g; Fat=${Math.round(dish.total_fat)}g; Fiber=${Math.round(dish.total_fiber)}g`,
    )
    .join('\n');

  return [
    `Tạo kế hoạch ăn 1 ngày cho ngày ${input.date}.`,
    '',
    'Mục tiêu ngày:',
    `- Calories: ${Math.round(input.targets.calories)} kcal`,
    `- Protein: ${Math.round(input.targets.protein)}g`,
    `- Carbs: ${Math.round(input.targets.carbs)}g`,
    `- Fat: ${Math.round(input.targets.fat)}g`,
    `- Fiber: ${Math.round(input.targets.fiber)}g`,
    '',
    'Danh sách món được phép chọn (chỉ dùng dish_id trong danh sách này):',
    dishRows || '- Không có món.',
    '',
    'Rules:',
    '- Chọn 3-5 món, phủ bữa sáng/trưa/chiều/phụ khi có đủ món phù hợp.',
    '- Ưu tiên meal_tag đúng bữa nếu có, nhưng có thể dùng meal_type khác nếu hợp lý.',
    '- Tổng Calories nên gần mục tiêu; Protein tối thiểu 80% mục tiêu nếu thư viện món cho phép.',
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
