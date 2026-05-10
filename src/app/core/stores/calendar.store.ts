import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type {
  DayPlanWithSlots,
  MealType,
  PlannedDish,
  WeekDayTotal,
} from '../models/meal-plan.types';
import { DayPlanRepository } from '../repositories/day-plan.repository';
import { PlannedDishRepository } from '../repositories/planned-dish.repository';
import { DishStore } from './dish.store';

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

  async deleteDish(plannedDishId: string): Promise<void> {
    await this.plannedDishRepo.delete(plannedDishId);
    this.invalidationTick.update((n) => n + 1);
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
    const result = await this.dayPlanRepo.findByDate(date);
    // Stale-result guard: if currentDate changed mid-fetch, drop this update.
    if (this.currentDate() !== date) return;
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
      return {
        date,
        label: VN_DAY_LABELS[i],
        dotCount,
        loggedCal: logged,
        plannedCal: planned,
        targetCal: dp?.target_calories ?? DEFAULT_TARGET_CAL,
        isToday: date === todayIso,
        isPast: date < todayIso,
        hasPlan: dotCount > 0,
      };
    });
    this.weekData.set(totals);
  }
}
