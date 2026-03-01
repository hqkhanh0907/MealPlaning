/**
 * Data migration service — handles legacy format conversions.
 * Pure functions for testability.
 */

import { DayPlan, Dish, MealType, Ingredient, DishIngredient, SaveAnalyzedDishPayload } from '../types';
import { createEmptyDayPlan } from './planService';
import { generateId } from '../utils/helpers';

/** Remove an ingredient from all dishes (used when deleting an ingredient) */
export const removeIngredientFromDishes = (dishes: Dish[], ingredientId: string): Dish[] =>
  dishes.map(d => ({ ...d, ingredients: d.ingredients.filter(di => di.ingredientId !== ingredientId) }));

/** Migrate old day plan format to new (breakfastId → breakfastDishIds) */
export const migrateDayPlans = (plans: unknown[]): DayPlan[] => {
  return plans.map((p: unknown) => {
    const plan = p as Record<string, unknown>;
    if (Array.isArray(plan.breakfastDishIds)) return plan as unknown as DayPlan;
    return createEmptyDayPlan(plan.date as string);
  });
};

/** Migrate old dish format — ensure tags is never empty */
export const migrateDishes = (dishes: unknown[]): Dish[] => {
  return (dishes as Record<string, unknown>[]).map(d => {
    const rawTags = (d as Record<string, unknown>).tags;
    const tags = Array.isArray(rawTags) && rawTags.length > 0
      ? (rawTags as MealType[])
      : ['lunch' as MealType];
    return { ...(d as unknown as Dish), tags };
  });
};

/** Process AI-analyzed dish result into ingredient + dish data */
export const processAnalyzedDish = (
  result: SaveAnalyzedDishPayload,
  existingIngredients: Ingredient[]
): { newIngredients: Ingredient[]; dishIngredients: DishIngredient[] } => {
  const newIngredients: Ingredient[] = [];
  const dishIngredients: DishIngredient[] = [];
  const allIngredients = [...existingIngredients];

  for (const aiIng of result.ingredients) {
    let existingIng = allIngredients.find(i => i.name.toLowerCase() === aiIng.name.toLowerCase());
    if (!existingIng) {
      const newIng: Ingredient = {
        id: generateId('ing'),
        name: aiIng.name,
        unit: aiIng.unit,
        caloriesPer100: aiIng.nutritionPerStandardUnit.calories,
        proteinPer100: aiIng.nutritionPerStandardUnit.protein,
        carbsPer100: aiIng.nutritionPerStandardUnit.carbs,
        fatPer100: aiIng.nutritionPerStandardUnit.fat,
        fiberPer100: aiIng.nutritionPerStandardUnit.fiber,
      };
      newIngredients.push(newIng);
      allIngredients.push(newIng);
      existingIng = newIng;
    }
    dishIngredients.push({ ingredientId: existingIng.id, amount: aiIng.amount });
  }
  return { newIngredients, dishIngredients };
};

