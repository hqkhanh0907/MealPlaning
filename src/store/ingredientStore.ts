import { create } from 'zustand';
import type { Ingredient } from '../types';
import type { DatabaseService } from '../services/databaseService';
import { initialIngredients } from '../data/initialData';
import { migrateIngredients } from '../services/dataService';

const STORAGE_KEY = 'mp-ingredients';

interface IngredientRow {
  id: string;
  name_vi: string;
  name_en: string | null;
  calories_per_100: number;
  protein_per_100: number;
  carbs_per_100: number;
  fat_per_100: number;
  fiber_per_100: number;
  unit_vi: string;
  unit_en: string | null;
}

export const loadIngredients = (): Ingredient[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return migrateIngredients(JSON.parse(saved));
  } catch { /* corrupted data — use default */ }
  return initialIngredients;
};

interface IngredientState {
  ingredients: Ingredient[];
  setIngredients: (updater: Ingredient[] | ((prev: Ingredient[]) => Ingredient[])) => void;
  addIngredient: (ing: Ingredient) => void;
  updateIngredient: (ing: Ingredient) => void;
  hydrate: () => void;
  loadAll: (db: DatabaseService) => Promise<void>;
}

export const useIngredientStore = create<IngredientState>((set) => ({
  ingredients: initialIngredients,
  setIngredients: (updater) => set((state) => ({
    ingredients: typeof updater === 'function' ? updater(state.ingredients) : updater,
  })),
  addIngredient: (ing) => set((state) => ({
    ingredients: [...state.ingredients, ing],
  })),
  updateIngredient: (ing) => set((state) => ({
    ingredients: state.ingredients.map(i => i.id === ing.id ? ing : i),
  })),
  hydrate: () => set({ ingredients: loadIngredients() }),
  loadAll: async (db: DatabaseService) => {
    const rows = await db.query<IngredientRow>('SELECT * FROM ingredients');
    if (rows.length === 0) {
      set({ ingredients: loadIngredients() });
      return;
    }
    const ingredients: Ingredient[] = rows.map((r) => ({
      id: r.id,
      name: { vi: r.name_vi, ...(r.name_en ? { en: r.name_en } : {}) },
      caloriesPer100: r.calories_per_100,
      proteinPer100: r.protein_per_100,
      carbsPer100: r.carbs_per_100,
      fatPer100: r.fat_per_100,
      fiberPer100: r.fiber_per_100,
      unit: { vi: r.unit_vi, ...(r.unit_en ? { en: r.unit_en } : {}) },
    }));
    set({ ingredients });
  },
}));

useIngredientStore.subscribe((state, prev) => {
  if (state.ingredients !== prev.ingredients) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.ingredients)); }
    catch { /* localStorage full */ }
  }
});
