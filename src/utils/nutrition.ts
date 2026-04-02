import { AnalyzedIngredient, Dish, Ingredient, NutritionInfo } from '../types';

const ZERO_NUTRITION: NutritionInfo = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

// --- Unit Normalization (shared across app) ---

const UNIT_ALIASES: Record<string, string> = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  gam: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  mg: 'mg',
  milligram: 'mg',
  milligrams: 'mg',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
};

export const normalizeUnit = (rawUnit: string): string => {
  const lower = rawUnit.toLowerCase().trim();
  return UNIT_ALIASES[lower] ?? lower;
};

const isWeightOrVolume = (unit: string): boolean => {
  const normalized = normalizeUnit(unit);
  return ['g', 'kg', 'mg', 'ml', 'l'].includes(normalized);
};

const getConversionFactor = (unit: string): number => {
  const normalized = normalizeUnit(unit);
  if (normalized === 'kg' || normalized === 'l') return 1000;
  if (normalized === 'mg') return 0.001;
  return 1;
};

export const calculateIngredientNutrition = (ingredient: Ingredient, amount: number): NutritionInfo => {
  let factor: number;
  const rawUnit = typeof ingredient.unit === 'string' ? ingredient.unit : ingredient.unit.vi;
  if (isWeightOrVolume(rawUnit)) {
    factor = (amount * getConversionFactor(rawUnit)) / 100;
  } else {
    factor = amount;
  }

  return {
    calories: (ingredient.caloriesPer100 || 0) * factor,
    protein: (ingredient.proteinPer100 || 0) * factor,
    carbs: (ingredient.carbsPer100 || 0) * factor,
    fat: (ingredient.fatPer100 || 0) * factor,
    fiber: (ingredient.fiberPer100 || 0) * factor,
  };
};

export const calculateDishNutrition = (dish: Dish, allIngredients: Ingredient[]): NutritionInfo => {
  return dish.ingredients.reduce<NutritionInfo>(
    (acc, di) => {
      const ingredient = allIngredients.find(i => i.id === di.ingredientId);
      if (!ingredient) return acc;
      const nutrition = calculateIngredientNutrition(ingredient, di.amount);
      return {
        calories: acc.calories + nutrition.calories,
        protein: acc.protein + nutrition.protein,
        carbs: acc.carbs + nutrition.carbs,
        fat: acc.fat + nutrition.fat,
        fiber: acc.fiber + nutrition.fiber,
      };
    },
    { ...ZERO_NUTRITION },
  );
};

export const calculateDishesNutrition = (
  dishIds: string[],
  allDishes: Dish[],
  allIngredients: Ingredient[],
  servings?: Record<string, number>,
): NutritionInfo => {
  return dishIds.reduce<NutritionInfo>(
    (acc, dishId) => {
      const dish = allDishes.find(d => d.id === dishId);
      if (!dish) return acc;
      const nutrition = calculateDishNutrition(dish, allIngredients);
      const multiplier = servings?.[dishId] ?? 1;
      return {
        calories: acc.calories + nutrition.calories * multiplier,
        protein: acc.protein + nutrition.protein * multiplier,
        carbs: acc.carbs + nutrition.carbs * multiplier,
        fat: acc.fat + nutrition.fat * multiplier,
        fiber: acc.fiber + nutrition.fiber * multiplier,
      };
    },
    { ...ZERO_NUTRITION },
  );
};

// Bridge between AI analysis output and our Ingredient model for nutrition calculations
export const toTempIngredient = (ing: AnalyzedIngredient): Ingredient => ({
  id: '',
  name: { vi: ing.name, en: ing.name },
  unit: { vi: normalizeUnit(ing.unit), en: normalizeUnit(ing.unit) },
  caloriesPer100: ing.nutritionPerStandardUnit.calories,
  proteinPer100: ing.nutritionPerStandardUnit.protein,
  carbsPer100: ing.nutritionPerStandardUnit.carbs,
  fatPer100: ing.nutritionPerStandardUnit.fat,
  fiberPer100: ing.nutritionPerStandardUnit.fiber,
});
