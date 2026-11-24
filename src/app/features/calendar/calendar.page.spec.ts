import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import type { DayPlanWithSlots, PlannedDishWithEffective } from '../../core/models/meal-plan.types';
import { DayPlanRepository } from '../../core/repositories/day-plan.repository';
import { MealPlanAi } from '../../core/services/ai/meal-plan-ai';
import { MenuSuggestionAi } from '../../core/services/ai/menu-suggestion-ai';
import { CalendarStore } from '../../core/stores/calendar.store';
import { DishStore } from '../../core/stores/dish.store';
import { NetworkStore } from '../../core/stores/network.store';
import { NutritionStore } from '../../core/stores/nutrition.store';
import CalendarPage from './calendar.page';

const DATE = '2026-05-11';
const DISH: PlannedDishWithEffective = {
  id: 'planned-dish',
  meal_slot_id: 'breakfast-slot',
  dish_id: 'dish',
  servings: 1,
  sort_order: 0,
  is_completed: 0,
  completed_at: null,
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  fiber: null,
  created_at: DATE,
  dish_name: 'Phở',
  effective_calories: 450,
  effective_protein: 30,
  effective_carbs: 50,
  effective_fat: 12,
  effective_fiber: 5,
};

const PLAN: DayPlanWithSlots = {
  id: 'day',
  date: DATE,
  target_calories: 2000,
  target_protein: 100,
  created_at: DATE,
  updated_at: null,
  meal_slots: [
    {
      id: 'breakfast-slot',
      day_plan_id: 'day',
      created_at: DATE,
      meal_type: 'breakfast',
      position: 0,
      planned_dishes: [DISH],
    },
    {
      id: 'lunch-slot',
      day_plan_id: 'day',
      created_at: DATE,
      meal_type: 'lunch',
      position: 1,
      planned_dishes: [],
    },
  ],
};

describe('CalendarPage', () => {
  let fixture: ComponentFixture<CalendarPage>;
  let page: CalendarPage;
  let store: jasmine.SpyObj<CalendarStore>;

  function click(selector: string): void {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(selector);
    expect(button).withContext(selector).not.toBeNull();
    button?.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    store = jasmine.createSpyObj<CalendarStore>(
      'CalendarStore',
      ['copyPreviousWeek', 'moveDish', 'copyToDate'],
      {
        currentDate: signal(DATE),
        currentView: signal('week'),
        dayPlan: signal(PLAN),
        weekDays: signal([
          DATE,
          '2026-05-12',
          '2026-05-13',
          '2026-05-14',
          '2026-05-15',
          '2026-05-16',
          '2026-05-17',
        ]),
        weekData: signal([]),
        yesterdayHint: signal(false),
      },
    );
    store.copyPreviousWeek.and.resolveTo({ copiedCount: 1, daysAffected: 1 });
    store.moveDish.and.resolveTo();
    store.copyToDate.and.resolveTo(DISH);

    await TestBed.configureTestingModule({
      imports: [CalendarPage],
      providers: [
        { provide: Router, useValue: {} },
        { provide: CalendarStore, useValue: store },
        { provide: DayPlanRepository, useValue: { findByDate: async () => null } },
        { provide: DishStore, useValue: { dishes: signal([]), loading: signal(false) } },
        { provide: NetworkStore, useValue: { online: signal(true) } },
        { provide: NutritionStore, useValue: {} },
        { provide: MealPlanAi, useValue: {} },
        { provide: MenuSuggestionAi, useValue: {} },
        {
          provide: ToastController,
          useValue: { create: async () => ({ present: () => Promise.resolve() }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarPage);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('moves the selected dish once after its context menu closes', async () => {
    page.onDishLongPress(DISH.id, 'breakfast');
    page.onContextAction('move');
    page.onContextMenuDismiss();

    expect(page.contextMenuOpen()).toBeFalse();
    expect(page.slotPickerCurrent()).toBe('breakfast');
    await Promise.all([page.onSlotPicked('lunch'), page.onSlotPicked('lunch')]);

    expect(store.moveDish).toHaveBeenCalledOnceWith(DISH.id, 'lunch-slot');
    expect(page.slotPickerOpen()).toBeFalse();
  });

  it('copies the selected dish to the same meal type on the chosen date once', async () => {
    page.onDishLongPress(DISH.id, 'breakfast');
    page.onContextAction('copy');
    page.onContextMenuDismiss();

    await page.onCopyDatePicked(DATE);
    expect(store.copyToDate).not.toHaveBeenCalled();
    expect(page.copyToDatePickerOpen()).toBeTrue();
    await Promise.all([page.onCopyDatePicked('2026-05-12'), page.onCopyDatePicked('2026-05-12')]);

    expect(store.copyToDate).toHaveBeenCalledOnceWith(DISH.id, '2026-05-12', 'breakfast');
    expect(page.copyToDatePickerOpen()).toBeFalse();
  });

  it('clears both pending dish actions when their picker is dismissed', async () => {
    page.onDishLongPress(DISH.id, 'breakfast');
    page.onContextAction('move');
    page.onSlotPickerDismiss();
    await page.onSlotPicked('lunch');

    page.onDishLongPress(DISH.id, 'breakfast');
    page.onContextAction('copy');
    page.onCopyDatePickerDismiss();
    await page.onCopyDatePicked('2026-05-12');

    expect(store.moveDish).not.toHaveBeenCalled();
    expect(store.copyToDate).not.toHaveBeenCalled();
  });

  it('copies the previous week only after accepting the replacement warning', async () => {
    click('.week-view__copy-btn');
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')?.textContent).toContain(
      'Món đã ăn',
    );
    expect(store.copyPreviousWeek).not.toHaveBeenCalled();

    click('.dialog-btn-cancel');
    expect(store.copyPreviousWeek).not.toHaveBeenCalled();

    click('.week-view__copy-btn');
    click('.dialog-btn-danger');
    await fixture.whenStable();

    expect(store.copyPreviousWeek).toHaveBeenCalledTimes(1);
  });
});
