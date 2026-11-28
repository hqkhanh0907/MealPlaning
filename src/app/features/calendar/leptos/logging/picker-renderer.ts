import type { DishListItem } from '../../../../core/repositories/dish.repository';
import type { MenuSuggestion } from '../../../../core/services/ai/menu-suggestion-ai';
import type { LoggingDishSelection } from '../../components/logging-modal/logging-modal';
import { loadCalendarRenderer } from '../calendar-renderer';

export interface PickerData {
  mealLabel: string;
  allDishes: readonly DishListItem[];
  recentDishes: readonly DishListItem[];
  loading: boolean;
  aiLoading: boolean;
  aiDisabledReason: string | null;
  aiSuggestions: readonly MenuSuggestion[];
}

export type PickerAction =
  | ({ type: 'selected' } & LoggingDishSelection)
  | { type: 'servings'; value: number }
  | { type: 'ai' | 'create' };

export interface PickerHandle {
  update(json: string): void;
  search(query: string): void;
  free(): void;
}

interface PickerRenderer {
  mountLoggingPicker(
    host: HTMLElement,
    json: string,
    servings: number,
    dispatch: (action: PickerAction) => void,
  ): PickerHandle;
}

export async function loadLoggingPicker(): Promise<PickerRenderer> {
  const module = await loadCalendarRenderer();
  if (!('mountLoggingPicker' in module) || typeof module.mountLoggingPicker !== 'function') {
    throw new Error('Logging picker renderer missing');
  }
  return module as typeof module & PickerRenderer;
}
