export const NUTRIENTS = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const;
export type NutritionTotals = Record<(typeof NUTRIENTS)[number], number>;

export const ZERO_TOTALS: Readonly<NutritionTotals> = Object.freeze({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
});

export function scaleNutrition(amount: NutritionTotals, factor: number): NutritionTotals {
  return {
    calories: amount.calories * factor,
    protein: amount.protein * factor,
    carbs: amount.carbs * factor,
    fat: amount.fat * factor,
    fiber: amount.fiber * factor,
  };
}

export function ingredientPortion(per100g: NutritionTotals, grams: number): NutritionTotals {
  return scaleNutrition(per100g, grams / 100);
}

export function percentOfNutritionTarget(value: number, target: number): number | null {
  if (!Number.isFinite(target) || target <= 0) return null;
  return Math.max(0, (value / target) * 100);
}
