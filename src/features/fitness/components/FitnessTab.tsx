import React, { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, History, BarChart3 } from 'lucide-react';
import { SubTabBar } from '../../../components/shared/SubTabBar';
import type { SubTab } from '../../../components/shared/SubTabBar';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import { FitnessOnboarding } from './FitnessOnboarding';
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
  const isOnboarded = useFitnessStore((s) => s.isOnboarded);
  const setOnboarded = useFitnessStore((s) => s.setOnboarded);
  const [activeSubTab, setActiveSubTab] = useState<FitnessSubTab>('plan');
  const { insight } = useFitnessNutritionBridge();
  const trainingPlans = useFitnessStore((s) => s.trainingPlans);
  const trainingProfile = useFitnessStore((s) => s.trainingProfile);
  const addTrainingPlan = useFitnessStore((s) => s.addTrainingPlan);
  const addPlanDays = useFitnessStore((s) => s.addPlanDays);
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

  const handleOnboardingComplete = useCallback(() => {
    setOnboarded(true);
  }, [setOnboarded]);

  const hasGeneratedAfterOnboard = React.useRef(false);

  React.useEffect(() => {
    if (isOnboarded && trainingProfile && !hasGeneratedAfterOnboard.current && trainingPlans.length === 0) {
      hasGeneratedAfterOnboard.current = true;
      const result = generatePlan({
        trainingProfile,
        healthProfile: { age: healthProfileAge ?? 30, weightKg: healthProfileWeight },
      });
      if (result) {
        addTrainingPlan(result.plan);
        addPlanDays(result.days);
        useFitnessStore.setState({ showPlanCelebration: true });
      }
    }
  }, [isOnboarded, trainingProfile, trainingPlans.length, generatePlan, healthProfileWeight, healthProfileAge, addTrainingPlan, addPlanDays]);

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

  if (!isOnboarded) {
    return <FitnessOnboarding onComplete={handleOnboardingComplete} />;
  }

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
