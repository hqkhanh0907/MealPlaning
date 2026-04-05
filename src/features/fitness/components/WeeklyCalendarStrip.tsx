import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface WeeklyCalendarStripProps {
  trainingDays: number[];
  selectedDay?: number;
  onDayToggle?: (day: number) => void;
  onDaySelect?: (day: number) => void;
  interactive?: boolean;
  todayDow?: number;
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

const DAY_FULL_KEYS = [
  'fitness.scheduleEditor.mondayFull',
  'fitness.scheduleEditor.tuesdayFull',
  'fitness.scheduleEditor.wednesdayFull',
  'fitness.scheduleEditor.thursdayFull',
  'fitness.scheduleEditor.fridayFull',
  'fitness.scheduleEditor.saturdayFull',
  'fitness.scheduleEditor.sundayFull',
] as const;

export const WeeklyCalendarStrip = React.memo(function WeeklyCalendarStrip({
  trainingDays,
  selectedDay,
  onDayToggle,
  onDaySelect,
  interactive = false,
  todayDow,
}: WeeklyCalendarStripProps): React.JSX.Element {
  const { t } = useTranslation();

  const trainingDaySet = useMemo(() => new Set(trainingDays), [trainingDays]);

  const handleDayClick = useCallback(
    (day: number) => {
      if (interactive && onDayToggle) {
        onDayToggle(day);
      } else if (!interactive && onDaySelect) {
        onDaySelect(day);
      }
    },
    [interactive, onDayToggle, onDaySelect],
  );

  return (
    <fieldset
      className="m-0 flex items-center justify-center gap-2 border-0 p-0"
      aria-label={t('fitness.scheduleEditor.weeklyCalendar')}
      data-testid="weekly-calendar-strip"
    >
      {[1, 2, 3, 4, 5, 6, 7].map(day => {
        const isTraining = trainingDaySet.has(day);
        const isSelected = selectedDay === day;
        const isToday = todayDow === day;
        const label = t(DAY_LABEL_KEYS[day - 1]);
        const fullLabel = t(DAY_FULL_KEYS[day - 1]);
        const statusLabel = isTraining ? t('fitness.scheduleEditor.trainingDay') : t('fitness.scheduleEditor.restDay');

        return (
          <button
            key={day}
            type="button"
            data-testid={`calendar-day-${day}`}
            aria-label={`${fullLabel} — ${statusLabel}`}
            aria-pressed={interactive ? isTraining : undefined}
            onClick={() => handleDayClick(day)}
            className={[
              'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full',
              'text-sm font-semibold',
              'touch-manipulation',
              'motion-reduce:transition-none',
              'transition-colors duration-150',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              isTraining ? 'bg-primary text-primary-foreground dark:bg-primary' : 'text-foreground-secondary bg-muted',
              isToday ? 'ring-status-info ring-2 ring-offset-1' : '',
              isSelected ? 'border-border border-2 dark:border-white' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {label}
          </button>
        );
      })}
    </fieldset>
  );
});
