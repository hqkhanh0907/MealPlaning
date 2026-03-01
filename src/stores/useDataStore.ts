/**
 * Zustand store for data persistence (ingredients, dishes, dayPlans, userProfile).
 * Replaces usePersistedState in App.tsx for core data.
 * Uses Zustand's persist middleware with localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ingredient, Dish, DayPlan, UserProfile, MealType, SaveAnalyzedDishPayload, DayNutritionSummary } from '../types';
import { initialIngredients, initialDishes } from '../data/initialData';
import { calculateDishesNutrition } from '../utils/nutrition';
import { generateId } from '../utils/helpers';
import {
  createEmptyDayPlan,
  clearPlansByScope,
  applySuggestionToDayPlans,
  updateDayPlanSlot,
} from '../services/planService';
import {
  removeIngredientFromDishes,
  migrateDishes,
  migrateDayPlans,
  processAnalyzedDish,
} from '../services/dataService';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface DataState {
  // Raw persisted data
  ingredients: Ingredient[];
  rawDishes: Dish[];
  rawDayPlans: DayPlan[];
  userProfile: UserProfile;

  // Actions — Ingredients
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (ing: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  isIngredientUsed: (id: string) => boolean;

  // Actions — Dishes
  addDish: (dish: Dish) => void;
  updateDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;
  isDishUsed: (id: string) => boolean;

  // Actions — Day Plans
  updatePlanSlot: (selectedDate: string, type: MealType, dishIds: string[]) => void;
  clearPlans: (selectedDate: string, scope: 'day' | 'week' | 'month') => void;
  applySuggestion: (selectedDate: string, suggestion: { breakfastDishIds: string[]; lunchDishIds: string[]; dinnerDishIds: string[]; reasoning: string }) => void;

  // Actions — User Profile
  setUserProfile: (profile: UserProfile) => void;

  // Actions — AI analyzed dish save
  saveAnalyzedDish: (result: SaveAnalyzedDishPayload) => { newIngredientCount: number; dishName: string; createdDish: boolean };

  // Actions — Import/Export
  importData: (data: Record<string, unknown>) => { importedCount: number; skippedKeys: string[] };

  // Derived data (computed via getters, not stored)
  getDishes: () => Dish[];
  getDayPlans: () => DayPlan[];
  getCurrentPlan: (selectedDate: string) => DayPlan;
  getDayNutrition: (selectedDate: string) => DayNutritionSummary;
  getTargetProtein: () => number;
}

// ---------------------------------------------------------------------------
// Validators for import
// ---------------------------------------------------------------------------

const IMPORT_VALIDATORS: Record<string, (v: unknown) => boolean> = {
  'mp-ingredients': (v) => Array.isArray(v) && v.every((i: unknown) =>
    typeof i === 'object' && i !== null && 'id' in i && 'name' in i && 'unit' in i
  ),
  'mp-dishes': (v) => Array.isArray(v) && v.every((d: unknown) =>
    typeof d === 'object' && d !== null && 'id' in d && 'name' in d && 'ingredients' in d
  ),
  'mp-day-plans': (v) => Array.isArray(v) && v.every((p: unknown) =>
    typeof p === 'object' && p !== null && 'date' in p
  ),
  'mp-user-profile': (v) =>
    typeof v === 'object' && v !== null && 'weight' in v && 'targetCalories' in v,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      // Initial state
      ingredients: initialIngredients,
      rawDishes: initialDishes,
      rawDayPlans: [],
      userProfile: { weight: 83, proteinRatio: 2, targetCalories: 1500 },

      // --- Ingredient actions ---
      addIngredient: (ing) => set(s => ({ ingredients: [...s.ingredients, ing] })),
      updateIngredient: (ing) => set(s => ({ ingredients: s.ingredients.map(i => i.id === ing.id ? ing : i) })),
      deleteIngredient: (id) => set(s => ({
        ingredients: s.ingredients.filter(i => i.id !== id),
        rawDishes: removeIngredientFromDishes(s.rawDishes, id),
      })),
      isIngredientUsed: (id) => get().rawDishes.some(d => d.ingredients.some(di => di.ingredientId === id)),

      // --- Dish actions ---
      addDish: (dish) => set(s => ({ rawDishes: [...s.rawDishes, dish] })),
      updateDish: (dish) => set(s => ({ rawDishes: s.rawDishes.map(d => d.id === dish.id ? dish : d) })),
      deleteDish: (id) => set(s => ({ rawDishes: s.rawDishes.filter(d => d.id !== id) })),
      isDishUsed: (id) => get().getDayPlans().some(p =>
        p.breakfastDishIds.includes(id) || p.lunchDishIds.includes(id) || p.dinnerDishIds.includes(id)
      ),

      // --- Day plan actions ---
      updatePlanSlot: (selectedDate, type, dishIds) =>
        set(s => ({ rawDayPlans: updateDayPlanSlot(s.rawDayPlans, selectedDate, type, dishIds) })),
      clearPlans: (selectedDate, scope) =>
        set(s => ({ rawDayPlans: clearPlansByScope(s.rawDayPlans, selectedDate, scope) })),
      applySuggestion: (selectedDate, suggestion) =>
        set(s => ({ rawDayPlans: applySuggestionToDayPlans(s.rawDayPlans, selectedDate, suggestion) })),

      // --- User profile ---
      setUserProfile: (profile) => set({ userProfile: profile }),

      // --- Save analyzed dish ---
      saveAnalyzedDish: (result) => {
        const state = get();
        const { newIngredients, dishIngredients } = processAnalyzedDish(result, state.ingredients);

        const createdDish = result.shouldCreateDish !== false;
        const updates: Partial<DataState> = {};

        if (newIngredients.length > 0) {
          updates.ingredients = [...state.ingredients, ...newIngredients];
        }

        if (createdDish) {
          const newDish: Dish = {
            id: generateId('dish'),
            name: result.name,
            ingredients: dishIngredients,
            tags: result.tags ?? ['lunch'],
          };
          updates.rawDishes = [...state.rawDishes, newDish];
        }

        if (Object.keys(updates).length > 0) set(updates);

        return {
          newIngredientCount: newIngredients.length,
          dishName: result.name,
          createdDish,
        };
      },

      // --- Import ---
      importData: (data) => {
        const skippedKeys: string[] = [];
        let importedCount = 0;

        const keyMap: Record<string, string> = {
          'mp-ingredients': 'ingredients',
          'mp-dishes': 'rawDishes',
          'mp-day-plans': 'rawDayPlans',
          'mp-user-profile': 'userProfile',
        };

        const updates: Partial<DataState> = {};
        for (const [key, validate] of Object.entries(IMPORT_VALIDATORS)) {
          if (key in data) {
            if (validate(data[key])) {
              const stateKey = keyMap[key];
              if (stateKey) {
                (updates as Record<string, unknown>)[stateKey] = data[key];
                importedCount++;
              }
            } else {
              skippedKeys.push(key);
            }
          }
        }

        if (importedCount > 0) set(updates);
        return { importedCount, skippedKeys };
      },

      // --- Derived data (computed getters) ---
      getDishes: () => migrateDishes(get().rawDishes),
      getDayPlans: () => migrateDayPlans(get().rawDayPlans),
      getCurrentPlan: (selectedDate) => {
        const plans = get().getDayPlans();
        return plans.find(p => p.date === selectedDate) || createEmptyDayPlan(selectedDate);
      },
      getDayNutrition: (selectedDate) => {
        const currentPlan = get().getCurrentPlan(selectedDate);
        const dishes = get().getDishes();
        const ingredients = get().ingredients;
        const calc = (dishIds: string[]) => ({
          dishIds,
          ...calculateDishesNutrition(dishIds, dishes, ingredients),
        });
        return {
          breakfast: calc(currentPlan.breakfastDishIds),
          lunch: calc(currentPlan.lunchDishIds),
          dinner: calc(currentPlan.dinnerDishIds),
        };
      },
      getTargetProtein: () => {
        const { weight, proteinRatio } = get().userProfile;
        return Math.round(weight * proteinRatio);
      },
    }),
    {
      name: 'mp-data-store',
      version: 1,
      // Merge strategy: incoming persisted state merges with defaults
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<DataState>),
      }),
    },
  ),
);

