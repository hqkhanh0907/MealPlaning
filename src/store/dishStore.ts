import { create } from 'zustand';

import { initialDishes } from '../data/initialData';
import type { DatabaseService } from '../services/databaseService';
import type { Dish, MealType } from '../types';
import { logger } from '../utils/logger';

/** Safely parse JSON with fallback and logging for corrupted data */
function safeJsonParse<T>(raw: string, fallback: T, context: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    logger.warn({ component: 'dishStore', action: 'safeJsonParse' }, `Corrupt ${context}: ${raw.slice(0, 80)}`);
    return fallback;
  }
}

interface DishRow {
  id: string;
  name_vi: string;
  name_en: string | null;
  tags: string;
  rating: number | null;
  notes: string | null;
}

interface DishIngredientRow {
  ingredient_id: string;
  amount: number;
}

interface DishState {
  dishes: Dish[];
  setDishes: (updater: Dish[] | ((prev: Dish[]) => Dish[])) => void;
  addDish: (dish: Dish) => void;
  updateDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;
  isIngredientUsed: (ingId: string) => boolean;
  loadAll: (db: DatabaseService) => Promise<void>;
}

export const useDishStore = create<DishState>((set, get) => ({
  dishes: initialDishes,
  setDishes: updater =>
    set(state => ({
      dishes: typeof updater === 'function' ? updater(state.dishes) : updater,
    })),
  addDish: dish =>
    set(state => ({
      dishes: [...state.dishes, dish],
    })),
  updateDish: dish =>
    set(state => ({
      dishes: state.dishes.map(d => (d.id === dish.id ? dish : d)),
    })),
  deleteDish: id =>
    set(state => ({
      dishes: state.dishes.filter(d => d.id !== id),
    })),
  isIngredientUsed: ingId => get().dishes.some(d => d.ingredients.some(di => di.ingredientId === ingId)),
  loadAll: async (db: DatabaseService) => {
    const dishRows = await db.query<DishRow>('SELECT * FROM dishes');
    if (dishRows.length === 0) return;
    const dishes: Dish[] = await Promise.all(
      dishRows.map(async r => {
        const ings = await db.query<DishIngredientRow>(
          'SELECT ingredient_id, amount FROM dish_ingredients WHERE dish_id = ?',
          [r.id],
        );
        return {
          id: r.id,
          name: { vi: r.name_vi, ...(r.name_en ? { en: r.name_en } : {}) },
          ingredients: ings.map(i => ({ ingredientId: i.ingredient_id, amount: i.amount })),
          tags: safeJsonParse<MealType[]>(r.tags, [], `tags[${r.id}]`),
          ...(r.rating == null ? {} : { rating: r.rating }),
          ...(r.notes == null ? {} : { notes: r.notes }),
        };
      }),
    );
    set({ dishes });
  },
}));
