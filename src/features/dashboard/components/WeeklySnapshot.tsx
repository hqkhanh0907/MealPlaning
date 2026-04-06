import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import type { WeightEntry, Workout } from '@/features/fitness/types';
import { addDays, formatDate, getMondayOfWeek } from '@/features/fitness/utils/dateUtils';
import { calculateStreak } from '@/features/fitness/utils/gamification';
import { useFitnessStore } from '@/store/fitnessStore';
import { selectActivePlan } from '@/store/selectors/fitnessSelectors';

// ===== Pure helpers =====

function getLatestWeight(entries: WeightEntry[]): number | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0].weightKg;
}

function computeWeeklyWeightChange(entries: WeightEntry[]): number | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const oldest = sorted[0];
  const latest = sorted.at(-1)!;
  const daysDiff = Math.max(1, (new Date(latest.date).getTime() - new Date(oldest.date).getTime()) / 86_400_000);
  return ((latest.weightKg - oldest.weightKg) / daysDiff) * 7;
}

function computeAdherence(
  workouts: Workout[],
  plannedDays: number[],
  mondayStr: string,
  todayStr: string,
): number | null {
  if (plannedDays.length === 0) return null;

  const plannedSet = new Set(plannedDays);
  const workoutDates = new Set(workouts.map(w => w.date.split('T')[0]));

  let plannedCount = 0;
  let completedCount = 0;

  for (let i = 0; i < 7; i++) {
    const d = addDays(mondayStr, i);
    if (d > todayStr) break;
    const dow = i + 1; // Mon=1 .. Sun=7
    if (plannedSet.has(dow)) {
      plannedCount++;
      if (workoutDates.has(d)) {
        completedCount++;
      }
    }
  }

  if (plannedCount === 0) return null;
  return Math.round((completedCount / plannedCount) * 100);
}

// ===== Dot colors =====

const DOT_COLORS: Record<string, string> = {
  completed: 'bg-primary',
  rest: 'bg-info',
  missed: 'border-2 border-border bg-transparent',
  upcoming: 'border-2 border-border bg-transparent',
  today: 'border-2 border-primary bg-primary/30',
};

// ===== Component =====

function WeeklySnapshotInner(): React.ReactElement {
  const { t } = useTranslation();
  const activePlan = useFitnessStore(selectActivePlan);
  const { workouts, weightEntries, trainingPlanDays } = useFitnessStore(
    useShallow(s => ({
      workouts: s.workouts,
      weightEntries: s.weightEntries,
      trainingPlanDays: s.trainingPlanDays,
    })),
  );

  const todayStr = useMemo(() => formatDate(new Date()), []);
  const mondayStr = useMemo(() => getMondayOfWeek(todayStr), [todayStr]);

  const planDays = useMemo(() => {
    if (!activePlan) return [] as number[];
    return trainingPlanDays.filter(d => d.planId === activePlan.id).map(d => d.dayOfWeek);
  }, [activePlan, trainingPlanDays]);

  const latestWeight = useMemo(() => getLatestWeight(weightEntries), [weightEntries]);

  const weeklyChange = useMemo(() => computeWeeklyWeightChange(weightEntries), [weightEntries]);

  const streakInfo = useMemo(() => calculateStreak(workouts, planDays, todayStr), [workouts, planDays, todayStr]);

  const adherence = useMemo(
    () => computeAdherence(workouts, planDays, mondayStr, todayStr),
    [workouts, planDays, mondayStr, todayStr],
  );

  // Weight change display
  const weightChangeDisplay = useMemo(() => {
    if (weeklyChange === null) return null;
    const abs = Math.abs(weeklyChange);
    const rounded = abs < 0.1 ? abs.toFixed(2) : abs.toFixed(1);
    if (weeklyChange < -0.05) {
      return { text: t('dashboard.weekly.weightDown', { value: rounded }), color: 'text-primary' };
    }
    if (weeklyChange > 0.05) {
      return { text: t('dashboard.weekly.weightUp', { value: rounded }), color: 'text-warning' };
    }
    return { text: t('dashboard.weekly.weightStable'), color: 'text-muted-foreground' };
  }, [weeklyChange, t]);

  return (
    <div
      data-testid="weekly-snapshot"
      aria-label={t('dashboard.weekly.a11y', {
        weight: latestWeight ?? '—',
        streak: streakInfo.currentStreak,
        adherence: adherence == null ? '—' : `${adherence}%`,
      })}
      className="bg-card border-border divide-border grid grid-cols-3 divide-x rounded-xl border p-4"
    >
      {/* Column 1 — Weight */}
      <div className="flex flex-col items-center justify-center gap-0.5 pr-3" data-testid="weekly-weight">
        {latestWeight == null ? (
          <>
            <span className="text-muted-foreground text-base font-semibold">{t('dashboard.weekly.noWeight')}</span>
            <span className="text-muted-foreground text-xs">{t('dashboard.weekly.logWeight')}</span>
          </>
        ) : (
          <>
            <span className="text-foreground text-base font-semibold tabular-nums">
              {latestWeight} {t('dashboard.weekly.weightUnit')}
            </span>
            {weightChangeDisplay && (
              <span
                className={`text-xs font-medium tabular-nums ${weightChangeDisplay.color}`}
                data-testid="weekly-weight-change"
              >
                {weightChangeDisplay.text}
              </span>
            )}
          </>
        )}
      </div>

      {/* Column 2 — Streak */}
      <div className="flex flex-col items-center justify-center gap-0.5 px-3" data-testid="weekly-streak">
        <span className="text-foreground text-base font-semibold tabular-nums">
          {streakInfo.currentStreak > 0
            ? t('dashboard.weekly.streakDays', { count: streakInfo.currentStreak })
            : t('dashboard.weekly.noStreak')}
        </span>
        <span className="text-muted-foreground text-xs">{t('dashboard.weekly.streak')}</span>
        <div className="mt-0.5 flex items-center gap-0.5" data-testid="weekly-streak-dots" aria-hidden="true">
          {streakInfo.weekDots.map(dot => (
            <span
              key={dot.day}
              data-testid={`weekly-dot-${dot.day}`}
              data-status={dot.status}
              className={`inline-block h-1.5 w-1.5 rounded-full ${DOT_COLORS[dot.status]}`}
            />
          ))}
        </div>
      </div>

      {/* Column 3 — Adherence */}
      <div className="flex flex-col items-center justify-center gap-0.5 pl-3" data-testid="weekly-adherence">
        {adherence == null ? (
          <>
            <span className="text-muted-foreground text-base font-semibold">{t('dashboard.weekly.noAdherence')}</span>
            <span className="text-muted-foreground text-xs">{t('dashboard.weekly.adherenceLabel')}</span>
          </>
        ) : (
          <>
            <span className="text-foreground text-base font-semibold tabular-nums">{adherence}%</span>
            <span className="text-muted-foreground text-xs">{t('dashboard.weekly.adherenceLabel')}</span>
            <progress
              className="bg-muted [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-value]:bg-primary mt-0.5 h-1.5 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all"
              data-testid="weekly-adherence-bar"
              value={Math.min(adherence, 100)}
              max={100}
            />
          </>
        )}
      </div>
    </div>
  );
}

export const WeeklySnapshot = React.memo(WeeklySnapshotInner);
