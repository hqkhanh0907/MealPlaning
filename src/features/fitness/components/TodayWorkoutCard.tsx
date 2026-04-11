import { Calendar, Moon, Pencil, Play, RotateCcw } from 'lucide-react';
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
  onStartWorkout: (planDay: TrainingPlanDay) => void;
  onEditExercises: (planDay: TrainingPlanDay) => void;
  onConvertToRest: () => void;
  onRestoreOriginal: (planDayId: string) => void;
  onSelectSession: (sessionId: string) => void;
  onAddSession: () => void;
  onDeleteSession?: (dayId: string) => void;
  onToggleExerciseExpand: () => void;
}

function WorkoutStatsContent({
  workoutType,
  exerciseCount,
  minutes,
}: Readonly<{ workoutType: string; exerciseCount: number; minutes: number }>): React.JSX.Element {
  const { t } = useTranslation();
  const normalizedType = workoutType.toLowerCase();

  if (normalizedType.includes('cardio')) {
    return <span className="text-muted-foreground">{t('fitness.plan.cardioDay')}</span>;
  }
  if (normalizedType === 'rest') {
    return <span className="text-muted-foreground">{t('fitness.plan.restDay')}</span>;
  }
  return (
    <>
      <span>
        {exerciseCount} {t('fitness.plan.exercises')}
      </span>
      <span>
        ~{minutes} {t('fitness.plan.minutes')}
      </span>
    </>
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
  onStartWorkout,
  onEditExercises,
  onConvertToRest,
  onRestoreOriginal,
  onSelectSession,
  onAddSession,
  onDeleteSession,
  onToggleExerciseExpand,
}: Readonly<TodayWorkoutCardProps>): React.JSX.Element {
  const { t } = useTranslation();

  const isModified = planDay.originalExercises != null && planDay.exercises !== planDay.originalExercises;
  const muscleGroups = planDay.muscleGroups
    ? safeParseJsonArray<string>(planDay.muscleGroups)
        .map(g => t(`fitness.onboarding.muscle_${g}`, g))
        .join(', ')
    : null;

  const shouldCollapse = exercises.length > COLLAPSE_THRESHOLD;
  const displayedExercises = shouldCollapse && !exercisesExpanded ? exercises.slice(0, COLLAPSE_THRESHOLD) : exercises;
  const hiddenCount = exercises.length - COLLAPSE_THRESHOLD;

  return (
    <div data-testid="today-workout-card">
      <div className="bg-card border-border border-l-accent-highlight rounded-2xl border border-l-4 p-4">
        <button
          data-testid="day-accordion-toggle"
          type="button"
          disabled
          className="text-foreground-secondary mb-1 flex min-h-[44px] w-full items-center gap-1.5 text-left text-xs font-medium tracking-wider uppercase"
        >
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          {t('fitness.plan.todayWorkout')}
        </button>

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
            <h3 className="text-foreground text-xl font-semibold">{translateWorkoutType(t, planDay.workoutType)}</h3>
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
                className="text-primary focus-visible:ring-ring hover:bg-accent flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full p-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
              className="focus-visible:ring-ring hover:bg-accent flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Pencil className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {muscleGroups && <p className="text-muted-foreground text-sm">{muscleGroups}</p>}

        <div data-testid="workout-stats" className="text-foreground-secondary mt-2 flex items-center gap-3 text-sm">
          <WorkoutStatsContent
            workoutType={planDay.workoutType}
            exerciseCount={exercises.length}
            minutes={estimatedMinutes}
          />
        </div>

        {exercises.length > 0 && (
          <>
            <ul data-testid="exercise-list" className="mt-3 space-y-1.5">
              {displayedExercises.map(ex => (
                <li
                  key={ex.exercise.id}
                  className="text-foreground-secondary flex min-w-0 items-center justify-between text-sm"
                >
                  <span className="min-w-0 truncate">{ex.exercise.nameVi}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {ex.sets} {t('fitness.plan.setsLabel')} × {ex.repsMin}-{ex.repsMax} {t('fitness.plan.repsLabel')}
                  </span>
                </li>
              ))}
            </ul>
            {shouldCollapse && (
              <button
                type="button"
                data-testid="exercise-collapse-toggle"
                onClick={onToggleExerciseExpand}
                className="text-primary focus-visible:ring-ring hover:text-primary-emphasis mt-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
          </>
        )}

        <button
          data-testid="start-workout-btn"
          type="button"
          onClick={() => onStartWorkout(planDay)}
          className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-lg font-semibold transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none"
        >
          <Play className="h-5 w-5" aria-hidden="true" />
          {t('fitness.plan.startWorkout')}
        </button>

        <div className="border-border-subtle mt-3 flex gap-2 border-t pt-3">
          <button
            data-testid="day-convert-rest-btn"
            type="button"
            onClick={onConvertToRest}
            className="focus-visible:ring-ring border-rose/20 bg-rose/10 text-rose hover:bg-rose/15 flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Moon className="text-info h-4 w-4" aria-hidden="true" />
            {t('fitness.plan.convertToRest')}
          </button>
        </div>
      </div>
    </div>
  );
}
