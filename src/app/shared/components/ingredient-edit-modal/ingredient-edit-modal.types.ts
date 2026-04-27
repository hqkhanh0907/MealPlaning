import type { NutritionBasisUnit } from '../../../core/models/management.types';

export interface IngredientEditUnitFormValue {
  local_id: string;
  unit_id: string;
  factor_to_basis: number;
  is_default: boolean;
  display_label: string;
  is_approximate: boolean;
  short_name_vi: string;
}

export interface IngredientEditFormValue {
  name: string;
  category: string;
  nutrition_basis_unit: NutritionBasisUnit;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  density_g_per_ml: number | null;
  units: IngredientEditUnitFormValue[];
}
