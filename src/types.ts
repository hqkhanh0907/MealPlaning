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

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type Dish = {
  id: string;
  name: string;
  ingredients: DishIngredient[];
  tags: MealType[]; // which meal slots this dish is suitable for
};

export type DayPlan = {
  date: string; // YYYY-MM-DD
  breakfastDishIds: string[];
  lunchDishIds: string[];
  dinnerDishIds: string[];
};

export type UserProfile = {
  weight: number;
  proteinRatio: number;
  targetCalories: number;
};

// --- Derived / Computed Types ---

export type NutritionInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type SlotInfo = {
  dishIds: string[];
} & NutritionInfo;

export type DayNutritionSummary = {
  breakfast: SlotInfo;
  lunch: SlotInfo;
  dinner: SlotInfo;
};

// --- AI Service Types ---

export type AnalyzedNutritionPerUnit = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type AnalyzedIngredient = {
  name: string;
  amount: number;
  unit: string;
  nutritionPerStandardUnit: AnalyzedNutritionPerUnit;
};

export type AnalyzedDishResult = {
  name: string;
  description: string;
  totalNutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  ingredients: AnalyzedIngredient[];
};

export type SaveAnalyzedDishPayload = {
  name: string;
  shouldCreateDish?: boolean;
  ingredients: AnalyzedIngredient[];
};

export type MealPlanSuggestion = {
  breakfastDishIds: string[];
  lunchDishIds: string[];
  dinnerDishIds: string[];
  reasoning: string;
};

export type IngredientSuggestion = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  unit: string;
};
