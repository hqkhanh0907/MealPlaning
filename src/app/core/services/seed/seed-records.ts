import type { MealTag } from '../../models/management.types';

export interface SeedIngredientRecord {
  id: string;
  name_vi: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface SeedDishIngredient {
  ingredient_id: string;
  gram_weight: number;
}

export interface SeedDishRecord {
  id: string;
  name_vi: string;
  meal_tag: MealTag;
  servings: number;
  is_favorite: boolean;
  ingredients: SeedDishIngredient[];
}
