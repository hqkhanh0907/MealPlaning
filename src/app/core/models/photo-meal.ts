import { scaleNutrition, type NutritionTotals } from './nutrition';

export interface FoodImageAnalysisItem extends Readonly<NutritionTotals> {
  readonly name: string;
  readonly estimatedGrams: number;
  readonly confidence: 'high' | 'medium' | 'low';
  readonly warning: string | null;
}

export const MAX_PHOTO_GRAMS = 2000;

export interface PhotoMealPortion {
  readonly item: FoodImageAnalysisItem;
  readonly grams: number;
}

export function validPhotoGrams(grams: number): boolean {
  return Number.isFinite(grams) && grams > 0 && grams <= MAX_PHOTO_GRAMS;
}

export function portionNutrition({ item, grams }: PhotoMealPortion): NutritionTotals {
  return scaleNutrition(item, grams / item.estimatedGrams);
}
