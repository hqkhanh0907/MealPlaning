import { create } from 'zustand';
import type { DayPlan, MealType } from '../types';
import { migrateDayPlans } from '../services/dataService';
import { updateDayPlanSlot } from '../services/planService';

const STORAGE_KEY = 'mp-day-plans';

export const loadDayPlans = (): DayPlan[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return migrateDayPlans(JSON.parse(saved));
  } catch { /* corrupted data — use default */ }
  return [];
};

interface DayPlanState {
  dayPlans: DayPlan[];
  setDayPlans: (updater: DayPlan[] | ((prev: DayPlan[]) => DayPlan[])) => void;
  updatePlan: (selectedDate: string, type: MealType, dishIds: string[]) => void;
  updateServings: (selectedDate: string, dishId: string, count: number) => void;
  isDishUsed: (dishId: string) => boolean;
  restoreDayPlans: (snapshot: DayPlan[]) => void;
  hydrate: () => void;
}

export const useDayPlanStore = create<DayPlanState>((set, get) => ({
  dayPlans: [],
  setDayPlans: (updater) => set((state) => ({
    dayPlans: typeof updater === 'function' ? updater(state.dayPlans) : updater,
  })),
  updatePlan: (selectedDate, type, dishIds) => set((state) => ({
    dayPlans: updateDayPlanSlot(state.dayPlans, selectedDate, type, dishIds),
  })),
  updateServings: (selectedDate, dishId, count) => set((state) => ({
    dayPlans: state.dayPlans.map(p => {
      if (p.date !== selectedDate) return p;
      const servings = { ...p.servings };
      if (count <= 1) delete servings[dishId];
      else servings[dishId] = count;
      return { ...p, servings };
    }),
  })),
  isDishUsed: (dishId) =>
    get().dayPlans.some(p =>
      p.breakfastDishIds.includes(dishId) ||
      p.lunchDishIds.includes(dishId) ||
      p.dinnerDishIds.includes(dishId)
    ),
  restoreDayPlans: (snapshot) => {
    const dates = new Set(snapshot.map(p => p.date));
    set((state) => ({
      dayPlans: [...state.dayPlans.filter(p => !dates.has(p.date)), ...snapshot],
    }));
  },
  hydrate: () => set({ dayPlans: loadDayPlans() }),
}));

useDayPlanStore.subscribe((state, prev) => {
  if (state.dayPlans !== prev.dayPlans) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.dayPlans)); }
    catch { /* localStorage full */ }
  }
});
