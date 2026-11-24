import { Injectable, inject } from '@angular/core';
import { roundSuggestedServings } from '../../models/meal-plan.types';
import { catalogForPrompt } from './prompts/ai-catalog';
import { AiGeneration } from './ai-generation';
import {
  MENU_SUGGESTION_SYSTEM_INSTRUCTION,
  buildMenuSuggestionPrompt,
  type BuildMenuSuggestionPromptInput,
  menuSuggestionResponseSchema,
  type MenuSuggestionResponse,
} from './prompts/menu-suggestion.prompt';

export type MenuSuggestionAiInput = BuildMenuSuggestionPromptInput;

export interface MenuSuggestion {
  readonly dishId: string;
  readonly dishName: string;
  readonly servings: number;
  readonly reason: string;
}

@Injectable({ providedIn: 'root' })
export class MenuSuggestionAi {
  private readonly ai = inject(AiGeneration);

  async suggest(input: MenuSuggestionAiInput): Promise<readonly MenuSuggestion[]> {
    const candidates = catalogForPrompt(input.dishes);
    const dishById = new Map(candidates.map((dish) => [dish.id, dish]));
    if (dishById.size === 0) {
      throw new Error('MenuSuggestionAi: cannot suggest without dishes.');
    }

    const response = await this.ai.generateText<MenuSuggestionResponse>(
      buildMenuSuggestionPrompt({ ...input, dishes: candidates }),
      {
        feature: 'menu_suggestion',
        systemInstruction: MENU_SUGGESTION_SYSTEM_INSTRUCTION,
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
          servings: roundSuggestedServings(item.servings),
          reason: item.reason.trim(),
        } satisfies MenuSuggestion;
      })
      .filter((item): item is MenuSuggestion => item !== null);

    if (suggestions.length === 0) {
      throw new Error('MenuSuggestionAi: AI returned no usable dish IDs.');
    }
    return suggestions;
  }
}
