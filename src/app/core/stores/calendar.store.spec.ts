import { TestBed } from '@angular/core/testing';
import { ApplicationRef, signal } from '@angular/core';
import type { DayPlanWithSlots, PlannedDish } from '../models/meal-plan.types';
import { DayPlanRepository } from '../repositories/day-plan.repository';
import { PlannedDishRepository } from '../repositories/planned-dish.repository';
import { shiftIsoDate } from '../utils/local-date';
import { CalendarStore } from './calendar.store';
import { DishStore } from './dish.store';
import { IngredientStore } from './ingredient.store';
import { LocalDay } from './local-day';
import { ProfileStore } from './profile.store';

describe('CalendarStore', () => {
  let store: CalendarStore;
  let localDay: LocalDay;
  let dayPlanRepo: jasmine.SpyObj<DayPlanRepository>;
  let plannedDishRepo: jasmine.SpyObj<PlannedDishRepository>;
  let dishChangedSignal: ReturnType<typeof signal<number>>;
  let ingredientRevision: ReturnType<typeof signal<number>>;
  let profile: ReturnType<typeof signal<{ target_calories: number } | null>>;

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
    fiber: null,
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
      'addToDateMealType',
      'replaceDatePlan',
      'markCompleted',
      'unmarkCompleted',
      'editServings',
      'delete',
      'restoreDeletedDish',
      'moveToSlot',
      'copyToDate',
      'copyDayIntoEmpty',
      'listRecentLogged',
    ]);
    dishChangedSignal = signal(0);
    ingredientRevision = signal(0);
    profile = signal<{ target_calories: number } | null>(null);

    dayPlanRepo.findByDate.and.returnValue(Promise.resolve(sampleDayPlan));
    plannedDishRepo.addToSlot.and.returnValue(Promise.resolve(samplePlanned));
    plannedDishRepo.addToDateMealType.and.returnValue(Promise.resolve(samplePlanned));
    plannedDishRepo.replaceDatePlan.and.returnValue(Promise.resolve(2));
    plannedDishRepo.markCompleted.and.returnValue(Promise.resolve());
    plannedDishRepo.unmarkCompleted.and.returnValue(Promise.resolve());
    plannedDishRepo.editServings.and.returnValue(Promise.resolve());
    plannedDishRepo.delete.and.resolveTo(null);
    plannedDishRepo.restoreDeletedDish.and.resolveTo(samplePlanned);
    plannedDishRepo.copyToDate.and.returnValue(Promise.resolve(samplePlanned));
    plannedDishRepo.listRecentLogged.and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      providers: [
        CalendarStore,
        { provide: DayPlanRepository, useValue: dayPlanRepo },
        { provide: PlannedDishRepository, useValue: plannedDishRepo },
        { provide: DishStore, useValue: { dishChanged: dishChangedSignal } },
        { provide: IngredientStore, useValue: { nutritionRevision: ingredientRevision } },
        { provide: ProfileStore, useValue: { profile } },
      ],
    });
    localDay = TestBed.inject(LocalDay);
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

  describe('local day changes', () => {
    it('loads the new local day while following Today', async () => {
      dayPlanRepo.findByDate.and.callFake(async (date) => ({ ...sampleDayPlan, date }));
      const previous = localDay.iso();
      await flush();
      expect(store.dayPlan()?.date).toBe(previous);

      const next = shiftIsoDate(previous, 1);
      localDay.iso.set(next);
      await flush();

      expect(store.currentDate()).toBe(next);
      expect(store.dayPlan()?.date).toBe(next);
    });

    it('keeps a pinned date until the user chooses Today again', () => {
      const previous = localDay.iso();
      const pinned = shiftIsoDate(previous, 1);
      store.setDate(pinned);

      localDay.iso.set(pinned);
      expect(store.currentDate()).toBe(pinned);
      const next = shiftIsoDate(pinned, 1);
      localDay.iso.set(next);
      expect(store.currentDate()).toBe(pinned);

      store.setDate(next);
      const following = shiftIsoDate(next, 1);
      localDay.iso.set(following);
      expect(store.currentDate()).toBe(following);
    });

    it('clamps navigation using the new day', () => {
      localDay.iso.set('2026-11-30');

      store.setDate('2099-01-01');
      expect(store.currentDate()).toBe('2027-11-30');
      store.setDate('1990-01-01');
      expect(store.currentDate()).toBe('2025-11-30');
      store.setDate('2026-02-30');
      expect(store.currentDate()).toBe('2026-11-30');
    });

    it('updates past and Today markers in the same pinned week', async () => {
      localDay.iso.set('2026-11-25');
      store.setDate('2026-11-23');
      dayPlanRepo.findByDateRange.and.resolveTo([]);
      store.setView('week');
      await flush();
      expect(store.weekData()?.find((day) => day.isToday)?.date).toBe('2026-11-25');

      localDay.iso.set('2026-11-26');
      await flush();

      expect(store.currentDate()).toBe('2026-11-23');
      expect(store.weekData()?.find((day) => day.isToday)?.date).toBe('2026-11-26');
      expect(store.weekData()?.find((day) => day.date === '2026-11-25')?.isPast).toBeTrue();
    });

    it('loads the new week when Sunday rolls into Monday in Today mode', async () => {
      localDay.iso.set('2026-11-29');
      dayPlanRepo.findByDateRange.and.resolveTo([]);
      store.setView('week');
      await flush();
      expect(store.weekData()?.[0].date).toBe('2026-11-23');

      localDay.iso.set('2026-11-30');
      await flush();

      expect(store.weekData()?.[0]).toEqual(
        jasmine.objectContaining({ date: '2026-11-30', isToday: true }),
      );
      expect(store.weekData()?.[6].date).toBe('2026-12-06');
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

    it('addDishToMeal creates date/meal precondition through repository', async () => {
      store.setDate('2026-05-10');
      const before = store.invalidationTick();
      await store.addDishToMeal('lunch', 'd-1', 1.5);
      expect(plannedDishRepo.addToDateMealType).toHaveBeenCalledWith(
        '2026-05-10',
        'lunch',
        'd-1',
        1.5,
      );
      expect(store.invalidationTick()).toBe(before + 1);
    });

    it('markEaten bumps tick', async () => {
      const before = store.invalidationTick();
      await store.markEaten('pd-1');
      expect(plannedDishRepo.markCompleted).toHaveBeenCalledWith('pd-1');
      expect(store.invalidationTick()).toBe(before + 1);
    });

    it('replaceCurrentDatePlan replaces planned rows through repository and bumps tick', async () => {
      store.setDate('2026-05-10');
      const before = store.invalidationTick();
      const items = [
        { mealType: 'breakfast' as const, dishId: 'd-1', servings: 1 },
        { mealType: 'lunch' as const, dishId: 'd-2', servings: 1.5 },
      ];

      const result = await store.replaceCurrentDatePlan(items);

      expect(result).toBe(2);
      expect(plannedDishRepo.replaceDatePlan).toHaveBeenCalledWith('2026-05-10', items);
      expect(store.invalidationTick()).toBe(before + 1);
    });

    it('listRecentLoggedDishes reads through repository without mutating calendar state', async () => {
      const before = store.invalidationTick();
      const result = await store.listRecentLoggedDishes(12);

      expect(result).toEqual([]);
      expect(plannedDishRepo.listRecentLogged).toHaveBeenCalledWith(12);
      expect(store.invalidationTick()).toBe(before);
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
    it('discards an old day after its delayed second read', async () => {
      const oldDate = '2026-05-12';
      const newDate = '2026-05-13';
      let finishOldDay!: (day: DayPlanWithSlots) => void;
      const pendingOldDay = new Promise<DayPlanWithSlots>((resolve) => (finishOldDay = resolve));
      dayPlanRepo.findByDate.and.returnValues(
        Promise.resolve(null),
        pendingOldDay,
        Promise.resolve({ ...sampleDayPlan, date: newDate }),
      );
      dayPlanRepo.getOrCreateForDate.and.resolveTo({ ...sampleDayPlan, date: oldDate });

      store.setDate(oldDate);
      await flush();
      expect(dayPlanRepo.findByDate).toHaveBeenCalledTimes(2);
      store.setDate(newDate);
      await flush();
      expect(store.dayPlan()?.date).toBe(newDate);

      finishOldDay({ ...sampleDayPlan, date: oldDate });
      await flush();
      expect(store.dayPlan()?.date).toBe(newDate);
    });

    it('discards old totals after refreshing the same week', async () => {
      let finishOldWeek!: (week: DayPlanWithSlots[]) => void;
      const pendingOldWeek = new Promise<DayPlanWithSlots[]>(
        (resolve) => (finishOldWeek = resolve),
      );
      dayPlanRepo.findByDateRange.and.returnValues(pendingOldWeek, Promise.resolve([]));
      store.setView('week');
      await flush();

      await store.addDish('s-1', 'd-1', 1);
      await flush();
      expect(store.weekData()?.[0].targetCal).toBe(0);

      finishOldWeek([{ ...sampleDayPlan, date: store.weekDays()[0], target_calories: 1900 }]);
      await flush();
      expect(store.weekData()?.[0].targetCal).toBe(0);
    });

    it('reads the day again when ingredient nutrition changes', async () => {
      await flush();
      dayPlanRepo.findByDate.calls.reset();
      ingredientRevision.set(1);
      await flush();
      expect(dayPlanRepo.findByDate).toHaveBeenCalledWith(store.currentDate());
    });

    it('updates week rows when a goal is set or cleared on the same week', async () => {
      dayPlanRepo.findByDateRange.and.resolveTo([]);
      store.setView('week');
      await flush();
      expect(store.weekData()?.map((day) => day.targetCal)).toEqual(Array(7).fill(0));
      profile.set({ target_calories: 1850 });
      await flush();
      expect(store.weekData()?.map((day) => day.targetCal)).toEqual(Array(7).fill(1850));
      profile.set({ target_calories: 0 });
      await flush();
      expect(store.weekData()?.map((day) => day.targetCal)).toEqual(Array(7).fill(0));
    });
    it('calls dayPlanRepo.findByDate when currentDate changes and updates dayPlan signal', async () => {
      dayPlanRepo.findByDate.calls.reset();
      store.setDate('2026-05-12');
      await flush();
      expect(dayPlanRepo.findByDate).toHaveBeenCalledWith('2026-05-12');
      expect(store.dayPlan()).toEqual(sampleDayPlan);
    });

    it('creates a missing day plan before rendering the day view', async () => {
      dayPlanRepo.findByDate.calls.reset();
      dayPlanRepo.findByDate.and.returnValues(
        Promise.resolve(null),
        Promise.resolve(sampleDayPlan),
      );
      dayPlanRepo.getOrCreateForDate.and.returnValue(Promise.resolve(sampleDayPlan));

      store.setDate('2026-05-13');
      await flush();
      await flush();

      expect(dayPlanRepo.findByDate).toHaveBeenCalledWith('2026-05-13');
      expect(dayPlanRepo.getOrCreateForDate).toHaveBeenCalledWith('2026-05-13');
      expect(store.dayPlan()).toEqual(sampleDayPlan);
    });
  });

  describe('Story 3.7 — context menu mutations', () => {
    it('moveDish forwards to repo.moveToSlot and bumps tick', async () => {
      plannedDishRepo.moveToSlot.and.returnValue(Promise.resolve());
      const before = store.invalidationTick();

      await store.moveDish('pd-1', 's-target');

      expect(plannedDishRepo.moveToSlot).toHaveBeenCalledWith('pd-1', 's-target');
      expect(store.invalidationTick()).toBe(before + 1);
    });

    it('deleteDish returns null when no row was deleted', async () => {
      const snapshot = await store.deleteDish('pd-not-loaded');
      expect(snapshot).toBeNull();
      expect(plannedDishRepo.delete).toHaveBeenCalledWith('pd-not-loaded');
    });

    it('deleteDish uses the persisted snapshot returned by the repository', async () => {
      const persisted = { ...samplePlanned, servings: 1.5 };
      plannedDishRepo.delete.and.resolveTo(persisted);

      const snapshot = await store.deleteDish('pd-1');

      expect(snapshot).toBe(persisted);
    });

    it('restoreDish leaves a planned dish unlogged', async () => {
      const snap = { ...samplePlanned, servings: 2 };

      await store.restoreDish(snap);

      expect(plannedDishRepo.restoreDeletedDish).toHaveBeenCalledWith(snap);
      expect(plannedDishRepo.markCompleted).not.toHaveBeenCalled();
    });

    it('restores the original eaten snapshot without logging it again', async () => {
      const snap = {
        ...samplePlanned,
        is_completed: 1 as const,
        completed_at: '2026-05-10T07:00:00Z',
        calories: 420,
        protein: 25,
        carbs: 50,
        fat: 12,
        fiber: 7,
      };
      plannedDishRepo.restoreDeletedDish.and.resolveTo(snap);

      const created = await store.restoreDish(snap);

      expect(created.id).toBe(snap.id);
      expect(created.completed_at).toBe(snap.completed_at);
      expect(created.calories).toBe(snap.calories);
      expect(plannedDishRepo.restoreDeletedDish).toHaveBeenCalledWith(snap);
      expect(plannedDishRepo.markCompleted).not.toHaveBeenCalled();
    });

    it('restoreDish bumps tick once per restore', async () => {
      const before = store.invalidationTick();
      await store.restoreDish(samplePlanned);
      expect(store.invalidationTick()).toBe(before + 1);
    });
  });

  describe('copyFromYesterday', () => {
    it('leaves the revision unchanged when the repository copies nothing', async () => {
      plannedDishRepo.copyDayIntoEmpty.and.resolveTo(0);
      const revision = store.invalidationTick();
      expect((await store.copyFromYesterday()).copiedCount).toBe(0);
      expect(store.invalidationTick()).toBe(revision);
    });

    it('copies the previous local date into the selected day and refreshes once', async () => {
      store.setDate('2026-03-01');
      plannedDishRepo.copyDayIntoEmpty.and.resolveTo(2);
      const revision = store.invalidationTick();
      expect((await store.copyFromYesterday()).copiedCount).toBe(2);
      expect(plannedDishRepo.copyDayIntoEmpty).toHaveBeenCalledOnceWith('2026-02-28', '2026-03-01');
      expect(store.invalidationTick()).toBe(revision + 1);
    });
  });

  describe('Story 3.7 — yesterdayHint signal', () => {
    it('canCopyYesterday is false until hint flips true', () => {
      // dayPlan is null until hydration kicks; force a hydration first.
      expect(store.canCopyYesterday()).toBe(false);
    });

    it('canCopyYesterday becomes true when hint=true AND dayPlan loaded', async () => {
      store.setDate(store.currentDate());
      await flush();
      store.yesterdayHint.set(true);
      expect(store.canCopyYesterday()).toBe(true);
      store.yesterdayHint.set(false);
      expect(store.canCopyYesterday()).toBe(false);
    });
  });
});
