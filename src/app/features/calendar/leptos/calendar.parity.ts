import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { ZERO_TOTALS } from '../../../core/models/nutrition';
import type {
  DayPlanWithSlots,
  MealType,
  PlannedDishWithEffective,
  WeekDayTotal,
} from '../../../core/models/meal-plan.types';
import { DayPlanRepository } from '../../../core/repositories/day-plan.repository';
import { MealPlanAi } from '../../../core/services/ai/meal-plan-ai';
import { MenuSuggestionAi } from '../../../core/services/ai/menu-suggestion-ai';
import { CalendarStore, type PendingMealTarget } from '../../../core/stores/calendar.store';
import { DishStore } from '../../../core/stores/dish.store';
import { LocalDay } from '../../../core/stores/local-day';
import { NetworkStore } from '../../../core/stores/network.store';
import { NutritionStore } from '../../../core/stores/nutrition.store';
import { AiAvailability } from '../../../shared/ai-availability';
import CalendarPage from '../calendar.page';
import LeptosCalendarPage from './calendar.page';

const date = '2026-11-28';
const dish: PlannedDishWithEffective = {
  id: 'plan-dish',
  dish_id: 'recipe',
  meal_slot_id: 's',
  dish_name: 'Bún bò Huế',
  sort_order: 0,
  servings: 1.5,
  is_completed: 0,
  completed_at: null,
  created_at: date,
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  fiber: null,
  effective_calories: 432.5,
  effective_protein: 28,
  effective_carbs: 33,
  effective_fat: 11,
  effective_fiber: 3,
};
const plan: DayPlanWithSlots = {
  date,
  id: 'p',
  target_calories: 1900,
  target_protein: 100,
  created_at: date,
  updated_at: null,
  meal_slots: [
    {
      id: 's',
      day_plan_id: 'p',
      meal_type: 'lunch',
      position: 1,
      created_at: date,
      planned_dishes: [
        dish,
        {
          ...dish,
          id: 'logged',
          dish_name: 'Cơm gà',
          is_completed: 1,
          completed_at: '2026-11-28 12:30:00',
          effective_calories: 321.25,
        },
      ],
    },
    {
      id: 'b',
      day_plan_id: 'p',
      meal_type: 'breakfast',
      position: 0,
      created_at: date,
      planned_dishes: [],
    },
  ],
};
function calendarFixture() {
  const currentDate = signal(date),
    currentView = signal<'day' | 'week'>('day');
  return {
    currentDate,
    currentView,
    dayPlan: signal<DayPlanWithSlots | null>(plan),
    addMealForDate: signal<string | null>(null),
    pendingMealNavigation: signal<PendingMealTarget | null>(null),
    weekDays: signal([
      '2026-11-23',
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
      date,
      '2026-11-29',
    ]),
    weekData: signal<WeekDayTotal[] | null>(null),
    setView: (v: 'day' | 'week') => currentView.set(v),
    setDate: (d: string) => currentDate.set(d),
    yesterdayHint: signal(false),
    copyingYesterday: signal(false),
    markEaten: jasmine.createSpy('markEaten').and.resolveTo(),
    unmarkEaten: jasmine.createSpy('unmarkEaten').and.resolveTo(),
    listRecentLoggedDishes: jasmine.createSpy('listRecentLoggedDishes').and.resolveTo([]),
    addDishToMeal: jasmine.createSpy('addDishToMeal').and.resolveTo(),
    copyPreviousWeek: jasmine
      .createSpy('copyPreviousWeek')
      .and.resolveTo({ copiedCount: 0, daysAffected: 0 }),
  };
}
function overview(root: HTMLElement) {
  const clean = (value: string | null) => value?.replace(/\s+/g, ' ').trim();
  const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
  return {
    chip: clean(root.querySelector('.calendar-date-chip')?.textContent ?? null),
    controls: all(
      '.calendar-view-toggle,.calendar-swipe-area button,.week-view button,.undo-toast button',
    ).map((el) => [
      clean(el.getAttribute('aria-label') ?? el.textContent),
      (el as HTMLButtonElement).disabled,
    ]),
    captions: all(
      '.day-summary-card__metric-value,.day-summary-card__metric-note,.day-summary-card__metric-label,.day-summary-card__eyebrow,.empty-day h2,.empty-day__subtitle,.meal-slot__label,.meal-slot__total,.meal-slot__cal,.meal-slot__servings,.status-pill__label,.meal-slot__empty,.calendar-loading,.week-view__range,.week-view__title,.day-row__label-name,.day-row__today-pill,.day-row__cal-num,.day-row__cal-cap,.day-row__cal-type',
    ).map((el) => clean(el.textContent)),
    actions: all('[data-planned-dish-action]').map((el) => el.dataset['plannedDishAction']),
  };
}
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 20));
describe('Calendar page Angular and Leptos', () => {
  it('matches actual Angular views and forwards dish actions and date handoffs', async () => {
    const store = calendarFixture();
    const online = signal(true),
      issue = signal<string | null>(null);
    const totals = signal({ ...ZERO_TOTALS, calories: 733.5, protein: 43.7, fiber: 10 });
    const targets = signal({ ...ZERO_TOTALS, calories: 1900, protein: 100, fiber: 25 });
    await TestBed.configureTestingModule({
      imports: [CalendarPage, LeptosCalendarPage],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        { provide: CalendarStore, useValue: store },
        { provide: DayPlanRepository, useValue: { findByDate: async () => null } },
        {
          provide: DishStore,
          useValue: { dishes: signal([]), loading: signal(false), load: async () => undefined },
        },
        {
          provide: NutritionStore,
          useValue: {
            today: totals,
            targets,
            loading: signal(false),
            keyMetric: signal('calories'),
          },
        },
        { provide: AiAvailability, useValue: { textIssue: issue } },
        { provide: NetworkStore, useValue: { online } },
        { provide: MealPlanAi, useValue: {} },
        { provide: MenuSuggestionAi, useValue: {} },
      ],
    }).compileComponents();
    TestBed.inject(LocalDay).iso.set(date);
    const old = TestBed.createComponent(CalendarPage),
      next = TestBed.createComponent(LeptosCalendarPage);
    const legacy: HTMLElement = old.nativeElement,
      rust: HTMLElement = next.nativeElement;
    async function compare() {
      old.detectChanges();
      next.detectChanges();
      await settle();
      expect(overview(rust)).toEqual(overview(legacy));
    }
    await compare();
    await next.whenStable();
    await compare();
    expect(rust.querySelector('[data-calendar-renderer=leptos]')).not.toBeNull();
    expect(rust.querySelector('app-calendar')).toBeNull();
    const rows = [legacy, rust].map((root) => root.querySelector<HTMLElement>('.meal-slot__row')!);
    for (const row of rows) {
      row.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      row.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 520));
    expect(old.componentInstance.contextMenu()).toBeNull();
    expect(next.componentInstance.contextMenu()).toBeNull();
    for (const row of rows) row.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await new Promise<void>((resolve) => setTimeout(resolve, 520));
    expect(next.componentInstance.contextMenu()).toEqual(old.componentInstance.contextMenu());
    expect(next.componentInstance.contextMenu()?.plannedDishId).toBe('plan-dish');
    for (const p of [old.componentInstance, next.componentInstance]) p.onContextMenuDismiss();
    for (const row of rows) {
      row.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      row.querySelector<HTMLElement>('.meal-slot__options')!.click();
    }
    expect(next.componentInstance.contextMenu()).toBeNull();
    expect(old.componentInstance.contextMenu()).toBeNull();
    for (const q of [
      '[data-planned-dish-action="plan-dish"]',
      '[data-planned-dish-action="logged"]',
      '.meal-slot__options',
    ]) {
      for (const root of [legacy, rust]) root.querySelector<HTMLElement>(q)!.click();
      await compare();
      expect(next.componentInstance.pendingConfirm()).toEqual(
        old.componentInstance.pendingConfirm(),
      );
      expect(next.componentInstance.contextMenu()).toEqual(old.componentInstance.contextMenu());
      for (const c of [old.componentInstance, next.componentInstance]) {
        if (c.pendingConfirm()) await c.onConfirm();
        c.onContextMenuDismiss();
      }
    }
    expect(store.markEaten.calls.allArgs()).toEqual([['plan-dish'], ['plan-dish']]);
    expect(store.unmarkEaten.calls.allArgs()).toEqual([['logged'], ['logged']]);
    for (const root of [legacy, rust])
      root.querySelector<HTMLElement>('.day-summary-card__detail-toggle')!.click();
    await compare();
    store.dayPlan.set({ ...plan, meal_slots: [] });
    await compare();
    online.set(false);
    issue.set('Cần kết nối mạng');
    await compare();
    store.dayPlan.set(null);
    await compare();
    store.setView('week');
    await compare();
    store.weekData.set([
      {
        date,
        label: 'T7',
        isToday: true,
        isPast: false,
        hasPlan: true,
        dotCount: 8,
        loggedCal: 100,
        plannedCal: 1234.5,
        targetCal: 1900,
      },
    ]);
    await compare();
    const target = { date, mealType: 'lunch' as MealType, plannedDishId: 'plan-dish' };
    store.pendingMealNavigation.set(target);
    const instance = next.componentInstance;
    instance.ionViewWillEnter();
    instance.ionViewDidEnter();
    expect(store.pendingMealNavigation()).toBeNull();
    expect(store.currentView()).toBe('day');
    await compare();
    store.dayPlan.set(plan);
    await compare();
    await settle();
    expect(document.activeElement).toBe(
      rust.querySelector('[data-planned-dish-action="plan-dish"]'),
    );
    old.destroy();
    next.destroy();
  });
});
