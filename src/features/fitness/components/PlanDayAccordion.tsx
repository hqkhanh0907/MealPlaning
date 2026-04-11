import { Check, ChevronDown, Pencil, Play } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../../../components/shared/EmptyState';
import { DAY_LABELS } from '../constants';
import type { SelectedExercise, TrainingPlanDay } from '../types';
import { safeParseJsonArray } from '../types';
import { estimateDuration } from '../utils/durationEstimator';
import { translateWorkoutType } from '../utils/translateWorkoutType';

const COLLAPSE_THRESHOLD = 3;

interface PlanDayAccordionProps {
  planDay: TrainingPlanDay;
  dayOfWeek: number;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  onStartWorkout: () => void;
  onEditExercises: () => void;
}

export function PlanDayAccordion({
  planDay,
  dayOfWeek,
  isExpanded,
  isCompleted,
  onToggle,
  onStartWorkout,
  onEditExercises,
}: Readonly<PlanDayAccordionProps>) {
  const { t } = useTranslation();
  const [exerciseListExpanded, setExerciseListExpanded] = useState(false);

  const dayLabel = DAY_LABELS[dayOfWeek - 1] ?? '';
  const workoutName = translateWorkoutType(t, planDay.workoutType);
  const rawExercises = safeParseJsonArray<SelectedExercise>(planDay.exercises);
  const exercises = rawExercises.filter(
    (ex): ex is SelectedExercise => !!ex && typeof ex === 'object' && 'exercise' in ex,
  );
  const muscleGroups = safeParseJsonArray<string>(planDay.muscleGroups);
  const muscleText = muscleGroups.map(g => t(`fitness.onboarding.muscle_${g}`, g)).join(', ');
  const minutes = estimateDuration(exercises);

  const shouldCollapse = exercises.length > COLLAPSE_THRESHOLD;
  const displayedExercises =
    shouldCollapse && !exerciseListExpanded ? exercises.slice(0, COLLAPSE_THRESHOLD) : exercises;
  const hiddenCount = exercises.length - COLLAPSE_THRESHOLD;

  const contentId = `plan-day-content-${dayOfWeek}`;
  const isCardio = planDay.workoutType.toLowerCase().includes('cardio');

  return (
    <div data-testid={`plan-day-${dayOfWeek}`} className="bg-card border-border overflow-hidden rounded-xl border">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={onToggle}
        className="focus-visible:ring-ring flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-left transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0 text-xs font-medium uppercase">{dayLabel}</span>
            <span className="text-foreground truncate text-sm font-semibold">{workoutName}</span>
            {isCompleted && (
              <span className="bg-success/10 text-success inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium">
                <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                {t('fitness.plan.completed')}
              </span>
            )}
          </div>
          {!isExpanded && muscleText && <p className="text-muted-foreground mt-0.5 truncate text-xs">{muscleText}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isExpanded && exercises.length > 0 && (
            <span className="text-muted-foreground text-xs">
              {exercises.length} {t('fitness.plan.exercises')}
            </span>
          )}
          <ChevronDown
            className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
            data-testid={`chevron-${dayOfWeek}`}
          />
        </div>
      </button>

      {isExpanded && (
        <div id={contentId} className="border-border border-t px-4 pt-2 pb-3">
          {exercises.length === 0 && !isCardio ? (
            <EmptyState
              variant="compact"
              title={t('fitness.plan.noExercises')}
              actionLabel={t('fitness.plan.addExercise')}
              onAction={onEditExercises}
            />
          ) : (
            <>
              {muscleText && <p className="text-muted-foreground mb-1 text-sm">{muscleText}</p>}
              <div className="text-foreground-secondary flex items-center gap-3 text-sm">
                {isCardio ? (
                  <span className="text-muted-foreground">{t('fitness.plan.cardioDay')}</span>
                ) : (
                  <>
                    <span>
                      {exercises.length} {t('fitness.plan.exercises')}
                    </span>
                    <span>
                      ~{minutes} {t('fitness.plan.minutes')}
                    </span>
                  </>
                )}
              </div>

              {exercises.length > 0 && (
                <>
                  <ul className="mt-3 space-y-1.5">
                    {displayedExercises.map((ex, i) => (
                      <li
                        key={ex.exercise.id}
                        className="text-foreground-secondary flex min-w-0 items-center justify-between text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="text-muted-foreground w-5 text-xs">{i + 1}.</span>
                          <span className="min-w-0 truncate">{ex.exercise.nameVi}</span>
                        </div>
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                          {ex.sets} {t('fitness.plan.setsLabel')} × {ex.repsMin}-{ex.repsMax}{' '}
                          {t('fitness.plan.repsLabel')}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {shouldCollapse && (
                    <button
                      type="button"
                      onClick={() => setExerciseListExpanded(!exerciseListExpanded)}
                      className="text-primary hover:text-primary-emphasis focus-visible:ring-ring mt-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {exerciseListExpanded
                        ? t('fitness.plan.showLess')
                        : t('fitness.plan.moreExercises', { remaining: hiddenCount })}
                    </button>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={onStartWorkout}
                      className="bg-primary text-primary-foreground flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-[colors,transform] active:scale-[0.98] motion-reduce:transform-none"
                    >
                      <Play className="h-4 w-4" aria-hidden="true" />
                      {t('fitness.plan.startWorkout')}
                    </button>
                    <button
                      type="button"
                      aria-label={t('fitness.plan.editExercises')}
                      onClick={onEditExercises}
                      className="border-border text-foreground-secondary flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
