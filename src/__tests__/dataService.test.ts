import { describe, it, expect } from 'vitest';
import { removeIngredientFromDishes, migrateDayPlans, migrateDishes, processAnalyzedDish } from '../services/dataService';
import { Dish, Ingredient, SaveAnalyzedDishPayload } from '../types';

describe('removeIngredientFromDishes', () => {
  const dishes: Dish[] = [
    {
      id: 'd1', name: 'Dish 1', tags: ['lunch'],
      ingredients: [
        { ingredientId: 'ing-1', amount: 100 },
        { ingredientId: 'ing-2', amount: 200 },
      ],
    },
    {
      id: 'd2', name: 'Dish 2', tags: ['dinner'],
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
});

describe('processAnalyzedDish', () => {
  const existingIngredients: Ingredient[] = [
    { id: 'ing-1', name: 'Ức gà', unit: 'g', caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0 },
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
    expect(result.newIngredients[0].name).toBe('Cà rốt');
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

