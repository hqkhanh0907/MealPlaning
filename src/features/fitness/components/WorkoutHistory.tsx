import { ChevronDown, ChevronUp, ClipboardList, Clock, StickyNote, Trash2 } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { Skeleton } from '@/components/ui/skeleton';

import { useFitnessStore } from '../../../store/fitnessStore';
import { DAY_LABELS_SUNDAY_FIRST } from '../constants';
import { EXERCISES } from '../data/exerciseDatabase';
import type { Workout, WorkoutSet } from '../types';
import { getMondayOfWeek, parseDate } from '../utils/dateUtils';
import { calculateExerciseVolume } from '../utils/trainingMetrics';

type FilterType = 'all' | 'strength' | 'cardio';

const EXERCISE_NAME_MAP = new Map(EXERCISES.map(e => [e.id, e.nameVi]));

interface WeekGroup {
  weekKey: string;
  weekLabel: string;
  workouts: Workout[];
}

function getRelativeDate(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const target = parseDate(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t('fitness.history.today');
  if (diffDays === 1) return t('fitness.history.yesterday');
  if (diffDays >= 2 && diffDays <= 6) return t('fitness.history.daysAgo', { count: diffDays });

  const parts = dateStr.split('-');
  const dayName = DAY_LABELS_SUNDAY_FIRST[target.getDay()];
  return `${dayName}, ${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getWeekKey(dateStr: string): string {
  return getMondayOfWeek(dateStr);
}

function getWeekLabel(dateStr: string): string {
  const monday = getMondayOfWeek(dateStr);
  const parts = monday.split('-');
  return `${parts[2]}/${parts[1]}`;
}

function formatCompletionTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function ExerciseGroupDetail({
  exerciseId,
  sets,
  t,
}: Readonly<{
  exerciseId: string;
  sets: WorkoutSet[];
  t: (key: string) => string;
}>): React.JSX.Element {
  const exerciseVolume = calculateExerciseVolume(sets);
  return (
    <div data-testid={`exercise-group-${exerciseId}`} className="py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-foreground text-sm font-medium">
          {exerciseId === '_deleted'
            ? t('fitness.history.deletedExercise')
            : (EXERCISE_NAME_MAP.get(exerciseId) ?? exerciseId)}
        </span>
        {exerciseVolume > 0 && (
          <span className="text-primary text-xs">
            {t('fitness.history.volume')}: {exerciseVolume} kg
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {sets.map(set => (
          <span key={set.id} data-testid={`set-detail-${set.id}`} className="bg-muted rounded px-2 py-1 text-xs">
            {set.weightKg > 0 && (
              <>
                {set.weightKg}kg × {set.reps ?? 0}
              </>
            )}
            {(set.durationMin ?? 0) > 0 && (
              <>
                {set.durationMin} {t('fitness.history.minutes')}
              </>
            )}
            {set.rpe ? ` RPE ${set.rpe}` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function WorkoutHistoryInner(): React.JSX.Element {
  const { t } = useTranslation();
  const workouts = useFitnessStore(s => s.workouts);
  const workoutSets = useFitnessStore(s => s.workoutSets);
  const deleteWorkout = useFitnessStore(s => s.deleteWorkout);

  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const getSetsForWorkout = useCallback(
    (workoutId: string): WorkoutSet[] => workoutSets.filter(s => s.workoutId === workoutId),
    [workoutSets],
  );

  const getExerciseCount = useCallback(
    (workoutId: string): number => {
      const sets = getSetsForWorkout(workoutId);
      return new Set(sets.map(s => s.exerciseId).filter(Boolean)).size;
    },
    [getSetsForWorkout],
  );

  const filteredWorkouts = useMemo(() => {
    const sorted = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filter === 'all') return sorted;
    return sorted.filter(w => {
      const sets = getSetsForWorkout(w.id);
      if (filter === 'strength') return sets.some(s => s.weightKg > 0);
      return sets.some(s => (s.durationMin ?? 0) > 0);
    });
  }, [workouts, filter, getSetsForWorkout]);

  const weekGroups = useMemo<WeekGroup[]>(() => {
    const grouped: Record<string, { label: string; workouts: Workout[] }> = {};
    for (const workout of filteredWorkouts) {
      const key = getWeekKey(workout.date);
      if (!grouped[key]) {
        grouped[key] = { label: getWeekLabel(workout.date), workouts: [] };
      }
      grouped[key].workouts.push(workout);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekKey, { label, workouts: wks }]) => ({
        weekKey,
        weekLabel: label,
        workouts: wks,
      }));
  }, [filteredWorkouts]);

  const handleToggle = useCallback((workoutId: string) => {
    setExpandedId(prev => (prev === workoutId ? null : workoutId));
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTargetId) {
      await deleteWorkout(deleteTargetId);
      setDeleteTargetId(null);
      setExpandedId(null);
    }
  }, [deleteTargetId, deleteWorkout]);

  const groupSetsByExercise = useCallback(
    (workoutId: string): Record<string, WorkoutSet[]> => {
      const sets = getSetsForWorkout(workoutId);
      const grouped: Record<string, WorkoutSet[]> = {};
      for (const set of sets) {
        const key = set.exerciseId ?? '_deleted';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(set);
      }
      return grouped;
    },
    [getSetsForWorkout],
  );

  const getWorkoutVolume = useCallback(
    (workoutId: string): number => {
      const sets = getSetsForWorkout(workoutId);
      return calculateExerciseVolume(sets);
    },
    [getSetsForWorkout],
  );

  const filters = useMemo<{ key: FilterType; label: string }[]>(
    () => [
      { key: 'all', label: t('fitness.history.all') },
      { key: 'strength', label: t('fitness.history.strength') },
      { key: 'cardio', label: t('fitness.history.cardio') },
    ],
    [t],
  );

  if (workouts.length === 0) {
    return (
      <div data-testid="workout-history-empty" className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="text-muted-foreground mb-4 h-12 w-12" aria-hidden="true" />
        <p data-testid="empty-title" className="text-muted-foreground mb-1 font-medium">
          {t('fitness.history.noHistory')}
        </p>
        <p data-testid="empty-subtitle" className="text-muted-foreground mb-6 text-sm">
          {t('fitness.history.emptySubtitle')}
        </p>
        <div
          data-testid="skeleton-preview"
          className="pointer-events-none flex w-full max-w-sm flex-col gap-3 opacity-30 blur-[1px]"
          aria-hidden="true"
        >
          {[1, 2, 3].map(i => (
            <Skeleton key={i} data-testid={`skeleton-card-${i}`} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="workout-history" className="flex flex-col gap-4">
      <div data-testid="filter-chips" className="flex gap-2">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            data-testid={`filter-${key}`}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            aria-label={label}
            className={`focus-visible:ring-ring min-h-11 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
              filter === key ? 'bg-primary text-primary-foreground' : 'text-foreground-secondary bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div data-testid="workout-list" className="flex flex-col gap-4">
        {weekGroups.map(({ weekKey, weekLabel, workouts: wks }) => (
          <div key={weekKey} data-testid={`week-group-${weekKey}`}>
            <h3
              data-testid={`week-header-${weekKey}`}
              className="text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wide uppercase"
            >
              {t('fitness.history.weekOf', { date: weekLabel })}
            </h3>
            <div className="flex flex-col gap-3">
              {wks.map(workout => {
                const isExpanded = expandedId === workout.id;
                const volume = getWorkoutVolume(workout.id);
                const exerciseCount = getExerciseCount(workout.id);

                return (
                  <div
                    key={workout.id}
                    data-testid={`workout-card-${workout.id}`}
                    className="bg-card border-border overflow-hidden rounded-xl border shadow-sm"
                  >
                    <button
                      data-testid={`workout-toggle-${workout.id}`}
                      type="button"
                      onClick={() => handleToggle(workout.id)}
                      aria-expanded={isExpanded}
                      aria-label={`${workout.name} - ${getRelativeDate(workout.date, t)}`}
                      className="focus-visible:ring-ring flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
                    >
                      <div className="flex flex-col gap-1">
                        <span data-testid={`workout-name-${workout.id}`} className="text-foreground font-medium">
                          {workout.name}
                        </span>
                        <span data-testid={`workout-date-${workout.id}`} className="text-muted-foreground text-sm">
                          {getRelativeDate(workout.date, t)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {exerciseCount > 0 && (
                          <span
                            data-testid={`workout-exercises-${workout.id}`}
                            className="text-muted-foreground text-xs"
                          >
                            {t('fitness.history.exerciseCount', {
                              count: exerciseCount,
                            })}
                          </span>
                        )}
                        {(workout.durationMin ?? 0) > 0 && (
                          <span className="text-muted-foreground text-sm">
                            {workout.durationMin} {t('fitness.history.minutes')}
                          </span>
                        )}
                        {volume > 0 && (
                          <span
                            data-testid={`workout-volume-${workout.id}`}
                            className="text-primary text-sm font-medium"
                          >
                            {volume} kg
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div
                        data-testid={`workout-detail-${workout.id}`}
                        className="border-border-subtle border-t px-4 pb-3"
                      >
                        {Object.entries(groupSetsByExercise(workout.id)).map(([exerciseId, sets]) => (
                          <ExerciseGroupDetail key={exerciseId} exerciseId={exerciseId} sets={sets} t={t} />
                        ))}

                        <div
                          data-testid={`workout-meta-${workout.id}`}
                          className="text-muted-foreground border-border mt-2 flex items-center gap-4 border-t pt-2 text-xs"
                        >
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {(workout.durationMin ?? 0) > 0 && (
                              <span data-testid={`workout-duration-detail-${workout.id}`}>
                                {workout.durationMin} {t('fitness.history.minutes')}
                              </span>
                            )}
                          </div>
                          <span data-testid={`workout-completed-${workout.id}`}>
                            {t('fitness.history.completedAt')} {formatCompletionTime(workout.updatedAt)}
                          </span>
                        </div>

                        {workout.notes && (
                          <div
                            data-testid={`workout-notes-${workout.id}`}
                            className="border-border mt-2 flex items-start gap-2 border-t pt-2"
                          >
                            <StickyNote className="text-muted-foreground mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                            <p className="text-muted-foreground text-xs">{workout.notes}</p>
                          </div>
                        )}

                        <div className="border-border mt-2 flex justify-end border-t pt-2">
                          <button
                            type="button"
                            data-testid={`delete-workout-${workout.id}`}
                            onClick={() => setDeleteTargetId(workout.id)}
                            className="focus-visible:ring-ring text-destructive hover:bg-destructive/10 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
                            aria-label={t('fitness.deleteWorkout.title')}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('fitness.deleteWorkout.delete')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        variant="danger"
        title={t('fitness.deleteWorkout.title')}
        message={t('fitness.deleteWorkout.confirm')}
        confirmLabel={t('fitness.deleteWorkout.delete')}
        cancelLabel={t('fitness.deleteWorkout.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

export const WorkoutHistory = React.memo(WorkoutHistoryInner);
