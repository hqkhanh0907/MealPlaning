import { ChevronDown, ChevronUp, Dumbbell, GripVertical } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { TrainingPlanDay } from '../types';
import { safeParseJsonArray } from '../types';

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
        className="text-muted-foreground flex flex-col items-center justify-center py-12"
      >
        <Dumbbell className="mb-2 h-6 w-6 opacity-40" />
        <p className="text-sm">{t('fitness.scheduleEditor.noWorkouts')}</p>
      </div>
    );
  }

  return (
    <ul data-testid="workout-assignment-list" className="space-y-2">
      {planDays.map((day, index) => (
        <li
          key={day.id}
          data-testid={`workout-item-${day.id}`}
          className="bg-card border-border flex items-center gap-2 rounded-xl border p-4 shadow-sm"
        >
          {/* Drag handle */}
          <div
            className="text-muted-foreground flex h-11 w-11 flex-shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Workout info */}
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-semibold">{day.workoutType}</p>
            {day.muscleGroups && (
              <p className="text-muted-foreground truncate text-xs">
                {safeParseJsonArray<string>(day.muscleGroups).join(', ')}
              </p>
            )}
          </div>

          {/* Day badge — tap to reassign */}
          <button
            type="button"
            data-testid={`reassign-btn-${day.id}`}
            aria-label={`${t('fitness.scheduleEditor.reassignDay')}: ${day.workoutType}`}
            onClick={() => handleReassign(day.id)}
            className="focus-visible:ring-ring text-primary-emphasis bg-primary/10 hover:bg-primary/20 min-h-11 flex-shrink-0 touch-manipulation rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
              className="focus-visible:ring-ring text-muted-foreground hover:bg-accent flex h-7 min-h-11 w-7 min-w-11 touch-manipulation items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              data-testid={`move-down-${day.id}`}
              aria-label={t('fitness.scheduleEditor.moveDown')}
              disabled={index === planDays.length - 1}
              onClick={() => handleMoveDown(index)}
              className="focus-visible:ring-ring text-muted-foreground hover:bg-accent flex h-7 min-h-11 w-7 min-w-11 touch-manipulation items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
});
