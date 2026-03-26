import { create } from 'zustand';
import type { Ingredient } from '../types';
import { initialIngredients } from '../data/initialData';
import { migrateIngredients } from '../services/dataService';

const STORAGE_KEY = 'mp-ingredients';

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
}));

useIngredientStore.subscribe((state, prev) => {
  if (state.ingredients !== prev.ingredients) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.ingredients)); }
    catch { /* localStorage full */ }
  }
});
