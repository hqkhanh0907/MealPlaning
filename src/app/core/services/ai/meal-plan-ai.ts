import { Injectable, inject } from '@angular/core';

import type { MealType } from '../../models/meal-plan.types';
import type { DishListItem } from '../../repositories/dish.repository';
import type { NutritionTotals } from '../nutrition/nutrition-query';
import { GeminiClient } from './gemini-client';
import {
  buildMealPlanDayPrompt,
  mealPlanDayGeminiSchema,
  mealPlanDayResponseSchema,
  MEAL_PLAN_DAY_SYSTEM_INSTRUCTION,
} from './prompts/meal-plan-day.prompt';

export interface MealPlanAiDayInput {
  readonly date: string;
  readonly targets: NutritionTotals;
  readonly dishes: readonly DishListItem[];
}

export interface MealPlanAiSuggestion {
  readonly dishId: string;
  readonly mealType: MealType;
  readonly servings: number;
  readonly reason: string;
}

@Injectable({ providedIn: 'root' })
export class MealPlanAi {
  private readonly gemini = inject(GeminiClient);

  async planDay(input: MealPlanAiDayInput): Promise<readonly MealPlanAiSuggestion[]> {
    const dishIds = new Set(input.dishes.map((dish) => dish.id));
    if (dishIds.size === 0) {
      throw new Error('MealPlanAi: cannot plan day without dishes');
    }

    const response = await this.gemini.generateContent(buildMealPlanDayPrompt(input), {
      feature: 'meal_plan_day',
      systemInstruction: MEAL_PLAN_DAY_SYSTEM_INSTRUCTION,
      responseSchema: mealPlanDayGeminiSchema,
      schema: mealPlanDayResponseSchema,
      maxOutputTokens: 2048,
      timeoutMs: 45_000,
    });

    const suggestions = response.items
      .filter((item) => dishIds.has(item.dish_id))
      .map(
        (item): MealPlanAiSuggestion => ({
          dishId: item.dish_id,
          mealType: item.meal_type,
          servings: roundToHalfServing(item.servings),
          reason: item.reason.trim(),
        }),
      );

    if (suggestions.length === 0) {
      throw new Error('MealPlanAi: Gemini returned no usable dish IDs');
    }

    return suggestions;
  }
}

function roundToHalfServing(servings: number): number {
  return Math.min(3, Math.max(0.5, Math.round(servings * 2) / 2));
}
