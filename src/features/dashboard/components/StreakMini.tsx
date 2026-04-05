import { Trophy } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { useFitnessStore } from '../../../store/fitnessStore';
import { selectActivePlan } from '../../../store/selectors/fitnessSelectors';
import { calculateStreak } from '../../fitness/utils/gamification';

const DOT_COLORS: Record<string, string> = {
  completed: 'bg-primary',
  rest: 'bg-info',
  missed: 'border-2 border-border bg-transparent',
  upcoming: 'border-2 border-border bg-transparent',
  today: 'border-2 border-primary bg-transparent',
};

interface StreakMiniProps {
  onTap?: () => void;
}

function StreakMiniInner({ onTap }: Readonly<StreakMiniProps>): React.ReactElement {
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
  }, [activePlan, trainingPlanDays]);

  const streakInfo = useMemo(() => calculateStreak(workouts, planDays), [workouts, planDays]);

  const handleTap = useCallback(() => {
    onTap?.();
  }, [onTap]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTap?.();
      }
    },
    [onTap],
  );

  if (workouts.length === 0) {
    return (
      <button
        type="button"
        data-testid="streak-mini-empty"
        tabIndex={0}
        aria-label={t('dashboard.streakMini.a11yEmpty')}
        onClick={handleTap}
        onKeyDown={handleKeyDown}
        className="focus:ring-ring bg-muted flex items-center gap-3 rounded-2xl p-3 transition-transform focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98]"
      >
        <Trophy className="text-muted-foreground h-5 w-5" aria-hidden={true} />
        <div>
          <p className="text-muted-foreground text-sm font-medium">{t('dashboard.streakMini.noData')}</p>
          <p className="text-muted-foreground text-xs">{t('dashboard.streakMini.startFirst')}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      data-testid="streak-mini"
      tabIndex={0}
      aria-label={t('dashboard.streakMini.a11y', {
        days: streakInfo.currentStreak,
        record: streakInfo.longestStreak,
      })}
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      className="focus:ring-ring bg-muted flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition-transform focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5" data-testid="streak-count">
          <Trophy className="text-energy h-4 w-4" aria-hidden={true} />
          <span className="text-foreground text-base font-semibold tabular-nums">
            {t('dashboard.streakMini.days', {
              count: streakInfo.currentStreak,
            })}
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs tabular-nums" data-testid="streak-record">
          {t('dashboard.streakMini.record', {
            count: streakInfo.longestStreak,
          })}
        </p>
      </div>

      <div className="flex items-center gap-1" data-testid="week-dots" aria-hidden="true">
        {streakInfo.weekDots.map(dot => (
          <span
            key={dot.day}
            data-testid={`dot-${dot.day}`}
            data-status={dot.status}
            className={`inline-block h-1.5 w-1.5 rounded-full ${DOT_COLORS[dot.status]}`}
          />
        ))}
      </div>
    </button>
  );
}

export const StreakMini = React.memo(StreakMiniInner);
