import {
  BatteryCharging,
  Check,
  CheckCircle,
  ChevronRight,
  Dumbbell,
  Footprints,
  Play,
  Plus,
  RotateCw,
  UtensilsCrossed,
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useDebounceAction } from '@/hooks/useDebounceAction';

import { useNavigationStore } from '../../../store/navigationStore';
import { translateWorkoutType } from '../../fitness/utils/translateWorkoutType';
import type { MealSlotInfo, TodayPlanState } from '../hooks/useTodaysPlan';
import { useTodaysPlan } from '../hooks/useTodaysPlan';
import { WeightQuickLog } from './WeightQuickLog';

const MEAL_SLOT_I18N: Record<MealSlotInfo['type'], string> = {
  breakfast: 'dashboard.todaysPlan.mealSlotBreakfast',
  lunch: 'dashboard.todaysPlan.mealSlotLunch',
  dinner: 'dashboard.todaysPlan.mealSlotDinner',
};

const MEAL_SLOT_ICON_CLASS: Record<MealSlotInfo['type'], string> = {
  breakfast: 'text-meal-breakfast',
  lunch: 'text-meal-lunch',
  dinner: 'text-meal-dinner',
};

const BASE_CARD = 'rounded-2xl shadow-md p-3';

const STATE_CARD_CLASSES: Record<TodayPlanState, string> = {
  'training-pending': `${BASE_CARD} bg-warning-subtle border border-warning/30`,
  'training-partial': `${BASE_CARD} bg-info-subtle border border-info/30`,
  'training-completed': `${BASE_CARD} bg-success-subtle border border-success/30`,
  'rest-day': `${BASE_CARD} bg-muted`,
  'no-plan': `${BASE_CARD} bg-card border border-border`,
};

const STATE_ARIA_KEYS: Record<TodayPlanState, string> = {
  'training-pending': 'dashboard.todaysPlan.a11y.pending',
  'training-partial': 'dashboard.todaysPlan.a11y.partial',
  'training-completed': 'dashboard.todaysPlan.a11y.completed',
  'rest-day': 'dashboard.todaysPlan.a11y.restDay',
  'no-plan': 'dashboard.todaysPlan.a11y.noPlan',
};

const RECOVERY_TIP_KEYS = [
  'dashboard.todaysPlan.recoveryTip1',
  'dashboard.todaysPlan.recoveryTip2',
  'dashboard.todaysPlan.recoveryTip3',
  'dashboard.todaysPlan.recoveryTip4',
  'dashboard.todaysPlan.recoveryTip5',
] as const;

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

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

function MealSlots({
  mealSlots,
  mealsLogged,
  totalMealsPlanned,
  hasReachedTarget,
  onAddMeal,
  allowActions = true,
}: Readonly<{
  mealSlots: MealSlotInfo[];
  mealsLogged: number;
  totalMealsPlanned: number;
  hasReachedTarget: boolean;
  onAddMeal: () => void;
  allowActions?: boolean;
}>) {
  const { t } = useTranslation();

  return (
    <div data-testid="meals-section">
      <div className="mb-1.5 flex items-center gap-1.5">
        <UtensilsCrossed className="text-energy h-4 w-4" aria-hidden="true" />
        <span className="text-foreground-secondary text-xs font-medium">{t('dashboard.todaysPlan.meals')}</span>
        <span data-testid="meals-progress" className="text-muted-foreground ml-auto text-xs">
          {t('dashboard.todaysPlan.mealsProgress', { logged: mealsLogged, total: totalMealsPlanned })}
          {hasReachedTarget && (
            <span className="text-primary ml-1 inline-flex items-center gap-0.5">
              <CheckCircle className="h-3 w-3" aria-hidden="true" />
              {t('dashboard.todaysPlan.mealsReachedTarget')}
            </span>
          )}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {mealSlots.map(slot =>
          slot.hasFood || !allowActions ? (
            <span
              key={slot.type}
              data-testid={`meal-slot-${slot.type}`}
              className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                slot.hasFood ? `${MEAL_SLOT_ICON_CLASS[slot.type]} bg-primary/10` : 'text-muted-foreground bg-muted'
              }`}
            >
              {slot.hasFood ? (
                <Check className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Plus className="h-3 w-3" aria-hidden="true" />
              )}
              {t(MEAL_SLOT_I18N[slot.type])}
            </span>
          ) : (
            <button
              key={slot.type}
              type="button"
              data-testid={`meal-slot-${slot.type}`}
              onClick={onAddMeal}
              className={`${MEAL_SLOT_ICON_CLASS[slot.type]} interactive flex items-center gap-1 rounded-full border border-dashed border-current px-1.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80`}
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              {t(MEAL_SLOT_I18N[slot.type])}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

const TodaysPlanCard = React.memo(function TodaysPlanCard({
  suppressPrimaryCtas = false,
  allowMealSlotActions = true,
}: Readonly<{ suppressPrimaryCtas?: boolean; allowMealSlotActions?: boolean }>) {
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

  const debouncedStartWorkout = useDebounceAction(handleStartWorkout);
  const debouncedCreatePlan = useDebounceAction(handleCreatePlan);
  const debouncedLogWeight = useDebounceAction(handleLogWeight);
  const debouncedLogCardio = useDebounceAction(handleLogCardio);

  const cardClass = STATE_CARD_CLASSES[data.state];
  const ariaLabel = t(STATE_ARIA_KEYS[data.state]);

  const mealSlotsProps = {
    mealSlots: data.mealSlots,
    mealsLogged: data.mealsLogged,
    totalMealsPlanned: data.totalMealsPlanned,
    hasReachedTarget: data.hasReachedTarget,
    onAddMeal: handleLogMeal,
    allowActions: allowMealSlotActions,
  };

  if (data.state === 'training-pending') {
    return (
      <>
        <div data-testid="todays-plan-card" className={cardClass} aria-label={ariaLabel}>
          <h3 className="text-warning mb-2 text-sm font-semibold">{t('dashboard.todaysPlan.title')}</h3>
          <div data-testid="workout-section">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Dumbbell className="text-warning h-4 w-4" aria-hidden="true" />
              <span className="text-warning text-xs font-medium">{t('dashboard.todaysPlan.workout')}</span>
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
            {suppressPrimaryCtas ? (
              <p className="text-muted-foreground mt-2 text-xs" data-testid="workout-next-step-hint">
                {t('dashboard.todaysPlan.orchestrationHint')}
              </p>
            ) : (
              <Button
                size="sm"
                onClick={debouncedStartWorkout}
                data-testid="start-workout-cta"
                className="interactive bg-warning hover:bg-warning/90 text-primary-foreground mt-2 gap-1"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                {t('dashboard.todaysPlan.startCta')}
              </Button>
            )}
          </div>
          <div className="border-border-subtle mt-2 border-t pt-2">
            <MealSlots {...mealSlotsProps} />
          </div>
        </div>
        {showWeightLog && <WeightQuickLog onClose={() => setShowWeightLog(false)} />}
      </>
    );
  }

  if (data.state === 'training-partial') {
    return (
      <div data-testid="todays-plan-card" className={cardClass} aria-label={ariaLabel}>
        <h3 className="text-info mb-2 text-sm font-semibold">{t('dashboard.todaysPlan.title')}</h3>
        <div data-testid="partial-progress-section">
          <div className="mb-1.5 flex items-center gap-1.5">
            <RotateCw className="text-info h-4 w-4" aria-hidden="true" />
            <span className="text-info text-xs font-medium">
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
          {suppressPrimaryCtas ? (
            <p className="text-muted-foreground mt-2 text-xs" data-testid="workout-next-step-hint">
              {t('dashboard.todaysPlan.orchestrationHint')}
            </p>
          ) : (
            <Button
              size="sm"
              onClick={debouncedStartWorkout}
              data-testid="continue-session-cta"
              className="interactive bg-primary text-primary-foreground hover:bg-primary/80 mt-2 gap-1"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              {t('dashboard.todaysPlan.continueSession')}
            </Button>
          )}
        </div>
        <div className="border-border-subtle mt-2 border-t pt-2">
          <MealSlots {...mealSlotsProps} />
        </div>
      </div>
    );
  }

  if (data.state === 'training-completed') {
    return (
      <div data-testid="todays-plan-card" className={cardClass} aria-label={ariaLabel}>
        <h3 className="text-success mb-2 text-sm font-semibold">{t('dashboard.todaysPlan.title')}</h3>
        <div data-testid="workout-summary">
          <div className="mb-1.5 flex items-center gap-1.5">
            <CheckCircle className="text-success h-4 w-4" aria-hidden="true" />
            <span className="text-success text-xs font-medium">{t('dashboard.todaysPlan.completed')}</span>
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
              {
                /* v8 ignore next -- hasPR currently always false from computeCompletedWorkout */ data.completedWorkout
                  .hasPR && (
                  <p data-testid="pr-highlight" className="text-energy text-sm font-semibold">
                    {t('dashboard.todaysPlan.prHighlight')}
                  </p>
                )
              }
            </>
          )}
          <SessionInfo
            totalSessions={data.totalSessions}
            completedSessions={data.completedSessions}
            variant="completed"
          />
        </div>
        <div className="border-border-subtle mt-2 border-t pt-2">
          <MealSlots {...mealSlotsProps} />
        </div>
      </div>
    );
  }

  if (data.state === 'rest-day') {
    const tipKey = RECOVERY_TIP_KEYS[getDayOfYear() % RECOVERY_TIP_KEYS.length];
    return (
      <>
        <div data-testid="todays-plan-card" className={cardClass} aria-label={ariaLabel}>
          <div className="mb-2 flex items-center gap-2">
            <BatteryCharging className="text-primary h-5 w-5" aria-hidden="true" />
            <h3 className="text-foreground text-sm font-semibold">{t('dashboard.todaysPlan.restDayTitle')}</h3>
          </div>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div data-testid="recovery-tips">
                <p className="text-foreground text-sm">
                  <span aria-hidden="true">
                    <Footprints className="mr-1 inline-block size-4" />
                  </span>
                  {t(tipKey)}
                </p>
              </div>
              <div data-testid="tomorrow-preview" className="mt-1.5">
                {data.tomorrowWorkoutType ? (
                  <p className="text-foreground text-sm">
                    {t('dashboard.todaysPlan.tomorrowPreview', {
                      name: translateWorkoutType(t, data.tomorrowWorkoutType),
                      count:
                        /* v8 ignore next -- defensive: tomorrowExerciseCount always set when tomorrowWorkoutType exists */ data.tomorrowExerciseCount ??
                        0,
                    })}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">{t('dashboard.todaysPlan.tomorrowRest')}</p>
                )}
              </div>
              {data.currentStreak > 0 && (
                <p data-testid="streak-count" className="text-primary mt-1 text-xs font-medium">
                  {t('dashboard.todaysPlan.streak', { count: data.currentStreak })}
                </p>
              )}
            </div>
          </div>
          <div className="border-border-subtle mt-2 border-t pt-2">
            <MealSlots {...mealSlotsProps} />
          </div>
          {!suppressPrimaryCtas && (
            <div className="mt-2 flex gap-2" data-testid="quick-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={debouncedLogWeight}
                data-testid="log-weight-chip"
                className="interactive bg-muted text-foreground hover:bg-accent rounded-full border-transparent"
              >
                {t('dashboard.todaysPlan.logWeight')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={debouncedLogCardio}
                data-testid="log-cardio-chip"
                className="interactive bg-muted text-foreground hover:bg-accent rounded-full border-transparent"
              >
                {t('dashboard.todaysPlan.logCardio')}
              </Button>
            </div>
          )}
        </div>
        {showWeightLog && <WeightQuickLog onClose={() => setShowWeightLog(false)} />}
      </>
    );
  }

  return (
    <div data-testid="todays-plan-card" className={cardClass} aria-label={ariaLabel}>
      <h3 className="text-muted-foreground mb-2 text-sm font-semibold">{t('dashboard.todaysPlan.title')}</h3>
      <div data-testid="no-plan-section" className="flex flex-col items-center py-2">
        <Dumbbell className="text-muted-foreground mb-2 h-8 w-8" aria-hidden="true" />
        <p className="text-muted-foreground mb-2 text-sm">{t('dashboard.todaysPlan.noPlan')}</p>
        {suppressPrimaryCtas ? (
          <p className="text-muted-foreground text-xs" data-testid="plan-next-step-hint">
            {t('dashboard.todaysPlan.planOrchestrationHint')}
          </p>
        ) : (
          <Button
            size="sm"
            onClick={debouncedCreatePlan}
            data-testid="create-plan-cta"
            className="interactive bg-info hover:bg-info/90 text-primary-foreground gap-1"
          >
            {t('dashboard.todaysPlan.createPlan')}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="border-border-subtle mt-1 border-t pt-2">
        <MealSlots {...mealSlotsProps} />
      </div>
    </div>
  );
});

TodaysPlanCard.displayName = 'TodaysPlanCard';

export { TodaysPlanCard };
