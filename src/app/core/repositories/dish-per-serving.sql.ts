import type { NutritionTotals } from '../models/nutrition';

export const DISH_PER_SERVING = `(
  SELECT id, name, description, type, source, servings, image_url, meal_tag, is_favorite,
         created_at, updated_at,
         total_calories / recipe_yield AS total_calories,
         total_protein / recipe_yield AS total_protein,
         total_carbs / recipe_yield AS total_carbs,
         total_fat / recipe_yield AS total_fat,
         total_fiber / recipe_yield AS total_fiber
  FROM (
    SELECT dwt.*, CASE WHEN servings > 0 THEN servings ELSE 1.0 END AS recipe_yield
    FROM dish_with_totals dwt
  )
)`;

export function effectivePlannedNutrient(nutrient: keyof NutritionTotals): string {
  const snapshot = nutrient === 'fiber' ? 'COALESCE(pd.fiber, 0)' : `pd.${nutrient}`;
  return `CASE WHEN pd.is_completed = 1 THEN ${snapshot} ELSE dwt.total_${nutrient} * pd.servings END`;
}
