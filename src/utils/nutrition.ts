import { Ingredient, Dish, NutritionInfo } from '../types';

const ZERO_NUTRITION: NutritionInfo = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

// --- Unit Normalization (shared across app) ---

const UNIT_ALIASES: Record<string, string> = {
  g: 'g', gram: 'g', grams: 'g', gam: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  mg: 'mg', milligram: 'mg', milligrams: 'mg',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml',
  l: 'l', liter: 'l', liters: 'l',
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
  
  if (isWeightOrVolume(ingredient.unit)) {
    factor = (amount * getConversionFactor(ingredient.unit)) / 100;
  } else {
    factor = amount;
  }
  
  return {
    calories: ingredient.caloriesPer100 * factor,
    protein: ingredient.proteinPer100 * factor,
    carbs: ingredient.carbsPer100 * factor,
    fat: ingredient.fatPer100 * factor,
    fiber: ingredient.fiberPer100 * factor,
  };
};

export const calculateDishNutrition = (dish: Dish, allIngredients: Ingredient[]): NutritionInfo => {
  return dish.ingredients.reduce<NutritionInfo>(
    (acc, di) => {
      const ingredient = allIngredients.find((i) => i.id === di.ingredientId);
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
    { ...ZERO_NUTRITION }
  );
};

export const calculateDishesNutrition = (
  dishIds: string[],
  allDishes: Dish[],
  allIngredients: Ingredient[]
): NutritionInfo => {
  return dishIds.reduce<NutritionInfo>(
    (acc, dishId) => {
      const dish = allDishes.find((d) => d.id === dishId);
      if (!dish) return acc;
      const nutrition = calculateDishNutrition(dish, allIngredients);
      return {
        calories: acc.calories + nutrition.calories,
        protein: acc.protein + nutrition.protein,
        carbs: acc.carbs + nutrition.carbs,
        fat: acc.fat + nutrition.fat,
        fiber: acc.fiber + nutrition.fiber,
      };
    },
    { ...ZERO_NUTRITION }
  );
};
