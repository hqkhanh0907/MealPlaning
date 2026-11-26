import {
  addCalendarDays,
  localIsoDate,
  mondayOfWeek,
  parseLocalDate,
  shiftIsoDate,
  weekDates,
} from '../utils/local-date';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { MEAL_CALENDAR_WINDOW_DAYS } from '../models/meal-plan.types';
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
import { IngredientStore } from './ingredient.store';
import { LocalDay } from './local-day';
import { ProfileStore } from './profile.store';

const VN_DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

export interface PendingMealTarget {
  date: string;
  mealType: MealType;
  plannedDishId: string;
}

type WeekTotals = Omit<WeekDayTotal, 'isToday' | 'isPast'>;

/** Inclusive [today-365, today+365] window per F-03 §2.D2. */
function clampDate(target: string, today: Date): string {
  const t = parseLocalDate(target);
  if (Number.isNaN(t.getTime())) return localIsoDate(today);
  const min = addCalendarDays(today, -MEAL_CALENDAR_WINDOW_DAYS);
  const max = addCalendarDays(today, MEAL_CALENDAR_WINDOW_DAYS);
  if (t < min) return localIsoDate(min);
  if (t > max) return localIsoDate(max);
  return localIsoDate(t);
}

@Injectable({ providedIn: 'root' })
export class CalendarStore {
  private readonly ingredientStore = inject(IngredientStore);
  readonly addMealForDate = signal<string | null>(null);
  readonly pendingMealNavigation = signal<PendingMealTarget | null>(null);
  private readonly dayPlanRepo = inject(DayPlanRepository);
  private readonly plannedDishRepo = inject(PlannedDishRepository);
  private readonly dishStore = inject(DishStore);
  private readonly profileStore = inject(ProfileStore);
  private readonly localDay = inject(LocalDay);
  private readonly pinnedDate = signal<string | null>(null);
  private readonly weekTotals = signal<WeekTotals[] | null>(null);

  readonly currentDate = computed(() => this.pinnedDate() ?? this.localDay.iso());
  readonly currentView = signal<'day' | 'week'>('day');
  readonly invalidationTick = signal(0);
  readonly dayPlan = signal<DayPlanWithSlots | null>(null);

  private readonly weekStart = computed(() =>
    localIsoDate(mondayOfWeek(parseLocalDate(this.currentDate()))),
  );
  readonly weekDays = computed(() => weekDates(this.weekStart()));
  readonly weekData = computed<WeekDayTotal[] | null>(() => {
    const totals = this.weekTotals();
    if (!totals || totals[0]?.date !== this.weekStart()) return null;
    const today = this.localDay.iso();
    return totals.map((day) => ({ ...day, isToday: day.date === today, isPast: day.date < today }));
  });

  constructor() {
    // Auto-hydrate dayPlan when currentDate or invalidationTick changes.
    effect(() => {
      const date = this.currentDate();
      void this.hydrateDayPlan(date, this.invalidationTick());
    });

    // Auto-hydrate weekData when currentView=week + week changes or invalidation.
    effect(() => {
      const view = this.currentView();
      const days = this.weekDays();
      if (view !== 'week') return;
      const target = this.profileStore.profile()?.target_calories ?? 0;
      void this.hydrateWeek(days, target, this.invalidationTick());
    });

    // Cross-store wiring: any DishStore mutation invalidates Calendar.
    effect(() => {
      const recipes = this.dishStore.dishChanged();
      const ingredients = this.ingredientStore.nutritionRevision();
      if (recipes > 0 || ingredients > 0) {
        this.invalidationTick.update((n) => n + 1);
      }
    });
  }

  // -- pure signal mutations --------------------------------------------------

  setDate(date: string): void {
    const clamped = clampDate(date, this.localDay.date());
    this.pinnedDate.set(clamped === this.localDay.iso() ? null : clamped);
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
    const snapshot = await this.plannedDishRepo.delete(plannedDishId);
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

  async restoreDish(snapshot: DeletedDishSnapshot): Promise<PlannedDish> {
    const created = await this.plannedDishRepo.restoreDeletedDish(snapshot);
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
  readonly copyingYesterday = signal(false);

  /**
   * Copy every planned dish from yesterday into today (same meal_type).
   * Returns count so the caller can toast.
   */
  async copyFromYesterday(): Promise<{ copiedCount: number }> {
    if (this.copyingYesterday()) return { copiedCount: 0 };
    const today = this.currentDate();
    const yesterday = shiftIsoDate(today, -1);
    this.copyingYesterday.set(true);
    try {
      const copiedCount = await this.plannedDishRepo.copyDayIntoEmpty(yesterday, today);
      if (copiedCount > 0) this.invalidationTick.update((n) => n + 1);
      return { copiedCount };
    } finally {
      this.copyingYesterday.set(false);
    }
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
    const prevWeekStart = shiftIsoDate(currentWeekStart, -7);
    const result = await this.plannedDishRepo.copyPreviousWeek(currentWeekStart, prevWeekStart);
    this.invalidationTick.update((n) => n + 1);
    return result;
  }

  // -- internal ---------------------------------------------------------------

  private async hydrateDayPlan(date: string, tick: number): Promise<void> {
    const isCurrent = (): boolean =>
      this.currentDate() === date && this.invalidationTick() === tick;
    let result = await this.dayPlanRepo.findByDate(date);
    if (!isCurrent()) return;

    if (!result) {
      await this.dayPlanRepo.getOrCreateForDate(date);
      if (!isCurrent()) return;
      result = await this.dayPlanRepo.findByDate(date);
      if (!isCurrent()) return;
      if (!result) {
        throw new Error(`CalendarStore: failed to hydrate day plan for '${date}'`);
      }
    }

    this.dayPlan.set(result);
  }

  private async hydrateWeek(days: string[], profileTarget: number, tick: number): Promise<void> {
    const start = days[0];
    const end = days[6];
    const dayPlans = await this.dayPlanRepo.findByDateRange(start, end);
    if (
      this.currentView() !== 'week' ||
      this.weekStart() !== start ||
      this.invalidationTick() !== tick ||
      profileTarget !== (this.profileStore.profile()?.target_calories ?? 0)
    )
      return;

    const byDate = new Map<string, DayPlanWithSlots>();
    for (const dp of dayPlans) byDate.set(dp.date, dp);

    const totals: WeekTotals[] = days.map((date, i) => {
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
      const rawTarget = dp?.target_calories ?? 0;
      const targetCal = rawTarget > 0 ? rawTarget : Math.max(0, profileTarget);
      return {
        date,
        label: VN_DAY_LABELS[i],
        dotCount,
        loggedCal: logged,
        plannedCal: planned,
        targetCal,
        hasPlan: dotCount > 0,
      };
    });
    this.weekTotals.set(totals);
  }
}
