export interface DishIngredientFormItem {
  local_id: string;
  ingredient_id: string;
  amount_value: number;
  unit_id: string;
}

export interface DishEditFormValue {
  name: string;
  description: string;
  servings: number | null;
  items: DishIngredientFormItem[];
}
