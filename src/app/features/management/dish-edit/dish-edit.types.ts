/**
 * Dish edit form types — gram-only (schema v6).
 *
 * Each ingredient row is just (ingredient_id, gram_weight). No unit picker.
 */
import type { MealTag } from '../../../core/models/management.types';

export interface DishIngredientFormItem {
  /** Local UUID v4 — used for trackBy / re-ordering. Not persisted. */
  local_id: string;
  ingredient_id: string;
  /** Gram weight, must be finite & > 0. */
  gram_weight: number;
}

export interface DishEditFormValue {
  name: string;
  description: string;
  servings: number | null;
  meal_tag: MealTag | null;
  items: DishIngredientFormItem[];
}
