import { Check, Dumbbell, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { DAY_LABELS } from '../constants';
import type { TrainingPlanDay } from '../types';

export interface WeekCalendarStripProps {
  readonly selectedDay: number;
  readonly todayDow: number;
  readonly planDays: readonly TrainingPlanDay[];
  readonly completedDays: Set<number>;
  readonly onDaySelect: (day: number) => void;
  readonly onDayContextMenu?: (dayNum: number, e: React.MouseEvent) => void;
}

type DayStatus = 'completed' | 'workout' | 'rest';

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

const STATUS_ICONS = {
  completed: Check,
  workout: Dumbbell,
  rest: Moon,
};

const STATUS_COLORS: Record<DayStatus, string> = {
  completed: 'bg-success/10 text-success',
  workout: 'bg-primary/10 text-primary',
  rest: 'bg-muted text-muted-foreground',
};

const STATUS_LABEL_KEYS: Record<DayStatus, string> = {
  completed: 'fitness.plan.completed',
  workout: 'fitness.plan.workout',
  rest: 'fitness.plan.restDay',
};

function getDayStatus(dayNum: number, planDays: readonly TrainingPlanDay[], completedDays: Set<number>): DayStatus {
  if (completedDays.has(dayNum)) return 'completed';
  const planDay = planDays.find(d => d.dayOfWeek === dayNum);
  if (planDay && planDay.workoutType !== 'rest') return 'workout';
  return 'rest';
}

export function WeekCalendarStrip({
  selectedDay,
  todayDow,
  planDays,
  completedDays,
  onDaySelect,
  onDayContextMenu,
}: WeekCalendarStripProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      data-testid="week-calendar-strip"
      className="flex gap-1.5"
      role="toolbar"
      aria-label={t('fitness.plan.weekOverview')}
    >
      {DAYS.map(dayNum => {
        const status = getDayStatus(dayNum, planDays, completedDays);
        const isToday = dayNum === todayDow;
        const isSelected = dayNum === selectedDay;
        const Icon = STATUS_ICONS[status];

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
              STATUS_COLORS[status],
              isToday && 'ring-primary ring-2',
              !isToday && isSelected && 'ring-ring ring-2',
            )}
          >
            <span className="text-[10px] uppercase">{DAY_LABELS[dayNum - 1]}</span>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
