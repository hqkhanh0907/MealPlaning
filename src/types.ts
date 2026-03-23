export type SupportedLang = 'vi';
export type LocalizedString = Record<'vi', string> & Partial<Record<'en', string>>;

export type Ingredient = {
  id: string;
  name: LocalizedString;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  fiberPer100: number;
  unit: LocalizedString; // e.g. { vi: 'g', en: 'g' }
};

export type DishIngredient = {
  ingredientId: string;
  amount: number; // in 'unit'
};

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type Dish = {
  id: string;
  name: LocalizedString;
  ingredients: DishIngredient[];
  tags: MealType[];
  rating?: number;
  notes?: string;
};

export type DayPlan = {
  date: string; // YYYY-MM-DD
  breakfastDishIds: string[];
  lunchDishIds: string[];
  dinnerDishIds: string[];
  servings?: Record<string, number>;
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
  isFood: boolean;
  notFoodReason?: string;
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

/** Thrown by analyzeDishImage when AI determines the image does not contain food */
export class NotFoodImageError extends Error {
  constructor(public readonly reason: string) {
    super(`Not a food image: ${reason}`);
    this.name = 'NotFoodImageError';
  }
}

export type SaveAnalyzedDishPayload = {
  name: string;
  shouldCreateDish?: boolean;
  tags?: MealType[];
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

export type SuggestedDishIngredient = {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type AvailableDishInfo = {
  id: string;
  name: string;
  tags: MealType[];
  calories: number;
  protein: number;
};

export type MealTemplate = {
  id: string;
  name: string;
  breakfastDishIds: string[];
  lunchDishIds: string[];
  dinnerDishIds: string[];
  createdAt: string;
  tags?: string[];
};

export interface FilterConfig {
  sortBy: 'name-asc' | 'name-desc' | 'cal-asc' | 'cal-desc' | 'pro-asc' | 'pro-desc';
  maxCalories?: number;
  minProtein?: number;
  tags?: string[];
}

// --- Auth & Sync Types ---

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
};

export type SyncStatus = 'idle' | 'uploading' | 'downloading' | 'error';

export type SyncMetadata = {
  lastSyncAt: string | null;
  syncStatus: SyncStatus;
  errorMessage: string | null;
};
