import { formatNumber } from '@angular/common';
import {
  portionNutrition,
  validPhotoGrams,
  type PhotoMealReviewPortion,
} from '../../core/models/photo-meal';

export function leptosPhotoPortion(portion: PhotoMealReviewPortion, locale: string) {
  const { item, grams, included } = portion;
  let nutritionLabel = '';
  if (included && validPhotoGrams(grams)) {
    const totals = portionNutrition(portion);
    const macro = (value: number) => formatNumber(value, locale, '1.0-1');
    nutritionLabel = `${formatNumber(totals.calories, locale, '1.0-0')} kcal · Protein ${macro(totals.protein)} g · Carbs ${macro(totals.carbs)} g · Fat ${macro(totals.fat)} g`;
  }
  return {
    name: item.name,
    grams: Number.isFinite(grams) ? grams : null,
    included,
    warning: item.warning,
    confidence: item.confidence,
    nutritionLabel,
  };
}
