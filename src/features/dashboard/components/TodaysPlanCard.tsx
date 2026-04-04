import {
  CheckCircle,
  ChevronRight,
  Droplets,
  Dumbbell,
  Footprints,
  Play,
  RotateCw,
  UtensilsCrossed,
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { useNavigationStore } from '../../../store/navigationStore';
import { translateWorkoutType } from '../../fitness/utils/translateWorkoutType';
import { useTodaysPlan } from '../hooks/useTodaysPlan';
import { WeightQuickLog } from './WeightQuickLog';

const MEAL_LOG_KEYS: Record<string, string> = {
  breakfast: 'dashboard.todaysPlan.logBreakfast',
  lunch: 'dashboard.todaysPlan.logLunch',
  dinner: 'dashboard.todaysPlan.logDinner',
};

const CARD_CLASS = 'bg-card rounded-2xl shadow-md border border-border-subtle p-4';

function SessionInfo({
  totalSessions,
  completedSessions,
  variant,
}: Readonly<{
  totalSessions: number;
  completedSessions: number;
  variant: 'pending' | 'completed';
}>) {
  const { t } = useTranslation();
  if (totalSessions <= 1) return null;

  const text =
    variant === 'completed'
      ? t('dashboard.todaysPlan.completedAllSessions', {
          completed: completedSessions,
          total: totalSessions,
        })
      : t('dashboard.todaysPlan.sessionsToday', { count: totalSessions });

  return (
    <p data-testid="session-info" className="text-muted-foreground mt-0.5 text-xs">
      {text}
    </p>
  );
}

function MealsSection({
  mealsLogged,
  totalMealsPlanned,
  hasReachedTarget,
  nextMealToLog,
  onLogMeal,
}: Readonly<{
  mealsLogged: number;
  totalMealsPlanned: number;
  hasReachedTarget: boolean;
  nextMealToLog?: string;
  onLogMeal?: () => void;
}>) {
  const { t } = useTranslation();
  const nextMealKey = nextMealToLog ? MEAL_LOG_KEYS[nextMealToLog] : undefined;

  return (
    <div data-testid="meals-section">
      <div className="mb-2 flex items-center gap-1.5">
        <UtensilsCrossed className="h-4 w-4 text-orange-500" aria-hidden="true" />
        <span className="text-foreground-secondary text-xs font-medium">{t('dashboard.todaysPlan.meals')}</span>
      </div>
      <div data-testid="meals-progress" className="text-foreground text-sm font-semibold">
        {t('dashboard.todaysPlan.mealsProgress', {
          logged: mealsLogged,
          total: totalMealsPlanned,
        })}
        {hasReachedTarget && (
          <span className="text-primary ml-1 inline-flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
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

const TodaysPlanCard = React.memo(function TodaysPlanCard() {
  const { t } = useTranslation();
  const data = useTodaysPlan();
  const pushPage = useNavigationStore(s => s.pushPage);
  const navigateTab = useNavigationStore(s => s.navigateTab);
  const [showWeightLog, setShowWeightLog] = useState(false);

  const handleStartWorkout = useCallback(() => {
    pushPage({
      id: 'workout-logger',
      component: 'WorkoutLogger',
      props: { planDay: data.nextUncompletedSession },
    });
  }, [pushPage, data.nextUncompletedSession]);

  const handleCreatePlan = useCallback(() => {
    navigateTab('fitness');
  }, [navigateTab]);

  const handleLogWeight = useCallback(() => {
    setShowWeightLog(true);
  }, []);

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
      <>
        <div data-testid="todays-plan-card" className={CARD_CLASS}>
          <h3 className="text-foreground mb-3 text-sm font-semibold">{t('dashboard.todaysPlan.title')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div data-testid="workout-section">
              <div className="mb-2 flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <span className="text-foreground-secondary text-xs font-medium">
                  {t('dashboard.todaysPlan.workout')}
                </span>
              </div>
              {data.workoutType && (
                <p data-testid="workout-name" className="text-foreground text-sm font-semibold">
                  {translateWorkoutType(t, data.workoutType)}
                </p>
              )}
              {data.exerciseCount != null && (
                <p data-testid="exercise-count" className="text-muted-foreground text-xs">
                  {t('dashboard.todaysPlan.exercisesCount', {
                    count: data.exerciseCount,
                  })}
                </p>
              )}
              <SessionInfo
                totalSessions={data.totalSessions}
                completedSessions={data.completedSessions}
                variant="pending"
              />
              <Button
                size="sm"
                onClick={handleStartWorkout}
                data-testid="start-workout-cta"
                className="mt-2 gap-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                {t('dashboard.todaysPlan.startCta')}
              </Button>
            </div>
            <MealsSection {...mealsProps} />
          </div>
        </div>
        {showWeightLog && <WeightQuickLog onClose={() => setShowWeightLog(false)} />}
      </>
    );
  }

  if (data.state === 'training-partial') {
    return (
      <div data-testid="todays-plan-card" className={CARD_CLASS}>
        <h3 className="text-foreground mb-3 text-sm font-semibold">{t('dashboard.todaysPlan.title')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div data-testid="partial-progress-section">
            <div className="mb-2 flex items-center gap-1.5">
              <RotateCw className="text-primary h-4 w-4" aria-hidden="true" />
              <span className="text-primary text-xs font-medium">
                {t('dashboard.todaysPlan.sessionProgress', {
                  completed: data.completedSessions,
                  total: data.totalSessions,
                })}
              </span>
            </div>
            {data.nextUncompletedSession && (
              <p data-testid="next-session-name" className="text-foreground text-sm font-semibold">
                {t('dashboard.todaysPlan.nextSession', {
                  name: translateWorkoutType(t, data.nextUncompletedSession.workoutType),
                })}
              </p>
            )}
            <Button
              size="sm"
              onClick={handleStartWorkout}
              data-testid="continue-session-cta"
              className="bg-primary text-primary-foreground hover:bg-primary/80 mt-2 gap-1"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              {t('dashboard.todaysPlan.continueSession')}
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
        <h3 className="text-foreground mb-3 text-sm font-semibold">{t('dashboard.todaysPlan.title')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div data-testid="workout-summary">
            <div className="mb-2 flex items-center gap-1.5">
              <CheckCircle className="text-primary h-4 w-4" aria-hidden="true" />
              <span className="text-primary text-xs font-medium">{t('dashboard.todaysPlan.completed')}</span>
            </div>
            {data.completedWorkout && (
              <>
                <p data-testid="workout-duration" className="text-foreground text-sm">
                  {t('dashboard.todaysPlan.duration', {
                    minutes: data.completedWorkout.durationMin,
                  })}
                </p>
                <p data-testid="workout-sets" className="text-foreground text-sm">
                  {t('dashboard.todaysPlan.setsCount', {
                    count: data.completedWorkout.totalSets,
                  })}
                </p>
                {data.completedWorkout.hasPR && (
                  <p data-testid="pr-highlight" className="text-sm font-bold text-amber-500">
                    {t('dashboard.todaysPlan.prHighlight')}
                  </p>
                )}
              </>
            )}
            <SessionInfo
              totalSessions={data.totalSessions}
              completedSessions={data.completedSessions}
              variant="completed"
            />
          </div>
          <MealsSection {...mealsProps} />
        </div>
      </div>
    );
  }

  if (data.state === 'rest-day') {
    return (
      <>
        <div data-testid="todays-plan-card" className={CARD_CLASS}>
          <h3 className="text-foreground mb-3 text-sm font-semibold">{t('dashboard.todaysPlan.restDayTitle')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div data-testid="recovery-tips">
              <p className="text-foreground text-sm">
                <span aria-hidden="true">
                  <Footprints className="mr-1 inline-block size-4" />
                </span>
                {t('dashboard.todaysPlan.recoveryTip1')}
              </p>
              <p className="text-foreground mt-1 text-sm">
                <span aria-hidden="true">
                  <Droplets className="mr-1 inline-block size-4" />
                </span>
                {t('dashboard.todaysPlan.recoveryTip2')}
              </p>
            </div>
            <div data-testid="tomorrow-preview">
              {data.tomorrowWorkoutType ? (
                <p className="text-foreground text-sm">
                  {t('dashboard.todaysPlan.tomorrowPreview', {
                    name: translateWorkoutType(t, data.tomorrowWorkoutType),
                    count: data.tomorrowExerciseCount ?? 0,
                  })}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">{t('dashboard.todaysPlan.tomorrowRest')}</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2" data-testid="quick-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogWeight}
              data-testid="log-weight-chip"
              className="bg-muted text-foreground hover:bg-accent rounded-full border-transparent"
            >
              {t('dashboard.todaysPlan.logWeight')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogCardio}
              data-testid="log-cardio-chip"
              className="bg-muted text-foreground hover:bg-accent rounded-full border-transparent"
            >
              {t('dashboard.todaysPlan.logCardio')}
            </Button>
          </div>
        </div>
        {showWeightLog && <WeightQuickLog onClose={() => setShowWeightLog(false)} />}
      </>
    );
  }

  return (
    <div data-testid="todays-plan-card" className={CARD_CLASS}>
      <h3 className="text-foreground mb-3 text-sm font-semibold">{t('dashboard.todaysPlan.title')}</h3>
      <div data-testid="no-plan-section" className="flex flex-col items-center py-4">
        <Dumbbell className="text-muted-foreground mb-3 h-12 w-12" aria-hidden="true" />
        <p className="text-muted-foreground mb-3 text-sm">{t('dashboard.todaysPlan.noPlan')}</p>
        <Button
          size="sm"
          onClick={handleCreatePlan}
          data-testid="create-plan-cta"
          className="gap-1 bg-blue-600 text-white hover:bg-blue-700"
        >
          {t('dashboard.todaysPlan.createPlan')}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="border-border-subtle mt-1 border-t pt-3">
        <MealsSection {...mealsProps} />
      </div>
    </div>
  );
});

TodaysPlanCard.displayName = 'TodaysPlanCard';

export { TodaysPlanCard };
