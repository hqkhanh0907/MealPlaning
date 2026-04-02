import { Flame } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFitnessStore } from '../../../store/fitnessStore';
import { calculateStreak } from '../../fitness/utils/gamification';

const DOT_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500',
  rest: 'bg-blue-500',
  missed: 'border-2 border-slate-300 dark:border-slate-600 bg-transparent',
  upcoming: 'border-2 border-slate-300 dark:border-slate-600 bg-transparent',
  today: 'border-2 border-emerald-500 bg-transparent',
};

interface StreakMiniProps {
  onTap?: () => void;
}

function StreakMiniInner({ onTap }: Readonly<StreakMiniProps>): React.ReactElement {
  const { t } = useTranslation();
  const workouts = useFitnessStore(s => s.workouts);
  const trainingPlanDays = useFitnessStore(s => s.trainingPlanDays);
  const trainingPlans = useFitnessStore(s => s.trainingPlans);

  const planDays = useMemo(() => {
    const activePlan = trainingPlans.find(p => p.status === 'active');
    if (!activePlan) return [] as number[];
    return trainingPlanDays.filter(d => d.planId === activePlan.id).map(d => d.dayOfWeek);
  }, [trainingPlans, trainingPlanDays]);

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
        className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none dark:bg-slate-800/50"
      >
        <Flame className="h-5 w-5 text-slate-400" aria-hidden={true} />
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.streakMini.noData')}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t('dashboard.streakMini.startFirst')}</p>
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
      className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 p-3 transition-transform focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none active:scale-[0.98] dark:bg-slate-800/50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5" data-testid="streak-count">
          <Flame className="h-4 w-4 text-orange-500" aria-hidden={true} />
          <span
            className="text-base font-bold text-slate-800 dark:text-slate-200"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {t('dashboard.streakMini.days', {
              count: streakInfo.currentStreak,
            })}
          </span>
        </div>
        <p
          className="mt-0.5 text-xs text-slate-500 dark:text-slate-400"
          data-testid="streak-record"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
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
