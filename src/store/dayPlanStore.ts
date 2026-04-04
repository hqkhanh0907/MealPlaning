import { create } from 'zustand';

import type { DatabaseService } from '../services/databaseService';
import { updateDayPlanSlot } from '../services/planService';
import type { DayPlan, MealType } from '../types';
import { logger } from '../utils/logger';
import { persistToDb } from './helpers/dbWriteQueue';

let _db: DatabaseService | null = null;

/** @internal Reset DB reference — test-only */
export function __resetDayPlanDbForTesting(): void {
  _db = null;
}

/** Safely parse JSON with fallback and logging for corrupted data */
function safeJsonParse<T>(raw: string, fallback: T, context: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    logger.warn({ component: 'dayPlanStore', action: 'safeJsonParse' }, `Corrupt ${context}: ${raw.slice(0, 80)}`);
    return fallback;
  }
}

function planToParams(plan: DayPlan): unknown[] {
  return [
    plan.date,
    JSON.stringify(plan.breakfastDishIds),
    JSON.stringify(plan.lunchDishIds),
    JSON.stringify(plan.dinnerDishIds),
    plan.servings ? JSON.stringify(plan.servings) : null,
  ];
}

const PLAN_UPSERT_SQL = `INSERT INTO day_plans (date, breakfast_dish_ids, lunch_dish_ids, dinner_dish_ids, servings)
  VALUES (?,?,?,?,?) ON CONFLICT(date) DO UPDATE SET
  breakfast_dish_ids=excluded.breakfast_dish_ids, lunch_dish_ids=excluded.lunch_dish_ids,
  dinner_dish_ids=excluded.dinner_dish_ids, servings=excluded.servings`;

/** Full reconcile: sync entire Zustand state → SQLite (used by batch setters) */
function syncAllPlansToDb(db: DatabaseService, plans: DayPlan[]): void {
  db.transaction(async () => {
    if (plans.length === 0) {
      await db.execute('DELETE FROM day_plans');
    } else {
      const dates = plans.map(p => p.date);
      const ph = dates.map(() => '?').join(',');
      await db.execute(`DELETE FROM day_plans WHERE date NOT IN (${ph})`, dates);
    }
    for (const plan of plans) {
      await db.execute(PLAN_UPSERT_SQL, planToParams(plan));
    }
  }).catch((error: unknown) => {
    logger.error({ component: 'dayPlanStore', action: 'syncAllToDb' }, error);
  });
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
  setDayPlans: updater => {
    const current = get().dayPlans;
    const next = typeof updater === 'function' ? updater(current) : updater;
    set({ dayPlans: next });
    if (_db) syncAllPlansToDb(_db, next);
  },
  updatePlan: (selectedDate, type, dishIds) => {
    const nextPlans = updateDayPlanSlot(get().dayPlans, selectedDate, type, dishIds);
    set({ dayPlans: nextPlans });
    if (_db) {
      const plan = nextPlans.find(p => p.date === selectedDate);
      if (plan) persistToDb(_db, PLAN_UPSERT_SQL, planToParams(plan), 'updatePlan');
    }
  },
  updateServings: (selectedDate, dishId, count) => {
    const nextPlans = get().dayPlans.map(p => {
      if (p.date !== selectedDate) return p;
      const servings = { ...p.servings };
      if (count <= 1) delete servings[dishId];
      else servings[dishId] = count;
      return { ...p, servings };
    });
    set({ dayPlans: nextPlans });
    if (_db) {
      const plan = nextPlans.find(p => p.date === selectedDate);
      if (plan) persistToDb(_db, PLAN_UPSERT_SQL, planToParams(plan), 'updateServings');
    }
  },
  isDishUsed: dishId =>
    get().dayPlans.some(
      p => p.breakfastDishIds.includes(dishId) || p.lunchDishIds.includes(dishId) || p.dinnerDishIds.includes(dishId),
    ),
  restoreDayPlans: snapshot => {
    const dates = new Set(snapshot.map(p => p.date));
    const next = [...get().dayPlans.filter(p => !dates.has(p.date)), ...snapshot];
    set({ dayPlans: next });
    if (_db) syncAllPlansToDb(_db, next);
  },
  loadAll: async (db: DatabaseService) => {
    _db = db;
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
