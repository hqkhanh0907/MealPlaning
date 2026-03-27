import React, { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Dumbbell, History, BarChart3 } from 'lucide-react';
import { SubTabBar } from '../../../components/shared/SubTabBar';
import type { SubTab } from '../../../components/shared/SubTabBar';
import { useFitnessStore } from '../../../store/fitnessStore';
import { FitnessOnboarding } from './FitnessOnboarding';
import { TrainingPlanView } from './TrainingPlanView';
import { WorkoutLogger } from './WorkoutLogger';
import { CardioLogger } from './CardioLogger';
import { WorkoutHistory } from './WorkoutHistory';
import { ProgressDashboard } from './ProgressDashboard';
import { StreakCounter } from './StreakCounter';

type FitnessSubTab = 'plan' | 'workout' | 'history' | 'progress';

const FitnessTabInner: React.FC = () => {
  const { t } = useTranslation();
  const isOnboarded = useFitnessStore((s) => s.isOnboarded);
  const setOnboarded = useFitnessStore((s) => s.setOnboarded);
  const [activeSubTab, setActiveSubTab] = useState<FitnessSubTab>('plan');
  const workoutMode = useFitnessStore((s) => s.workoutMode);
  const setWorkoutMode = useFitnessStore((s) => s.setWorkoutMode);

  const subTabs: SubTab[] = useMemo(
    () => [
      { id: 'plan', label: t('fitness.plan.tab'), icon: ClipboardList },
      { id: 'workout', label: t('fitness.workout.tab'), icon: Dumbbell },
      { id: 'history', label: t('fitness.history.title'), icon: History },
      { id: 'progress', label: t('fitness.progress.title'), icon: BarChart3 },
    ],
    [t],
  );

  const handleOnboardingComplete = useCallback(() => {
    setOnboarded(true);
  }, [setOnboarded]);

  const handleTabChange = useCallback((id: string) => {
    setActiveSubTab(id as FitnessSubTab);
  }, []);

  const handleSelectStrength = useCallback(() => {
    setWorkoutMode('strength');
  }, [setWorkoutMode]);

  const handleSelectCardio = useCallback(() => {
    setWorkoutMode('cardio');
  }, [setWorkoutMode]);

  const handleGeneratePlan = useCallback(() => {
    setActiveSubTab('plan');
  }, []);

  const handleWorkoutComplete = useCallback(() => {
    setActiveSubTab('history');
  }, []);

  const handleWorkoutBack = useCallback(() => {
    setActiveSubTab('plan');
  }, []);

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

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeSubTab === 'plan' && (
          <div
            data-testid="plan-subtab-content"
            role="tabpanel"
            id="tabpanel-plan"
          >
            <TrainingPlanView onGeneratePlan={handleGeneratePlan} />
          </div>
        )}

        {activeSubTab === 'workout' && (
          <div
            data-testid="workout-subtab-content"
            role="tabpanel"
            id="tabpanel-workout"
          >
            <div
              className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4"
              role="radiogroup"
              aria-label={t('fitness.workout.tab')}
            >
              <button
                type="button"
                role="radio"
                aria-checked={workoutMode === 'strength'}
                data-testid="workout-mode-strength"
                onClick={handleSelectStrength}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  workoutMode === 'strength'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t('fitness.history.strength')}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={workoutMode === 'cardio'}
                data-testid="workout-mode-cardio"
                onClick={handleSelectCardio}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  workoutMode === 'cardio'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t('fitness.history.cardio')}
              </button>
            </div>

            {workoutMode === 'strength' ? (
              <WorkoutLogger
                onComplete={handleWorkoutComplete}
                onBack={handleWorkoutBack}
              />
            ) : (
              <CardioLogger
                onComplete={handleWorkoutComplete}
                onBack={handleWorkoutBack}
              />
            )}
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
            <StreakCounter />
            <ProgressDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export const FitnessTab = memo(FitnessTabInner);
FitnessTab.displayName = 'FitnessTab';
