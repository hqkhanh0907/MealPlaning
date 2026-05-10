import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { DayPlanWithSlots, MealType, PlannedDish } from '../models/meal-plan.types';
import { DayPlanRepository } from '../repositories/day-plan.repository';
import { PlannedDishRepository } from '../repositories/planned-dish.repository';
import { DishStore } from './dish.store';

const DAY_MS = 86_400_000;
const CLAMP_DAYS = 365;

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

  readonly weekDays = computed<string[]>(() => {
    const start = weekStart(this.currentDate());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return formatIsoDate(d);
    });
  });

  constructor() {
    // Auto-hydrate dayPlan when currentDate or invalidationTick changes.
    effect(() => {
      const date = this.currentDate();
      // Touch tick so the effect re-runs on bump.
      this.invalidationTick();
      void this.hydrateDayPlan(date);
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

  // -- internal ---------------------------------------------------------------

  private async hydrateDayPlan(date: string): Promise<void> {
    const result = await this.dayPlanRepo.findByDate(date);
    // Stale-result guard: if currentDate changed mid-fetch, drop this update.
    if (this.currentDate() !== date) return;
    this.dayPlan.set(result);
  }
}
