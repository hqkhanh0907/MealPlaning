import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  CheckCircle,
  Dumbbell,
  UtensilsCrossed,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTodaysPlan } from '../hooks/useTodaysPlan';
import { useNavigationStore } from '../../../store/navigationStore';

const MEAL_LOG_KEYS: Record<string, string> = {
  breakfast: 'dashboard.todaysPlan.logBreakfast',
  lunch: 'dashboard.todaysPlan.logLunch',
  dinner: 'dashboard.todaysPlan.logDinner',
};

const CARD_CLASS =
  'bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 p-4';

function MealsSection({
  mealsLogged,
  totalMealsPlanned,
  hasReachedTarget,
  nextMealToLog,
  onLogMeal,
}: {
  mealsLogged: number;
  totalMealsPlanned: number;
  hasReachedTarget: boolean;
  nextMealToLog?: string;
  onLogMeal?: () => void;
}) {
  const { t } = useTranslation();
  const nextMealKey = nextMealToLog
    ? MEAL_LOG_KEYS[nextMealToLog]
    : undefined;

  return (
    <div data-testid="meals-section">
      <div className="flex items-center gap-1.5 mb-2">
        <UtensilsCrossed className="w-4 h-4 text-orange-500" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {t('dashboard.todaysPlan.meals')}
        </span>
      </div>
      <div
        data-testid="meals-progress"
        className="text-sm font-semibold text-slate-800 dark:text-slate-100"
      >
        {t('dashboard.todaysPlan.mealsProgress', {
          logged: mealsLogged,
          total: totalMealsPlanned,
        })}
        {hasReachedTarget && (
          <span className="inline-flex items-center gap-1 ml-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
            {t('dashboard.todaysPlan.mealsReachedTarget')}
          </span>
        )}
      </div>
      {nextMealKey && !hasReachedTarget && (
        <Button
          variant="link"
          size="sm"
          onClick={onLogMeal}
          data-testid="log-meal-cta"
          className="mt-2 h-auto p-0 text-xs text-blue-600 dark:text-blue-400"
        >
          {t(nextMealKey)}
        </Button>
      )}
    </div>
  );
}

const TodaysPlanCard: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const data = useTodaysPlan();
  const pushPage = useNavigationStore((s) => s.pushPage);
  const navigateTab = useNavigationStore((s) => s.navigateTab);

  const handleStartWorkout = useCallback(() => {
    pushPage({ id: 'workout-logger', component: 'WorkoutLogger' });
  }, [pushPage]);

  const handleCreatePlan = useCallback(() => {
    navigateTab('fitness');
  }, [navigateTab]);

  const handleLogWeight = useCallback(() => {
    pushPage({ id: 'weight-logger', component: 'WeightLogger' });
  }, [pushPage]);

  const handleLogCardio = useCallback(() => {
    pushPage({ id: 'cardio-logger', component: 'CardioLogger' });
  }, [pushPage]);

  const handleLogMeal = useCallback(() => {
    navigateTab('calendar');
  }, [navigateTab]);

  const mealsProps = {
    mealsLogged: data.mealsLogged,
    totalMealsPlanned: data.totalMealsPlanned,
    hasReachedTarget: data.hasReachedTarget,
    nextMealToLog: data.nextMealToLog,
    onLogMeal: handleLogMeal,
  };

  if (data.state === 'training-pending') {
    return (
      <div data-testid="todays-plan-card" className={CARD_CLASS}>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
          {t('dashboard.todaysPlan.title')}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div data-testid="workout-section">
            <div className="flex items-center gap-1.5 mb-2">
              <Dumbbell className="w-4 h-4 text-blue-500" aria-hidden="true" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('dashboard.todaysPlan.workout')}
              </span>
            </div>
            {data.workoutType && (
              <p
                data-testid="workout-name"
                className="text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                {data.workoutType}
              </p>
            )}
            {data.exerciseCount != null && (
              <p
                data-testid="exercise-count"
                className="text-xs text-slate-500 dark:text-slate-400"
              >
                {t('dashboard.todaysPlan.exercisesCount', {
                  count: data.exerciseCount,
                })}
              </p>
            )}
            <Button
              size="sm"
              onClick={handleStartWorkout}
              data-testid="start-workout-cta"
              className="mt-2 gap-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              {t('dashboard.todaysPlan.startCta')}
            </Button>
          </div>
          <MealsSection {...mealsProps} />
        </div>
      </div>
    );
  }

  if (data.state === 'training-completed') {
    return (
      <div data-testid="todays-plan-card" className={CARD_CLASS}>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
          {t('dashboard.todaysPlan.title')}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div data-testid="workout-summary">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {t('dashboard.todaysPlan.completed')}
              </span>
            </div>
            {data.completedWorkout && (
              <>
                <p
                  data-testid="workout-duration"
                  className="text-sm text-slate-700 dark:text-slate-200"
                >
                  {t('dashboard.todaysPlan.duration', {
                    minutes: data.completedWorkout.durationMin,
                  })}
                </p>
                <p
                  data-testid="workout-sets"
                  className="text-sm text-slate-700 dark:text-slate-200"
                >
                  {t('dashboard.todaysPlan.setsCount', {
                    count: data.completedWorkout.totalSets,
                  })}
                </p>
                {data.completedWorkout.hasPR && (
                  <p
                    data-testid="pr-highlight"
                    className="text-sm font-bold text-amber-500"
                  >
                    {t('dashboard.todaysPlan.prHighlight')}
                  </p>
                )}
              </>
            )}
          </div>
          <MealsSection {...mealsProps} />
        </div>
      </div>
    );
  }

  if (data.state === 'rest-day') {
    return (
      <div data-testid="todays-plan-card" className={CARD_CLASS}>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
          {t('dashboard.todaysPlan.restDayTitle')}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div data-testid="recovery-tips">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              <span aria-hidden="true">{'🚶 '}</span>
              {t('dashboard.todaysPlan.recoveryTip1')}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
              <span aria-hidden="true">{'💧 '}</span>
              {t('dashboard.todaysPlan.recoveryTip2')}
            </p>
          </div>
          <div data-testid="tomorrow-preview">
            {data.tomorrowWorkoutType ? (
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {t('dashboard.todaysPlan.tomorrowPreview', {
                  name: data.tomorrowWorkoutType,
                  count: data.tomorrowExerciseCount ?? 0,
                })}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('dashboard.todaysPlan.tomorrowRest')}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3" data-testid="quick-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogWeight}
            data-testid="log-weight-chip"
            className="rounded-full border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            {t('dashboard.todaysPlan.logWeight')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogCardio}
            data-testid="log-cardio-chip"
            className="rounded-full border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            {t('dashboard.todaysPlan.logCardio')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="todays-plan-card" className={CARD_CLASS}>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
        {t('dashboard.todaysPlan.title')}
      </h3>
      <div
        data-testid="no-plan-section"
        className="flex flex-col items-center py-4"
      >
        <Dumbbell className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" aria-hidden="true" />
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          {t('dashboard.todaysPlan.noPlan')}
        </p>
        <Button
          size="sm"
          onClick={handleCreatePlan}
          data-testid="create-plan-cta"
          className="gap-1 bg-blue-600 text-white hover:bg-blue-700"
        >
          {t('dashboard.todaysPlan.createPlan')}
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-1">
        <MealsSection {...mealsProps} />
      </div>
    </div>
  );
});

TodaysPlanCard.displayName = 'TodaysPlanCard';

export { TodaysPlanCard };
