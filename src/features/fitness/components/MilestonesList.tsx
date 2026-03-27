import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, CheckCircle } from 'lucide-react';
import { useFitnessStore } from '../../../store/fitnessStore';
import {
  checkMilestones,
  calculateStreak,
} from '../utils/gamification';

export const MilestonesList = React.memo(function MilestonesList() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const workouts = useFitnessStore((s) => s.workouts);
  const trainingPlanDays = useFitnessStore((s) => s.trainingPlanDays);
  const trainingPlans = useFitnessStore((s) => s.trainingPlans);

  const { milestones, currentSessions, currentLongestStreak } = useMemo(() => {
    const activePlan = trainingPlans.find((p) => p.status === 'active');
    const days = activePlan
      ? trainingPlanDays
          .filter((d) => d.planId === activePlan.id)
          .map((d) => d.dayOfWeek)
      : [];
    const streakInfo = calculateStreak(workouts, days);
    const ms = checkMilestones(workouts.length, streakInfo.longestStreak);
    return {
      milestones: ms,
      currentSessions: workouts.length,
      currentLongestStreak: streakInfo.longestStreak,
    };
  }, [workouts, trainingPlans, trainingPlanDays]);

  const nextMilestone = milestones.find((m) => !m.achievedDate);

  const progress = useMemo(() => {
    if (!nextMilestone) return 100;
    const current =
      nextMilestone.type === 'sessions'
        ? currentSessions
        : currentLongestStreak;
    return Math.min(100, Math.round((current / nextMilestone.threshold) * 100));
  }, [nextMilestone, currentSessions, currentLongestStreak]);

  return (
    <div data-testid="milestones-list">
      <button
        data-testid="milestones-toggle"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-3 text-left font-semibold text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
      >
        <span>{t('fitness.gamification.milestones')}</span>
        <ChevronDown
          className={`h-5 w-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <div data-testid="milestones-content" className="mt-2 space-y-3">
          {nextMilestone && (
            <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-800">
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                {t('fitness.gamification.nextMilestone')}:{' '}
                {nextMilestone.emoji}{' '}
                {t(`fitness.gamification.${nextMilestone.label}`)}
              </p>
              <div
                data-testid="progress-bar"
                className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('fitness.gamification.nextMilestone')}
              >
                <div
                  data-testid="progress-fill"
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {milestones.map((m) => (
              <div
                key={m.id}
                data-testid={`milestone-${m.id}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  m.achievedDate
                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                    : 'bg-zinc-50 opacity-50 dark:bg-zinc-800/50'
                }`}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">
                  {t(`fitness.gamification.${m.label}`)}
                </span>
                {m.achievedDate && (
                  <span
                    data-testid={`milestone-date-${m.id}`}
                    className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('fitness.gamification.achieved')} {m.achievedDate}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
