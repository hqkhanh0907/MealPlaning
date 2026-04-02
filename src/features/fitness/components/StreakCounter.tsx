import { CheckCircle, Circle, Flame, MapPin, Moon } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFitnessStore } from '../../../store/fitnessStore';
import { DAY_LABELS } from '../constants';
import { calculateStreak } from '../utils/gamification';

function DotIcon({ status }: Readonly<{ status: string }>): React.JSX.Element {
  switch (status) {
    case 'completed':
      return <CheckCircle className="text-primary h-5 w-5" aria-hidden="true" />;
    case 'rest':
      return <Moon className="h-5 w-5 text-blue-400" aria-hidden="true" />;
    case 'today':
      return <MapPin className="text-primary h-5 w-5" aria-hidden="true" />;
    case 'missed':
      return <Circle className="h-5 w-5 text-red-400" aria-hidden="true" />;
    default:
      return <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" aria-hidden="true" />;
  }
}

export const StreakCounter = React.memo(function StreakCounter() {
  const { t } = useTranslation();
  const workouts = useFitnessStore(s => s.workouts);
  const trainingPlanDays = useFitnessStore(s => s.trainingPlanDays);
  const trainingPlans = useFitnessStore(s => s.trainingPlans);

  const planDays = useMemo(() => {
    const activePlan = trainingPlans.find(p => p.status === 'active');
    if (!activePlan) return [] as number[];
    return trainingPlanDays.filter(d => d.planId === activePlan.id).map(d => d.dayOfWeek);
  }, [trainingPlanDays, trainingPlans]);

  const streakInfo = useMemo(() => calculateStreak(workouts, planDays), [workouts, planDays]);

  return (
    <div data-testid="streak-counter" className="bg-card rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Flame className="size-6 text-orange-500" aria-hidden="true" />
        <span data-testid="streak-count" className="text-foreground text-xl font-bold">
          {streakInfo.currentStreak}
        </span>
        <span className="text-muted-foreground">{t('fitness.gamification.streak')}</span>
      </div>

      {streakInfo.streakAtRisk && (
        <p data-testid="streak-warning" className="mt-1 text-sm text-amber-600 dark:text-amber-400">
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
