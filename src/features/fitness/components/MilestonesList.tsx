import { CheckCircle, ChevronDown } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { useFitnessStore } from '../../../store/fitnessStore';
import { selectActivePlan } from '../../../store/selectors/fitnessSelectors';
import { calculateStreak, checkMilestones } from '../utils/gamification';

export const MilestonesList = React.memo(function MilestonesList() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const activePlan = useFitnessStore(selectActivePlan);
  const { workouts, trainingPlanDays } = useFitnessStore(
    useShallow(s => ({
      workouts: s.workouts,
      trainingPlanDays: s.trainingPlanDays,
    })),
  );

  const { milestones, currentSessions, currentLongestStreak } = useMemo(() => {
    const days = activePlan ? trainingPlanDays.filter(d => d.planId === activePlan.id).map(d => d.dayOfWeek) : [];
    const streakInfo = calculateStreak(workouts, days);
    const ms = checkMilestones(workouts.length, streakInfo.longestStreak);
    return {
      milestones: ms,
      currentSessions: workouts.length,
      currentLongestStreak: streakInfo.longestStreak,
    };
  }, [workouts, activePlan, trainingPlanDays]);

  const nextMilestone = milestones.find(m => !m.achievedDate);

  const progress = useMemo(() => {
    if (!nextMilestone) return 100;
    const current = nextMilestone.type === 'sessions' ? currentSessions : currentLongestStreak;
    return Math.min(100, Math.round((current / nextMilestone.threshold) * 100));
  }, [nextMilestone, currentSessions, currentLongestStreak]);

  return (
    <div data-testid="milestones-list">
      <button
        data-testid="milestones-toggle"
        onClick={() => setIsExpanded(v => !v)}
        aria-expanded={isExpanded}
        className="bg-card text-foreground flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-semibold shadow-sm"
      >
        <span>{t('fitness.gamification.milestones')}</span>
        <ChevronDown
          className={`text-muted-foreground h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <div data-testid="milestones-content" className="mt-2 space-y-3">
          {nextMilestone && (
            <div className="bg-card rounded-lg p-4 shadow-sm">
              <p className="text-muted-foreground mb-2 text-sm">
                {t('fitness.gamification.nextMilestone')}: {nextMilestone.emoji}{' '}
                {t(`fitness.gamification.${nextMilestone.label}`)}
              </p>
              <progress
                data-testid="progress-bar"
                className="sr-only"
                value={progress}
                max={100}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('fitness.gamification.nextMilestone')}
              />
              <div className="bg-muted h-2 overflow-hidden rounded-full" aria-hidden="true">
                <div
                  data-testid="progress-fill"
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {milestones.map(m => (
              <div
                key={m.id}
                data-testid={`milestone-${m.id}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  m.achievedDate ? 'bg-primary-subtle' : 'bg-muted/50 opacity-50'
                }`}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-foreground flex-1 text-sm">{t(`fitness.gamification.${m.label}`)}</span>
                {m.achievedDate && (
                  <span data-testid={`milestone-date-${m.id}`} className="text-primary flex items-center gap-1 text-xs">
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
