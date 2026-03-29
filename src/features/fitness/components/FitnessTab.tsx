import React, { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, History, BarChart3 } from 'lucide-react';
import { SubTabBar } from '../../../components/shared/SubTabBar';
import type { SubTab } from '../../../components/shared/SubTabBar';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import { useNavigationStore } from '../../../store/navigationStore';
import { TrainingPlanView } from './TrainingPlanView';
import { WorkoutHistory } from './WorkoutHistory';
import { ProgressDashboard } from './ProgressDashboard';
import { SmartInsightBanner } from './SmartInsightBanner';
import { PlanGeneratedCard } from './PlanGeneratedCard';
import { useFitnessNutritionBridge } from '../hooks/useFitnessNutritionBridge';
import { useTrainingPlan } from '../hooks/useTrainingPlan';
import { useNotification } from '../../../contexts/NotificationContext';

type FitnessSubTab = 'plan' | 'history' | 'progress';

const FitnessTabInner: React.FC = () => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<FitnessSubTab>('plan');
  const { insight } = useFitnessNutritionBridge();
  const trainingProfile = useFitnessStore((s) => s.trainingProfile);
  const planStrategy = useFitnessStore((s) => s.planStrategy);
  const addTrainingPlan = useFitnessStore((s) => s.addTrainingPlan);
  const addPlanDays = useFitnessStore((s) => s.addPlanDays);
  const pushPage = useNavigationStore((s) => s.pushPage);
  const healthProfileWeight = useHealthProfileStore((s) => s.profile.weightKg);
  const healthProfileAge = useHealthProfileStore((s) => s.profile.age);
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

  const handleGeneratePlan = useCallback(() => {
    if (!trainingProfile) return;
    const result = generatePlan({
      trainingProfile,
      healthProfile: { age: healthProfileAge ?? 30, weightKg: healthProfileWeight },
    });
    if (result) {
      addTrainingPlan(result.plan);
      addPlanDays(result.days);
      notify.success(t('fitness.plan.planCreated'));
    } else {
      notify.error(t('fitness.plan.planError'));
    }
    setActiveSubTab('plan');
  }, [trainingProfile, generatePlan, healthProfileWeight, healthProfileAge, addTrainingPlan, addPlanDays, notify, t]);

  const handleCreateManualPlan = useCallback(() => {
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
    addTrainingPlan(plan);

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
    const todayDay = days.find((d) => d.dayOfWeek === todayDow);
    if (todayDay) {
      pushPage({
        id: 'plan-day-editor',
        component: 'PlanDayEditor',
        props: { planDay: todayDay },
      });
    }

    notify.success(t('fitness.plan.planCreated'));
    setActiveSubTab('plan');
  }, [addTrainingPlan, addPlanDays, pushPage, notify, t]);

  return (
    <div className="flex flex-col h-full" data-testid="fitness-tab">
      <div className="px-4 pt-3 pb-2">
        <SubTabBar
          tabs={subTabs}
          activeTab={activeSubTab}
          onTabChange={handleTabChange}
        />
      </div>

      {insight && <SmartInsightBanner insight={insight} />}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeSubTab === 'plan' && (
          <div
            data-testid="plan-subtab-content"
            role="tabpanel"
            id="tabpanel-plan"
          >
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
          <div
            data-testid="history-subtab-content"
            role="tabpanel"
            id="tabpanel-history"
          >
            <WorkoutHistory />
          </div>
        )}

        {activeSubTab === 'progress' && (
          <div
            data-testid="progress-subtab-content"
            role="tabpanel"
            id="tabpanel-progress"
          >
            <ProgressDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export const FitnessTab = memo(FitnessTabInner);
FitnessTab.displayName = 'FitnessTab';
