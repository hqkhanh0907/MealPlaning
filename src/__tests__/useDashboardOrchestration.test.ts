import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { TodaysPlanData } from '../features/dashboard/hooks/useTodaysPlan';
import type { TrainingPlan, TrainingProfile } from '../features/fitness/types';
import type { Goal, HealthProfile } from '../features/health-profile/types';

const navigationState = {
  pushPage: vi.fn(),
  navigateTab: vi.fn(),
};

const healthState: { profile: HealthProfile | null; activeGoal: Goal | null } = {
  profile: null,
  activeGoal: null,
};

const fitnessState: {
  trainingProfile: TrainingProfile | null;
  activePlan: TrainingPlan | undefined;
} = {
  trainingProfile: null,
  activePlan: undefined,
};

let todaysPlanState: TodaysPlanData;
let mockedHealthContract = {
  surfaceState: 'success',
  summary: 'ok',
  nextStep: 'ok',
};
let mockedGoalContract = {
  surfaceState: 'success',
  summary: 'ok',
  nextStep: 'ok',
};
let mockedTrainingContract = {
  surfaceState: 'success',
  summary: 'ok',
  nextStep: 'ok',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (!params) return key;
      return Object.entries(params).reduce(
        (text, [paramKey, value]) => text.replace(`{{${paramKey}}}`, String(value)),
        key,
      );
    },
  }),
}));

vi.mock('@/components/settings/readiness', () => ({
  getHealthProfileSetupContract: () => mockedHealthContract,
  getGoalSetupContract: () => mockedGoalContract,
  getTrainingProfileSetupContract: () => mockedTrainingContract,
}));

vi.mock('@/store/navigationStore', () => ({
  useNavigationStore: (selector: (state: typeof navigationState) => unknown) => selector(navigationState),
}));

vi.mock('@/store/selectors/fitnessSelectors', () => ({
  selectActivePlan: (state: typeof fitnessState) => state.activePlan,
}));

vi.mock('@/store/fitnessStore', () => ({
  useFitnessStore: (selector: (state: typeof fitnessState) => unknown) => selector(fitnessState),
}));

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: (selector: (state: typeof healthState) => unknown) => selector(healthState),
}));

vi.mock('../features/dashboard/hooks/useTodaysPlan', () => ({
  useTodaysPlan: () => todaysPlanState,
}));

import { useDashboardOrchestration } from '../features/dashboard/hooks/useDashboardOrchestration';

describe('useDashboardOrchestration', () => {
  beforeEach(() => {
    navigationState.pushPage.mockReset();
    navigationState.navigateTab.mockReset();
    healthState.profile = null;
    healthState.activeGoal = null;
    fitnessState.trainingProfile = null;
    fitnessState.activePlan = undefined;
    mockedHealthContract = { surfaceState: 'success', summary: 'ok', nextStep: 'ok' };
    mockedGoalContract = { surfaceState: 'success', summary: 'ok', nextStep: 'ok' };
    mockedTrainingContract = { surfaceState: 'success', summary: 'ok', nextStep: 'ok' };
    todaysPlanState = {
      state: 'no-plan',
      mealsLogged: 0,
      totalMealsPlanned: 3,
      hasReachedTarget: false,
      mealSlots: [
        { type: 'breakfast', hasFood: false },
        { type: 'lunch', hasFood: false },
        { type: 'dinner', hasFood: false },
      ],
      totalSessions: 0,
      completedSessions: 0,
      todayPlanDays: [],
      currentStreak: 0,
    };
  });

  it('blocks the dashboard when health setup is incomplete', () => {
    mockedHealthContract = {
      surfaceState: 'setup',
      summary: 'Thiếu ngày sinh',
      nextStep: 'Mở hồ sơ sức khỏe',
    };

    const { result } = renderHook(() => useDashboardOrchestration());

    expect(result.current.heroMode).toBe('blocking');
    expect(result.current.heroContract.copy.title).toBe('dashboard.orchestration.health.title');
    expect(result.current.showInsights).toBe(false);
    expect(result.current.showQuickActions).toBe(false);
    result.current.heroContract.primaryAction?.onAction?.();
    expect(navigationState.pushPage).toHaveBeenCalledWith({ id: 'settings', component: 'SettingsTab' });
  });

  it('routes missing active plan to a single create-plan CTA', () => {
    mockedTrainingContract = {
      surfaceState: 'success',
      summary: 'ready',
      nextStep: 'ready',
    };

    const { result } = renderHook(() => useDashboardOrchestration());

    expect(result.current.heroMode).toBe('blocking');
    expect(result.current.heroContract.copy.title).toBe('dashboard.orchestration.plan.title');
    result.current.heroContract.primaryAction?.onAction?.();
    expect(navigationState.navigateTab).toHaveBeenCalledWith('fitness');
  });

  it('falls back to a passive review state when setup and daily actions are complete', () => {
    fitnessState.activePlan = {
      id: 'plan-1',
      name: 'Plan',
      status: 'active',
      splitType: 'ppl',
      durationWeeks: 8,
      startDate: '2025-01-01',
      trainingDays: [1, 3, 5],
      restDays: [2, 4, 6, 7],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    todaysPlanState = {
      ...todaysPlanState,
      state: 'training-completed',
      nextMealToLog: undefined,
      mealsLogged: 3,
      hasReachedTarget: true,
    };

    const { result } = renderHook(() => useDashboardOrchestration());

    expect(result.current.heroMode).toBe('passive');
    expect(result.current.showInsights).toBe(true);
    expect(result.current.showQuickActions).toBe(true);
    expect(result.current.heroContract.primaryAction).toBeUndefined();
  });
});
