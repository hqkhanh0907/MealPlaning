import { Check, Clock, Dumbbell, Layers, Moon, Pencil, Play, RotateCcw, Scale, Zap } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';

import type { SelectedExercise, TrainingPlanDay } from '../types';
import { safeParseJsonArray } from '../types';
import { translateWorkoutType } from '../utils/translateWorkoutType';
import { SessionTabs } from './SessionTabs';

const COLLAPSE_THRESHOLD = 3;

interface TodayWorkoutCardProps {
  planDay: TrainingPlanDay;
  daySessions: TrainingPlanDay[];
  activeSessionId: string;
  completedSessionIds: string[];
  exercises: SelectedExercise[];
  estimatedMinutes: number;
  exercisesExpanded: boolean;
  completedWorkoutStats?: { durationMin: number; totalVolume: number; totalSets: number };
  tomorrowPlanDay?: TrainingPlanDay;
  onStartWorkout: (planDay: TrainingPlanDay) => void;
  onEditExercises: (planDay: TrainingPlanDay) => void;
  onConvertToRest: () => void;
  onRestoreOriginal: (planDayId: string) => void;
  onSelectSession: (sessionId: string) => void;
  onAddSession: () => void;
  onDeleteSession?: (dayId: string) => void;
  onToggleExerciseExpand: () => void;
  onLogWeight?: () => void;
  onQuickCardio?: () => void;
  onViewSummary?: () => void;
}

function RestDayHero({
  tomorrowPlanDay,
  onLogWeight,
  onQuickCardio,
}: Readonly<{
  tomorrowPlanDay?: TrainingPlanDay;
  onLogWeight?: () => void;
  onQuickCardio?: () => void;
}>): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <section
      data-testid="today-hero-rest"
      aria-label={t('fitness.plan.restDayRegion')}
      className="animate-slide-up from-info/5 to-card border-border/60 rounded-2xl border bg-gradient-to-br p-5 shadow-sm"
    >
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="bg-info/10 flex h-14 w-14 items-center justify-center rounded-full">
          <Moon className="text-info h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="text-foreground text-lg font-bold">{t('fitness.plan.restDay')}</h2>
        <p className="text-muted-foreground text-sm">{t('fitness.plan.restDayTip')}</p>
      </div>

      {tomorrowPlanDay && (
        <div data-testid="tomorrow-preview" className="bg-card/50 mt-2 rounded-xl border p-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {t('fitness.plan.tomorrowPreview')}
          </p>
          <p className="text-foreground mt-1 text-sm font-medium">
            {translateWorkoutType(t, tomorrowPlanDay.workoutType)}
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onLogWeight}
          className="focus-visible:ring-ring border-border/60 bg-card flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none"
        >
          <Scale className="h-4 w-4" aria-hidden="true" />
          {t('fitness.plan.logWeight')}
        </button>
        <button
          type="button"
          onClick={onQuickCardio}
          className="focus-visible:ring-ring border-border/60 bg-card flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none"
        >
          <Zap className="h-4 w-4" aria-hidden="true" />
          {t('fitness.plan.quickCardio')}
        </button>
      </div>
    </section>
  );
}

export function TodayWorkoutCard({
  planDay,
  daySessions,
  activeSessionId,
  completedSessionIds,
  exercises,
  estimatedMinutes,
  exercisesExpanded,
  completedWorkoutStats,
  tomorrowPlanDay,
  onStartWorkout,
  onEditExercises,
  onConvertToRest,
  onRestoreOriginal,
  onSelectSession,
  onAddSession,
  onDeleteSession,
  onToggleExerciseExpand,
  onLogWeight,
  onQuickCardio,
  onViewSummary,
}: Readonly<TodayWorkoutCardProps>): React.JSX.Element {
  const { t } = useTranslation();

  const isRest = planDay.workoutType.toLowerCase() === 'rest';
  if (isRest) {
    return <RestDayHero tomorrowPlanDay={tomorrowPlanDay} onLogWeight={onLogWeight} onQuickCardio={onQuickCardio} />;
  }

  const allSessionsCompleted = daySessions.length > 0 && daySessions.every(s => completedSessionIds.includes(s.id));
  const completedCount = daySessions.filter(s => completedSessionIds.includes(s.id)).length;
  const isMultiSession = daySessions.length > 1;
  const isModified = planDay.originalExercises != null && planDay.exercises !== planDay.originalExercises;

  const muscleGroups = planDay.muscleGroups
    ? safeParseJsonArray<string>(planDay.muscleGroups)
        .map(g => t(`fitness.onboarding.muscle_${g}`, g))
        .join(' · ')
    : null;

  const shouldCollapse = exercises.length > COLLAPSE_THRESHOLD;
  const displayedExercises = shouldCollapse && !exercisesExpanded ? exercises.slice(0, COLLAPSE_THRESHOLD) : exercises;
  const hiddenCount = exercises.length - COLLAPSE_THRESHOLD;

  const infoParts: string[] = [
    ...(muscleGroups ? [muscleGroups] : []),
    `${exercises.length} ${t('fitness.plan.exercises')}`,
    `~${estimatedMinutes} ${t('fitness.plan.minutes')}`,
  ];

  return (
    <section
      data-testid="today-hero-card"
      aria-label={t('fitness.plan.todayWorkout')}
      className="animate-slide-up from-primary-subtle to-card border-border/60 rounded-2xl border bg-gradient-to-br p-5 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t('fitness.plan.todayLabel')}
        </span>
        {allSessionsCompleted && (
          <span className="bg-success/10 text-success inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
            <Check className="h-3 w-3" aria-hidden="true" />
            {t('fitness.plan.completed')}
          </span>
        )}
        {isMultiSession && !allSessionsCompleted && completedCount > 0 && (
          <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
            {completedCount}/{daySessions.length}
          </span>
        )}
      </div>

      {daySessions.length >= 1 && (
        <SessionTabs
          sessions={daySessions}
          activeSessionId={activeSessionId}
          completedSessionIds={completedSessionIds}
          onSelectSession={onSelectSession}
          onAddSession={onAddSession}
          onDeleteSession={onDeleteSession}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-lg leading-tight font-bold">
            {translateWorkoutType(t, planDay.workoutType)}
          </h2>
          {isModified && (
            <span
              data-testid="modified-badge"
              className="bg-warning/10 text-warning inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            >
              {t('fitness.plan.modified')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isModified && (
            <button
              data-testid="restore-original-btn"
              type="button"
              onClick={() => onRestoreOriginal(planDay.id)}
              className="text-primary focus-visible:ring-ring hover:bg-accent flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full p-2.5 text-xs transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none"
              aria-label={t('fitness.plan.restore')}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            data-testid="edit-exercises-btn"
            type="button"
            aria-label={t('fitness.plan.editExercises')}
            onClick={() => onEditExercises(planDay)}
            className="focus-visible:ring-ring hover:bg-accent flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none"
          >
            <Pencil className="text-muted-foreground h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p data-testid="hero-info-line" className="text-muted-foreground mt-1 text-sm">
        {infoParts.join(' · ')}
      </p>

      {allSessionsCompleted && completedWorkoutStats != null && (
        <div data-testid="completed-stats" className="mt-3 flex items-center gap-4 text-sm">
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {completedWorkoutStats.durationMin}m
          </span>
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
            {completedWorkoutStats.totalVolume}kg
          </span>
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            {completedWorkoutStats.totalSets} sets
          </span>
        </div>
      )}

      {exercises.length > 0 && (
        <div className="border-border/60 mt-3 border-t pt-3">
          <ul data-testid="exercise-list" className="space-y-1.5">
            {displayedExercises.map((ex, i) => (
              <li
                key={ex.exercise.id}
                className="text-foreground-secondary flex min-w-0 items-center justify-between text-sm"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="text-muted-foreground text-xs tabular-nums">{i + 1}</span>
                  <span className="min-w-0 truncate">{ex.exercise.nameVi}</span>
                </span>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {ex.sets}×{ex.repsMin}-{ex.repsMax}
                </span>
              </li>
            ))}
          </ul>
          {shouldCollapse && (
            <button
              type="button"
              data-testid="exercise-collapse-toggle"
              onClick={onToggleExerciseExpand}
              className="text-primary focus-visible:ring-ring hover:text-primary-emphasis mt-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
              aria-label={
                exercisesExpanded
                  ? t('fitness.plan.showLess')
                  : t('fitness.plan.moreExercises', { remaining: hiddenCount })
              }
            >
              {exercisesExpanded
                ? t('fitness.plan.showLess')
                : t('fitness.plan.moreExercises', { remaining: hiddenCount })}
            </button>
          )}
        </div>
      )}

      {allSessionsCompleted ? (
        <button
          data-testid="btn-start-workout-hero"
          type="button"
          onClick={() => (onViewSummary ?? (() => onStartWorkout(planDay)))()}
          className="border-primary text-primary hover:bg-primary/5 focus-visible:ring-ring mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-6 text-lg font-semibold shadow-sm transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none"
        >
          {t('fitness.plan.viewSummary')}
        </button>
      ) : (
        <button
          data-testid="btn-start-workout-hero"
          type="button"
          onClick={() => onStartWorkout(planDay)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-lg font-semibold shadow-sm transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none"
        >
          <Play className="h-5 w-5" aria-hidden="true" />
          {t('fitness.plan.startWorkout')}
        </button>
      )}

      <div className="mt-3 flex gap-2">
        <button
          data-testid="day-convert-rest-btn"
          type="button"
          onClick={onConvertToRest}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none"
        >
          <Moon className="h-4 w-4" aria-hidden="true" />
          {t('fitness.plan.convertToRest')}
        </button>
      </div>
    </section>
  );
}
