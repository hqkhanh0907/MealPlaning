import { AlertTriangle, CheckCircle, Circle, Flame, MapPin, Moon, Trophy } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { useFitnessStore } from '../../../store/fitnessStore';
import { selectActivePlan } from '../../../store/selectors/fitnessSelectors';
import { DAY_LABELS } from '../constants';
import { calculateStreak } from '../utils/gamification';

const MILESTONE_THRESHOLDS = new Set([7, 14, 30, 60, 90]);

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

  const planDays = activePlan
    ? trainingPlanDays.filter(d => d.planId === activePlan.id).map(d => d.dayOfWeek)
    : ([] as number[]);

  const streakInfo = calculateStreak(workouts, planDays);

  if (streakInfo.currentStreak === 0) return null;

  const isFlame = streakInfo.currentStreak < 7;
  const isEntryAnimation = streakInfo.currentStreak === 1;
  const isMilestone = MILESTONE_THRESHOLDS.has(streakInfo.currentStreak);

  return (
    <output
      data-testid="streak-counter"
      className={`bg-card block rounded-xl p-4 shadow-sm${isEntryAnimation ? 'animate-scale-in' : ''}`}
      aria-label={t('fitness.gamification.streak')}
    >
      <div className="flex items-center gap-2">
        {isFlame ? (
          <Flame className="text-energy size-6" aria-hidden="true" data-testid="streak-icon-flame" />
        ) : (
          <Trophy className="text-energy size-6" aria-hidden="true" data-testid="streak-icon-trophy" />
        )}
        <span data-testid="streak-count" className="text-foreground text-2xl font-bold tabular-nums">
          {streakInfo.currentStreak}
        </span>
        <span className="text-muted-foreground">{t('fitness.gamification.streak')}</span>
      </div>

      {streakInfo.streakAtRisk && (
        <div data-testid="streak-warning" className="text-warning mt-1 flex items-center gap-1 text-sm">
          <AlertTriangle className="size-4" aria-hidden="true" />
          <span>{t('fitness.gamification.streakAtRisk')}</span>
        </div>
      )}

      {isMilestone && (
        <p data-testid="streak-milestone" className="text-primary mt-1 text-sm font-medium">
          {t('fitness.streak.milestone', { count: streakInfo.currentStreak })}
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
    </output>
  );
});
