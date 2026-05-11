import type { DishSource, DishType, IngredientSource, MealTag } from './management.types';

/**
 * Ingredient — gram-only revision (schema v6).
 *
 * Tất cả nutrition đều tính per-100g. Không còn nutrition_basis_unit /
 * nutrition_basis_quantity / density_g_per_ml. Liquid ingredient (sữa, dầu, …)
 * được seed/lưu sau khi đã quy đổi qua density về cơ sở gram.
 *
 * Nguồn: docs/3-design/data-model.md §4.1 (v1.1).
 */
export interface IngredientModel {
  id: string;
  name: string;
  category: string;
  /** Calories per 100 g. */
  calories: number;
  /** Protein in g per 100 g. */
  protein: number;
  /** Carbs in g per 100 g. */
  carbs: number;
  /** Fat in g per 100 g. */
  fat: number;
  /** Fiber in g per 100 g. */
  fiber: number;
  source: IngredientSource;
  created_at: string;
  updated_at: string | null;
}

export interface DishModel {
  id: string;
  name: string;
  description: string | null;
  type: DishType;
  source: DishSource;
  servings: number;
  image_url: string | null;
  meal_tag: MealTag | null;
  is_favorite: 0 | 1;
  created_at: string;
  updated_at: string | null;
}

/**
 * Dish ↔ ingredient link — gram-only.
 *
 * `gram_weight` là trọng lượng nguyên liệu (sau quy đổi về gram) dùng cho 1 dish
 * (không chia theo serving). UI nhập trực tiếp số gram, không có unit picker.
 */
export interface DishIngredientModel {
  id: string;
  dish_id: string;
  ingredient_id: string;
  gram_weight: number;
  sort_order: number;
}
