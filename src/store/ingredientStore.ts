import { create } from 'zustand';

import { initialIngredients } from '../data/initialData';
import type { DatabaseService } from '../services/databaseService';
import type { Ingredient } from '../types';
import { logger } from '../utils/logger';
import { persistToDb } from './helpers/dbWriteQueue';

let _db: DatabaseService | null = null;

/** @internal Reset DB reference — test-only */
export function __resetIngredientDbForTesting(): void {
  _db = null;
}

const ING_UPSERT_SQL = `INSERT INTO ingredients (id, name_vi, name_en, calories_per_100, protein_per_100, carbs_per_100, fat_per_100, fiber_per_100, unit_vi, unit_en)
  VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
  name_vi=excluded.name_vi, name_en=excluded.name_en, calories_per_100=excluded.calories_per_100,
  protein_per_100=excluded.protein_per_100, carbs_per_100=excluded.carbs_per_100,
  fat_per_100=excluded.fat_per_100, fiber_per_100=excluded.fiber_per_100,
  unit_vi=excluded.unit_vi, unit_en=excluded.unit_en`;

function ingToParams(ing: Ingredient): unknown[] {
  return [
    ing.id,
    ing.name.vi,
    ing.name.en ?? null,
    ing.caloriesPer100,
    ing.proteinPer100,
    ing.carbsPer100,
    ing.fatPer100,
    ing.fiberPer100,
    ing.unit.vi,
    ing.unit.en ?? null,
  ];
}

/** Full reconcile: sync entire Zustand state → SQLite (used by batch setters) */
function syncAllToDb(db: DatabaseService, ingredients: Ingredient[]): void {
  db.transaction(async () => {
    if (ingredients.length === 0) {
      await db.execute('DELETE FROM ingredients');
    } else {
      const ids = ingredients.map(i => i.id);
      const ph = ids.map(() => '?').join(',');
      await db.execute(`DELETE FROM ingredients WHERE id NOT IN (${ph})`, ids);
    }
    for (const ing of ingredients) {
      await db.execute(ING_UPSERT_SQL, ingToParams(ing));
    }
  }).catch((error: unknown) => {
    logger.error({ component: 'ingredientStore', action: 'syncAllToDb' }, error);
  });
}

/* Row type after rowToType() conversion (camelCase) */
interface IngredientRow {
  id: string;
  nameVi: string;
  nameEn: string | null;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  fiberPer100: number;
  unitVi: string;
  unitEn: string | null;
}

interface IngredientState {
  ingredients: Ingredient[];
  setIngredients: (updater: Ingredient[] | ((prev: Ingredient[]) => Ingredient[])) => void;
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (ing: Ingredient) => void;
  loadAll: (db: DatabaseService) => Promise<void>;
}

export const useIngredientStore = create<IngredientState>((set, get) => ({
  ingredients: initialIngredients,
  setIngredients: updater => {
    const current = get().ingredients;
    const next = typeof updater === 'function' ? updater(current) : updater;
    set({ ingredients: next });
    if (_db) syncAllToDb(_db, next);
  },
  addIngredient: ing => {
    set(state => ({ ingredients: [...state.ingredients, ing] }));
    if (_db) persistToDb(_db, ING_UPSERT_SQL, ingToParams(ing), 'addIngredient');
  },
  updateIngredient: ing => {
    set(state => ({ ingredients: state.ingredients.map(i => (i.id === ing.id ? ing : i)) }));
    if (_db) persistToDb(_db, ING_UPSERT_SQL, ingToParams(ing), 'updateIngredient');
  },
  loadAll: async (db: DatabaseService) => {
    _db = db;
    const rows = await db.query<IngredientRow>('SELECT * FROM ingredients');
    if (rows.length === 0) return;
    const ingredients: Ingredient[] = rows.map(r => ({
      id: r.id,
      name: { vi: r.nameVi, ...(r.nameEn ? { en: r.nameEn } : {}) },
      caloriesPer100: r.caloriesPer100,
      proteinPer100: r.proteinPer100,
      carbsPer100: r.carbsPer100,
      fatPer100: r.fatPer100,
      fiberPer100: r.fiberPer100,
      unit: { vi: r.unitVi, ...(r.unitEn ? { en: r.unitEn } : {}) },
    }));
    set({ ingredients });
  },
}));
