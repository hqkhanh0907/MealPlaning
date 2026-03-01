import { describe, it, expect } from 'vitest';
import { normalizeUnit, calculateIngredientNutrition, calculateDishNutrition, calculateDishesNutrition } from '../utils/nutrition';
import { Ingredient, Dish } from '../types';

// --- Test fixtures ---

const chicken: Ingredient = {
  id: 'ing-1', name: 'Ức gà', unit: 'g',
  caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0,
};

const rice: Ingredient = {
  id: 'ing-2', name: 'Cơm trắng', unit: 'g',
  caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4,
};

const egg: Ingredient = {
  id: 'ing-3', name: 'Trứng gà', unit: 'quả',
  caloriesPer100: 155, proteinPer100: 13, carbsPer100: 1.1, fatPer100: 11, fiberPer100: 0,
};

const oil: Ingredient = {
  id: 'ing-4', name: 'Dầu ăn', unit: 'ml',
  caloriesPer100: 884, proteinPer100: 0, carbsPer100: 0, fatPer100: 100, fiberPer100: 0,
};

const butter: Ingredient = {
  id: 'ing-5', name: 'Bơ', unit: 'kg',
  caloriesPer100: 717, proteinPer100: 0.85, carbsPer100: 0.06, fatPer100: 81, fiberPer100: 0,
};

const allIngredients = [chicken, rice, egg, oil, butter];

// --- Tests ---

describe('normalizeUnit', () => {
  it('should normalize common weight units', () => {
    expect(normalizeUnit('g')).toBe('g');
    expect(normalizeUnit('gram')).toBe('g');
    expect(normalizeUnit('grams')).toBe('g');
    expect(normalizeUnit('gam')).toBe('g');
    expect(normalizeUnit('G')).toBe('g');
    expect(normalizeUnit('Gram')).toBe('g');
  });

  it('should normalize kg', () => {
    expect(normalizeUnit('kg')).toBe('kg');
    expect(normalizeUnit('kilogram')).toBe('kg');
    expect(normalizeUnit('kilograms')).toBe('kg');
  });

  it('should normalize volume units', () => {
    expect(normalizeUnit('ml')).toBe('ml');
    expect(normalizeUnit('milliliter')).toBe('ml');
    expect(normalizeUnit('l')).toBe('l');
    expect(normalizeUnit('liter')).toBe('l');
  });

  it('should return unknown units as-is (lowercased)', () => {
    expect(normalizeUnit('quả')).toBe('quả');
    expect(normalizeUnit('miếng')).toBe('miếng');
    expect(normalizeUnit('muỗng')).toBe('muỗng');
  });

  it('should trim whitespace', () => {
    expect(normalizeUnit('  g  ')).toBe('g');
  });
});

describe('calculateIngredientNutrition', () => {
  it('should calculate correctly for gram-based ingredient (100g)', () => {
    const result = calculateIngredientNutrition(chicken, 100);
    expect(result.calories).toBe(165);
    expect(result.protein).toBe(31);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(3.6);
    expect(result.fiber).toBe(0);
  });

  it('should scale correctly for gram-based ingredient (200g)', () => {
    const result = calculateIngredientNutrition(chicken, 200);
    expect(result.calories).toBe(330);
    expect(result.protein).toBe(62);
  });

  it('should scale correctly for gram-based ingredient (50g)', () => {
    const result = calculateIngredientNutrition(chicken, 50);
    expect(result.calories).toBe(82.5);
    expect(result.protein).toBe(15.5);
  });

  it('should handle zero amount', () => {
    const result = calculateIngredientNutrition(chicken, 0);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
  });

  it('should handle ml unit (same factor as g)', () => {
    const result = calculateIngredientNutrition(oil, 10);
    expect(result.calories).toBeCloseTo(88.4);
    expect(result.fat).toBeCloseTo(10);
  });

  it('should handle kg unit (1kg = 1000g, factor = 10x per 100g)', () => {
    const result = calculateIngredientNutrition(butter, 0.1); // 100g
    expect(result.calories).toBeCloseTo(717);
    expect(result.fat).toBeCloseTo(81);
  });

  it('should handle countable unit (quả) — amount used directly as factor', () => {
    // For countable units, nutrition values are per 1 unit
    const result = calculateIngredientNutrition(egg, 2);
    expect(result.calories).toBe(310);
    expect(result.protein).toBe(26);
  });

  it('should handle countable unit with 1 item', () => {
    const result = calculateIngredientNutrition(egg, 1);
    expect(result.calories).toBe(155);
    expect(result.protein).toBe(13);
  });
});

describe('calculateDishNutrition', () => {
  it('should sum nutrition of all ingredients in a dish', () => {
    const dish: Dish = {
      id: 'dish-1', name: 'Cơm gà',
      ingredients: [
        { ingredientId: 'ing-1', amount: 150 }, // 150g chicken
        { ingredientId: 'ing-2', amount: 200 }, // 200g rice
      ],
      tags: ['lunch'],
    };
    const result = calculateDishNutrition(dish, allIngredients);
    // chicken: 150/100 * 165 = 247.5 cal, rice: 200/100 * 130 = 260 cal
    expect(result.calories).toBeCloseTo(507.5);
    // chicken: 150/100 * 31 = 46.5 pro, rice: 200/100 * 2.7 = 5.4 pro
    expect(result.protein).toBeCloseTo(51.9);
  });

  it('should return zero for empty ingredients', () => {
    const dish: Dish = { id: 'dish-2', name: 'Empty', ingredients: [], tags: ['lunch'] };
    const result = calculateDishNutrition(dish, allIngredients);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
    expect(result.fiber).toBe(0);
  });

  it('should skip unknown ingredients', () => {
    const dish: Dish = {
      id: 'dish-3', name: 'Unknown',
      ingredients: [{ ingredientId: 'unknown-id', amount: 100 }],
      tags: ['lunch'],
    };
    const result = calculateDishNutrition(dish, allIngredients);
    expect(result.calories).toBe(0);
  });

  it('should handle mix of known and unknown ingredients', () => {
    const dish: Dish = {
      id: 'dish-4', name: 'Mixed',
      ingredients: [
        { ingredientId: 'ing-1', amount: 100 },
        { ingredientId: 'unknown-id', amount: 100 },
      ],
      tags: ['lunch'],
    };
    const result = calculateDishNutrition(dish, allIngredients);
    expect(result.calories).toBe(165); // Only chicken counted
  });
});

describe('calculateDishesNutrition', () => {
  const dishes: Dish[] = [
    {
      id: 'dish-1', name: 'Cơm gà',
      ingredients: [
        { ingredientId: 'ing-1', amount: 100 }, // 165 cal
        { ingredientId: 'ing-2', amount: 100 }, // 130 cal
      ],
      tags: ['lunch'],
    },
    {
      id: 'dish-2', name: 'Trứng luộc',
      ingredients: [{ ingredientId: 'ing-3', amount: 2 }], // 310 cal
      tags: ['breakfast'],
    },
  ];

  it('should sum nutrition across multiple dishes', () => {
    const result = calculateDishesNutrition(['dish-1', 'dish-2'], dishes, allIngredients);
    expect(result.calories).toBeCloseTo(605); // 165 + 130 + 310
  });

  it('should handle empty dish IDs', () => {
    const result = calculateDishesNutrition([], dishes, allIngredients);
    expect(result.calories).toBe(0);
  });

  it('should skip unknown dish IDs', () => {
    const result = calculateDishesNutrition(['unknown-dish'], dishes, allIngredients);
    expect(result.calories).toBe(0);
  });

  it('should handle duplicate dish IDs (counts twice)', () => {
    const result = calculateDishesNutrition(['dish-2', 'dish-2'], dishes, allIngredients);
    expect(result.calories).toBe(620); // 310 * 2
  });
});

