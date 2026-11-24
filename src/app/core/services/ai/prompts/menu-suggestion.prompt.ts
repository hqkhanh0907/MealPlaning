import { dishCatalogPrompt } from './ai-catalog';
import { z } from 'zod';
import { MEAL_LABELS, type MealType } from '../../../models/meal-plan.types';
import type { DishListItem } from '../../../models/management.model';
import type { NutritionTotals } from '../../../models/nutrition';

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
  const dishRows = dishCatalogPrompt(input.dishes);

  return [
    `Gợi ý món cho ${MEAL_LABELS[input.mealType].toLowerCase()} ngày ${input.date}.`,
    '',
    'Mục tiêu còn lại trong ngày:',
    input.targets.calories > 0
      ? `- Calories còn lại: ${Math.round(remainingCalories)} kcal`
      : '- Chưa đặt mục tiêu năng lượng.',
    input.targets.protein > 0
      ? `- Protein còn lại: ${Math.round(remainingProtein)}g`
      : '- Chưa đặt mục tiêu protein.',
    '',
    'Danh sách món được phép chọn. Mỗi dòng ghi dinh dưỡng cho một khẩu phần:',
    dishRows || '- Không có món.',
    '',
    'Rules:',
    '- Chỉ chọn dish_id trong danh sách.',
    '- Ưu tiên meal_tag đúng bữa nếu hợp lý.',
    '- Chọn 1-5 gợi ý, servings 0.5-3, bước 0.5.',
    '- Chỉ so với mục tiêu đã đặt. Khi chưa có mục tiêu, gợi ý theo bữa và món trong thư viện.',
  ].join('\n');
}

export const MENU_SUGGESTION_SYSTEM_INSTRUCTION =
  'Bạn là coach dinh dưỡng cho người Việt. Chỉ trả JSON đúng schema, không markdown.';
