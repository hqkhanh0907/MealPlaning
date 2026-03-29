import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFitnessStore } from '../store/fitnessStore';
import type {
  TrainingPlan,
  TrainingPlanDay,
} from '../features/fitness/types';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

vi.mock('sql.js', async () => {
  const real = await vi.importActual<typeof import('sql.js')>('sql.js');
  return { default: () => real.default() };
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
const INITIAL_STATE = {
  trainingProfile: null,
  trainingPlans: [] as TrainingPlan[],
  trainingPlanDays: [] as TrainingPlanDay[],
  workouts: [],
  workoutSets: [],
  weightEntries: [],
  isOnboarded: false,
  workoutMode: 'strength' as const,
  workoutDraft: null,
  sqliteReady: false,
};

function resetStore() {
  useFitnessStore.setState(INITIAL_STATE);
}

function samplePlan(overrides: Partial<TrainingPlan> = {}): TrainingPlan {
  return {
    id: 'plan-1',
    name: 'PPL 8-Week',
    status: 'active',
    splitType: 'ppl',
    durationWeeks: 8,
    currentWeek: 1,
    startDate: '2025-06-01',
    trainingDays: [1, 3, 5],
    restDays: [2, 4, 6, 7],
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function samplePlanDay(overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay {
  return {
    id: 'day-1',
    planId: 'plan-1',
    dayOfWeek: 1,
    sessionOrder: 1,
    workoutType: 'push',
    muscleGroups: 'chest,shoulders',
    isUserAssigned: false,
    originalDayOfWeek: 1,
    ...overrides,
  };
}

/* ================================================================== */
/*  Tests                                                               */
/* ================================================================== */
describe('fitnessStore — Schedule Editor Actions', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  /* ================================================================ */
  /*  updateTrainingDays                                                */
  /* ================================================================ */
  describe('updateTrainingDays', () => {
    it('updates training and rest days for a plan', () => {
      const plan = samplePlan({ trainingDays: [1, 3, 5], restDays: [2, 4, 6, 7] });
      useFitnessStore.setState({ trainingPlans: [plan] });

      useFitnessStore.getState().updateTrainingDays('plan-1', [1, 2, 4, 6]);

      const updated = useFitnessStore.getState().trainingPlans.find((p) => p.id === 'plan-1');
      expect(updated?.trainingDays).toEqual([1, 2, 4, 6]);
      expect(updated?.restDays).toEqual([3, 5, 7]);
    });

    it('rejects fewer than 2 training days', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const plan = samplePlan();
      useFitnessStore.setState({ trainingPlans: [plan] });

      useFitnessStore.getState().updateTrainingDays('plan-1', [1]);

      const unchanged = useFitnessStore.getState().trainingPlans.find((p) => p.id === 'plan-1');
      expect(unchanged?.trainingDays).toEqual([1, 3, 5]);
      spy.mockRestore();
    });

    it('rejects more than 6 training days', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const plan = samplePlan();
      useFitnessStore.setState({ trainingPlans: [plan] });

      useFitnessStore.getState().updateTrainingDays('plan-1', [1, 2, 3, 4, 5, 6, 7]);

      const unchanged = useFitnessStore.getState().trainingPlans.find((p) => p.id === 'plan-1');
      expect(unchanged?.trainingDays).toEqual([1, 3, 5]);
      spy.mockRestore();
    });

    it('reassigns orphaned sessions to nearest training day', () => {
      const plan = samplePlan({ trainingDays: [1, 3, 5], restDays: [2, 4, 6, 7] });
      const dayOnRemoved = samplePlanDay({ id: 'day-5', planId: 'plan-1', dayOfWeek: 5, originalDayOfWeek: 5 });
      const dayOnKept = samplePlanDay({ id: 'day-1', planId: 'plan-1', dayOfWeek: 1, originalDayOfWeek: 1 });
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: [dayOnKept, dayOnRemoved],
      });

      // Remove day 5, keep days 1 and 3
      useFitnessStore.getState().updateTrainingDays('plan-1', [1, 3]);

      const days = useFitnessStore.getState().trainingPlanDays;
      const reassigned = days.find((d) => d.id === 'day-5');
      expect(reassigned?.dayOfWeek).toBe(3); // nearest to 5 from [1, 3]
      expect(days.find((d) => d.id === 'day-1')?.dayOfWeek).toBe(1); // unchanged
    });

    it('does not modify sessions on kept training days', () => {
      const plan = samplePlan({ trainingDays: [1, 3, 5], restDays: [2, 4, 6, 7] });
      const day1 = samplePlanDay({ id: 'day-1', planId: 'plan-1', dayOfWeek: 1, originalDayOfWeek: 1 });
      const day3 = samplePlanDay({ id: 'day-3', planId: 'plan-1', dayOfWeek: 3, originalDayOfWeek: 3 });
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: [day1, day3],
      });

      useFitnessStore.getState().updateTrainingDays('plan-1', [1, 3]);

      const days = useFitnessStore.getState().trainingPlanDays;
      expect(days.find((d) => d.id === 'day-1')?.dayOfWeek).toBe(1);
      expect(days.find((d) => d.id === 'day-3')?.dayOfWeek).toBe(3);
    });

    it('handles non-existent plan gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      useFitnessStore.getState().updateTrainingDays('nonexistent', [1, 3]);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('plan not found'),
      );
      spy.mockRestore();
    });

    it('does not affect other plans when updating', () => {
      const plan1 = samplePlan({ id: 'plan-1', trainingDays: [1, 3, 5] });
      const plan2 = samplePlan({ id: 'plan-2', trainingDays: [2, 4, 6] });
      useFitnessStore.setState({ trainingPlans: [plan1, plan2] });

      useFitnessStore.getState().updateTrainingDays('plan-1', [1, 2]);

      const p2 = useFitnessStore.getState().trainingPlans.find((p) => p.id === 'plan-2');
      expect(p2?.trainingDays).toEqual([2, 4, 6]);
    });
  });

  /* ================================================================ */
  /*  reassignWorkoutToDay                                              */
  /* ================================================================ */
  describe('reassignWorkoutToDay', () => {
    it('reassigns a plan day to a new valid training day', () => {
      const plan = samplePlan({ trainingDays: [1, 3, 5] });
      const day = samplePlanDay({ id: 'day-1', planId: 'plan-1', dayOfWeek: 1, isUserAssigned: false });
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: [day],
      });

      useFitnessStore.getState().reassignWorkoutToDay('day-1', 3);

      const updated = useFitnessStore.getState().trainingPlanDays.find((d) => d.id === 'day-1');
      expect(updated?.dayOfWeek).toBe(3);
      expect(updated?.isUserAssigned).toBe(true);
    });

    it('rejects reassignment to a non-training day', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const plan = samplePlan({ trainingDays: [1, 3, 5] });
      const day = samplePlanDay({ id: 'day-1', planId: 'plan-1', dayOfWeek: 1 });
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: [day],
      });

      useFitnessStore.getState().reassignWorkoutToDay('day-1', 2);

      const unchanged = useFitnessStore.getState().trainingPlanDays.find((d) => d.id === 'day-1');
      expect(unchanged?.dayOfWeek).toBe(1);
      spy.mockRestore();
    });

    it('rejects reassignment when target day already has 3 sessions', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const plan = samplePlan({ trainingDays: [1, 3, 5] });
      const existing = [
        samplePlanDay({ id: 'slot-1', planId: 'plan-1', dayOfWeek: 3, sessionOrder: 1 }),
        samplePlanDay({ id: 'slot-2', planId: 'plan-1', dayOfWeek: 3, sessionOrder: 2 }),
        samplePlanDay({ id: 'slot-3', planId: 'plan-1', dayOfWeek: 3, sessionOrder: 3 }),
        samplePlanDay({ id: 'day-to-move', planId: 'plan-1', dayOfWeek: 1, sessionOrder: 1 }),
      ];
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: existing,
      });

      useFitnessStore.getState().reassignWorkoutToDay('day-to-move', 3);

      const notMoved = useFitnessStore.getState().trainingPlanDays.find((d) => d.id === 'day-to-move');
      expect(notMoved?.dayOfWeek).toBe(1);
      spy.mockRestore();
    });

    it('handles non-existent day gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      useFitnessStore.getState().reassignWorkoutToDay('nonexistent', 1);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('day not found'),
      );
      spy.mockRestore();
    });

    it('handles non-existent plan gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const day = samplePlanDay({ id: 'day-1', planId: 'orphan-plan', dayOfWeek: 1 });
      useFitnessStore.setState({ trainingPlanDays: [day] });

      useFitnessStore.getState().reassignWorkoutToDay('day-1', 3);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('plan not found'),
      );
      spy.mockRestore();
    });
  });

  /* ================================================================ */
  /*  autoAssignWorkouts                                                */
  /* ================================================================ */
  describe('autoAssignWorkouts', () => {
    it('distributes sessions evenly across training days', () => {
      const plan = samplePlan({ trainingDays: [1, 3, 5] });
      const days = [
        samplePlanDay({ id: 'd1', planId: 'plan-1', dayOfWeek: 1, muscleGroups: 'chest' }),
        samplePlanDay({ id: 'd2', planId: 'plan-1', dayOfWeek: 1, muscleGroups: 'back' }),
        samplePlanDay({ id: 'd3', planId: 'plan-1', dayOfWeek: 1, muscleGroups: 'legs' }),
      ];
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: days,
      });

      useFitnessStore.getState().autoAssignWorkouts('plan-1');

      const result = useFitnessStore.getState().trainingPlanDays;
      const dayCounts = new Map<number, number>();
      for (const d of result) {
        dayCounts.set(d.dayOfWeek, (dayCounts.get(d.dayOfWeek) ?? 0) + 1);
      }
      // 3 sessions across 3 days => 1 each
      expect(dayCounts.size).toBe(3);
      for (const count of dayCounts.values()) {
        expect(count).toBe(1);
      }
    });

    it('sets isUserAssigned to false for all auto-assigned days', () => {
      const plan = samplePlan({ trainingDays: [1, 3] });
      const days = [
        samplePlanDay({ id: 'd1', planId: 'plan-1', dayOfWeek: 1, isUserAssigned: true }),
        samplePlanDay({ id: 'd2', planId: 'plan-1', dayOfWeek: 3, isUserAssigned: true }),
      ];
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: days,
      });

      useFitnessStore.getState().autoAssignWorkouts('plan-1');

      const result = useFitnessStore.getState().trainingPlanDays;
      for (const d of result) {
        expect(d.isUserAssigned).toBe(false);
      }
    });

    it('avoids same primary muscle group on consecutive days when possible', () => {
      const plan = samplePlan({ trainingDays: [1, 3, 5] });
      const days = [
        samplePlanDay({ id: 'd1', planId: 'plan-1', muscleGroups: 'chest,triceps' }),
        samplePlanDay({ id: 'd2', planId: 'plan-1', muscleGroups: 'back,biceps' }),
        samplePlanDay({ id: 'd3', planId: 'plan-1', muscleGroups: 'legs,glutes' }),
      ];
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: days,
      });

      useFitnessStore.getState().autoAssignWorkouts('plan-1');

      const result = useFitnessStore.getState().trainingPlanDays;
      // With 3 distinct muscle groups and 3 non-consecutive training days (1, 3, 5),
      // all sessions should be on different days
      const assignedDays = result.map((d) => d.dayOfWeek).sort((a, b) => a - b);
      expect(new Set(assignedDays).size).toBe(3);
    });

    it('handles plan with no plan days', () => {
      const plan = samplePlan({ trainingDays: [1, 3] });
      useFitnessStore.setState({ trainingPlans: [plan], trainingPlanDays: [] });

      useFitnessStore.getState().autoAssignWorkouts('plan-1');

      expect(useFitnessStore.getState().trainingPlanDays).toEqual([]);
    });

    it('handles non-existent plan gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      useFitnessStore.getState().autoAssignWorkouts('nonexistent');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('plan not found'),
      );
      spy.mockRestore();
    });

    it('does not modify plan days from other plans', () => {
      const plan1 = samplePlan({ id: 'plan-1', trainingDays: [1, 3] });
      const plan2 = samplePlan({ id: 'plan-2', trainingDays: [2, 4] });
      const days = [
        samplePlanDay({ id: 'd1', planId: 'plan-1', dayOfWeek: 1, muscleGroups: 'chest' }),
        samplePlanDay({ id: 'd2', planId: 'plan-2', dayOfWeek: 2, muscleGroups: 'back' }),
      ];
      useFitnessStore.setState({
        trainingPlans: [plan1, plan2],
        trainingPlanDays: days,
      });

      useFitnessStore.getState().autoAssignWorkouts('plan-1');

      const plan2Day = useFitnessStore.getState().trainingPlanDays.find((d) => d.id === 'd2');
      expect(plan2Day?.dayOfWeek).toBe(2);
    });

    it('handles plan with empty training days array', () => {
      const plan = samplePlan({ trainingDays: [] });
      const day = samplePlanDay({ id: 'd1', planId: 'plan-1', dayOfWeek: 1 });
      useFitnessStore.setState({ trainingPlans: [plan], trainingPlanDays: [day] });

      useFitnessStore.getState().autoAssignWorkouts('plan-1');

      // Should not crash; day remains unchanged since no training days to assign to
      expect(useFitnessStore.getState().trainingPlanDays.find((d) => d.id === 'd1')).toBeDefined();
    });
  });

  /* ================================================================ */
  /*  restoreOriginalSchedule                                           */
  /* ================================================================ */
  describe('restoreOriginalSchedule', () => {
    it('restores day_of_week from original_day_of_week', () => {
      const plan = samplePlan({ trainingDays: [1, 3], restDays: [2, 4, 5, 6, 7] });
      const day = samplePlanDay({
        id: 'day-1',
        planId: 'plan-1',
        dayOfWeek: 3, // currently moved to day 3
        originalDayOfWeek: 1, // originally was day 1
        isUserAssigned: true,
      });
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: [day],
      });

      useFitnessStore.getState().restoreOriginalSchedule('plan-1');

      const restored = useFitnessStore.getState().trainingPlanDays.find((d) => d.id === 'day-1');
      expect(restored?.dayOfWeek).toBe(1);
      expect(restored?.isUserAssigned).toBe(false);
    });

    it('recalculates training and rest days based on restored assignments', () => {
      const plan = samplePlan({ trainingDays: [3, 5], restDays: [1, 2, 4, 6, 7] });
      const days = [
        samplePlanDay({ id: 'd1', planId: 'plan-1', dayOfWeek: 3, originalDayOfWeek: 1 }),
        samplePlanDay({ id: 'd2', planId: 'plan-1', dayOfWeek: 5, originalDayOfWeek: 4 }),
      ];
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: days,
      });

      useFitnessStore.getState().restoreOriginalSchedule('plan-1');

      const updatedPlan = useFitnessStore.getState().trainingPlans.find((p) => p.id === 'plan-1');
      expect(updatedPlan?.trainingDays).toEqual([1, 4]);
      expect(updatedPlan?.restDays).toEqual([2, 3, 5, 6, 7]);
    });

    it('resets isUserAssigned to false for all days', () => {
      const plan = samplePlan({ trainingDays: [1, 3] });
      const days = [
        samplePlanDay({ id: 'd1', planId: 'plan-1', dayOfWeek: 3, originalDayOfWeek: 1, isUserAssigned: true }),
        samplePlanDay({ id: 'd2', planId: 'plan-1', dayOfWeek: 1, originalDayOfWeek: 3, isUserAssigned: true }),
      ];
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: days,
      });

      useFitnessStore.getState().restoreOriginalSchedule('plan-1');

      const result = useFitnessStore.getState().trainingPlanDays;
      for (const d of result) {
        expect(d.isUserAssigned).toBe(false);
      }
    });

    it('handles plan with no plan days gracefully', () => {
      const plan = samplePlan();
      useFitnessStore.setState({ trainingPlans: [plan], trainingPlanDays: [] });

      useFitnessStore.getState().restoreOriginalSchedule('plan-1');

      // Plan should remain unchanged since there are no days to restore from
      const updatedPlan = useFitnessStore.getState().trainingPlans.find((p) => p.id === 'plan-1');
      expect(updatedPlan?.trainingDays).toEqual([1, 3, 5]);
    });

    it('handles non-existent plan gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      useFitnessStore.getState().restoreOriginalSchedule('nonexistent');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('plan not found'),
      );
      spy.mockRestore();
    });

    it('does not affect other plans', () => {
      const plan1 = samplePlan({ id: 'plan-1', trainingDays: [3], restDays: [1, 2, 4, 5, 6, 7] });
      const plan2 = samplePlan({ id: 'plan-2', trainingDays: [2, 4, 6] });
      const days = [
        samplePlanDay({ id: 'd1', planId: 'plan-1', dayOfWeek: 3, originalDayOfWeek: 1 }),
        samplePlanDay({ id: 'd2', planId: 'plan-2', dayOfWeek: 2, originalDayOfWeek: 2 }),
      ];
      useFitnessStore.setState({
        trainingPlans: [plan1, plan2],
        trainingPlanDays: days,
      });

      useFitnessStore.getState().restoreOriginalSchedule('plan-1');

      const p2 = useFitnessStore.getState().trainingPlans.find((p) => p.id === 'plan-2');
      expect(p2?.trainingDays).toEqual([2, 4, 6]);
      const p2Day = useFitnessStore.getState().trainingPlanDays.find((d) => d.id === 'd2');
      expect(p2Day?.dayOfWeek).toBe(2);
    });

    it('handles multiple sessions restoring to the same original day', () => {
      const plan = samplePlan({ trainingDays: [3, 5], restDays: [1, 2, 4, 6, 7] });
      const days = [
        samplePlanDay({ id: 'd1', planId: 'plan-1', dayOfWeek: 3, originalDayOfWeek: 1, sessionOrder: 1, workoutType: 'push' }),
        samplePlanDay({ id: 'd2', planId: 'plan-1', dayOfWeek: 5, originalDayOfWeek: 1, sessionOrder: 2, workoutType: 'pull' }),
      ];
      useFitnessStore.setState({
        trainingPlans: [plan],
        trainingPlanDays: days,
      });

      useFitnessStore.getState().restoreOriginalSchedule('plan-1');

      const result = useFitnessStore.getState().trainingPlanDays;
      expect(result.every((d) => d.dayOfWeek === 1)).toBe(true);
      const updatedPlan = useFitnessStore.getState().trainingPlans.find((p) => p.id === 'plan-1');
      expect(updatedPlan?.trainingDays).toEqual([1]);
      expect(updatedPlan?.restDays).toEqual([2, 3, 4, 5, 6, 7]);
    });
  });
});
