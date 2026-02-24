import { Ingredient, Dish, Meal, DishIngredient } from '../types';

const isWeightOrVolume = (unit: string): boolean => {
  const lower = unit.toLowerCase().trim();
  return ['g', 'kg', 'mg', 'ml', 'l'].includes(lower);
};

const getConversionFactor = (unit: string): number => {
  const lower = unit.toLowerCase().trim();
  if (lower === 'kg' || lower === 'l') return 1000;
  if (lower === 'mg') return 0.001;
  return 1;
};

export const calculateIngredientNutrition = (ingredient: Ingredient, amount: number) => {
  // Normalize amount to the base unit factor
  let factor: number;
  
  if (isWeightOrVolume(ingredient.unit)) {
    // For weight/volume, we store nutrition per 100g/ml
    factor = (amount * getConversionFactor(ingredient.unit)) / 100;
  } else {
    // For pieces (quả, cái, chai...), we store nutrition per 1 unit
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

export const calculateDishNutrition = (dish: Dish, allIngredients: Ingredient[]) => {
  return dish.ingredients.reduce(
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
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
};

export const calculateMealNutrition = (meal: Meal, allDishes: Dish[], allIngredients: Ingredient[]) => {
  return meal.dishIds.reduce(
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
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
};
