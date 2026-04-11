import { ClipboardList, Moon, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { TrainingPlanDay } from '@/features/fitness/types';
import { translateWorkoutType } from '@/features/fitness/utils/translateWorkoutType';

export interface TodayRestCardProps {
  readonly tomorrowPlanDay?: TrainingPlanDay;
  readonly tomorrowExerciseCount: number;
  readonly onConvertToWorkout: () => void;
  readonly onLogWeight: () => void;
  readonly onLogCardio: () => void;
}

export function TodayRestCard({
  tomorrowPlanDay,
  tomorrowExerciseCount,
  onConvertToWorkout,
  onLogWeight,
  onLogCardio,
}: TodayRestCardProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="rest-day-card"
      className="from-muted to-muted/80 text-foreground rounded-2xl bg-gradient-to-br p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <Moon className="h-5 w-5" aria-hidden="true" />
        <h3 className="text-lg font-semibold">{t('fitness.plan.restDay')}</h3>
      </div>

      <ul className="text-primary-foreground/90 space-y-2 text-sm">
        <li>{t('fitness.plan.restDayTip1')}</li>
        <li>{t('fitness.plan.restDayTip2')}</li>
        <li>{t('fitness.plan.restDayTip3')}</li>
      </ul>

      <button
        data-testid="rest-add-workout-btn"
        type="button"
        onClick={onConvertToWorkout}
        className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground focus-visible:ring-primary-foreground/60 mt-3 flex min-h-12 w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t('fitness.plan.convertToWorkout')}
      </button>

      {tomorrowPlanDay && (
        <p data-testid="tomorrow-preview" className="text-primary-foreground/80 mt-3 text-sm">
          <ClipboardList className="inline-block size-4" aria-hidden="true" /> {t('fitness.plan.tomorrow')}:{' '}
          {translateWorkoutType(t, tomorrowPlanDay.workoutType)} — {tomorrowExerciseCount} {t('fitness.plan.exercises')}
        </p>
      )}

      <div data-testid="quick-actions" className="mt-3 flex gap-2">
        <button
          data-testid="quick-log-weight"
          type="button"
          onClick={onLogWeight}
          className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground focus-visible:ring-primary-foreground/60 min-h-12 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('fitness.plan.logWeight')}
        </button>
        <button
          data-testid="quick-log-cardio"
          type="button"
          onClick={onLogCardio}
          className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground focus-visible:ring-primary-foreground/60 min-h-12 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('fitness.plan.logLightCardio')}
        </button>
      </div>
    </div>
  );
}
