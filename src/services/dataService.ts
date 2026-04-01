// Handles legacy format conversions. Pure functions for testability.

import { DayPlan, Dish, MealType, Ingredient, DishIngredient, SaveAnalyzedDishPayload } from '../types';
import { createEmptyDayPlan } from './planService';
import { generateUUID } from '../utils/helpers';
import { logger } from '../utils/logger';
import { toLocalized, getLocalizedField } from '../utils/localize';

// --- Type guards for runtime validation during migration ---

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const isDayPlan = (v: unknown): v is DayPlan =>
  isRecord(v) &&
  typeof v.date === 'string' &&
  Array.isArray(v.breakfastDishIds) &&
  Array.isArray(v.lunchDishIds) &&
  Array.isArray(v.dinnerDishIds);

// Accepts both old string names and new LocalizedString for backward compat
const isDish = (v: unknown): v is Dish =>
  isRecord(v) &&
  typeof v.id === 'string' &&
  (typeof v.name === 'string' || isRecord(v.name)) &&
  Array.isArray(v.ingredients);

// Accepts both old string names/units and new LocalizedString for backward compat
const isIngredient = (v: unknown): v is Ingredient =>
  isRecord(v) &&
  typeof v.id === 'string' &&
  (typeof v.name === 'string' || isRecord(v.name)) &&
  (typeof v.unit === 'string' || isRecord(v.unit));

export const removeIngredientFromDishes = (dishes: Dish[], ingredientId: string): Dish[] =>
  dishes.map(d => ({ ...d, ingredients: d.ingredients.filter(di => di.ingredientId !== ingredientId) }));

// Legacy data used breakfastId (singular) → need migration to breakfastDishIds (array)
export const migrateDayPlans = (plans: unknown[]): DayPlan[] => {
  return plans.map((p: unknown) => {
    if (isDayPlan(p)) return p;
    if (isRecord(p) && typeof p.date === 'string') return createEmptyDayPlan(p.date);
    return createEmptyDayPlan(new Date().toISOString().split('T')[0]);
  });
};

// Legacy dishes may lack tags — default to 'lunch' for backward compatibility.
// Legacy dishes may also have string names — migrate to LocalizedString.
// Invalid entries are filtered out with a warning instead of throwing (fail-safe).
export const migrateDishes = (dishes: unknown[]): Dish[] => {
  return dishes
    .filter(d => {
      if (!isDish(d)) {
        logger.warn(
          { component: 'dataService', action: 'migrateDishes' },
          `Invalid dish data skipped during migration: ${JSON.stringify(d)}`
        );
        return false;
      }
      return true;
    })
    .map(d => {
      const dish = d as Dish;
      const rawTags = dish.tags;
      const tags: MealType[] = Array.isArray(rawTags) && rawTags.length > 0
        ? rawTags
        : ['lunch'];
      return { ...dish, name: toLocalized(dish.name), tags };
    });
};

// Migrates legacy ingredients that store name/unit as plain strings.
export const migrateIngredients = (ingredients: unknown[]): Ingredient[] => {
  return ingredients
    .filter(i => {
      if (!isIngredient(i)) {
        logger.warn(
          { component: 'dataService', action: 'migrateIngredients' },
          `Invalid ingredient data skipped during migration: ${JSON.stringify(i)}`
        );
        return false;
      }
      return true;
    })
    .map(i => {
      const ing = i as Ingredient;
      return { ...ing, name: toLocalized(ing.name), unit: toLocalized(ing.unit) };
    });
};

export const processAnalyzedDish = (
  result: SaveAnalyzedDishPayload,
  existingIngredients: Ingredient[]
): { newIngredients: Ingredient[]; dishIngredients: DishIngredient[] } => {
  const newIngredients: Ingredient[] = [];
  const dishIngredients: DishIngredient[] = [];
  const allIngredients = [...existingIngredients];

  for (const aiIng of result.ingredients) {
    const aiNameLower = aiIng.name.toLowerCase();
    // Match against both vi and en variants (case-insensitive)
    let existingIng = allIngredients.find(i => {
      const viName = getLocalizedField(i.name, 'vi').toLowerCase();
      const enName = getLocalizedField(i.name, 'en').toLowerCase();
      return viName === aiNameLower || enName === aiNameLower;
    });
    if (!existingIng) {
      const newIng: Ingredient = {
        id: generateUUID(),
        name: toLocalized(aiIng.name),
        unit: toLocalized(aiIng.unit),
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

// --- Import data validation ---

export interface ImportValidationResult {
  validEntries: Record<string, unknown>;
  invalidKeys: string[];
}

const IMPORT_VALIDATORS: Record<string, (v: unknown) => boolean> = {
  'mp-ingredients': (v) => Array.isArray(v) && v.every((i: unknown) =>
    isRecord(i) && 'id' in i && 'name' in i && 'unit' in i
  ),
  'mp-dishes': (v) => Array.isArray(v) && v.every((d: unknown) =>
    isRecord(d) && 'id' in d && 'name' in d && 'ingredients' in d
  ),
  'mp-day-plans': (v) => Array.isArray(v) && v.every((p: unknown) =>
    isRecord(p) && 'date' in p
  ),
  'mp-user-profile': (v) =>
    isRecord(v) && 'weight' in v && 'targetCalories' in v,
};

/** Pure validation — separates valid/invalid keys from raw import data. */
export const validateImportData = (data: Record<string, unknown>): ImportValidationResult => {
  const validEntries: Record<string, unknown> = {};
  const invalidKeys: string[] = [];

  for (const [key, validate] of Object.entries(IMPORT_VALIDATORS)) {
    if (key in data) {
      if (validate(data[key])) {
        validEntries[key] = data[key];
      } else {
        invalidKeys.push(key);
      }
    }
  }

  return { validEntries, invalidKeys };
};
