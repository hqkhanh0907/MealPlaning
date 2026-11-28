import { DecimalPipe } from '@angular/common';
import { portionNutrition, type PhotoMealReviewPortion } from '../../core/models/photo-meal';
import { leptosPhotoPortion } from './leptos-photo-portion';

describe('Leptos photo review', () => {
  const portion: PhotoMealReviewPortion = {
    grams: 75,
    included: true,
    item: {
      name: 'Bún bò Huế',
      estimatedGrams: 50,
      calories: 125.5,
      protein: 12.35,
      carbs: 18.1,
      fat: 3.3,
      fiber: 1.2,
      warning: null,
      confidence: 'low',
    },
  };
  it('shows the same quantity, labels and rounding as the Angular review', () => {
    const n = portionNutrition(portion);
    const pipe = new DecimalPipe('en-US');
    const expected =
      pipe.transform(n.calories, '1.0-0') +
      ' kcal · Protein ' +
      pipe.transform(n.protein, '1.0-1') +
      ' g · Carbs ' +
      pipe.transform(n.carbs, '1.0-1') +
      ' g · Fat ' +
      pipe.transform(n.fat, '1.0-1') +
      ' g';
    expect(leptosPhotoPortion(portion, 'en-US')).toEqual({
      name: 'Bún bò Huế',
      grams: 75,
      included: true,
      warning: null,
      confidence: 'low',
      nutritionLabel: expected,
    });
  });
  it('keeps an empty grams field distinct from zero across the JSON boundary', () => {
    const missing = leptosPhotoPortion({ ...portion, grams: Number.NaN }, 'en-US');
    const zero = leptosPhotoPortion({ ...portion, grams: 0 }, 'en-US');
    expect(missing.grams).toBeNull();
    expect(zero.grams).toBe(0);
    expect(missing.nutritionLabel).toBe('');
    expect(zero.nutritionLabel).toBe('');
  });
});
