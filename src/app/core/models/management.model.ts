import type {
  DishSource,
  DishType,
  IngredientSource,
  MealTag,
  NutritionBasisUnit,
  UnitType,
} from './management.types';

export interface UnitModel {
  id: string;
  display_name_vi: string;
  display_name_en: string;
  short_name_vi: string;
  unit_type: UnitType;
  is_global: number;
  base_factor_g: number | null;
  base_factor_ml: number | null;
  is_approximate: number;
  display_order: number;
}

export interface IngredientUnitModel {
  ingredient_id: string;
  unit_id: string;
  factor_to_basis: number;
  is_default: number;
  display_label: string | null;
}

export interface IngredientModel {
  id: string;
  name: string;
  category: string;
  nutrition_basis_unit: NutritionBasisUnit;
  nutrition_basis_quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  density_g_per_ml: number | null;
  source: IngredientSource;
  created_at: string;
  updated_at: string | null;
  units?: IngredientUnitModel[];
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
  created_at: string;
  updated_at: string | null;
}

export interface DishIngredientModel {
  id: string;
  dish_id: string;
  ingredient_id: string;
  amount_value: number;
  unit_id: string;
  normalized_amount: number;
}
