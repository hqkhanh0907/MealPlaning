export type Ingredient = {
  id: string;
  name: string;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  fiberPer100: number;
  unit: string; // 'g' or 'ml'
};

export type DishIngredient = {
  ingredientId: string;
  amount: number; // in 'unit'
};

export type Dish = {
  id: string;
  name: string;
  ingredients: DishIngredient[];
};

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type Meal = {
  id: string;
  name: string;
  type: MealType;
  dishIds: string[];
};

export type DayPlan = {
  date: string; // YYYY-MM-DD
  breakfastId: string | null;
  lunchId: string | null;
  dinnerId: string | null;
};

export type UserProfile = {
  weight: number;
  proteinRatio: number;
  targetCalories: number;
};
