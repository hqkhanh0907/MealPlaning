import { scaleNutrition, type NutritionTotals } from './nutrition';

export interface FoodImageAnalysisItem extends Readonly<NutritionTotals> {
  readonly name: string;
  readonly estimatedGrams: number;
  readonly confidence: 'high' | 'medium' | 'low';
  readonly warning: string | null;
}

export const MAX_PHOTO_GRAMS = 2000;
export const MAX_PHOTO_NAME_LENGTH = 80;

export interface PhotoMealPortion {
  readonly item: FoodImageAnalysisItem;
  readonly grams: number;
}

export interface PhotoMealReviewPortion extends PhotoMealPortion {
  readonly included: boolean;
}

export function validPhotoName(name: string): boolean {
  const length = name.trim().length;
  return length > 0 && length <= MAX_PHOTO_NAME_LENGTH;
}

export function validPhotoGrams(grams: number): boolean {
  return Number.isFinite(grams) && grams > 0 && grams <= MAX_PHOTO_GRAMS;
}

export function portionNutrition({ item, grams }: PhotoMealPortion): NutritionTotals {
  return scaleNutrition(item, grams / item.estimatedGrams);
}
