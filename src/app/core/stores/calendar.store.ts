import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type {
  DayPlanWithSlots,
  DeletedDishSnapshot,
  MealType,
  PlannedDish,
  WeekDayTotal,
} from '../models/meal-plan.types';
import type { DishListItem } from '../repositories/dish.repository';
import { DayPlanRepository } from '../repositories/day-plan.repository';
import {
  PlannedDishRepository,
  type DateMealPlanItem,
} from '../repositories/planned-dish.repository';
import { DishStore } from './dish.store';
import { ProfileStore } from './profile.store';

const DAY_MS = 86_400_000;
const CLAMP_DAYS = 365;
const DEFAULT_TARGET_CAL = 2000;

const VN_DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

/** Inclusive [today-365, today+365] window per F-03 §2.D2. */
function clampDate(target: string, today: Date): string {
  const t = parseIsoDate(target);
  if (Number.isNaN(t.getTime())) return formatIsoDate(today);
  const min = new Date(today.getTime() - CLAMP_DAYS * DAY_MS);
  const max = new Date(today.getTime() + CLAMP_DAYS * DAY_MS);
  if (t < min) return formatIsoDate(min);
  if (t > max) return formatIsoDate(max);
  return formatIsoDate(t);
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(iso: string): Date {
  // Force local-midnight interpretation so day arithmetic is timezone-stable.
  const [y, m, d] = iso.split('-').map((p) => Number.parseInt(p, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Monday-anchored ISO week (Mon → Sun). */
function weekStart(iso: string): Date {
  const d = parseIsoDate(iso);
  const day = d.getDay(); // Sun=0, Mon=1 … Sat=6
  const offsetToMonday = (day + 6) % 7; // Mon→0, Sun→6
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offsetToMonday);
}

@Injectable({ providedIn: 'root' })
export class CalendarStore {
  private readonly dayPlanRepo = inject(DayPlanRepository);
  private readonly plannedDishRepo = inject(PlannedDishRepository);
  private readonly dishStore = inject(DishStore);
  private readonly profileStore = inject(ProfileStore);

  /** Captured at construction so clamp behaviour stays test-deterministic. */
  private readonly today = new Date();

  readonly currentDate = signal(formatIsoDate(this.today));
  readonly currentView = signal<'day' | 'week'>('day');
  readonly invalidationTick = signal(0);
  readonly dayPlan = signal<DayPlanWithSlots | null>(null);
  readonly weekData = signal<WeekDayTotal[] | null>(null);

  readonly weekDays = computed<string[]>(() => {
    const start = weekStart(this.currentDate());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return formatIsoDate(d);
    });
  });

  /** ISO of "today" snapshotted at construction (used by week view). */
  private readonly todayIso = formatIsoDate(this.today);

  constructor() {
    // Auto-hydrate dayPlan when currentDate or invalidationTick changes.
    effect(() => {
      const date = this.currentDate();
      // Touch tick so the effect re-runs on bump.
      this.invalidationTick();
      void this.hydrateDayPlan(date);
    });

    // Auto-hydrate weekData when currentView=week + week changes or invalidation.
    effect(() => {
      const view = this.currentView();
      const days = this.weekDays();
      this.invalidationTick();
      if (view !== 'week') return;
      void this.hydrateWeek(days);
    });

    // Cross-store wiring: any DishStore mutation invalidates Calendar.
    effect(() => {
      const tick = this.dishStore.dishChanged();
      if (tick > 0) {
        this.invalidationTick.update((n) => n + 1);
      }
    });
  }

  // -- pure signal mutations --------------------------------------------------

  setDate(date: string): void {
    this.currentDate.set(clampDate(date, this.today));
  }

  setView(view: 'day' | 'week'): void {
    this.currentView.set(view);
  }

  // -- repo-backed mutations (tx FIRST → bump LAST per AC-6) ------------------

  async addDish(slotId: string, dishId: string, servings: number): Promise<PlannedDish> {
    const created = await this.plannedDishRepo.addToSlot(slotId, dishId, servings);
    this.invalidationTick.update((n) => n + 1);
    return created;
  }

  async addDishToMeal(mealType: MealType, dishId: string, servings: number): Promise<PlannedDish> {
    const created = await this.plannedDishRepo.addToDateMealType(
      this.currentDate(),
      mealType,
      dishId,
      servings,
    );
    this.invalidationTick.update((n) => n + 1);
    return created;
  }

  async replaceCurrentDatePlan(items: readonly DateMealPlanItem[]): Promise<number> {
    const inserted = await this.plannedDishRepo.replaceDatePlan(this.currentDate(), items);
    this.invalidationTick.update((n) => n + 1);
    return inserted;
  }

  async listRecentLoggedDishes(limit = 20): Promise<DishListItem[]> {
    return this.plannedDishRepo.listRecentLogged(limit);
  }

  async markEaten(plannedDishId: string): Promise<void> {
    await this.plannedDishRepo.markCompleted(plannedDishId);
    this.invalidationTick.update((n) => n + 1);
  }

  async unmarkEaten(plannedDishId: string): Promise<void> {
    await this.plannedDishRepo.unmarkCompleted(plannedDishId);
    this.invalidationTick.update((n) => n + 1);
  }

  async editServings(plannedDishId: string, newServings: number): Promise<void> {
    await this.plannedDishRepo.editServings(plannedDishId, newServings);
    this.invalidationTick.update((n) => n + 1);
  }

  async deleteDish(plannedDishId: string): Promise<DeletedDishSnapshot | null> {
    const snapshot = this.captureSnapshot(plannedDishId);
    await this.plannedDishRepo.delete(plannedDishId);
    this.invalidationTick.update((n) => n + 1);
    return snapshot;
  }

  /**
   * Move a planned/logged dish to a different meal slot inside the SAME day.
   * Cross-day move is expressed via `copyToDate` + `deleteDish` from the UI
   * because the slot-id alone does not encode the day.
   */
  async moveDish(plannedDishId: string, targetSlotId: string): Promise<void> {
    await this.plannedDishRepo.moveToSlot(plannedDishId, targetSlotId);
    this.invalidationTick.update((n) => n + 1);
  }

  /**
   * Restore a deleted dish from snapshot (Story 3.7 undo flow).
   * Re-inserts as planned via `addToSlot`, then re-applies `markCompleted`
   * if the snapshot was logged. The restored row gets a NEW uuid (cannot
   * resurrect the original PK because schema CASCADE may have referenced it).
   */
  async restoreDish(snapshot: DeletedDishSnapshot): Promise<PlannedDish> {
    const created = await this.plannedDishRepo.addToSlot(
      snapshot.meal_slot_id,
      snapshot.dish_id,
      snapshot.servings,
    );
    if (snapshot.is_completed === 1) {
      await this.plannedDishRepo.markCompleted(created.id);
    }
    this.invalidationTick.update((n) => n + 1);
    return created;
  }

  /** True when yesterday has at least one dish to copy from (Story 3.7 §AC-2). */
  readonly canCopyYesterday = computed<boolean>(() => {
    const dp = this.dayPlan();
    if (!dp) return false;
    // hydration is only for currentDate, so can only check yesterday by hint.
    // Real check happens in `copyFromYesterday` via repo round-trip — this
    // signal is a heuristic only used for disabling the CTA. The empty-state
    // CTA should still ATTEMPT and report "tuần trước không có món" if hint
    // proved wrong (parity with copyPreviousWeek toast).
    return this.yesterdayHint();
  });

  /** Mutable hint flag set by the page after probing yesterday on hydration. */
  readonly yesterdayHint = signal(false);

  /**
   * Copy every planned dish from yesterday into today (same meal_type).
   * Returns count so the caller can toast.
   */
  async copyFromYesterday(): Promise<{ copiedCount: number }> {
    const today = this.currentDate();
    const yesterday = formatIsoDate(new Date(parseIsoDate(today).getTime() - DAY_MS));
    const yDayPlan = await this.dayPlanRepo.findByDate(yesterday);
    if (!yDayPlan) return { copiedCount: 0 };
    let copiedCount = 0;
    for (const slot of yDayPlan.meal_slots) {
      for (const pd of slot.planned_dishes) {
        await this.plannedDishRepo.copyToDate(pd.id, today, slot.meal_type);
        copiedCount += 1;
      }
    }
    if (copiedCount > 0) this.invalidationTick.update((n) => n + 1);
    return { copiedCount };
  }

  /**
   * Snapshot helper for undo. Looks up the dish in the currently loaded
   * dayPlan; returns null if not found (caller decides whether to skip undo).
   */
  private captureSnapshot(plannedDishId: string): DeletedDishSnapshot | null {
    const dp = this.dayPlan();
    if (!dp) return null;
    for (const slot of dp.meal_slots) {
      const pd = slot.planned_dishes.find((d) => d.id === plannedDishId);
      if (pd) {
        return {
          meal_slot_id: pd.meal_slot_id,
          dish_id: pd.dish_id,
          dish_name: pd.dish_name,
          servings: pd.servings,
          is_completed: pd.is_completed,
        };
      }
    }
    return null;
  }

  async copyToDate(
    plannedDishId: string,
    targetDate: string,
    targetMeal: MealType,
  ): Promise<PlannedDish> {
    const created = await this.plannedDishRepo.copyToDate(plannedDishId, targetDate, targetMeal);
    this.invalidationTick.update((n) => n + 1);
    return created;
  }

  /**
   * Copy previous week's planned + logged dishes into the current week.
   * Returns counts so caller can toast the user.
   */
  async copyPreviousWeek(): Promise<{ copiedCount: number; daysAffected: number }> {
    const days = this.weekDays();
    const currentWeekStart = days[0];
    const prev = new Date(parseIsoDate(currentWeekStart).getTime() - 7 * DAY_MS);
    const prevWeekStart = formatIsoDate(prev);
    const result = await this.plannedDishRepo.copyPreviousWeek(currentWeekStart, prevWeekStart);
    this.invalidationTick.update((n) => n + 1);
    return result;
  }

  // -- internal ---------------------------------------------------------------

  private async hydrateDayPlan(date: string): Promise<void> {
    let result = await this.dayPlanRepo.findByDate(date);
    // Stale-result guard: if currentDate changed mid-fetch, drop this update.
    if (this.currentDate() !== date) return;

    if (!result) {
      await this.dayPlanRepo.getOrCreateForDate(date);
      if (this.currentDate() !== date) return;
      result = await this.dayPlanRepo.findByDate(date);
      if (!result) {
        throw new Error(`CalendarStore: failed to hydrate day plan for '${date}'`);
      }
    }

    this.dayPlan.set(result);
  }

  private async hydrateWeek(days: string[]): Promise<void> {
    const start = days[0];
    const end = days[6];
    const dayPlans = await this.dayPlanRepo.findByDateRange(start, end);
    // Stale-result guard
    const current = this.weekDays();
    if (current[0] !== start || current[6] !== end) return;

    const byDate = new Map<string, DayPlanWithSlots>();
    for (const dp of dayPlans) byDate.set(dp.date, dp);

    const todayIso = this.todayIso;
    const profileTarget = this.profileStore.profile()?.target_calories ?? 0;
    const fallbackTarget = profileTarget > 0 ? profileTarget : DEFAULT_TARGET_CAL;
    const totals: WeekDayTotal[] = days.map((date, i) => {
      const dp = byDate.get(date);
      let logged = 0;
      let planned = 0;
      let dotCount = 0;
      if (dp) {
        for (const slot of dp.meal_slots) {
          for (const pd of slot.planned_dishes) {
            dotCount += 1;
            if (pd.is_completed === 1) {
              logged += pd.effective_calories ?? 0;
            } else {
              planned += pd.effective_calories ?? 0;
            }
          }
        }
      }
      // Treat 0 as "unset" — older day_plan rows seeded target_calories=0
      // before goals were computed; fall back to user profile, then 2000.
      const rawTarget = dp?.target_calories ?? 0;
      const targetCal = rawTarget > 0 ? rawTarget : fallbackTarget;
      return {
        date,
        label: VN_DAY_LABELS[i],
        dotCount,
        loggedCal: logged,
        plannedCal: planned,
        targetCal,
        isToday: date === todayIso,
        isPast: date < todayIso,
        hasPlan: dotCount > 0,
      };
    });
    this.weekData.set(totals);
  }
}
