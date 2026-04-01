import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, ChevronUp, ChevronDown, Dumbbell } from 'lucide-react';
import type { TrainingPlanDay } from '../types';

export interface WorkoutAssignmentListProps {
  planDays: TrainingPlanDay[];
  trainingDays: number[];
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onReassign?: (dayId: string) => void;
}

const DAY_LABEL_KEYS = [
  'fitness.scheduleEditor.monday',
  'fitness.scheduleEditor.tuesday',
  'fitness.scheduleEditor.wednesday',
  'fitness.scheduleEditor.thursday',
  'fitness.scheduleEditor.friday',
  'fitness.scheduleEditor.saturday',
  'fitness.scheduleEditor.sunday',
] as const;

export const WorkoutAssignmentList = React.memo(function WorkoutAssignmentList({
  planDays,
  trainingDays: _trainingDays,
  onReorder,
  onReassign,
}: WorkoutAssignmentListProps): React.JSX.Element {
  const { t } = useTranslation();

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0 && onReorder) {
        onReorder(index, index - 1);
      }
    },
    [onReorder],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < planDays.length - 1 && onReorder) {
        onReorder(index, index + 1);
      }
    },
    [onReorder, planDays.length],
  );

  const handleReassign = useCallback(
    (dayId: string) => {
      if (onReassign) {
        onReassign(dayId);
      }
    },
    [onReassign],
  );

  const getDayLabel = useMemo(() => {
    return (dow: number): string => {
      if (dow < 1 || dow > 7) return String(dow);
      return t(DAY_LABEL_KEYS[dow - 1]);
    };
  }, [t]);

  if (planDays.length === 0) {
    return (
      <div
        data-testid="workout-assignment-empty"
        className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500"
      >
        <Dumbbell className="mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm">{t('fitness.scheduleEditor.noWorkouts')}</p>
      </div>
    );
  }

  return (
    <ul
      data-testid="workout-assignment-list"
      className="space-y-2"
     
    >
      {planDays.map((day, index) => (
        <li
          key={day.id}
          data-testid={`workout-item-${day.id}`}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {/* Drag handle */}
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Workout info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
              {day.workoutType}
            </p>
            {day.muscleGroups && (
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {day.muscleGroups}
              </p>
            )}
          </div>

          {/* Day badge — tap to reassign */}
          <button
            type="button"
            data-testid={`reassign-btn-${day.id}`}
            aria-label={`${t('fitness.scheduleEditor.reassignDay')}: ${day.workoutType}`}
            onClick={() => handleReassign(day.id)}
            className="flex-shrink-0 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 touch-manipulation transition-colors hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
          >
            {getDayLabel(day.dayOfWeek)}
          </button>

          {/* Move up/down buttons */}
          <div className="flex flex-shrink-0 flex-col gap-1">
            <button
              type="button"
              data-testid={`move-up-${day.id}`}
              aria-label={t('fitness.scheduleEditor.moveUp')}
              disabled={index === 0}
              onClick={() => handleMoveUp(index)}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-400 touch-manipulation transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-700"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              data-testid={`move-down-${day.id}`}
              aria-label={t('fitness.scheduleEditor.moveDown')}
              disabled={index === planDays.length - 1}
              onClick={() => handleMoveDown(index)}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-400 touch-manipulation transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-700"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
});
