import { AlertTriangle, Check } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

export interface DayAssignmentSheetProps {
  open: boolean;
  onClose: () => void;
  trainingDays: number[];
  currentDay: number;
  onSelectDay: (day: number) => void;
  existingDayCounts?: Record<number, number>;
}

const MAX_SESSIONS_PER_DAY = 3;

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

const DayAssignmentSheetInner = React.memo(function DayAssignmentSheetInner({
  open,
  onClose,
  trainingDays,
  currentDay,
  onSelectDay,
  existingDayCounts = {},
}: DayAssignmentSheetProps): React.JSX.Element | null {
  const { t } = useTranslation();

  useModalBackHandler(open, onClose);

  const sortedDays = useMemo(() => [...trainingDays].sort((a, b) => a - b), [trainingDays]);

  const handleSelect = useCallback(
    (day: number) => {
      const count = existingDayCounts[day] ?? 0;
      if (count >= MAX_SESSIONS_PER_DAY) return;
      onSelectDay(day);
      onClose();
    },
    [existingDayCounts, onSelectDay, onClose],
  );

  if (!open) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        data-testid="day-assignment-sheet"
        className="bg-card relative w-full rounded-t-2xl shadow-xl sm:max-w-md sm:rounded-2xl"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="bg-muted h-1 w-10 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 text-center">
          <h2 data-testid="day-assignment-title" className="text-foreground text-lg font-bold">
            {t('fitness.scheduleEditor.selectDay')}
          </h2>
        </div>

        {/* Day list */}
        <div className="pb-safe px-4">
          <div role="radiogroup" aria-label={t('fitness.scheduleEditor.selectDay')} className="space-y-2 pb-4">
            {sortedDays.map(day => {
              const count = existingDayCounts[day] ?? 0;
              const isFull = count >= MAX_SESSIONS_PER_DAY;
              const isCurrent = day === currentDay;
              const shortLabel = t(DAY_LABEL_KEYS[day - 1]);
              const fullLabel = t(DAY_FULL_KEYS[day - 1]);

              return (
                <li key={day}>
                  <input
                    type="radio"
                    className="sr-only"
                    checked={isCurrent}
                    disabled={isFull}
                    onChange={() => handleSelect(day)}
                    name="day-selection"
                    tabIndex={-1}
                    aria-label={`${shortLabel} (${fullLabel})`}
                  />
                  <button
                    type="button"
                    aria-pressed={isCurrent}
                    data-testid={`day-option-${day}`}
                    disabled={isFull}
                    onClick={() => handleSelect(day)}
                    className={[
                      'flex w-full items-center gap-3 rounded-xl px-4 py-3',
                      'touch-manipulation text-left text-sm',
                      'transition-colors motion-reduce:transition-none',
                      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                      isCurrent
                        ? 'border-primary bg-primary-subtle border-2'
                        : 'bg-card border-border hover:bg-accent border',
                      'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {/* Radio indicator */}
                    <span
                      className={[
                        'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                        isCurrent ? 'border-primary bg-primary' : 'border-border',
                      ].join(' ')}
                    >
                      {isCurrent && <Check className="h-3 w-3 text-white" />}
                    </span>

                    {/* Day info */}
                    <span className="flex-1">
                      <span className="text-foreground font-semibold">{shortLabel}</span>
                      <span className="text-muted-foreground ml-1">({fullLabel})</span>
                      <span className="text-muted-foreground ml-2">
                        — {t('fitness.scheduleEditor.sessionsCount', { count })}
                      </span>
                    </span>

                    {/* Warning for full days */}
                    {isFull && (
                      <span
                        data-testid={`day-full-warning-${day}`}
                        className="flex flex-shrink-0 items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
                        aria-label={t('fitness.scheduleEditor.maxSessions')}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
});

export const DayAssignmentSheet = DayAssignmentSheetInner;
