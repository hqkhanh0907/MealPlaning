import { create } from 'zustand';
import type { Dish } from '../types';
import { initialDishes } from '../data/initialData';
import { migrateDishes } from '../services/dataService';

const STORAGE_KEY = 'mp-dishes';

export const loadDishes = (): Dish[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return migrateDishes(JSON.parse(saved));
  } catch { /* corrupted data — use default */ }
  return initialDishes;
};

interface DishState {
  dishes: Dish[];
  setDishes: (updater: Dish[] | ((prev: Dish[]) => Dish[])) => void;
  addDish: (dish: Dish) => void;
  updateDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;
  isIngredientUsed: (ingId: string) => boolean;
  hydrate: () => void;
}

export const useDishStore = create<DishState>((set, get) => ({
  dishes: initialDishes,
  setDishes: (updater) => set((state) => ({
    dishes: typeof updater === 'function' ? updater(state.dishes) : updater,
  })),
  addDish: (dish) => set((state) => ({
    dishes: [...state.dishes, dish],
  })),
  updateDish: (dish) => set((state) => ({
    dishes: state.dishes.map(d => d.id === dish.id ? dish : d),
  })),
  deleteDish: (id) => set((state) => ({
    dishes: state.dishes.filter(d => d.id !== id),
  })),
  isIngredientUsed: (ingId) =>
    get().dishes.some(d => d.ingredients.some(di => di.ingredientId === ingId)),
  hydrate: () => set({ dishes: loadDishes() }),
}));

useDishStore.subscribe((state, prev) => {
  if (state.dishes !== prev.dishes) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.dishes)); }
    catch { /* localStorage full */ }
  }
});
