import { TestBed } from '@angular/core/testing';
import { ApplicationRef, signal } from '@angular/core';
import type { DayPlanWithSlots, PlannedDish } from '../models/meal-plan.types';
import { DayPlanRepository } from '../repositories/day-plan.repository';
import { PlannedDishRepository } from '../repositories/planned-dish.repository';
import { CalendarStore } from './calendar.store';
import { DishStore } from './dish.store';

describe('CalendarStore', () => {
  let store: CalendarStore;
  let dayPlanRepo: jasmine.SpyObj<DayPlanRepository>;
  let plannedDishRepo: jasmine.SpyObj<PlannedDishRepository>;
  let dishChangedSignal: ReturnType<typeof signal<number>>;

  const samplePlanned: PlannedDish = {
    id: 'pd-1',
    meal_slot_id: 's-1',
    dish_id: 'd-1',
    servings: 1,
    sort_order: 0,
    is_completed: 0,
    completed_at: null,
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    created_at: '2026-05-10T00:00:00Z',
  };

  const sampleDayPlan: DayPlanWithSlots = {
    id: 'dp-1',
    date: '2026-05-10',
    target_calories: 0,
    target_protein: 0,
    created_at: '2026-05-10T00:00:00Z',
    updated_at: null,
    meal_slots: [],
  };

  /** Helper: drive Angular's effect scheduler via tick + microtasks. */
  async function flush(): Promise<void> {
    TestBed.inject(ApplicationRef).tick();
    await Promise.resolve();
    TestBed.inject(ApplicationRef).tick();
    await Promise.resolve();
  }

  beforeEach(() => {
    dayPlanRepo = jasmine.createSpyObj<DayPlanRepository>('DayPlanRepository', [
      'getOrCreateForDate',
      'findByDate',
      'findByDateRange',
    ]);
    plannedDishRepo = jasmine.createSpyObj<PlannedDishRepository>('PlannedDishRepository', [
      'addToSlot',
      'markCompleted',
      'unmarkCompleted',
      'editServings',
      'delete',
      'moveToSlot',
      'copyToDate',
      'listRecentLogged',
    ]);
    dishChangedSignal = signal(0);

    dayPlanRepo.findByDate.and.returnValue(Promise.resolve(sampleDayPlan));
    plannedDishRepo.addToSlot.and.returnValue(Promise.resolve(samplePlanned));
    plannedDishRepo.markCompleted.and.returnValue(Promise.resolve());
    plannedDishRepo.unmarkCompleted.and.returnValue(Promise.resolve());
    plannedDishRepo.editServings.and.returnValue(Promise.resolve());
    plannedDishRepo.delete.and.returnValue(Promise.resolve());
    plannedDishRepo.copyToDate.and.returnValue(Promise.resolve(samplePlanned));

    TestBed.configureTestingModule({
      providers: [
        CalendarStore,
        { provide: DayPlanRepository, useValue: dayPlanRepo },
        { provide: PlannedDishRepository, useValue: plannedDishRepo },
        { provide: DishStore, useValue: { dishChanged: dishChangedSignal } },
      ],
    });
    store = TestBed.inject(CalendarStore);
  });

  describe('default state', () => {
    it('exposes today as currentDate, day view, tick=0', () => {
      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(store.currentDate()).toBe(expected);
      expect(store.currentView()).toBe('day');
      expect(store.invalidationTick()).toBe(0);
    });
  });

  describe('setDate clamp', () => {
    it('accepts a date inside the [today-365, today+365] window', () => {
      const today = new Date();
      const inWindow = new Date(today.getTime() + 30 * 86_400_000);
      const iso = `${inWindow.getFullYear()}-${String(inWindow.getMonth() + 1).padStart(2, '0')}-${String(inWindow.getDate()).padStart(2, '0')}`;
      store.setDate(iso);
      expect(store.currentDate()).toBe(iso);
    });

    it('clamps a date past today+365 to today+365', () => {
      const today = new Date();
      store.setDate('2099-01-01');
      const max = new Date(today.getTime() + 365 * 86_400_000);
      const expected = `${max.getFullYear()}-${String(max.getMonth() + 1).padStart(2, '0')}-${String(max.getDate()).padStart(2, '0')}`;
      expect(store.currentDate()).toBe(expected);
    });

    it('clamps a date before today-365 to today-365', () => {
      const today = new Date();
      store.setDate('1990-01-01');
      const min = new Date(today.getTime() - 365 * 86_400_000);
      const expected = `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(2, '0')}-${String(min.getDate()).padStart(2, '0')}`;
      expect(store.currentDate()).toBe(expected);
    });
  });

  describe('setView', () => {
    it('toggles between day and week views', () => {
      store.setView('week');
      expect(store.currentView()).toBe('week');
      store.setView('day');
      expect(store.currentView()).toBe('day');
    });
  });

  describe('weekDays computed', () => {
    it('returns 7 ISO dates Monday → Sunday for the week containing currentDate', () => {
      // 2026-05-10 is a Sunday → week is Mon 2026-05-04 .. Sun 2026-05-10.
      store.setDate('2026-05-10');
      const expected = [
        '2026-05-04',
        '2026-05-05',
        '2026-05-06',
        '2026-05-07',
        '2026-05-08',
        '2026-05-09',
        '2026-05-10',
      ];
      expect(store.weekDays()).toEqual(expected);
    });

    it('handles a Monday currentDate (week starts on the same day)', () => {
      store.setDate('2026-05-04'); // Monday
      expect(store.weekDays()[0]).toBe('2026-05-04');
      expect(store.weekDays()[6]).toBe('2026-05-10');
    });
  });

  describe('mutations bump invalidationTick after repo (AC-2 + AC-6)', () => {
    it('addDish: tx FIRST, signal LAST', async () => {
      const before = store.invalidationTick();
      await store.addDish('s-1', 'd-1', 1);
      expect(plannedDishRepo.addToSlot).toHaveBeenCalledWith('s-1', 'd-1', 1);
      expect(store.invalidationTick()).toBe(before + 1);
    });

    it('markEaten bumps tick', async () => {
      const before = store.invalidationTick();
      await store.markEaten('pd-1');
      expect(plannedDishRepo.markCompleted).toHaveBeenCalledWith('pd-1');
      expect(store.invalidationTick()).toBe(before + 1);
    });

    it('unmarkEaten bumps tick', async () => {
      const before = store.invalidationTick();
      await store.unmarkEaten('pd-1');
      expect(plannedDishRepo.unmarkCompleted).toHaveBeenCalledWith('pd-1');
      expect(store.invalidationTick()).toBe(before + 1);
    });

    it('editServings bumps tick', async () => {
      const before = store.invalidationTick();
      await store.editServings('pd-1', 2);
      expect(plannedDishRepo.editServings).toHaveBeenCalledWith('pd-1', 2);
      expect(store.invalidationTick()).toBe(before + 1);
    });

    it('deleteDish bumps tick', async () => {
      const before = store.invalidationTick();
      await store.deleteDish('pd-1');
      expect(plannedDishRepo.delete).toHaveBeenCalledWith('pd-1');
      expect(store.invalidationTick()).toBe(before + 1);
    });

    it('copyToDate bumps tick', async () => {
      const before = store.invalidationTick();
      await store.copyToDate('pd-1', '2026-05-12', 'lunch');
      expect(plannedDishRepo.copyToDate).toHaveBeenCalledWith('pd-1', '2026-05-12', 'lunch');
      expect(store.invalidationTick()).toBe(before + 1);
    });
  });

  describe('mutation rollback on repo throw (AC-6 R-A3)', () => {
    it('does NOT bump tick when repo rejects', async () => {
      plannedDishRepo.addToSlot.and.returnValue(Promise.reject(new Error('CHECK failed')));
      const before = store.invalidationTick();

      await expectAsync(store.addDish('s-1', 'd-1', 1)).toBeRejected();

      expect(store.invalidationTick()).toBe(before);
    });
  });

  describe('cross-store wiring (AC-4)', () => {
    it('bumps invalidationTick when DishStore.dishChanged advances', async () => {
      const before = store.invalidationTick();
      dishChangedSignal.set(1);
      await flush();
      expect(store.invalidationTick()).toBeGreaterThan(before);
    });
  });

  describe('hydration effect (AC-7)', () => {
    it('calls dayPlanRepo.findByDate when currentDate changes and updates dayPlan signal', async () => {
      dayPlanRepo.findByDate.calls.reset();
      store.setDate('2026-05-12');
      await flush();
      expect(dayPlanRepo.findByDate).toHaveBeenCalledWith('2026-05-12');
      expect(store.dayPlan()).toEqual(sampleDayPlan);
    });
  });
});
