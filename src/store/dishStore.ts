import { create } from 'zustand';

import { initialDishes } from '../data/initialData';
import type { DatabaseService } from '../services/databaseService';
import type { Dish, MealType } from '../types';
import { logger } from '../utils/logger';
import { persistToDb } from './helpers/dbWriteQueue';

let _db: DatabaseService | null = null;

/** @internal Reset DB reference — test-only */
export function __resetDishDbForTesting(): void {
  _db = null;
}

/** Safely parse JSON with fallback and logging for corrupted data */
function safeJsonParse<T>(raw: string, fallback: T, context: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    logger.warn({ component: 'dishStore', action: 'safeJsonParse' }, `Corrupt ${context}: ${raw.slice(0, 80)}`);
    return fallback;
  }
}

function persistDish(db: DatabaseService, dish: Dish, context: string): void {
  db.transaction(async () => {
    await db.execute(
      `INSERT INTO dishes (id, name_vi, name_en, tags, rating, notes) VALUES (?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET name_vi=excluded.name_vi, name_en=excluded.name_en,
       tags=excluded.tags, rating=excluded.rating, notes=excluded.notes`,
      [dish.id, dish.name.vi, dish.name.en ?? null, JSON.stringify(dish.tags), dish.rating ?? null, dish.notes ?? null],
    );
    await db.execute('DELETE FROM dish_ingredients WHERE dish_id = ?', [dish.id]);
    for (const di of dish.ingredients) {
      await db.execute('INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?,?,?)', [
        dish.id,
        di.ingredientId,
        di.amount,
      ]);
    }
  }).catch((error: unknown) => {
    logger.error({ component: 'dishStore', action: context }, error);
  });
}

/** Full reconcile: sync entire Zustand state → SQLite (used by batch setters) */
function syncAllDishesToDb(db: DatabaseService, dishes: Dish[]): void {
  db.transaction(async () => {
    if (dishes.length === 0) {
      await db.execute('DELETE FROM dish_ingredients');
      await db.execute('DELETE FROM dishes');
    } else {
      const ids = dishes.map(d => d.id);
      const ph = ids.map(() => '?').join(',');
      await db.execute(`DELETE FROM dish_ingredients WHERE dish_id NOT IN (${ph})`, ids);
      await db.execute(`DELETE FROM dishes WHERE id NOT IN (${ph})`, ids);
    }
    for (const dish of dishes) {
      await db.execute(
        `INSERT INTO dishes (id, name_vi, name_en, tags, rating, notes) VALUES (?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET name_vi=excluded.name_vi, name_en=excluded.name_en,
         tags=excluded.tags, rating=excluded.rating, notes=excluded.notes`,
        [
          dish.id,
          dish.name.vi,
          dish.name.en ?? null,
          JSON.stringify(dish.tags),
          dish.rating ?? null,
          dish.notes ?? null,
        ],
      );
      await db.execute('DELETE FROM dish_ingredients WHERE dish_id = ?', [dish.id]);
      for (const di of dish.ingredients) {
        await db.execute('INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?,?,?)', [
          dish.id,
          di.ingredientId,
          di.amount,
        ]);
      }
    }
  }).catch((error: unknown) => {
    logger.error({ component: 'dishStore', action: 'syncAllToDb' }, error);
  });
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
  setDishes: updater => {
    const current = get().dishes;
    const next = typeof updater === 'function' ? updater(current) : updater;
    set({ dishes: next });
    if (_db) syncAllDishesToDb(_db, next);
  },
  addDish: dish => {
    set(state => ({ dishes: [...state.dishes, dish] }));
    if (_db) persistDish(_db, dish, 'addDish');
  },
  updateDish: dish => {
    set(state => ({ dishes: state.dishes.map(d => (d.id === dish.id ? dish : d)) }));
    if (_db) persistDish(_db, dish, 'updateDish');
  },
  deleteDish: id => {
    set(state => ({ dishes: state.dishes.filter(d => d.id !== id) }));
    if (_db) {
      persistToDb(_db, 'DELETE FROM dish_ingredients WHERE dish_id = ?', [id], 'deleteDish.ingredients');
      persistToDb(_db, 'DELETE FROM dishes WHERE id = ?', [id], 'deleteDish');
    }
  },
  isIngredientUsed: ingId => get().dishes.some(d => d.ingredients.some(di => di.ingredientId === ingId)),
  loadAll: async (db: DatabaseService) => {
    _db = db;
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
