import type { LucideIcon } from 'lucide-react';
import { Check, Circle, Dumbbell, Moon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { getAnimationClass, useReducedMotion } from '@/utils/motion';

import { DAY_LABELS } from '../constants';
import type { TrainingPlanDay } from '../types';

export type DayStatus = 'completed' | 'rest' | 'workout' | 'missed' | 'noPlan';

export interface WeekCalendarStripProps {
  readonly selectedDay: number;
  readonly todayDow: number;
  readonly planDays: readonly TrainingPlanDay[];
  readonly completedDays: Set<number>;
  readonly weekDates?: readonly number[];
  readonly selectedDayData?: {
    readonly workoutName: string;
    readonly exerciseCount: number;
    readonly muscleGroups: string;
  } | null;
  readonly onDaySelect: (day: number) => void;
  readonly onDayContextMenu?: (dayNum: number, e: React.MouseEvent) => void;
  readonly onStartSelectedDayWorkout?: () => void;
}

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const DAY_FULL_LABEL_KEYS = [
  'fitness.dayFull.0',
  'fitness.dayFull.1',
  'fitness.dayFull.2',
  'fitness.dayFull.3',
  'fitness.dayFull.4',
  'fitness.dayFull.5',
  'fitness.dayFull.6',
] as const;

const STATUS_ICONS: Record<DayStatus, LucideIcon> = {
  completed: Check,
  workout: Dumbbell,
  rest: Moon,
  missed: X,
  noPlan: Circle,
};

const STATUS_COLORS: Record<DayStatus, string> = {
  completed: 'bg-success/10 text-success',
  workout: 'bg-primary/10 text-primary',
  rest: 'bg-muted text-info',
  missed: 'bg-error/10 text-error',
  noPlan: 'bg-muted text-muted-foreground',
};

const STATUS_LABEL_KEYS: Record<DayStatus, string> = {
  completed: 'fitness.plan.completed',
  workout: 'fitness.plan.workout',
  rest: 'fitness.plan.restDay',
  missed: 'fitness.plan.missed',
  noPlan: 'fitness.plan.noPlanDay',
};

export function getDayStatus(
  dayNum: number,
  todayDow: number,
  planDays: readonly TrainingPlanDay[],
  completedDays: Set<number>,
): DayStatus {
  if (completedDays.has(dayNum)) return 'completed';
  const planDay = planDays.find(d => d.dayOfWeek === dayNum);
  if (planDay) {
    if (planDay.workoutType === 'rest') return 'rest';
    if (dayNum < todayDow) return 'missed';
    return 'workout';
  }
  if (dayNum < todayDow) return 'rest';
  return 'noPlan';
}

export function WeekCalendarStrip({
  selectedDay,
  todayDow,
  planDays,
  completedDays,
  weekDates,
  selectedDayData,
  onDaySelect,
  onDayContextMenu,
  onStartSelectedDayWorkout,
}: WeekCalendarStripProps): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const containerAnimation = getAnimationClass('slideUp', 2, reducedMotion);

  return (
    <div>
      <div
        data-testid="week-calendar-strip"
        className={cn('flex gap-1.5', containerAnimation, 'motion-reduce:transform-none')}
        role="toolbar"
        aria-label={t('fitness.plan.weekOverview')}
      >
        {DAYS.map(dayNum => {
          const status = getDayStatus(dayNum, todayDow, planDays, completedDays);
          const isToday = dayNum === todayDow;
          const isSelected = dayNum === selectedDay;
          const Icon = STATUS_ICONS[status];
          const dateNum = weekDates?.[dayNum - 1];

          return (
            <button
              key={dayNum}
              type="button"
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              aria-label={`${t(DAY_FULL_LABEL_KEYS[dayNum - 1])} — ${t(STATUS_LABEL_KEYS[status])}`}
              data-testid={`day-pill-${dayNum}`}
              data-status={status}
              onClick={() => onDaySelect(dayNum)}
              onContextMenu={onDayContextMenu ? e => onDayContextMenu(dayNum, e) : undefined}
              className={cn(
                'flex min-h-11 flex-1 flex-col items-center justify-center rounded-xl px-1 py-2 text-xs font-medium transition-colors',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                'active:scale-[0.98] motion-reduce:transform-none',
                STATUS_COLORS[status],
                isToday && 'ring-primary ring-2',
                !isToday && isSelected && 'ring-ring ring-2',
              )}
            >
              <span className="text-[10px] uppercase">{DAY_LABELS[dayNum - 1]}</span>
              {dateNum !== undefined && (
                <span className="text-[10px]" data-testid={`date-${dayNum}`}>
                  {dateNum}
                </span>
              )}
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {selectedDayData && (
        <div
          data-testid="day-preview"
          className={cn(
            'border-border bg-card mt-2 rounded-xl border p-3',
            !reducedMotion && 'animate-fade-in',
            'motion-reduce:transform-none',
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p data-testid="preview-workout-name" className="text-foreground text-sm font-semibold">
                {selectedDayData.workoutName}
              </p>
              <p data-testid="preview-details" className="text-muted-foreground text-xs">
                {t('fitness.plan.exerciseCount', { count: selectedDayData.exerciseCount })}
                {selectedDayData.muscleGroups && ` · ${selectedDayData.muscleGroups}`}
              </p>
            </div>
            {onStartSelectedDayWorkout && (
              <button
                type="button"
                data-testid="start-selected-workout"
                className="bg-primary text-primary-foreground min-h-11 rounded-lg px-4 py-2 text-sm font-medium"
                onClick={onStartSelectedDayWorkout}
              >
                {t('fitness.plan.startWorkout')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
