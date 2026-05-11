import { z } from 'zod';
import type { MealType } from '../../../models/meal-plan.types';
import type { DishListItem } from '../../../repositories/dish.repository';
import type { NutritionTotals } from '../../nutrition/nutrition-query';

export const menuSuggestionItemSchema = z
  .object({
    dish_id: z.string().min(1),
    servings: z.number().min(0.5).max(3),
    reason: z.string().min(1).max(180),
  })
  .strict();

export const menuSuggestionResponseSchema = z
  .object({
    suggestions: z.array(menuSuggestionItemSchema).min(1).max(5),
  })
  .strict();

export type MenuSuggestionResponse = z.infer<typeof menuSuggestionResponseSchema>;

export const menuSuggestionGeminiSchema = {
  type: 'OBJECT',
  properties: {
    suggestions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          dish_id: { type: 'STRING' },
          servings: { type: 'NUMBER' },
          reason: { type: 'STRING' },
        },
        required: ['dish_id', 'servings', 'reason'],
      },
    },
  },
  required: ['suggestions'],
} as const;

export interface BuildMenuSuggestionPromptInput {
  readonly date: string;
  readonly mealType: MealType;
  readonly targets: NutritionTotals;
  readonly currentTotals: NutritionTotals;
  readonly dishes: readonly DishListItem[];
}

export function buildMenuSuggestionPrompt(input: BuildMenuSuggestionPromptInput): string {
  const remainingCalories = Math.max(0, input.targets.calories - input.currentTotals.calories);
  const remainingProtein = Math.max(0, input.targets.protein - input.currentTotals.protein);
  const dishRows = input.dishes
    .slice(0, 80)
    .map(
      (dish) =>
        `- id=${dish.id}; name="${dish.name}"; meal_tag=${dish.meal_tag ?? 'any'}; kcal=${Math.round(dish.total_calories)}; Protein=${Math.round(dish.total_protein)}g; Carbs=${Math.round(dish.total_carbs)}g; Fat=${Math.round(dish.total_fat)}g; Fiber=${Math.round(dish.total_fiber)}g`,
    )
    .join('\n');

  return [
    `Gợi ý món cho ${mealLabel(input.mealType)} ngày ${input.date}.`,
    '',
    'Mục tiêu còn lại trong ngày:',
    `- Calories còn lại: ${Math.round(remainingCalories)} kcal`,
    `- Protein còn lại: ${Math.round(remainingProtein)}g`,
    '',
    'Danh sách món được phép chọn:',
    dishRows || '- Không có món.',
    '',
    'Rules:',
    '- Chỉ chọn dish_id trong danh sách.',
    '- Ưu tiên meal_tag đúng bữa nếu hợp lý.',
    '- Chọn 1-5 gợi ý, servings 0.5-3, bước 0.5.',
    '- Lý do phải cụ thể theo calo/protein còn lại.',
  ].join('\n');
}

function mealLabel(mealType: MealType): string {
  switch (mealType) {
    case 'breakfast':
      return 'bữa sáng';
    case 'lunch':
      return 'bữa trưa';
    case 'dinner':
      return 'bữa tối';
    case 'snack':
      return 'bữa phụ';
  }
}

export const MENU_SUGGESTION_SYSTEM_INSTRUCTION =
  'Bạn là coach dinh dưỡng cho người Việt. Chỉ trả JSON đúng schema, không markdown.';
