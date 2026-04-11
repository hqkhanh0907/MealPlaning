import { ChevronDown, ChevronUp, Clock, Copy, Dumbbell, StickyNote, Trash2, Trophy } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { Skeleton } from '@/components/ui/skeleton';

import { useFitnessStore } from '../../../store/fitnessStore';
import { useNavigationStore } from '../../../store/navigationStore';
import { DAY_LABELS_SUNDAY_FIRST } from '../constants';
import type { ExerciseSeed } from '../data/exerciseDatabase';
import { EXERCISES } from '../data/exerciseDatabase';
import type { Exercise, ExerciseSessionMeta, Workout, WorkoutSet } from '../types';
import { addDays, getMondayOfWeek, parseDate } from '../utils/dateUtils';
import { seedToExercise } from '../utils/exerciseSelector';
import type { PRDetection } from '../utils/gamification';
import { detectPRs } from '../utils/gamification';
import { calculateExerciseVolume } from '../utils/trainingMetrics';

type FilterType = 'all' | 'strength' | 'cardio';

const EXERCISE_NAME_MAP = new Map(EXERCISES.map(e => [e.id, e.nameVi]));

interface WeekGroup {
  weekKey: string;
  weekNum: number;
  weekStart: string;
  weekEnd: string;
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

function getISOWeekNumber(dateStr: string): number {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
}

interface WeekLabelInfo {
  weekNum: number;
  start: string;
  end: string;
}

function getWeekLabel(dateStr: string): WeekLabelInfo {
  const monday = getMondayOfWeek(dateStr);
  const sunday = addDays(monday, 6);
  const weekNum = getISOWeekNumber(monday);
  const mParts = monday.split('-');
  const sParts = sunday.split('-');
  return {
    weekNum,
    start: `${mParts[2]}/${mParts[1]}`,
    end: `${sParts[2]}/${sParts[1]}`,
  };
}

function formatCompletionTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function ExerciseGroupDetail({
  exerciseId,
  sets,
  pr,
  t,
}: Readonly<{
  exerciseId: string;
  sets: WorkoutSet[];
  pr?: PRDetection;
  t: (key: string, opts?: Record<string, unknown>) => string;
}>): React.JSX.Element {
  const exerciseName =
    exerciseId === '_deleted'
      ? t('fitness.history.deletedExercise')
      : (EXERCISE_NAME_MAP.get(exerciseId) ?? exerciseId);
  const exerciseVolume = calculateExerciseVolume(sets);
  return (
    <div data-testid={`exercise-group-${exerciseId}`} className="py-2">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-sm font-medium">{exerciseName}</span>
          {pr && (
            <span
              data-testid={`pr-badge-${exerciseId}`}
              aria-label={t('fitness.history.prBadgeAria', { exercise: exerciseName })}
              className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800"
            >
              <Trophy className="h-3 w-3" aria-hidden="true" />
              {t('fitness.history.prBadge')}
            </span>
          )}
        </div>
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
  const setWorkoutDraft = useFitnessStore(s => s.setWorkoutDraft);
  const navigateTab = useNavigationStore(s => s.navigateTab);

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
    const grouped: Record<string, { weekNum: number; weekStart: string; weekEnd: string; workouts: Workout[] }> = {};
    for (const workout of filteredWorkouts) {
      const key = getWeekKey(workout.date);
      if (!grouped[key]) {
        const info = getWeekLabel(workout.date);
        grouped[key] = { weekNum: info.weekNum, weekStart: info.start, weekEnd: info.end, workouts: [] };
      }
      grouped[key].workouts.push(workout);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekKey, { weekNum, weekStart, weekEnd, workouts: wks }]) => ({
        weekKey,
        weekNum,
        weekStart,
        weekEnd,
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

  const expandedPRMap = useMemo<Map<string, PRDetection>>(() => {
    if (!expandedId) return new Map();
    const expandedWorkout = workouts.find(w => w.id === expandedId);
    if (!expandedWorkout) return new Map();

    const currentSets = workoutSets.filter(s => s.workoutId === expandedId);
    const previousSets = workoutSets.filter(s => {
      if (s.workoutId === expandedId) return false;
      const w = workouts.find(w2 => w2.id === s.workoutId);
      if (!w) return false;
      return new Date(w.date).getTime() < new Date(expandedWorkout.date).getTime();
    });

    const prs = detectPRs(currentSets, previousSets, EXERCISE_NAME_MAP);
    return new Map(prs.map(p => [p.exerciseId, p]));
  }, [expandedId, workouts, workoutSets]);

  const handleClone = useCallback(
    (workout: Workout) => {
      const sets = getSetsForWorkout(workout.id);
      const exerciseIds = [...new Set(sets.map(s => s.exerciseId).filter((id): id is string => id !== null))];
      const seeds: ExerciseSeed[] = exerciseIds
        .map(id => EXERCISES.find(e => e.id === id))
        .filter((e): e is ExerciseSeed => e !== undefined);
      const exercises: Exercise[] = seeds.map(seedToExercise);

      const exerciseMetas: ExerciseSessionMeta[] = exercises.map(ex => {
        const exSets = sets.filter(s => s.exerciseId === ex.id);
        return {
          exercise: ex,
          plannedSets: exSets.length,
          repsMin: ex.defaultRepsMin,
          repsMax: ex.defaultRepsMax,
          restSeconds: 90,
        };
      });

      const clonedSets: WorkoutSet[] = sets.map(s => ({
        ...s,
        id: crypto.randomUUID(),
        workoutId: '',
      }));

      setWorkoutDraft({
        exercises,
        exerciseMetas: exerciseMetas.length > 0 ? exerciseMetas : undefined,
        sets: clonedSets,
        elapsedSeconds: 0,
      });

      navigateTab('fitness');
    },
    [getSetsForWorkout, setWorkoutDraft, navigateTab],
  );

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
        <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Dumbbell className="text-muted-foreground h-7 w-7" aria-hidden="true" />
        </div>
        <p data-testid="empty-title" className="text-foreground mb-1 text-lg font-semibold">
          {t('fitness.emptyState.historyTitle')}
        </p>
        <p data-testid="empty-subtitle" className="text-muted-foreground mb-6 max-w-xs text-sm">
          {t('fitness.emptyState.historyDescription')}
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
              filter === key
                ? 'bg-accent-highlight text-accent-highlight-foreground'
                : 'text-foreground-secondary bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div data-testid="workout-list" className="flex flex-col gap-4">
        {weekGroups.map(({ weekKey, weekNum, weekStart, weekEnd, workouts: wks }) => (
          <div key={weekKey} data-testid={`week-group-${weekKey}`}>
            <h3
              data-testid={`week-header-${weekKey}`}
              className="bg-background text-muted-foreground sticky top-0 z-10 mb-2 px-1 text-xs font-semibold tracking-wider uppercase"
            >
              {t('fitness.history.weekRange', { week: weekNum, start: weekStart, end: weekEnd })}
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
                    <div className="flex items-stretch">
                      <button
                        data-testid={`workout-toggle-${workout.id}`}
                        type="button"
                        onClick={() => handleToggle(workout.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${workout.name} - ${getRelativeDate(workout.date, t)}`}
                        className="focus-visible:ring-ring flex flex-1 items-center justify-between px-4 py-3 text-left transition-all focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
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
                      <button
                        type="button"
                        data-testid={`clone-workout-${workout.id}`}
                        onClick={() => handleClone(workout)}
                        aria-label={t('fitness.history.cloneWorkoutAria', { name: workout.name })}
                        className="focus-visible:ring-ring text-muted-foreground hover:text-foreground hover:bg-muted flex items-center px-3 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    {isExpanded && (
                      <div
                        data-testid={`workout-detail-${workout.id}`}
                        className="border-border-subtle border-t px-4 pb-3"
                      >
                        {Object.entries(groupSetsByExercise(workout.id)).map(([exerciseId, sets]) => (
                          <ExerciseGroupDetail
                            key={exerciseId}
                            exerciseId={exerciseId}
                            sets={sets}
                            pr={expandedPRMap.get(exerciseId)}
                            t={t}
                          />
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
