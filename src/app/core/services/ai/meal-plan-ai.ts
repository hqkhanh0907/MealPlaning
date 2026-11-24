import { Injectable, inject } from '@angular/core';

import {
  roundSuggestedServings,
  type DayPlanWithSlots,
  type MealType,
} from '../../models/meal-plan.types';
import { catalogForPrompt } from './prompts/ai-catalog';
import { NUTRIENTS, ZERO_TOTALS } from '../../models/nutrition';
import { AiGeneration } from './ai-generation';
import {
  buildMealPlanDayPrompt,
  type BuildMealPlanDayPromptInput,
  mealPlanDayResponseSchema,
  MEAL_PLAN_DAY_SYSTEM_INSTRUCTION,
} from './prompts/meal-plan-day.prompt';

export type MealPlanAiDayInput = BuildMealPlanDayPromptInput;
export class MealPlanBudgetError extends Error {}

export function loggedMealContext(
  day: DayPlanWithSlots | null,
): Pick<MealPlanAiDayInput, 'logged' | 'loggedMeals'> & { key: string } {
  const rows = (day?.meal_slots ?? []).flatMap((slot) =>
    slot.planned_dishes
      .filter((dish) => dish.is_completed === 1)
      .map((dish) => ({
        id: dish.id,
        mealType: slot.meal_type,
        completedAt: dish.completed_at,
        calories: dish.calories,
        protein: dish.protein,
        carbs: dish.carbs,
        fat: dish.fat,
        fiber: dish.fiber,
      })),
  );
  const logged: MealPlanAiDayInput['logged'] = { ...ZERO_TOTALS };
  for (const row of rows) {
    for (const key of NUTRIENTS) {
      const value = row[key];
      const total = logged[key];
      logged[key] = value === null || total === null ? null : total + value;
    }
  }
  return {
    logged,
    loggedMeals: [...new Set(rows.map((row) => row.mealType))],
    key: JSON.stringify(rows),
  };
}

export interface MealPlanAiSuggestion {
  readonly dishId: string;
  readonly mealType: MealType;
  readonly servings: number;
  readonly reason: string;
}

@Injectable({ providedIn: 'root' })
export class MealPlanAi {
  private readonly ai = inject(AiGeneration);

  async planDay(input: MealPlanAiDayInput): Promise<readonly MealPlanAiSuggestion[]> {
    const candidates = catalogForPrompt(input.dishes);
    const dishes = new Map(candidates.map((dish) => [dish.id, dish]));
    if (dishes.size === 0) {
      throw new Error('MealPlanAi: cannot plan day without dishes');
    }

    const energyLimit = input.targets.calories > 0 ? input.targets.calories : null;
    const recordedEnergy = input.logged.calories;
    if (energyLimit !== null && recordedEnergy === null) {
      throw new MealPlanBudgetError(
        'Thiếu số liệu năng lượng của bữa đã ăn. Lịch ăn vẫn giữ nguyên.',
      );
    }
    const remainingEnergy =
      energyLimit !== null && recordedEnergy !== null ? energyLimit - recordedEnergy : null;
    if (remainingEnergy !== null && remainingEnergy <= 0) return [];
    const targetKeys = NUTRIENTS.filter((key) => input.targets[key] > 0);
    if (
      targetKeys.length &&
      targetKeys.every((key) => {
        const logged = input.logged[key];
        return logged !== null && logged >= input.targets[key];
      })
    )
      return [];

    const response = await this.ai.generateText(
      buildMealPlanDayPrompt({ ...input, dishes: candidates }),
      {
        feature: 'meal_plan_day',
        systemInstruction: MEAL_PLAN_DAY_SYSTEM_INSTRUCTION,
        schema: mealPlanDayResponseSchema,
        maxOutputTokens: 2048,
        timeoutMs: 45_000,
      },
    );

    const suggestions = response.items
      .filter((item) => dishes.has(item.dish_id))
      .map(
        (item): MealPlanAiSuggestion => ({
          dishId: item.dish_id,
          mealType: item.meal_type,
          servings: roundSuggestedServings(item.servings),
          reason: item.reason.trim(),
        }),
      );

    if (suggestions.length === 0) {
      throw new Error('MealPlanAi: AI returned no usable dish IDs');
    }
    const suggestedEnergy = suggestions.reduce(
      (sum, item) => sum + dishes.get(item.dishId)!.total_calories * item.servings,
      0,
    );
    if (
      remainingEnergy !== null &&
      (!Number.isFinite(suggestedEnergy) || suggestedEnergy > remainingEnergy + 1e-8)
    ) {
      throw new MealPlanBudgetError(
        'Các món gợi ý vượt mục tiêu năng lượng còn lại. Lịch ăn vẫn giữ nguyên.',
      );
    }

    return suggestions;
  }
}
