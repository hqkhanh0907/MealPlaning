import { AlertTriangle, BarChart3, ClipboardList, History } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SubTab } from '../../../components/shared/SubTabBar';
import { SubTabBar } from '../../../components/shared/SubTabBar';
import { useNotification } from '../../../contexts/NotificationContext';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useNavigationStore } from '../../../store/navigationStore';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import { useFitnessNutritionBridge } from '../hooks/useFitnessNutritionBridge';
import { useTrainingPlan } from '../hooks/useTrainingPlan';
import { PlanGeneratedCard } from './PlanGeneratedCard';
import { ProgressDashboard } from './ProgressDashboard';
import { SmartInsightBanner } from './SmartInsightBanner';
import { TrainingPlanView } from './TrainingPlanView';
import { WorkoutHistory } from './WorkoutHistory';

type FitnessSubTab = 'plan' | 'history' | 'progress';

const FitnessTabInner = () => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<FitnessSubTab>('plan');
  const { insight } = useFitnessNutritionBridge();
  const trainingProfile = useFitnessStore(s => s.trainingProfile);
  const planStrategy = useFitnessStore(s => s.planStrategy);
  const profileOutOfSync = useFitnessStore(s => s.profileOutOfSync);
  const profileChangedFields = useFitnessStore(s => s.profileChangedFields);
  const addTrainingPlan = useFitnessStore(s => s.addTrainingPlan);
  const addPlanDays = useFitnessStore(s => s.addPlanDays);
  const setActivePlan = useFitnessStore(s => s.setActivePlan);
  const pushPage = useNavigationStore(s => s.pushPage);
  const healthProfileWeight = useHealthProfileStore(s => s.profile?.weightKg ?? 70);
  const healthProfileAge = useHealthProfileStore(s => s.profile?.age ?? 30);
  const { generatePlan, isGenerating } = useTrainingPlan();
  const notify = useNotification();

  const subTabs: SubTab[] = useMemo(
    () => [
      { id: 'plan', label: t('fitness.plan.tab'), icon: ClipboardList },
      { id: 'progress', label: t('fitness.progress.title'), icon: BarChart3 },
      { id: 'history', label: t('fitness.history.title'), icon: History },
    ],
    [t],
  );

  const handleTabChange = useCallback((id: string) => {
    setActiveSubTab(id as FitnessSubTab);
  }, []);

  const handleGeneratePlan = useCallback(async () => {
    if (!trainingProfile) return;
    const result = generatePlan({
      trainingProfile,
      healthProfile: { age: healthProfileAge ?? 30, weightKg: healthProfileWeight },
    });
    if (result) {
      await addTrainingPlan(result.plan);
      addPlanDays(result.days);
      setActivePlan(result.plan.id);
      notify.success(t('fitness.plan.planCreated'));
    } else {
      notify.error(t('fitness.plan.planError'));
    }
    setActiveSubTab('plan');
  }, [
    trainingProfile,
    generatePlan,
    healthProfileWeight,
    healthProfileAge,
    addTrainingPlan,
    addPlanDays,
    setActivePlan,
    notify,
    t,
  ]);

  const handleCreateManualPlan = useCallback(async () => {
    const now = new Date();
    const planId = `manual-${now.getTime()}`;
    const startDate = now.toISOString();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const plan = {
      id: planId,
      name: 'Manual Plan',
      status: 'active' as const,
      splitType: 'custom' as const,
      durationWeeks: 1,
      currentWeek: 1,
      startDate,
      endDate,
      createdAt: startDate,
      updatedAt: startDate,
      trainingDays: [] as number[],
      restDays: [1, 2, 3, 4, 5, 6, 7],
    };
    await addTrainingPlan(plan);
    setActivePlan(plan.id);

    const days = Array.from({ length: 7 }, (_, i) => ({
      id: `${planId}-d${i + 1}`,
      planId,
      dayOfWeek: i + 1,
      sessionOrder: 1,
      workoutType: 'Rest',
      exercises: '[]',
      originalExercises: '[]',
      isUserAssigned: false,
      originalDayOfWeek: i + 1,
    }));
    addPlanDays(days);

    const todayDow = now.getDay() === 0 ? 7 : now.getDay();
    const todayDay = days.find(d => d.dayOfWeek === todayDow);
    if (todayDay) {
      pushPage({
        id: 'plan-day-editor',
        component: 'PlanDayEditor',
        props: { planDay: todayDay },
      });
    }

    notify.success(t('fitness.plan.planCreated'));
    setActiveSubTab('plan');
  }, [addTrainingPlan, addPlanDays, setActivePlan, pushPage, notify, t]);

  return (
    <div className="flex h-full flex-col" data-testid="fitness-tab">
      <div className="px-4 pt-3 pb-2">
        <SubTabBar tabs={subTabs} activeTab={activeSubTab} onTabChange={handleTabChange} />
      </div>

      {profileOutOfSync && activeSubTab === 'plan' && (
        <div
          className="bg-warning/10 text-warning mx-4 mt-2 flex items-center gap-2 rounded-lg p-3 text-sm"
          data-testid="profile-out-of-sync-banner"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <span>{t('fitness.plan.profileOutOfSync')}</span>
            {profileChangedFields.length > 0 && (
              <span className="ml-1 text-xs opacity-80" data-testid="changed-fields-hint">
                ({profileChangedFields.map(f => t(`fitness.profile.field.${f}`)).join(', ')})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleGeneratePlan}
            className="text-primary hover:bg-muted focus-visible:ring-ring/50 rounded px-1 text-xs font-semibold whitespace-nowrap underline focus-visible:ring-3"
            data-testid="regenerate-plan-btn"
          >
            {t('fitness.plan.regeneratePlan')}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {insight && activeSubTab === 'plan' && <SmartInsightBanner insight={insight} />}
        {activeSubTab === 'plan' && (
          <div data-testid="plan-subtab-content" role="tabpanel" id="tabpanel-plan">
            <PlanGeneratedCard />
            <TrainingPlanView
              onGeneratePlan={handleGeneratePlan}
              onCreateManualPlan={handleCreateManualPlan}
              planStrategy={planStrategy}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {activeSubTab === 'history' && (
          <div data-testid="history-subtab-content" role="tabpanel" id="tabpanel-history">
            <WorkoutHistory />
          </div>
        )}

        {activeSubTab === 'progress' && (
          <div data-testid="progress-subtab-content" role="tabpanel" id="tabpanel-progress">
            <ProgressDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export const FitnessTab = memo(FitnessTabInner);
FitnessTab.displayName = 'FitnessTab';
