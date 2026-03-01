/**
 * Integration tests: end-to-end data flow through services.
 * Tests: create ingredient → create dish → plan meal → verify grocery list aggregation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Ingredient, Dish, DayPlan, MealType } from '../types';
import { calculateDishNutrition, calculateDishesNutrition } from '../utils/nutrition';
import { generateId } from '../utils/helpers';
import { updateDayPlanSlot, clearPlansByScope, applySuggestionToDayPlans } from '../services/planService';
import { removeIngredientFromDishes, migrateDishes, migrateDayPlans, processAnalyzedDish } from '../services/dataService';

// --- Shared state for each test ---

let ingredients: Ingredient[];
let dishes: Dish[];
let dayPlans: DayPlan[];

beforeEach(() => {
  ingredients = [
    { id: 'ing-chicken', name: 'Ức gà', unit: 'g', caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0 },
    { id: 'ing-rice', name: 'Cơm trắng', unit: 'g', caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4 },
    { id: 'ing-egg', name: 'Trứng gà', unit: 'quả', caloriesPer100: 155, proteinPer100: 13, carbsPer100: 1.1, fatPer100: 11, fiberPer100: 0 },
    { id: 'ing-broccoli', name: 'Bông cải xanh', unit: 'g', caloriesPer100: 34, proteinPer100: 2.8, carbsPer100: 7, fatPer100: 0.4, fiberPer100: 2.6 },
  ];

  dishes = [
    {
      id: 'dish-com-ga', name: 'Cơm gà',
      ingredients: [
        { ingredientId: 'ing-chicken', amount: 150 },
        { ingredientId: 'ing-rice', amount: 200 },
      ],
      tags: ['lunch' as MealType, 'dinner' as MealType],
    },
    {
      id: 'dish-trung-luoc', name: 'Trứng luộc',
      ingredients: [{ ingredientId: 'ing-egg', amount: 2 }],
      tags: ['breakfast' as MealType],
    },
    {
      id: 'dish-salad', name: 'Salad gà',
      ingredients: [
        { ingredientId: 'ing-chicken', amount: 100 },
        { ingredientId: 'ing-broccoli', amount: 150 },
      ],
      tags: ['lunch' as MealType],
    },
  ];

  dayPlans = [];
});

// --- Integration tests ---

describe('Flow: Create Ingredient → Create Dish → Plan Meal → Calculate Nutrition', () => {
  it('should calculate correct nutrition when dish is added to plan', () => {
    // Step 1: Add a plan with "Cơm gà" for lunch
    dayPlans = updateDayPlanSlot(dayPlans, '2026-03-01', 'lunch', ['dish-com-ga']);

    // Step 2: Verify plan was created
    expect(dayPlans).toHaveLength(1);
    expect(dayPlans[0].lunchDishIds).toEqual(['dish-com-ga']);

    // Step 3: Calculate nutrition
    const lunchNutrition = calculateDishesNutrition(['dish-com-ga'], dishes, ingredients);
    // chicken 150g: 247.5 cal, rice 200g: 260 cal = 507.5 cal total
    expect(lunchNutrition.calories).toBeCloseTo(507.5);
    // chicken 150g: 46.5g pro, rice 200g: 5.4g pro = 51.9g total
    expect(lunchNutrition.protein).toBeCloseTo(51.9);
  });

  it('should calculate day-total nutrition across all meals', () => {
    // Plan full day
    dayPlans = updateDayPlanSlot(dayPlans, '2026-03-01', 'breakfast', ['dish-trung-luoc']);
    dayPlans = updateDayPlanSlot(dayPlans, '2026-03-01', 'lunch', ['dish-com-ga']);
    dayPlans = updateDayPlanSlot(dayPlans, '2026-03-01', 'dinner', ['dish-salad']);

    const plan = dayPlans[0];
    const breakfast = calculateDishesNutrition(plan.breakfastDishIds, dishes, ingredients);
    const lunch = calculateDishesNutrition(plan.lunchDishIds, dishes, ingredients);
    const dinner = calculateDishesNutrition(plan.dinnerDishIds, dishes, ingredients);

    const totalCalories = breakfast.calories + lunch.calories + dinner.calories;
    const totalProtein = breakfast.protein + lunch.protein + dinner.protein;

    // Breakfast: 2 eggs = 310 cal, 26g pro
    expect(breakfast.calories).toBe(310);
    // Lunch: 507.5 cal, 51.9g pro
    expect(lunch.calories).toBeCloseTo(507.5);
    // Dinner: chicken 100g + broccoli 150g = 165 + 51 = 216 cal
    expect(dinner.calories).toBeCloseTo(216);
    // Total: 310 + 507.5 + 216 = 1033.5 cal
    expect(totalCalories).toBeCloseTo(1033.5);
    expect(totalProtein).toBeGreaterThan(80); // High protein day
  });
});

describe('Flow: Delete Ingredient → Cascade to Dishes', () => {
  it('should remove ingredient from all dishes when deleted', () => {
    // Delete chicken
    const updatedDishes = removeIngredientFromDishes(dishes, 'ing-chicken');

    // "Cơm gà" should only have rice left
    const comGa = updatedDishes.find(d => d.id === 'dish-com-ga')!;
    expect(comGa.ingredients).toHaveLength(1);
    expect(comGa.ingredients[0].ingredientId).toBe('ing-rice');

    // "Salad gà" should only have broccoli left
    const salad = updatedDishes.find(d => d.id === 'dish-salad')!;
    expect(salad.ingredients).toHaveLength(1);
    expect(salad.ingredients[0].ingredientId).toBe('ing-broccoli');

    // "Trứng luộc" should be unchanged
    const trung = updatedDishes.find(d => d.id === 'dish-trung-luoc')!;
    expect(trung.ingredients).toHaveLength(1);
  });
});

describe('Flow: AI Suggestion → Preview → Apply', () => {
  it('should apply AI suggestion while preserving existing meals', () => {
    // Start with breakfast already planned
    dayPlans = updateDayPlanSlot(dayPlans, '2026-03-01', 'breakfast', ['dish-trung-luoc']);

    // AI suggests lunch and dinner but not breakfast
    const suggestion = {
      breakfastDishIds: [], // Empty → preserve existing
      lunchDishIds: ['dish-com-ga'],
      dinnerDishIds: ['dish-salad'],
      reasoning: 'Balanced meal plan',
    };

    dayPlans = applySuggestionToDayPlans(dayPlans, '2026-03-01', suggestion);

    const plan = dayPlans[0];
    // Breakfast should be preserved (not overwritten by empty suggestion)
    expect(plan.breakfastDishIds).toEqual(['dish-trung-luoc']);
    // Lunch and dinner should be from AI
    expect(plan.lunchDishIds).toEqual(['dish-com-ga']);
    expect(plan.dinnerDishIds).toEqual(['dish-salad']);
  });

  it('should replace existing meals when AI suggestion is non-empty', () => {
    // Full day already planned
    dayPlans = updateDayPlanSlot(dayPlans, '2026-03-01', 'breakfast', ['dish-trung-luoc']);
    dayPlans = updateDayPlanSlot(dayPlans, '2026-03-01', 'lunch', ['dish-salad']);

    // AI replaces lunch
    const suggestion = {
      breakfastDishIds: [],
      lunchDishIds: ['dish-com-ga'], // Replace salad with com ga
      dinnerDishIds: ['dish-salad'],
      reasoning: 'Better balance',
    };

    dayPlans = applySuggestionToDayPlans(dayPlans, '2026-03-01', suggestion);
    expect(dayPlans[0].lunchDishIds).toEqual(['dish-com-ga']); // Replaced
  });
});

describe('Flow: Clear Plans by Scope', () => {
  it('should clear only selected day, preserving other days', () => {
    dayPlans = updateDayPlanSlot(dayPlans, '2026-03-01', 'lunch', ['dish-com-ga']);
    dayPlans = updateDayPlanSlot(dayPlans, '2026-03-02', 'lunch', ['dish-salad']);

    dayPlans = clearPlansByScope(dayPlans, '2026-03-01', 'day');
    expect(dayPlans).toHaveLength(1);
    expect(dayPlans[0].date).toBe('2026-03-02');
  });

  it('should clear entire week', () => {
    // Mon-Fri in same week (2026-03-02 is Monday)
    for (let d = 2; d <= 6; d++) {
      dayPlans = updateDayPlanSlot(dayPlans, `2026-03-0${d}`, 'lunch', ['dish-com-ga']);
    }
    // Add a plan in different week
    dayPlans = updateDayPlanSlot(dayPlans, '2026-03-10', 'lunch', ['dish-salad']);

    dayPlans = clearPlansByScope(dayPlans, '2026-03-04', 'week'); // Wed in same week
    expect(dayPlans).toHaveLength(1);
    expect(dayPlans[0].date).toBe('2026-03-10');
  });
});

describe('Flow: Data Migration', () => {
  it('should migrate dishes with empty tags to default "lunch"', () => {
    const oldDishes = [
      { id: 'd1', name: 'Test', ingredients: [], tags: [] },
      { id: 'd2', name: 'Test2', ingredients: [], tags: ['breakfast'] },
      { id: 'd3', name: 'Test3', ingredients: [] }, // no tags field
    ];
    const migrated = migrateDishes(oldDishes);
    expect(migrated[0].tags).toEqual(['lunch']);
    expect(migrated[1].tags).toEqual(['breakfast']);
    expect(migrated[2].tags).toEqual(['lunch']);
  });

  it('should migrate old day plan format', () => {
    const oldPlans = [
      { date: '2026-03-01', breakfastId: 'old-1', mealId: 'old-2' },
      { date: '2026-03-02', breakfastDishIds: ['new-1'], lunchDishIds: [], dinnerDishIds: ['new-2'] },
    ];
    const migrated = migrateDayPlans(oldPlans);
    expect(migrated[0].breakfastDishIds).toEqual([]); // Old format → empty
    expect(migrated[1].breakfastDishIds).toEqual(['new-1']); // New format preserved
  });
});

describe('Flow: AI Analyzed Dish → Save to Library', () => {
  it('should match existing ingredients and create new ones', () => {
    const payload = {
      name: 'Gà chiên',
      ingredients: [
        {
          name: 'Ức gà', // Matches existing
          amount: 200, unit: 'g',
          nutritionPerStandardUnit: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
        },
        {
          name: 'Dầu ăn', // New ingredient
          amount: 30, unit: 'ml',
          nutritionPerStandardUnit: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
        },
      ],
    };

    const { newIngredients, dishIngredients } = processAnalyzedDish(payload, ingredients);

    // Should create 1 new ingredient (Dầu ăn) and match 1 existing (Ức gà)
    expect(newIngredients).toHaveLength(1);
    expect(newIngredients[0].name).toBe('Dầu ăn');
    expect(dishIngredients).toHaveLength(2);
    expect(dishIngredients[0].ingredientId).toBe('ing-chicken'); // Matched existing
    expect(dishIngredients[1].ingredientId).toBe(newIngredients[0].id); // New

    // Verify nutrition of the created dish
    const allIngredients = [...ingredients, ...newIngredients];
    const newDish: Dish = {
      id: generateId('dish'),
      name: payload.name,
      ingredients: dishIngredients,
      tags: ['lunch'],
    };
    const nutrition = calculateDishNutrition(newDish, allIngredients);
    // chicken 200g: 330 cal, oil 30ml: 265.2 cal = 595.2 cal
    expect(nutrition.calories).toBeCloseTo(595.2);
  });
});

describe('Flow: Multiple Dishes per Meal Slot', () => {
  it('should correctly aggregate nutrition for multiple dishes in one meal', () => {
    // Add 2 dishes to lunch
    dayPlans = updateDayPlanSlot(dayPlans, '2026-03-01', 'lunch', ['dish-com-ga', 'dish-trung-luoc']);

    const plan = dayPlans[0];
    const lunchNutrition = calculateDishesNutrition(plan.lunchDishIds, dishes, ingredients);

    // Com ga: 507.5 cal + Trung luoc: 310 cal = 817.5 cal
    expect(lunchNutrition.calories).toBeCloseTo(817.5);
  });
});

