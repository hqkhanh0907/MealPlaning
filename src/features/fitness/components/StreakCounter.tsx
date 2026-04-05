import { CheckCircle, Circle, Flame, MapPin, Moon } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { useFitnessStore } from '../../../store/fitnessStore';
import { selectActivePlan } from '../../../store/selectors/fitnessSelectors';
import { DAY_LABELS } from '../constants';
import { calculateStreak } from '../utils/gamification';

function DotIcon({ status }: Readonly<{ status: string }>): React.JSX.Element {
  switch (status) {
    case 'completed':
      return <CheckCircle className="text-primary h-5 w-5" aria-hidden="true" />;
    case 'rest':
      return <Moon className="text-info h-5 w-5" aria-hidden="true" />;
    case 'today':
      return <MapPin className="text-primary h-5 w-5" aria-hidden="true" />;
    case 'missed':
      return <Circle className="text-destructive h-5 w-5" aria-hidden="true" />;
    default:
      return <Circle className="text-muted-foreground h-5 w-5" aria-hidden="true" />;
  }
}

export const StreakCounter = React.memo(function StreakCounter() {
  const { t } = useTranslation();
  const activePlan = useFitnessStore(selectActivePlan);
  const { workouts, trainingPlanDays } = useFitnessStore(
    useShallow(s => ({
      workouts: s.workouts,
      trainingPlanDays: s.trainingPlanDays,
    })),
  );

  const planDays = useMemo(() => {
    if (!activePlan) return [] as number[];
    return trainingPlanDays.filter(d => d.planId === activePlan.id).map(d => d.dayOfWeek);
  }, [trainingPlanDays, activePlan]);

  const streakInfo = useMemo(() => calculateStreak(workouts, planDays), [workouts, planDays]);

  return (
    <div data-testid="streak-counter" className="bg-card rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Flame className="text-color-energy size-6" aria-hidden="true" />
        <span data-testid="streak-count" className="text-foreground text-xl font-semibold">
          {streakInfo.currentStreak}
        </span>
        <span className="text-muted-foreground">{t('fitness.gamification.streak')}</span>
      </div>

      {streakInfo.streakAtRisk && (
        <p data-testid="streak-warning" className="text-warning mt-1 text-sm">
          {t('fitness.gamification.streakAtRisk')}
        </p>
      )}

      <p data-testid="streak-record" className="text-muted-foreground mt-1 text-sm">
        {t('fitness.gamification.longestStreak')}: {streakInfo.longestStreak}
      </p>

      <div data-testid="week-dots" className="mt-3 flex justify-between">
        {streakInfo.weekDots.map((dot, i) => (
          <div key={DAY_LABELS[i]} data-testid={`dot-${dot.status}`} className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground text-xs">{DAY_LABELS[i]}</span>
            <DotIcon status={dot.status} />
          </div>
        ))}
      </div>
    </div>
  );
});
