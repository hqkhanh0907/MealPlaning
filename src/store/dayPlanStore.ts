import { create } from 'zustand';

import type { DatabaseService } from '../services/databaseService';
import { updateDayPlanSlot } from '../services/planService';
import type { DayPlan, MealType } from '../types';
import { logger } from '../utils/logger';

/** Safely parse JSON with fallback and logging for corrupted data */
function safeJsonParse<T>(raw: string, fallback: T, context: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    logger.warn({ component: 'dayPlanStore', action: 'safeJsonParse' }, `Corrupt ${context}: ${raw.slice(0, 80)}`);
    return fallback;
  }
}

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
      breakfastDishIds: safeJsonParse<string[]>(r.breakfast_dish_ids, [], `breakfast_dish_ids[${r.date}]`),
      lunchDishIds: safeJsonParse<string[]>(r.lunch_dish_ids, [], `lunch_dish_ids[${r.date}]`),
      dinnerDishIds: safeJsonParse<string[]>(r.dinner_dish_ids, [], `dinner_dish_ids[${r.date}]`),
      ...(r.servings ? { servings: safeJsonParse<Record<string, number>>(r.servings, {}, `servings[${r.date}]`) } : {}),
    }));
    set({ dayPlans });
  },
}));
