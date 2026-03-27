import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Dumbbell, Moon, ChevronRight, Calendar } from 'lucide-react';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useNavigationStore } from '../../../store/navigationStore';
import { DailyWeightInput } from './DailyWeightInput';
import { StreakCounter } from './StreakCounter';
import type { SelectedExercise, TrainingPlanDay } from '../types';
import { DAY_LABELS } from '../constants';

interface TrainingPlanViewProps {
  onGeneratePlan: () => void;
}

function parseExercises(exercises?: string): SelectedExercise[] {
  if (!exercises) return [];
  try {
    return JSON.parse(exercises) as SelectedExercise[];
  } catch {
    return [];
  }
}

function estimateDuration(exercises: SelectedExercise[]): number {
  if (exercises.length === 0) return 0;
  const totalSeconds = exercises.reduce(
    (sum, ex) => sum + ex.sets * (30 + ex.restSeconds),
    0,
  );
  return Math.round(totalSeconds / 60) + 5;
}

function getTodayDow(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function getTomorrowDow(todayDow: number): number {
  return todayDow === 7 ? 1 : todayDow + 1;
}

function TrainingPlanViewInner({
  onGeneratePlan,
}: TrainingPlanViewProps): React.JSX.Element {
  const { t } = useTranslation();
  const trainingPlans = useFitnessStore((s) => s.trainingPlans);
  const trainingPlanDays = useFitnessStore((s) => s.trainingPlanDays);
  const pushPage = useNavigationStore((s) => s.pushPage);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const activePlan = useMemo(
    () => trainingPlans.find((p) => p.status === 'active'),
    [trainingPlans],
  );

  const planDays = useMemo(
    () =>
      activePlan
        ? trainingPlanDays.filter((d) => d.planId === activePlan.id)
        : [],
    [activePlan, trainingPlanDays],
  );

  const todayDow = getTodayDow();
  const viewedDay = selectedDay ?? todayDow;
  const isViewingToday = viewedDay === todayDow;

  const viewedPlanDay = useMemo(
    () => planDays.find((d) => d.dayOfWeek === viewedDay),
    [planDays, viewedDay],
  );

  const viewedExercises = useMemo(
    () => parseExercises(viewedPlanDay?.exercises),
    [viewedPlanDay],
  );

  const estimatedMinutes = useMemo(
    () => estimateDuration(viewedExercises),
    [viewedExercises],
  );

  const tomorrowDow = getTomorrowDow(todayDow);

  const tomorrowPlanDay = useMemo(
    () => planDays.find((d) => d.dayOfWeek === tomorrowDow),
    [planDays, tomorrowDow],
  );

  const tomorrowExercises = useMemo(
    () => parseExercises(tomorrowPlanDay?.exercises),
    [tomorrowPlanDay],
  );

  const handleStartWorkout = useCallback(
    (planDay: TrainingPlanDay) => {
      pushPage({
        id: 'workout-logger',
        component: 'WorkoutLogger',
        props: { workoutPlanDay: planDay },
      });
    },
    [pushPage],
  );

  const handleDaySelect = useCallback((dayNum: number) => {
    setSelectedDay((prev) => (prev === dayNum ? null : dayNum));
  }, []);

  if (!activePlan) {
    return (
      <div
        data-testid="training-plan-view"
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div
          data-testid="no-plan-cta"
          className="flex flex-col items-center gap-4"
        >
          <Dumbbell className="h-12 w-12 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          <p className="text-slate-500 dark:text-slate-400">
            {t('fitness.plan.noPlan')}
          </p>
          <button
            data-testid="create-plan-btn"
            type="button"
            onClick={onGeneratePlan}
            className="flex items-center gap-1 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-600 active:scale-95"
          >
            {t('fitness.plan.createPlan')}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="training-plan-view" className="flex flex-col gap-4">
      <StreakCounter />

      <div data-testid="calendar-strip" className="flex gap-1.5">
        {Array.from({ length: 7 }, (_, i) => {
          const dayNum = i + 1;
          const planDay = planDays.find((d) => d.dayOfWeek === dayNum);
          const isToday = dayNum === todayDow;
          const isSelected = dayNum === viewedDay && !isToday;
          const isCardio =
            planDay?.workoutType.toLowerCase().includes('cardio') ?? false;

          let colorClass =
            'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
          if (planDay) {
            colorClass = isCardio
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
          }

          const ringClass = isToday
            ? 'ring-2 ring-emerald-500'
            : isSelected
              ? 'ring-2 ring-slate-400'
              : '';

          return (
            <button
              key={dayNum}
              data-testid={`day-pill-${dayNum}`}
              type="button"
              onClick={() => handleDaySelect(dayNum)}
              className={`flex flex-1 flex-col items-center rounded-xl px-1 py-2 text-xs font-medium transition-colors ${colorClass} ${ringClass}`}
              aria-current={isToday ? 'date' : undefined}
            >
              <span>{DAY_LABELS[i]}</span>
            </button>
          );
        })}
      </div>

      {viewedPlanDay ? (
        <div
          data-testid="today-workout-card"
          className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
        >
          <div
            data-testid="workout-card-header"
            className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500"
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {isViewingToday
              ? t('fitness.plan.todayWorkout')
              : DAY_LABELS[viewedDay - 1]}
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {viewedPlanDay.workoutType}
          </h3>
          {viewedPlanDay.muscleGroups && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {viewedPlanDay.muscleGroups}
            </p>
          )}
          <div
            data-testid="workout-stats"
            className="mt-2 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
          >
            <span>
              {viewedExercises.length} {t('fitness.plan.exercises')}
            </span>
            <span>
              ~{estimatedMinutes} {t('fitness.plan.minutes')}
            </span>
          </div>

          {viewedExercises.length > 0 && (
            <ul data-testid="exercise-list" className="mt-3 space-y-1">
              {viewedExercises.map((ex) => (
                <li
                  key={ex.exercise.id}
                  className="text-sm text-slate-600 dark:text-slate-300"
                >
                  {ex.exercise.nameVi}
                </li>
              ))}
            </ul>
          )}

          {isViewingToday && (
            <button
              data-testid="start-workout-btn"
              type="button"
              onClick={() => handleStartWorkout(viewedPlanDay)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-lg font-bold text-white transition-colors hover:bg-emerald-600 active:scale-[0.98]"
            >
              <Play className="h-5 w-5" aria-hidden="true" />
              {t('fitness.plan.startWorkout')}
            </button>
          )}
        </div>
      ) : (
        <div
          data-testid="rest-day-card"
          className="rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 p-5 text-white"
        >
          <div className="mb-3 flex items-center gap-2">
            <Moon className="h-5 w-5" aria-hidden="true" />
            <h3 className="text-lg font-bold">{t('fitness.plan.restDay')}</h3>
          </div>
          <ul className="space-y-2 text-sm text-white/90">
            <li>{t('fitness.plan.restDayTip1')}</li>
            <li>{t('fitness.plan.restDayTip2')}</li>
            <li>{t('fitness.plan.restDayTip3')}</li>
          </ul>

          {isViewingToday && tomorrowPlanDay && (
            <p
              data-testid="tomorrow-preview"
              className="mt-3 text-sm text-white/80"
            >
              📋 {t('fitness.plan.tomorrow')}: {tomorrowPlanDay.workoutType} —{' '}
              {tomorrowExercises.length} {t('fitness.plan.exercises')}
            </p>
          )}

          {isViewingToday && (
            <div data-testid="quick-actions" className="mt-3 flex gap-2">
              <button
                data-testid="quick-log-weight"
                type="button"
                className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/30"
              >
                {t('fitness.plan.logWeight')}
              </button>
              <button
                data-testid="quick-log-cardio"
                type="button"
                className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/30"
              >
                {t('fitness.plan.logLightCardio')}
              </button>
            </div>
          )}
        </div>
      )}

      <DailyWeightInput />
    </div>
  );
}

export const TrainingPlanView = React.memo(TrainingPlanViewInner);
TrainingPlanView.displayName = 'TrainingPlanView';
