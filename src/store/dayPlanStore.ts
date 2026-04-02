import { create } from 'zustand';

import type { DatabaseService } from '../services/databaseService';
import { updateDayPlanSlot } from '../services/planService';
import type { DayPlan, MealType } from '../types';

interface DayPlanRow {
  date: string;
  breakfast_dish_ids: string;
  lunch_dish_ids: string;
  dinner_dish_ids: string;
  servings: string | null;
}

interface DayPlanState {
  dayPlans: DayPlan[];
  setDayPlans: (updater: DayPlan[] | ((prev: DayPlan[]) => DayPlan[])) => void;
  updatePlan: (selectedDate: string, type: MealType, dishIds: string[]) => void;
  updateServings: (selectedDate: string, dishId: string, count: number) => void;
  isDishUsed: (dishId: string) => boolean;
  restoreDayPlans: (snapshot: DayPlan[]) => void;
  loadAll: (db: DatabaseService) => Promise<void>;
}

export const useDayPlanStore = create<DayPlanState>((set, get) => ({
  dayPlans: [],
  setDayPlans: updater =>
    set(state => ({
      dayPlans: typeof updater === 'function' ? updater(state.dayPlans) : updater,
    })),
  updatePlan: (selectedDate, type, dishIds) =>
    set(state => ({
      dayPlans: updateDayPlanSlot(state.dayPlans, selectedDate, type, dishIds),
    })),
  updateServings: (selectedDate, dishId, count) =>
    set(state => ({
      dayPlans: state.dayPlans.map(p => {
        if (p.date !== selectedDate) return p;
        const servings = { ...p.servings };
        if (count <= 1) delete servings[dishId];
        else servings[dishId] = count;
        return { ...p, servings };
      }),
    })),
  isDishUsed: dishId =>
    get().dayPlans.some(
      p => p.breakfastDishIds.includes(dishId) || p.lunchDishIds.includes(dishId) || p.dinnerDishIds.includes(dishId),
    ),
  restoreDayPlans: snapshot => {
    const dates = new Set(snapshot.map(p => p.date));
    set(state => ({
      dayPlans: [...state.dayPlans.filter(p => !dates.has(p.date)), ...snapshot],
    }));
  },
  loadAll: async (db: DatabaseService) => {
    const rows = await db.query<DayPlanRow>('SELECT * FROM day_plans');
    if (rows.length === 0) return;
    const dayPlans: DayPlan[] = rows.map(r => ({
      date: r.date,
      breakfastDishIds: JSON.parse(r.breakfast_dish_ids) as string[],
      lunchDishIds: JSON.parse(r.lunch_dish_ids) as string[],
      dinnerDishIds: JSON.parse(r.dinner_dish_ids) as string[],
      ...(r.servings ? { servings: JSON.parse(r.servings) as Record<string, number> } : {}),
    }));
    set({ dayPlans });
  },
}));
