import { describe, it, expect, vi } from 'vitest';
import { removeIngredientFromDishes, migrateDayPlans, migrateDishes, migrateIngredients, processAnalyzedDish, validateImportData } from '../services/dataService';
import { Dish, Ingredient, SaveAnalyzedDishPayload } from '../types';

describe('removeIngredientFromDishes', () => {
  const dishes: Dish[] = [
    {
      id: 'd1', name: { vi: 'Dish 1', en: 'Dish 1' }, tags: ['lunch'],
      ingredients: [
        { ingredientId: 'ing-1', amount: 100 },
        { ingredientId: 'ing-2', amount: 200 },
      ],
    },
    {
      id: 'd2', name: { vi: 'Dish 2', en: 'Dish 2' }, tags: ['dinner'],
      ingredients: [{ ingredientId: 'ing-1', amount: 50 }],
    },
  ];

  it('should remove ingredient from all dishes', () => {
    const result = removeIngredientFromDishes(dishes, 'ing-1');
    expect(result[0].ingredients).toEqual([{ ingredientId: 'ing-2', amount: 200 }]);
    expect(result[1].ingredients).toEqual([]);
  });

  it('should not mutate original dishes', () => {
    const original = dishes[0].ingredients.length;
    removeIngredientFromDishes(dishes, 'ing-1');
    expect(dishes[0].ingredients.length).toBe(original);
  });

  it('should handle non-existent ingredient gracefully', () => {
    const result = removeIngredientFromDishes(dishes, 'non-existent');
    expect(result[0].ingredients.length).toBe(2);
    expect(result[1].ingredients.length).toBe(1);
  });
});

describe('migrateDayPlans', () => {
  it('should keep new format plans as-is', () => {
    const plans = [{ date: '2026-03-01', breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: ['d2'] }];
    const result = migrateDayPlans(plans);
    expect(result[0].breakfastDishIds).toEqual(['d1']);
  });

  it('should convert old format to empty plan', () => {
    const plans = [{ date: '2026-03-01', breakfastId: 'old-1', mealId: 'old-2' }];
    const result = migrateDayPlans(plans);
    expect(result[0].date).toBe('2026-03-01');
    expect(result[0].breakfastDishIds).toEqual([]);
    expect(result[0].lunchDishIds).toEqual([]);
    expect(result[0].dinnerDishIds).toEqual([]);
  });

  it('should handle empty array', () => {
    expect(migrateDayPlans([])).toEqual([]);
  });

  it('should fallback to today when entry has no date field', () => {
    const plans = [{ randomField: 'no-date-here' }];
    const result = migrateDayPlans(plans);
    const today = new Date().toISOString().split('T')[0];
    expect(result[0].date).toBe(today);
    expect(result[0].breakfastDishIds).toEqual([]);
    expect(result[0].lunchDishIds).toEqual([]);
    expect(result[0].dinnerDishIds).toEqual([]);
  });

  it('should handle primitive values in the array', () => {
    const plans = [null as unknown, 42 as unknown];
    const result = migrateDayPlans(plans);
    const today = new Date().toISOString().split('T')[0];
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe(today);
    expect(result[1].date).toBe(today);
  });
});

describe('migrateDishes', () => {
  it('should keep dishes with valid tags', () => {
    const dishes = [{ id: 'd1', name: 'Test', ingredients: [], tags: ['breakfast'] }];
    const result = migrateDishes(dishes);
    expect(result[0].tags).toEqual(['breakfast']);
  });

  it('should add default "lunch" tag when tags is empty', () => {
    const dishes = [{ id: 'd1', name: 'Test', ingredients: [], tags: [] }];
    const result = migrateDishes(dishes);
    expect(result[0].tags).toEqual(['lunch']);
  });

  it('should add default "lunch" tag when tags is missing', () => {
    const dishes = [{ id: 'd1', name: 'Test', ingredients: [] }];
    const result = migrateDishes(dishes);
    expect(result[0].tags).toEqual(['lunch']);
  });

  it('should handle empty array', () => {
    expect(migrateDishes([])).toEqual([]);
  });

  it('should filter out invalid dish data (missing id)', () => {
    const result = migrateDishes([{ name: 'No ID', ingredients: [] }]);
    expect(result).toEqual([]);
  });

  it('should filter out invalid dish data (missing name)', () => {
    const result = migrateDishes([{ id: 'd1', ingredients: [] }]);
    expect(result).toEqual([]);
  });

  it('should filter out invalid dish data (missing ingredients)', () => {
    const result = migrateDishes([{ id: 'd1', name: 'Test' }]);
    expect(result).toEqual([]);
  });

  it('should filter out primitive values', () => {
    expect(migrateDishes([null as unknown])).toEqual([]);
    expect(migrateDishes([42 as unknown])).toEqual([]);
    expect(migrateDishes(['string' as unknown])).toEqual([]);
  });

  it('should keep valid dishes and filter invalid ones in mixed input', () => {
    const validDish = { id: 'd1', name: 'Valid', ingredients: [], tags: ['lunch'] };
    const result = migrateDishes([validDish, null as unknown, { id: 'd2' }]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual({ vi: 'Valid' });
  });
});

describe('migrateIngredients', () => {
  it('should filter out invalid ingredient data and log warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = migrateIngredients([{ name: 'No ID or unit' }]);
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('migrateIngredients'),
      expect.stringContaining('Invalid ingredient data skipped'),
    );
    warnSpy.mockRestore();
  });

  it('should migrate valid ingredients with string names to LocalizedString', () => {
    const result = migrateIngredients([
      { id: 'i1', name: 'Chicken', unit: 'g', caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual({ vi: 'Chicken' });
    expect(result[0].unit).toEqual({ vi: 'g' });
  });

  it('should handle empty array', () => {
    expect(migrateIngredients([])).toEqual([]);
  });

  it('should keep valid ingredients and filter invalid ones in mixed input', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = migrateIngredients([
      { id: 'i1', name: 'Valid', unit: 'g' },
      null as unknown,
      42 as unknown,
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual({ vi: 'Valid' });
    warnSpy.mockRestore();
  });
});

describe('processAnalyzedDish', () => {
  const existingIngredients: Ingredient[] = [
    { id: 'ing-1', name: { vi: 'Ức gà', en: 'Ức gà' }, unit: { vi: 'g' }, caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0 },
  ];

  it('should match existing ingredient by name (case-insensitive)', () => {
    const payload: SaveAnalyzedDishPayload = {
      name: 'Test Dish',
      ingredients: [{
        name: 'ức gà', amount: 100, unit: 'g',
        nutritionPerStandardUnit: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
      }],
    };
    const result = processAnalyzedDish(payload, existingIngredients);
    expect(result.newIngredients).toHaveLength(0);
    expect(result.dishIngredients[0].ingredientId).toBe('ing-1');
    expect(result.dishIngredients[0].amount).toBe(100);
  });

  it('should create new ingredient when not found', () => {
    const payload: SaveAnalyzedDishPayload = {
      name: 'Test Dish',
      ingredients: [{
        name: 'Cà rốt', amount: 50, unit: 'g',
        nutritionPerStandardUnit: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8 },
      }],
    };
    const result = processAnalyzedDish(payload, existingIngredients);
    expect(result.newIngredients).toHaveLength(1);
    expect(result.newIngredients[0].name).toEqual({ vi: 'Cà rốt' });
    expect(result.newIngredients[0].caloriesPer100).toBe(41);
    expect(result.dishIngredients[0].ingredientId).toBe(result.newIngredients[0].id);
  });

  it('should handle mixed existing and new ingredients', () => {
    const payload: SaveAnalyzedDishPayload = {
      name: 'Mixed',
      ingredients: [
        { name: 'Ức gà', amount: 150, unit: 'g', nutritionPerStandardUnit: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 } },
        { name: 'Hành tím', amount: 20, unit: 'g', nutritionPerStandardUnit: { calories: 40, protein: 1.1, carbs: 9, fat: 0.1, fiber: 1.7 } },
      ],
    };
    const result = processAnalyzedDish(payload, existingIngredients);
    expect(result.newIngredients).toHaveLength(1);
    expect(result.dishIngredients).toHaveLength(2);
    expect(result.dishIngredients[0].ingredientId).toBe('ing-1'); // Existing
    expect(result.dishIngredients[1].ingredientId).toBe(result.newIngredients[0].id); // New
  });

  it('should not create duplicates when same new ingredient appears twice', () => {
    const payload: SaveAnalyzedDishPayload = {
      name: 'Double',
      ingredients: [
        { name: 'Tỏi', amount: 5, unit: 'g', nutritionPerStandardUnit: { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1 } },
        { name: 'tỏi', amount: 10, unit: 'g', nutritionPerStandardUnit: { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1 } },
      ],
    };
    const result = processAnalyzedDish(payload, []);
    expect(result.newIngredients).toHaveLength(1); // Only created once
    expect(result.dishIngredients).toHaveLength(2); // Both reference same ingredient
    expect(result.dishIngredients[0].ingredientId).toBe(result.dishIngredients[1].ingredientId);
  });
});

describe('validateImportData', () => {
  const validIngredients = [{ id: 'i1', name: 'Chicken', unit: 'g' }];
  const validDishes = [{ id: 'd1', name: 'Salad', ingredients: [] }];
  const validDayPlans = [{ date: '2025-01-01' }];
  const validProfile = { weight: 70, targetCalories: 2000 };

  it('accepts all four valid keys', () => {
    const result = validateImportData({
      'mp-ingredients': validIngredients,
      'mp-dishes': validDishes,
      'mp-day-plans': validDayPlans,
      'mp-user-profile': validProfile,
    });
    expect(result.invalidKeys).toHaveLength(0);
    expect(Object.keys(result.validEntries)).toHaveLength(4);
  });

  it('marks mp-ingredients invalid when entries lack required fields', () => {
    const result = validateImportData({
      'mp-ingredients': [{ name: 'Chicken' }], // missing id, unit
    });
    expect(result.invalidKeys).toContain('mp-ingredients');
    expect(result.validEntries['mp-ingredients']).toBeUndefined();
  });

  it('marks mp-dishes invalid when entries lack required fields', () => {
    const result = validateImportData({
      'mp-dishes': [{ id: 'd1', name: 'Test' }], // missing ingredients
    });
    expect(result.invalidKeys).toContain('mp-dishes');
  });

  it('marks mp-day-plans invalid when entries lack date field', () => {
    const result = validateImportData({
      'mp-day-plans': [{ meals: [] }], // missing date
    });
    expect(result.invalidKeys).toContain('mp-day-plans');
  });

  it('marks mp-user-profile invalid when missing required fields', () => {
    const result = validateImportData({
      'mp-user-profile': { weight: 70 }, // missing targetCalories
    });
    expect(result.invalidKeys).toContain('mp-user-profile');
  });

  it('ignores unknown keys not in the validator map', () => {
    const result = validateImportData({
      'unknown-key': [{ id: 'x' }],
    });
    expect(result.invalidKeys).toHaveLength(0);
    expect(result.validEntries['unknown-key']).toBeUndefined();
  });

  it('handles empty input object', () => {
    const result = validateImportData({});
    expect(result.invalidKeys).toHaveLength(0);
    expect(Object.keys(result.validEntries)).toHaveLength(0);
  });

  it('accepts valid mp-ingredients and rejects invalid mp-dishes in same call', () => {
    const result = validateImportData({
      'mp-ingredients': validIngredients,
      'mp-dishes': [{ id: 'd1' }], // missing name and ingredients
    });
    expect(result.validEntries['mp-ingredients']).toBeDefined();
    expect(result.invalidKeys).toContain('mp-dishes');
  });
});
