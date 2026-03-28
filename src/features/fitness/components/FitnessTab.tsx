import React, { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Dumbbell, History, BarChart3 } from 'lucide-react';
import { SubTabBar } from '../../../components/shared/SubTabBar';
import type { SubTab } from '../../../components/shared/SubTabBar';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import type { SelectedExercise } from '../types';
import { FitnessOnboarding } from './FitnessOnboarding';
import { TrainingPlanView } from './TrainingPlanView';
import { WorkoutLogger } from './WorkoutLogger';
import { CardioLogger } from './CardioLogger';
import { WorkoutHistory } from './WorkoutHistory';
import { ProgressDashboard } from './ProgressDashboard';
import { StreakCounter } from './StreakCounter';
import { SmartInsightBanner } from './SmartInsightBanner';
import { useFitnessNutritionBridge } from '../hooks/useFitnessNutritionBridge';
import { QuickConfirmCard } from './QuickConfirmCard';
import { useProgressiveOverload } from '../hooks/useProgressiveOverload';
import { useTrainingPlan } from '../hooks/useTrainingPlan';
import { useNotification } from '../../../contexts/NotificationContext';

type FitnessSubTab = 'plan' | 'workout' | 'history' | 'progress';

const FitnessTabInner: React.FC = () => {
  const { t } = useTranslation();
  const isOnboarded = useFitnessStore((s) => s.isOnboarded);
  const setOnboarded = useFitnessStore((s) => s.setOnboarded);
  const [activeSubTab, setActiveSubTab] = useState<FitnessSubTab>('plan');
  const workoutMode = useFitnessStore((s) => s.workoutMode);
  const setWorkoutMode = useFitnessStore((s) => s.setWorkoutMode);
  const { insight } = useFitnessNutritionBridge();
  const { suggestNextSet } = useProgressiveOverload();
  const trainingPlans = useFitnessStore((s) => s.trainingPlans);
  const trainingPlanDays = useFitnessStore((s) => s.trainingPlanDays);
  const trainingProfile = useFitnessStore((s) => s.trainingProfile);
  const addTrainingPlan = useFitnessStore((s) => s.addTrainingPlan);
  const addPlanDays = useFitnessStore((s) => s.addPlanDays);
  const healthProfileWeight = useHealthProfileStore((s) => s.profile.weightKg);
  const healthProfileAge = useHealthProfileStore((s) => s.profile.age);
  const { generatePlan, isGenerating } = useTrainingPlan();
  const notify = useNotification();
  const [confirmedExercises, setConfirmedExercises] = useState<Set<string>>(
    () => new Set(),
  );

  const todayExercises: SelectedExercise[] = useMemo(() => {
    const activePlan = trainingPlans.find((p) => p.status === 'active');
    if (!activePlan) return [];
    const jsDay = new Date().getDay();
    const todayDow = jsDay === 0 ? 7 : jsDay;
    const todayPlanDay = trainingPlanDays.find(
      (d) => d.planId === activePlan.id && d.dayOfWeek === todayDow,
    );
    if (!todayPlanDay?.exercises) return [];
    try {
      const parsed: unknown = JSON.parse(todayPlanDay.exercises);
      return Array.isArray(parsed) ? (parsed as SelectedExercise[]) : [];
    } catch {
      return [];
    }
  }, [trainingPlans, trainingPlanDays]);

  const strengthExercises = useMemo(
    () =>
      todayExercises.filter(
        (ex) =>
          ex.exercise.exerciseType === 'strength' &&
          !confirmedExercises.has(ex.exercise.id),
      ),
    [todayExercises, confirmedExercises],
  );

  const handleQuickConfirm = useCallback(
    (exerciseId: string) => {
      setConfirmedExercises((prev) => new Set(prev).add(exerciseId));
    },
    [],
  );

  const handleOpenCustomize = useCallback(() => {
    setActiveSubTab('workout');
  }, []);

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
      }
    }
  }, [isOnboarded, trainingProfile, trainingPlans.length, generatePlan, healthProfileWeight, healthProfileAge, addTrainingPlan, addPlanDays]);

  const handleTabChange = useCallback((id: string) => {
    setActiveSubTab(id as FitnessSubTab);
  }, []);

  const handleSelectStrength = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkoutMode('strength');
  }, [setWorkoutMode]);

  const handleSelectCardio = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkoutMode('cardio');
  }, [setWorkoutMode]);

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

  const handleWorkoutComplete = useCallback(() => {
    setActiveSubTab('history');
  }, []);

  const handleWorkoutBack = useCallback(() => {
    setActiveSubTab('plan');
  }, []);

  const handleLogCardio = useCallback(() => {
    setWorkoutMode('cardio');
    setActiveSubTab('workout');
  }, [setWorkoutMode]);

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
            <TrainingPlanView
              onGeneratePlan={handleGeneratePlan}
              isGenerating={isGenerating}
              onLogCardio={handleLogCardio}
            />
            {strengthExercises.length > 0 && (
              <div className="mt-4 space-y-3" data-testid="quick-confirm-list">
                {strengthExercises.map((ex) => (
                  <QuickConfirmCard
                    key={ex.exercise.id}
                    exerciseName={ex.exercise.nameVi}
                    suggestion={suggestNextSet(
                      ex.exercise.id,
                      ex.repsMin,
                      ex.repsMax,
                    )}
                    onConfirm={() => handleQuickConfirm(ex.exercise.id)}
                    onCustomize={handleOpenCustomize}
                  />
                ))}
              </div>
            )}
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
