import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type ActionType,
  determineQuickActions,
  type QuickActionsInput,
  useQuickActions,
} from '../features/dashboard/hooks/useQuickActions';
import { useDayPlanStore } from '../store/dayPlanStore';
import { useFitnessStore } from '../store/fitnessStore';
import { useNavigationStore } from '../store/navigationStore';

const DEFAULT_INPUT: QuickActionsInput = {
  mealsLoggedToday: 0,
  hasBreakfast: false,
  hasLunch: false,
  hasDinner: false,
  workoutCompleted: false,
  isRestDay: false,
  weightLoggedToday: false,
  hasTrainingPlan: true,
};

function makeInput(overrides: Partial<QuickActionsInput> = {}): QuickActionsInput {
  return { ...DEFAULT_INPUT, ...overrides };
}

/* ------------------------------------------------------------------ */
/*  determineQuickActions – pure function                              */
/* ------------------------------------------------------------------ */
describe('determineQuickActions', () => {
  it('1 – morning nothing logged → [log-weight, log-breakfast, start-workout]', () => {
    const [left, center, right] = determineQuickActions(makeInput());

    expect(left.id).toBe('log-weight');
    expect(center.id).toBe('log-breakfast');
    expect(right.id).toBe('start-workout');
  });

  it('2 – breakfast+lunch logged → [log-weight, log-dinner, start-workout]', () => {
    const [left, center, right] = determineQuickActions(
      makeInput({
        mealsLoggedToday: 2,
        hasBreakfast: true,
        hasLunch: true,
      }),
    );

    expect(left.id).toBe('log-weight');
    expect(center.id).toBe('log-dinner');
    expect(right.id).toBe('start-workout');
  });

  it('3 – rest day → [log-weight, log-meal, log-cardio]', () => {
    const [left, center, right] = determineQuickActions(makeInput({ isRestDay: true }));

    expect(left.id).toBe('log-weight');
    expect(center.id).toBe('log-meal');
    expect(right.id).toBe('log-cardio');
  });

  it('4 – workout completed → [log-weight, log-meal, view-results]', () => {
    const [left, center, right] = determineQuickActions(makeInput({ workoutCompleted: true }));

    expect(left.id).toBe('log-weight');
    expect(center.id).toBe('log-meal');
    expect(right.id).toBe('view-results');
  });

  it('5 – all 3 meals logged → [log-weight, start-workout, log-snack]', () => {
    const [left, center, right] = determineQuickActions(
      makeInput({
        mealsLoggedToday: 3,
        hasBreakfast: true,
        hasLunch: true,
        hasDinner: true,
      }),
    );

    expect(left.id).toBe('log-weight');
    expect(center.id).toBe('start-workout');
    expect(right.id).toBe('log-snack');
  });

  it('6 – center action always has isPrimary=true', () => {
    const scenarios: QuickActionsInput[] = [
      makeInput(),
      makeInput({ isRestDay: true }),
      makeInput({ workoutCompleted: true }),
      makeInput({
        hasBreakfast: true,
        hasLunch: true,
        hasDinner: true,
        mealsLoggedToday: 3,
      }),
      makeInput({
        hasBreakfast: true,
        hasLunch: true,
        hasDinner: true,
        workoutCompleted: true,
        mealsLoggedToday: 3,
      }),
    ];

    for (const scenario of scenarios) {
      const [, center] = determineQuickActions(scenario);
      expect(center.isPrimary).toBe(true);
    }
  });

  it('7 – left and right never isPrimary', () => {
    const scenarios: QuickActionsInput[] = [
      makeInput(),
      makeInput({ isRestDay: true }),
      makeInput({ workoutCompleted: true }),
      makeInput({
        hasBreakfast: true,
        hasLunch: true,
        hasDinner: true,
        mealsLoggedToday: 3,
      }),
      makeInput({
        hasBreakfast: true,
        hasLunch: true,
        hasDinner: true,
        workoutCompleted: true,
        mealsLoggedToday: 3,
      }),
    ];

    for (const scenario of scenarios) {
      const [left, , right] = determineQuickActions(scenario);
      expect(left.isPrimary).toBe(false);
      expect(right.isPrimary).toBe(false);
    }
  });

  it('8 – weight logged today still shows log-weight as left action', () => {
    const [left] = determineQuickActions(makeInput({ weightLoggedToday: true }));
    expect(left.id).toBe('log-weight');
    expect(left.icon).toBe('⚖️');
  });

  it('9 – no training plan + rest day → no start-workout option', () => {
    const actions = determineQuickActions(makeInput({ hasTrainingPlan: false, isRestDay: true }));
    const ids = actions.map(a => a.id);
    expect(ids).not.toContain('start-workout');
  });

  it('10 – all logged + workout done → fallback actions', () => {
    const [left, center, right] = determineQuickActions(
      makeInput({
        mealsLoggedToday: 3,
        hasBreakfast: true,
        hasLunch: true,
        hasDinner: true,
        workoutCompleted: true,
      }),
    );

    expect(left.id).toBe('log-weight');
    expect(center.id).toBe('view-results');
    expect(center.isPrimary).toBe(true);
    expect(right.id).toBe('log-snack');
  });

  /* ---------- Additional branch coverage ---------- */

  it('breakfast only logged → center is log-lunch', () => {
    const [, center] = determineQuickActions(
      makeInput({
        mealsLoggedToday: 1,
        hasBreakfast: true,
        hasLunch: false,
        hasDinner: false,
      }),
    );
    expect(center.id).toBe('log-lunch');
  });

  it('all meals logged but no training plan → center is log-meal', () => {
    const [, center] = determineQuickActions(
      makeInput({
        mealsLoggedToday: 3,
        hasBreakfast: true,
        hasLunch: true,
        hasDinner: true,
        hasTrainingPlan: false,
      }),
    );
    expect(center.id).toBe('log-meal');
  });

  it('no training plan and not rest day → right is log-cardio', () => {
    const [, , right] = determineQuickActions(makeInput({ hasTrainingPlan: false }));
    expect(right.id).toBe('log-cardio');
  });

  it('left action always has correct icon and label', () => {
    const [left] = determineQuickActions(makeInput());
    expect(left.icon).toBe('⚖️');
    expect(left.label).toBe('quickActions.logWeight');
  });

  it('rest day with all meals logged → center is still log-meal (rest takes priority)', () => {
    const [, center] = determineQuickActions(
      makeInput({
        isRestDay: true,
        hasBreakfast: true,
        hasLunch: true,
        hasDinner: true,
        mealsLoggedToday: 3,
        workoutCompleted: false,
      }),
    );
    expect(center.id).toBe('log-meal');
  });
});

/* ------------------------------------------------------------------ */
/*  useQuickActions – hook                                             */
/* ------------------------------------------------------------------ */
describe('useQuickActions', () => {
  const today = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    useDayPlanStore.setState({ dayPlans: [] });
    useFitnessStore.setState({
      weightEntries: [],
      workouts: [],
      trainingPlans: [],
    });
    useNavigationStore.setState({
      navigateTab: vi.fn(),
    });
  });

  it('returns morning actions when stores are empty', () => {
    const { result } = renderHook(() => useQuickActions());
    const [left, center, right] = result.current.actions;

    expect(left.id).toBe('log-weight');
    expect(center.id).toBe('log-breakfast');
    expect(right.id).toBe('log-cardio');
  });

  it('reflects meals logged for today from dayPlanStore', () => {
    useDayPlanStore.setState({
      dayPlans: [
        {
          date: today,
          breakfastDishIds: ['d1'],
          lunchDishIds: ['d2'],
          dinnerDishIds: [],
          servings: {},
        },
      ],
    });

    const { result } = renderHook(() => useQuickActions());
    expect(result.current.actions[1].id).toBe('log-dinner');
  });

  it('reflects active training plan from fitnessStore', () => {
    useDayPlanStore.setState({
      dayPlans: [
        {
          date: today,
          breakfastDishIds: ['d1'],
          lunchDishIds: ['d2'],
          dinnerDishIds: ['d3'],
          servings: {},
        },
      ],
    });
    useFitnessStore.setState({
      weightEntries: [],
      workouts: [],
      trainingPlans: [
        {
          id: 'plan-1',
          name: 'Plan A',
          status: 'active',
          splitType: 'ppl',
          durationWeeks: 8,
          currentWeek: 1,
          startDate: today,
          createdAt: today,
          updatedAt: today,
          trainingDays: [1, 3, 5],
          restDays: [2, 4, 6, 7],
        },
      ],
    });

    const { result } = renderHook(() => useQuickActions());
    expect(result.current.actions[1].id).toBe('start-workout');
  });

  it('reflects completed workout for today', () => {
    useFitnessStore.setState({
      weightEntries: [],
      workouts: [
        {
          id: 'w1',
          date: `${today}T08:00:00.000Z`,
          name: 'Push Day',
          createdAt: today,
          updatedAt: today,
        },
      ],
      trainingPlans: [],
    });

    const { result } = renderHook(() => useQuickActions());
    expect(result.current.actions[1].id).toBe('log-meal');
    expect(result.current.actions[2].id).toBe('view-results');
  });

  it('handles weight entries for today', () => {
    useFitnessStore.setState({
      weightEntries: [
        {
          id: 'we1',
          date: `${today}T07:00:00.000Z`,
          weightKg: 75,
          createdAt: today,
          updatedAt: today,
        },
      ],
      workouts: [],
      trainingPlans: [],
    });

    const { result } = renderHook(() => useQuickActions());
    expect(result.current.actions[0].id).toBe('log-weight');
  });

  it('handleAction navigates to fitness for fitness-type actions', () => {
    const mockNavigateTab = vi.fn();
    useNavigationStore.setState({ navigateTab: mockNavigateTab });

    const { result } = renderHook(() => useQuickActions());
    const fitnessActions: ActionType[] = ['log-weight', 'start-workout', 'log-cardio', 'view-results'];

    for (const id of fitnessActions) {
      act(() => {
        result.current.handleAction({
          id,
          icon: '',
          label: '',
          isPrimary: false,
        });
      });
    }

    expect(mockNavigateTab).toHaveBeenCalledTimes(4);
    for (const call of mockNavigateTab.mock.calls) {
      expect(call[0]).toBe('fitness');
    }
  });

  it('handleAction navigates to calendar for meal-type actions', () => {
    const mockNavigateTab = vi.fn();
    useNavigationStore.setState({ navigateTab: mockNavigateTab });

    const { result } = renderHook(() => useQuickActions());
    const mealActions: ActionType[] = ['log-breakfast', 'log-lunch', 'log-dinner', 'log-meal', 'log-snack'];

    for (const id of mealActions) {
      act(() => {
        result.current.handleAction({
          id,
          icon: '',
          label: '',
          isPrimary: false,
        });
      });
    }

    expect(mockNavigateTab).toHaveBeenCalledTimes(5);
    for (const call of mockNavigateTab.mock.calls) {
      expect(call[0]).toBe('calendar');
    }
  });
});
