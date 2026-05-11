import { Injectable, inject } from '@angular/core';
import type { MealType } from '../../models/meal-plan.types';
import type { DishListItem } from '../../repositories/dish.repository';
import type { NutritionTotals } from '../nutrition/nutrition-query';
import { GeminiClient } from './gemini-client';
import {
  MENU_SUGGESTION_SYSTEM_INSTRUCTION,
  buildMenuSuggestionPrompt,
  menuSuggestionGeminiSchema,
  menuSuggestionResponseSchema,
  type MenuSuggestionResponse,
} from './prompts/menu-suggestion.prompt';

export interface MenuSuggestionAiInput {
  readonly date: string;
  readonly mealType: MealType;
  readonly targets: NutritionTotals;
  readonly currentTotals: NutritionTotals;
  readonly dishes: readonly DishListItem[];
}

export interface MenuSuggestion {
  readonly dishId: string;
  readonly dishName: string;
  readonly servings: number;
  readonly reason: string;
}

@Injectable({ providedIn: 'root' })
export class MenuSuggestionAi {
  private readonly gemini = inject(GeminiClient);

  async suggest(input: MenuSuggestionAiInput): Promise<readonly MenuSuggestion[]> {
    const dishById = new Map(input.dishes.map((dish) => [dish.id, dish]));
    if (dishById.size === 0) {
      throw new Error('MenuSuggestionAi: cannot suggest without dishes.');
    }

    const response = await this.gemini.generateContent<MenuSuggestionResponse>(
      buildMenuSuggestionPrompt(input),
      {
        feature: 'menu_suggestion',
        systemInstruction: MENU_SUGGESTION_SYSTEM_INSTRUCTION,
        responseSchema: menuSuggestionGeminiSchema,
        schema: menuSuggestionResponseSchema,
        maxOutputTokens: 2048,
        timeoutMs: 30_000,
      },
    );

    const suggestions = response.suggestions
      .map((item) => {
        const dish = dishById.get(item.dish_id);
        if (!dish) return null;
        return {
          dishId: dish.id,
          dishName: dish.name,
          servings: roundToHalfServing(item.servings),
          reason: item.reason.trim(),
        } satisfies MenuSuggestion;
      })
      .filter((item): item is MenuSuggestion => item !== null);

    if (suggestions.length === 0) {
      throw new Error('MenuSuggestionAi: Gemini returned no usable dish IDs.');
    }
    return suggestions;
  }
}

function roundToHalfServing(servings: number): number {
  return Math.min(3, Math.max(0.5, Math.round(servings * 2) / 2));
}
