import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular/standalone';
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
  let alertCtrl: jasmine.SpyObj<AlertController>;

  function click(selector: string): void {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(selector);
    expect(button).withContext(selector).not.toBeNull();
    button?.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    store = jasmine.createSpyObj<CalendarStore>(
      'CalendarStore',
      [
        'copyPreviousWeek',
        'moveDish',
        'copyToDate',
        'editServings',
        'replaceCurrentDatePlan',
        'setDate',
        'setView',
      ],
      {
        currentDate: signal(DATE),
        currentView: signal('week'),
        dayPlan: signal(PLAN),
        addMealForDate: signal(null),
        pendingMealNavigation: signal(null),
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
        copyingYesterday: signal(false),
      },
    );
    store.copyPreviousWeek.and.resolveTo({ copiedCount: 1, daysAffected: 1 });
    store.moveDish.and.resolveTo();
    store.copyToDate.and.resolveTo(DISH);
    store.editServings.and.resolveTo();
    store.setDate.and.callFake((date) => store.currentDate.set(date));
    store.setView.and.callFake((view) => store.currentView.set(view));
    alertCtrl = jasmine.createSpyObj<AlertController>('AlertController', ['create']);
    alertCtrl.create.and.resolveTo({ present: async () => undefined } as HTMLIonAlertElement);

    await TestBed.configureTestingModule({
      imports: [CalendarPage],
      providers: [
        { provide: Router, useValue: {} },
        { provide: CalendarStore, useValue: store },
        { provide: DayPlanRepository, useValue: { findByDate: async () => null } },
        {
          provide: DishStore,
          useValue: { dishes: signal([]), loading: signal(false), load: async () => undefined },
        },
        { provide: NetworkStore, useValue: { online: signal(true) } },
        {
          provide: NutritionStore,
          useValue: {
            targets: signal({}),
            today: signal({}),
            loading: signal(false),
            keyMetric: signal('calories'),
          },
        },
        { provide: MealPlanAi, useValue: {} },
        { provide: MenuSuggestionAi, useValue: {} },
        { provide: AlertController, useValue: alertCtrl },
        {
          provide: ToastController,
          useValue: {
            create: async () => ({ present: async () => undefined, dismiss: async () => true }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarPage);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('reveals the requested dish after the reused calendar opens the requested day', () => {
    const staleDate = '2026-05-12';
    store.currentDate.set(staleDate);
    store.dayPlan.set({ ...PLAN, date: staleDate });
    const scroll = spyOn(HTMLElement.prototype, 'scrollIntoView');
    const focus = spyOn(HTMLElement.prototype, 'focus');
    store.pendingMealNavigation.set({ date: DATE, mealType: 'lunch', plannedDishId: 'lunch-dish' });

    page.ionViewWillEnter();
    page.ionViewDidEnter();
    fixture.detectChanges();

    expect(store.pendingMealNavigation()).toBeNull();
    expect(store.currentDate()).toBe(DATE);
    expect(store.currentView()).toBe('day');
    expect(scroll).not.toHaveBeenCalled();

    store.dayPlan.set({
      ...PLAN,
      meal_slots: [
        PLAN.meal_slots[0],
        {
          ...PLAN.meal_slots[1],
          planned_dishes: [{ ...DISH, id: 'lunch-dish', meal_slot_id: 'lunch-slot' }],
        },
      ],
    });
    fixture.detectChanges();

    const target = fixture.nativeElement.querySelector('[data-planned-dish-action="lunch-dish"]');
    expect(scroll).toHaveBeenCalledOnceWith({ block: 'center', behavior: 'instant' });
    expect(scroll.calls.mostRecent().object).toBe(target);
    expect(focus).toHaveBeenCalledOnceWith({ preventScroll: true });

    page.ionViewWillLeave();
    page.ionViewWillEnter();
    page.ionViewDidEnter();
    fixture.detectChanges();

    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it('leaves the newly selected date untouched when a prior day plan arrives', async () => {
    const dishes = TestBed.inject(DishStore);
    const dish = { id: 'dish', name: 'Phở' } as ReturnType<typeof dishes.dishes>[number];
    dishes.dishes.set([dish]);
    const ai = TestBed.inject(MealPlanAi);
    let requested!: () => void;
    const started = new Promise<void>((resolve) => (requested = resolve));
    let answer!: (rows: Awaited<ReturnType<MealPlanAi['planDay']>>) => void;
    ai.planDay = () => {
      requested();
      return new Promise((resolve) => (answer = resolve));
    };
    const pending = page.onAiCta();
    await started;
    store.currentDate.set('2026-05-12');
    answer([{ mealType: 'lunch', dishId: 'dish', servings: 1, reason: 'Món thử' }]);
    await pending;
    expect(store.replaceCurrentDatePlan).not.toHaveBeenCalled();
  });

  it('preserves the plan when a logged meal changes while AI is answering', async () => {
    const dishes = TestBed.inject(DishStore);
    dishes.dishes.set([{ id: 'dish', name: 'Phở' } as ReturnType<typeof dishes.dishes>[number]]);
    const repository = TestBed.inject(DayPlanRepository);
    let day = PLAN;
    spyOn(repository, 'findByDate').and.callFake(async (date) => (date === DATE ? day : null));
    const ai = TestBed.inject(MealPlanAi);
    ai.planDay = async () => {
      day = {
        ...PLAN,
        meal_slots: [
          {
            ...PLAN.meal_slots[0],
            planned_dishes: [
              { ...DISH, is_completed: 1, completed_at: DATE, calories: 500, protein: 25 },
            ],
          },
        ],
      };
      return [{ mealType: 'lunch', dishId: 'dish', servings: 1, reason: 'Lịch cũ' }];
    };
    await page.onAiCta();
    expect(store.replaceCurrentDatePlan).not.toHaveBeenCalled();
  });

  it('sends only stored meal snapshots and keeps the existing plan for an empty suggestion', async () => {
    const dishes = TestBed.inject(DishStore);
    dishes.dishes.set([{ id: 'dish', name: 'Phở' } as ReturnType<typeof dishes.dishes>[number]]);
    const recorded: PlannedDishWithEffective = {
      ...DISH,
      id: 'eaten',
      is_completed: 1,
      completed_at: DATE,
      calories: 500,
      protein: 25,
      carbs: 60,
      fat: 10,
      fiber: null,
    };
    const day: DayPlanWithSlots = {
      ...PLAN,
      meal_slots: [{ ...PLAN.meal_slots[0], planned_dishes: [DISH, recorded] }],
    };
    spyOn(TestBed.inject(DayPlanRepository), 'findByDate').and.callFake(async (date) =>
      date === DATE ? day : null,
    );
    const ai = TestBed.inject(MealPlanAi);
    ai.planDay = async (input) => {
      expect(input.logged).toEqual({ calories: 500, protein: 25, carbs: 60, fat: 10, fiber: null });
      expect(input.loggedMeals).toEqual(['breakfast']);
      return [];
    };
    await page.onAiCta();
    expect(store.replaceCurrentDatePlan).not.toHaveBeenCalled();
  });

  it('discards dish suggestions when the picker switches to a different meal', async () => {
    const dishes = TestBed.inject(DishStore);
    dishes.dishes.set([{ id: 'dish', name: 'Phở' } as ReturnType<typeof dishes.dishes>[number]]);
    const ai = TestBed.inject(MenuSuggestionAi);
    let started!: () => void;
    const called = new Promise<void>((resolve) => (started = resolve));
    let reply!: (items: Awaited<ReturnType<MenuSuggestionAi['suggest']>>) => void;
    ai.suggest = () => {
      started();
      return new Promise((resolve) => (reply = resolve));
    };
    page.loggingModalOpen.set(true);
    const pending = page.onLoggingAiSuggestionsRequested();
    await called;
    page.loggingMealType.set('lunch');
    reply([{ dishId: 'dish', dishName: 'Phở', servings: 1, reason: 'Bữa sáng' }]);
    await pending;
    expect(page.loggingAiSuggestions()).toEqual([]);
    expect(page.loggingAiLoading()).toBeFalse();
  });

  it('edits a planned dish only after validating the selected servings', async () => {
    page.onDishLongPress(DISH.id, 'breakfast');
    expect(page.contextMenuCanEditServings()).toBeTrue();
    page.onContextAction('servings');

    const options = alertCtrl.create.calls.mostRecent().args[0];
    expect(options?.inputs?.[0].value).toBe(DISH.servings);
    const save = options?.buttons?.[1];
    if (!save || typeof save === 'string' || !save.handler) {
      fail('Missing servings save button');
      return;
    }
    expect(await save.handler({ servings: '0' })).toBeFalse();
    expect(store.editServings).not.toHaveBeenCalled();
    expect(await save.handler({ servings: '2.5' })).toBeTrue();
    expect(store.editServings).toHaveBeenCalledOnceWith(DISH.id, 2.5);
  });

  it('keeps logged dishes out of the servings editor', () => {
    store.dayPlan.set({
      ...PLAN,
      meal_slots: [
        {
          ...PLAN.meal_slots[0],
          planned_dishes: [{ ...DISH, is_completed: 1, completed_at: DATE }],
        },
      ],
    });
    page.onDishLongPress(DISH.id, 'breakfast');
    expect(page.contextMenuCanEditServings()).toBeFalse();
    page.onContextAction('servings');
    expect(alertCtrl.create).not.toHaveBeenCalled();
    expect(store.editServings).not.toHaveBeenCalled();
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
