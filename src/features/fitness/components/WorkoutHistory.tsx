import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Clock,
  StickyNote,
} from 'lucide-react';
import { useFitnessStore } from '../../../store/fitnessStore';
import { calculateExerciseVolume } from '../utils/trainingMetrics';
import type { Workout, WorkoutSet } from '../types';
import { DAY_LABELS_SUNDAY_FIRST } from '../constants';

type FilterType = 'all' | 'strength' | 'cardio';

interface WeekGroup {
  weekKey: string;
  weekLabel: string;
  workouts: Workout[];
}

function getRelativeDate(
  dateStr: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const parts = dateStr.split('-');
  const target = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
  );
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return t('fitness.history.today');
  if (diffDays === 1) return t('fitness.history.yesterday');
  if (diffDays >= 2 && diffDays <= 6)
    return t('fitness.history.daysAgo', { count: diffDays });

  const dayName = DAY_LABELS_SUNDAY_FIRST[target.getDay()];
  return `${dayName}, ${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getMondayOfWeek(dateStr: string): Date {
  const parts = dateStr.split('-');
  const date = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
  );
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(date);
  monday.setDate(monday.getDate() - diff);
  return monday;
}

function getWeekKey(dateStr: string): string {
  const monday = getMondayOfWeek(dateStr);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekLabel(dateStr: string): string {
  const monday = getMondayOfWeek(dateStr);
  const dd = String(monday.getDate()).padStart(2, '0');
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

function formatCompletionTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function WorkoutHistoryInner(): React.JSX.Element {
  const { t } = useTranslation();
  const workouts = useFitnessStore((s) => s.workouts);
  const workoutSets = useFitnessStore((s) => s.workoutSets);

  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSetsForWorkout = useCallback(
    (workoutId: string): WorkoutSet[] =>
      workoutSets.filter((s) => s.workoutId === workoutId),
    [workoutSets],
  );

  const getExerciseCount = useCallback(
    (workoutId: string): number => {
      const sets = getSetsForWorkout(workoutId);
      return new Set(sets.map((s) => s.exerciseId)).size;
    },
    [getSetsForWorkout],
  );

  const filteredWorkouts = useMemo(() => {
    const sorted = [...workouts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    if (filter === 'all') return sorted;
    return sorted.filter((w) => {
      const sets = getSetsForWorkout(w.id);
      if (filter === 'strength') return sets.some((s) => s.weightKg > 0);
      return sets.some((s) => (s.durationMin ?? 0) > 0);
    });
  }, [workouts, filter, getSetsForWorkout]);

  const weekGroups = useMemo<WeekGroup[]>(() => {
    const grouped: Record<string, { label: string; workouts: Workout[] }> =
      {};
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
    setExpandedId((prev) => (prev === workoutId ? null : workoutId));
  }, []);

  const groupSetsByExercise = useCallback(
    (workoutId: string): Record<string, WorkoutSet[]> => {
      const sets = getSetsForWorkout(workoutId);
      const grouped: Record<string, WorkoutSet[]> = {};
      for (const set of sets) {
        const key = set.exerciseId;
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
      <div
        data-testid="workout-history-empty"
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <ClipboardList
          className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4"
          aria-hidden="true"
        />
        <p
          data-testid="empty-title"
          className="text-slate-500 dark:text-slate-400 font-medium mb-1"
        >
          {t('fitness.history.noHistory')}
        </p>
        <p
          data-testid="empty-subtitle"
          className="text-sm text-slate-400 dark:text-slate-500 mb-6"
        >
          {t('fitness.history.emptySubtitle')}
        </p>
        <div
          data-testid="skeleton-preview"
          className="w-full max-w-sm flex flex-col gap-3 opacity-30 blur-[1px] pointer-events-none"
          aria-hidden="true"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              data-testid={`skeleton-card-${i}`}
              className="bg-slate-100 dark:bg-slate-800 rounded-xl h-16 animate-pulse"
            />
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
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
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
              className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 px-1"
            >
              {t('fitness.history.weekOf', { date: weekLabel })}
            </h3>
            <div className="flex flex-col gap-3">
              {wks.map((workout) => {
                const isExpanded = expandedId === workout.id;
                const volume = getWorkoutVolume(workout.id);
                const exerciseCount = getExerciseCount(workout.id);

                return (
                  <div
                    key={workout.id}
                    data-testid={`workout-card-${workout.id}`}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    <button
                      data-testid={`workout-toggle-${workout.id}`}
                      type="button"
                      onClick={() => handleToggle(workout.id)}
                      aria-expanded={isExpanded}
                      aria-label={`${workout.name} - ${getRelativeDate(workout.date, t)}`}
                      className="w-full px-4 py-3 flex items-center justify-between text-left"
                    >
                      <div className="flex flex-col gap-1">
                        <span
                          data-testid={`workout-name-${workout.id}`}
                          className="font-medium text-slate-800 dark:text-slate-100"
                        >
                          {workout.name}
                        </span>
                        <span
                          data-testid={`workout-date-${workout.id}`}
                          className="text-sm text-slate-500 dark:text-slate-400"
                        >
                          {getRelativeDate(workout.date, t)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {exerciseCount > 0 && (
                          <span
                            data-testid={`workout-exercises-${workout.id}`}
                            className="text-xs text-slate-400 dark:text-slate-500"
                          >
                            {t('fitness.history.exerciseCount', {
                              count: exerciseCount,
                            })}
                          </span>
                        )}
                        {(workout.durationMin ?? 0) > 0 && (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {workout.durationMin}{' '}
                            {t('fitness.history.minutes')}
                          </span>
                        )}
                        {volume > 0 && (
                          <span
                            data-testid={`workout-volume-${workout.id}`}
                            className="text-sm font-medium text-emerald-600 dark:text-emerald-400"
                          >
                            {volume} kg
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div
                        data-testid={`workout-detail-${workout.id}`}
                        className="px-4 pb-3 border-t border-slate-100 dark:border-slate-700"
                      >
                        {Object.entries(groupSetsByExercise(workout.id)).map(
                          ([exerciseId, sets]) => {
                            const exerciseVolume =
                              calculateExerciseVolume(sets);
                            return (
                              <div
                                key={exerciseId}
                                data-testid={`exercise-group-${exerciseId}`}
                                className="py-2"
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {exerciseId}
                                  </span>
                                  {exerciseVolume > 0 && (
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                      {t('fitness.history.volume')}:{' '}
                                      {exerciseVolume} kg
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {sets.map((set) => (
                                    <span
                                      key={set.id}
                                      data-testid={`set-detail-${set.id}`}
                                      className="text-xs bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded"
                                    >
                                      {set.weightKg > 0 && (
                                        <>
                                          {set.weightKg}kg × {set.reps ?? 0}
                                        </>
                                      )}
                                      {(set.durationMin ?? 0) > 0 && (
                                        <>
                                          {set.durationMin}{' '}
                                          {t('fitness.history.minutes')}
                                        </>
                                      )}
                                      {set.rpe ? ` RPE ${set.rpe}` : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          },
                        )}

                        <div
                          data-testid={`workout-meta-${workout.id}`}
                          className="flex items-center gap-4 pt-2 mt-2 border-t border-slate-50 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500"
                        >
                          <div className="flex items-center gap-1">
                            <Clock
                              className="w-3 h-3"
                              aria-hidden="true"
                            />
                            {(workout.durationMin ?? 0) > 0 && (
                              <span
                                data-testid={`workout-duration-detail-${workout.id}`}
                              >
                                {workout.durationMin}{' '}
                                {t('fitness.history.minutes')}
                              </span>
                            )}
                          </div>
                          <span
                            data-testid={`workout-completed-${workout.id}`}
                          >
                            {t('fitness.history.completedAt')}{' '}
                            {formatCompletionTime(workout.updatedAt)}
                          </span>
                        </div>

                        {workout.notes && (
                          <div
                            data-testid={`workout-notes-${workout.id}`}
                            className="flex items-start gap-2 pt-2 mt-2 border-t border-slate-50 dark:border-slate-700"
                          >
                            <StickyNote
                              className="w-3 h-3 text-slate-400 mt-0.5 shrink-0"
                              aria-hidden="true"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {workout.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const WorkoutHistory = React.memo(WorkoutHistoryInner);
