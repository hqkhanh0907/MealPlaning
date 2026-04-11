import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { MainTab } from '@/components/navigation/types';
import {
  getGoalSetupContract,
  getHealthProfileSetupContract,
  getTrainingProfileSetupContract,
} from '@/components/settings/readiness';
import { createSurfaceStateContract, type SurfaceStateContract } from '@/components/shared/surfaceState';
import type { TrainingProfile } from '@/features/fitness/types';
import type { Goal, HealthProfile } from '@/features/health-profile/types';
import { useFitnessStore } from '@/store/fitnessStore';
import { useNavigationStore } from '@/store/navigationStore';
import { selectActivePlan } from '@/store/selectors/fitnessSelectors';

import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import { useTodaysPlan } from './useTodaysPlan';

export interface DashboardOrchestration {
  heroMode: 'blocking' | 'guided' | 'passive';
  heroContract: SurfaceStateContract;
  showInsights: boolean;
  suppressInsightAction: boolean;
  showQuickActions: boolean;
  suppressPlanPrimaryActions: boolean;
  allowMealSlotActions: boolean;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function blockingOrchestration(heroContract: SurfaceStateContract): DashboardOrchestration {
  return {
    heroMode: 'blocking',
    heroContract,
    showInsights: false,
    suppressInsightAction: true,
    showQuickActions: false,
    suppressPlanPrimaryActions: true,
    allowMealSlotActions: false,
  };
}

function guidedOrchestration(heroContract: SurfaceStateContract): DashboardOrchestration {
  return {
    heroMode: 'guided',
    heroContract,
    showInsights: true,
    suppressInsightAction: true,
    showQuickActions: false,
    suppressPlanPrimaryActions: true,
    allowMealSlotActions: false,
  };
}

function resolveBlockingState(
  profile: HealthProfile | null,
  activeGoal: Goal | null | undefined,
  trainingProfile: TrainingProfile | null | undefined,
  activePlan: unknown,
  openSettings: () => void,
  navigateTab: (tab: MainTab) => void,
  t: (key: string, options?: Record<string, unknown>) => string,
): DashboardOrchestration | null {
  const healthContract = getHealthProfileSetupContract(profile, activeGoal, t);
  if (healthContract.surfaceState !== 'success') {
    return blockingOrchestration(
      createSurfaceStateContract({
        surface: 'dashboard.hero',
        state: healthContract.surfaceState,
        copy: {
          title: t('dashboard.orchestration.health.title'),
          missing: t('dashboard.orchestration.health.missing'),
          reason: healthContract.summary,
          nextStep: healthContract.nextStep,
        },
        primaryAction: { label: t('dashboard.orchestration.health.cta'), onAction: openSettings },
      }),
    );
  }

  const goalContract = getGoalSetupContract(activeGoal, profile, t);
  if (goalContract.surfaceState !== 'success') {
    return blockingOrchestration(
      createSurfaceStateContract({
        surface: 'dashboard.hero',
        state: goalContract.surfaceState,
        copy: {
          title: t('dashboard.orchestration.goal.title'),
          missing: t('dashboard.orchestration.goal.missing'),
          reason: goalContract.summary,
          nextStep: goalContract.nextStep,
        },
        primaryAction: { label: t('dashboard.orchestration.goal.cta'), onAction: openSettings },
      }),
    );
  }

  if (!activePlan) {
    const trainingContract = getTrainingProfileSetupContract(trainingProfile, t);
    const hasTrainingProfile = trainingContract.surfaceState === 'success';
    return blockingOrchestration(
      createSurfaceStateContract({
        surface: 'dashboard.hero',
        state: hasTrainingProfile ? 'warning' : trainingContract.surfaceState,
        copy: {
          title: hasTrainingProfile
            ? t('dashboard.orchestration.plan.title')
            : t('dashboard.orchestration.training.title'),
          missing: hasTrainingProfile
            ? t('dashboard.orchestration.plan.missing')
            : t('dashboard.orchestration.training.missing'),
          reason: hasTrainingProfile ? t('dashboard.orchestration.plan.reason') : trainingContract.summary,
          nextStep: hasTrainingProfile ? t('dashboard.orchestration.plan.nextStep') : trainingContract.nextStep,
        },
        primaryAction: hasTrainingProfile
          ? { label: t('dashboard.orchestration.plan.cta'), onAction: () => navigateTab('fitness') }
          : { label: t('dashboard.orchestration.training.cta'), onAction: openSettings },
      }),
    );
  }

  return null;
}

export function useDashboardOrchestration(): DashboardOrchestration {
  const { t } = useTranslation();
  const profile = useHealthProfileStore(s => s.profile);
  const activeGoal = useHealthProfileStore(s => s.activeGoal);
  const trainingProfile = useFitnessStore(s => s.trainingProfile);
  const activePlan = useFitnessStore(selectActivePlan);
  const pushPage = useNavigationStore(s => s.pushPage);
  const navigateTab = useNavigationStore(s => s.navigateTab);
  const todaysPlan = useTodaysPlan();

  return useMemo(() => {
    const openSettings = () => {
      pushPage({ id: 'settings', component: 'SettingsTab' });
    };

    const blocking = resolveBlockingState(
      profile,
      activeGoal,
      trainingProfile,
      activePlan,
      openSettings,
      navigateTab,
      t,
    );
    if (blocking) return blocking;

    if (todaysPlan.state === 'training-pending' && todaysPlan.nextUncompletedSession) {
      return guidedOrchestration(
        createSurfaceStateContract({
          surface: 'dashboard.hero',
          state: 'warning',
          copy: {
            title: t('dashboard.orchestration.workoutStart.title'),
            missing: t('dashboard.orchestration.workoutStart.missing'),
            reason: t('dashboard.orchestration.workoutStart.reason', { count: todaysPlan.totalSessions }),
            nextStep: t('dashboard.orchestration.workoutStart.nextStep'),
          },
          primaryAction: {
            label: t('dashboard.orchestration.workoutStart.cta'),
            onAction: () =>
              pushPage({
                id: 'workout-logger',
                component: 'WorkoutLogger',
                props: { planDay: todaysPlan.nextUncompletedSession },
              }),
          },
        }),
      );
    }

    if (todaysPlan.state === 'training-partial' && todaysPlan.nextUncompletedSession) {
      return guidedOrchestration(
        createSurfaceStateContract({
          surface: 'dashboard.hero',
          state: 'warning',
          copy: {
            title: t('dashboard.orchestration.workoutContinue.title'),
            missing: t('dashboard.orchestration.workoutContinue.missing'),
            reason: t('dashboard.orchestration.workoutContinue.reason', {
              completed: todaysPlan.completedSessions,
              total: todaysPlan.totalSessions,
            }),
            nextStep: t('dashboard.orchestration.workoutContinue.nextStep'),
          },
          primaryAction: {
            label: t('dashboard.orchestration.workoutContinue.cta'),
            onAction: () =>
              pushPage({
                id: 'workout-logger',
                component: 'WorkoutLogger',
                props: { planDay: todaysPlan.nextUncompletedSession },
              }),
          },
        }),
      );
    }

    if (todaysPlan.nextMealToLog) {
      const mealLabelKey = `dashboard.todaysPlan.mealSlot${capitalize(todaysPlan.nextMealToLog)}`;
      return guidedOrchestration(
        createSurfaceStateContract({
          surface: 'dashboard.hero',
          state: 'warning',
          copy: {
            title: t('dashboard.orchestration.meal.title'),
            missing: t('dashboard.orchestration.meal.missing', { meal: t(mealLabelKey).toLowerCase() }),
            reason: t('dashboard.orchestration.meal.reason', {
              logged: todaysPlan.mealsLogged,
              total: todaysPlan.totalMealsPlanned,
            }),
            nextStep: t('dashboard.orchestration.meal.nextStep'),
          },
          primaryAction: {
            label: t('dashboard.orchestration.meal.cta'),
            onAction: () => navigateTab('calendar'),
          },
        }),
      );
    }

    return {
      heroMode: 'passive',
      heroContract: createSurfaceStateContract({
        surface: 'dashboard.hero',
        state: 'success',
        copy: {
          title: t('dashboard.orchestration.review.title'),
          reason: t('dashboard.orchestration.review.reason'),
          nextStep: t('dashboard.orchestration.review.nextStep'),
        },
      }),
      showInsights: true,
      suppressInsightAction: false,
      showQuickActions: true,
      suppressPlanPrimaryActions: false,
      allowMealSlotActions: true,
    };
  }, [activeGoal, activePlan, navigateTab, profile, pushPage, t, todaysPlan, trainingProfile]);
}
