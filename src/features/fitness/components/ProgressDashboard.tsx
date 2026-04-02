import { BarChart3, Calendar, Dumbbell, Minus, Scale, Target, TrendingDown, TrendingUp, X } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useFitnessStore } from '../../../store/fitnessStore';
import { useCurrentDate } from '../hooks/useCurrentDate';
import { getWeekBounds } from '../utils/dateUtils';
import { analyzePlateau } from '../utils/plateauAnalysis';
import { calculateWeeklyVolume, estimate1RM } from '../utils/trainingMetrics';

type MetricCardType = 'weight' | '1rm' | 'adherence' | 'sessions';
type TimeRange = '1W' | '1M' | '3M' | 'all';

const TIME_RANGES: TimeRange[] = ['1W', '1M', '3M', 'all'];

const CARD_TITLE_KEYS: Record<MetricCardType, string> = {
  weight: 'fitness.progress.weight',
  '1rm': 'fitness.progress.estimated1rm',
  adherence: 'fitness.progress.adherence',
  sessions: 'fitness.progress.sessions',
};

function getCutoffDate(range: TimeRange): string {
  if (range === 'all') return '0000-01-01';
  const daysMap = { '1W': 7, '1M': 30, '3M': 90 } as const;
  const d = new Date();
  d.setDate(d.getDate() - daysMap[range]);
  return d.toISOString().split('T')[0];
}

function SimpleBarChart({ data }: Readonly<{ data: number[] }>) {
  const maxVal = Math.max(...data, 1);
  return (
    <div data-testid="bottom-sheet-chart" className="flex h-32 items-end gap-1">
      {data.map((val, idx) => (
        <div
          key={`item-${String(idx)}`}
          data-testid="chart-bar"
          className="flex-1 rounded-t bg-emerald-400"
          style={{
            height: `${(val / maxVal) * 100}%`,
            minHeight: val > 0 ? '4px' : '2px',
          }}
        />
      ))}
    </div>
  );
}

function ProgressDashboardInner() {
  const { t } = useTranslation();
  const workouts = useFitnessStore(s => s.workouts);
  const workoutSets = useFitnessStore(s => s.workoutSets);
  const weightEntries = useFitnessStore(s => s.weightEntries);
  const trainingProfile = useFitnessStore(s => s.trainingProfile);
  const activePlan = useFitnessStore(s => s.getActivePlan());

  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
  const [selectedCard, setSelectedCard] = useState<MetricCardType | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1W');

  const hasData = workouts.length > 0;

  const currentDate = useCurrentDate();
  const thisWeek = useMemo(() => getWeekBounds(0, currentDate), [currentDate]);
  const lastWeek = useMemo(() => getWeekBounds(-1, currentDate), [currentDate]);

  const thisWeekWorkouts = useMemo(
    () => workouts.filter(w => w.date >= thisWeek.start && w.date <= thisWeek.end),
    [workouts, thisWeek],
  );

  const lastWeekWorkouts = useMemo(
    () => workouts.filter(w => w.date >= lastWeek.start && w.date <= lastWeek.end),
    [workouts, lastWeek],
  );

  const thisWeekVolume = useMemo(
    () => calculateWeeklyVolume(thisWeekWorkouts, workoutSets),
    [thisWeekWorkouts, workoutSets],
  );

  const lastWeekVolume = useMemo(
    () => calculateWeeklyVolume(lastWeekWorkouts, workoutSets),
    [lastWeekWorkouts, workoutSets],
  );

  const volumeChangePercent =
    lastWeekVolume > 0 ? Math.round(((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100) : 0;

  const sortedWeights = useMemo(() => [...weightEntries].sort((a, b) => b.date.localeCompare(a.date)), [weightEntries]);

  const latestWeight = sortedWeights.length > 0 ? sortedWeights[0] : undefined;

  const weight7DaysAgo = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return sortedWeights.find(w => w.date <= cutoffStr);
  }, [sortedWeights]);

  const weightDelta =
    latestWeight && weight7DaysAgo ? Math.round((latestWeight.weightKg - weight7DaysAgo.weightKg) * 10) / 10 : 0;

  const best1RM = useMemo(() => {
    if (workoutSets.length === 0) return 0;
    return Math.max(0, ...workoutSets.map(s => estimate1RM(s.weightKg, s.reps ?? 0)));
  }, [workoutSets]);

  const plannedSessions = trainingProfile?.daysPerWeek ?? 0;
  const completedSessions = thisWeekWorkouts.length;
  const adherencePercent =
    plannedSessions > 0 ? Math.min(100, Math.round((completedSessions / plannedSessions) * 100)) : 0;

  const cycleProgress = useMemo(() => {
    if (!activePlan) return null;
    const startDate = new Date(activePlan.startDate);
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    const currentWeek = Math.min(Math.max(diffWeeks + 1, 1), activePlan.durationWeeks);
    const percentComplete = Math.round((currentWeek / activePlan.durationWeeks) * 100);
    return {
      currentWeek,
      totalWeeks: activePlan.durationWeeks,
      percentComplete,
    };
  }, [activePlan]);

  const sparklineData = useMemo(() => {
    const days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayWorkouts = workouts.filter(w => w.date === dateStr);
      days.push(calculateWeeklyVolume(dayWorkouts, workoutSets));
    }
    return days;
  }, [workouts, workoutSets]);

  const plateauInsights = useMemo(() => {
    const exerciseIds = [...new Set(workoutSets.map(s => s.exerciseId))];
    const results: { id: string; text: string }[] = [];
    for (const eid of exerciseIds) {
      const result = analyzePlateau(workouts, workoutSets, eid);
      if (result.strengthPlateau || result.volumePlateau) {
        results.push({ id: `plateau-${eid}`, text: result.message });
      }
    }
    return results;
  }, [workouts, workoutSets]);

  const insights = useMemo(() => {
    const result: { id: string; text: string }[] = [];

    if (volumeChangePercent > 0) {
      result.push({
        id: 'volume-up',
        text: t('fitness.progress.volumeUp', {
          percent: volumeChangePercent,
        }),
      });
    } else if (volumeChangePercent < 0) {
      result.push({
        id: 'volume-down',
        text: t('fitness.progress.volumeDown', {
          percent: Math.abs(volumeChangePercent),
        }),
      });
    }

    const missedSessions = plannedSessions - completedSessions;
    if (missedSessions > 0 && plannedSessions > 0) {
      result.push({
        id: 'missed-sessions',
        text: t('fitness.progress.missedSessions', {
          count: missedSessions,
        }),
      });
    }

    if (latestWeight && weight7DaysAgo && weightDelta !== 0) {
      result.push({
        id: 'weight-change',
        text: t('fitness.progress.weightChange', {
          delta: weightDelta > 0 ? `+${weightDelta}` : String(weightDelta),
        }),
      });
    }

    return [...result, ...plateauInsights];
  }, [
    volumeChangePercent,
    completedSessions,
    plannedSessions,
    latestWeight,
    weight7DaysAgo,
    weightDelta,
    plateauInsights,
    t,
  ]);

  const visibleInsights = insights.filter(i => !dismissedInsights.includes(i.id));

  const bottomSheetChartData = useMemo((): number[] => {
    if (!selectedCard) return [];
    const cutoffStr = getCutoffDate(timeRange);

    switch (selectedCard) {
      case 'weight':
        return sortedWeights
          .filter(w => w.date >= cutoffStr)
          .reverse()
          .map(w => w.weightKg);
      case '1rm': {
        const filtered = workouts.filter(w => w.date >= cutoffStr);
        return filtered.map(w => {
          const sets = workoutSets.filter(s => s.workoutId === w.id);
          if (sets.length === 0) return 0;
          return Math.max(0, ...sets.map(s => estimate1RM(s.weightKg, s.reps ?? 0)));
        });
      }
      case 'adherence': {
        const filtered = workouts.filter(w => w.date >= cutoffStr);
        const target = trainingProfile?.daysPerWeek ?? 1;
        const weekMap = new Map<string, number>();
        for (const w of filtered) {
          const d = new Date(w.date);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
          const key = weekStart.toISOString().split('T')[0];
          weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
        }
        return Array.from(weekMap.keys())
          .sort((a, b) => a.localeCompare(b))
          .map(key => Math.min(100, Math.round(((weekMap.get(key) ?? 0) / target) * 100)));
      }
      case 'sessions': {
        const filtered = workouts.filter(w => w.date >= cutoffStr);
        const weekMap = new Map<string, number>();
        for (const w of filtered) {
          const d = new Date(w.date);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
          const key = weekStart.toISOString().split('T')[0];
          weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
        }
        return Array.from(weekMap.keys())
          .sort((a, b) => a.localeCompare(b))
          .map(key => weekMap.get(key) ?? 0);
      }
      /* v8 ignore next 3 -- TypeScript exhaustiveness check: all MetricCardType values handled above */
      default: {
        const _exhaustive: never = selectedCard;
        return _exhaustive;
      }
    }
  }, [selectedCard, timeRange, sortedWeights, workouts, workoutSets, trainingProfile]);

  const handleDismiss = useCallback((id: string) => {
    setDismissedInsights(prev => [...prev, id]);
  }, []);

  const handleCardClick = useCallback((card: MetricCardType) => {
    setSelectedCard(card);
    setTimeRange('1W');
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedCard(null);
  }, []);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  if (!hasData) {
    return (
      <div data-testid="progress-empty-state" className="flex flex-col items-center px-4 py-12">
        <div className="w-full space-y-4 opacity-30">
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="flex gap-3">
            <div className="h-20 flex-1 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="h-20 flex-1 rounded-xl bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">{t('fitness.progress.noData')}</p>
        <button
          type="button"
          data-testid="start-training-cta"
          className="mt-4 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white active:bg-emerald-600"
        >
          {t('fitness.progress.startTraining')} →
        </button>
      </div>
    );
  }

  const maxSparkline = Math.max(...sparklineData, 1);

  return (
    <div data-testid="progress-dashboard" className="space-y-4 pb-4">
      <div
        data-testid="hero-metric-card"
        className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg"
      >
        <p className="text-sm font-medium opacity-80">{t('fitness.progress.volumeThisWeek')}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span data-testid="volume-change" className="text-3xl font-bold">
            {volumeChangePercent >= 0 ? '+' : ''}
            {volumeChangePercent}%
          </span>
          {volumeChangePercent > 0 && <TrendingUp className="h-5 w-5" aria-hidden="true" />}
          {volumeChangePercent < 0 && <TrendingDown className="h-5 w-5" aria-hidden="true" />}
          {volumeChangePercent === 0 && <Minus className="h-5 w-5" aria-hidden="true" />}
        </div>
        <div data-testid="sparkline" className="mt-3 flex h-8 items-end gap-1">
          {sparklineData.map((val, idx) => (
            <div
              key={`item-${String(idx)}`}
              className="flex-1 rounded-sm bg-white/30"
              style={{
                height: `${(val / maxSparkline) * 100}%`,
                minHeight: '2px',
              }}
            />
          ))}
        </div>
      </div>

      <div data-testid="metric-cards" className="flex gap-3 overflow-x-auto pb-1">
        <button
          type="button"
          data-testid="metric-card-weight"
          onClick={() => handleCardClick('weight')}
          aria-label={t('fitness.progress.weight')}
          className="min-w-[140px] flex-shrink-0 cursor-pointer rounded-xl bg-white p-4 text-left shadow-sm active:scale-95 dark:bg-slate-800"
        >
          <Scale className="h-5 w-5 text-blue-500" aria-hidden="true" />
          <p className="mt-2 text-xl font-bold text-slate-800 dark:text-slate-100">
            {latestWeight ? `${latestWeight.weightKg}kg` : '—'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('fitness.progress.weight')}</p>
          {weightDelta !== 0 && (
            <span
              data-testid="weight-delta"
              className={`text-xs font-medium ${weightDelta > 0 ? 'text-red-500' : 'text-green-500'}`}
            >
              {weightDelta > 0 ? '↑' : '↓'} {Math.abs(weightDelta)}kg
            </span>
          )}
          {weightDelta === 0 && latestWeight && (
            <span data-testid="weight-stable" className="text-xs font-medium text-slate-400">
              →
            </span>
          )}
        </button>

        <button
          type="button"
          data-testid="metric-card-1rm"
          onClick={() => handleCardClick('1rm')}
          aria-label={t('fitness.progress.estimated1rm')}
          className="min-w-[140px] flex-shrink-0 cursor-pointer rounded-xl bg-white p-4 text-left shadow-sm active:scale-95 dark:bg-slate-800"
        >
          <Dumbbell className="h-5 w-5 text-purple-500" aria-hidden="true" />
          <p className="mt-2 text-xl font-bold text-slate-800 dark:text-slate-100">
            {best1RM > 0 ? `${best1RM}kg` : '—'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('fitness.progress.estimated1rm')}</p>
        </button>

        <button
          type="button"
          data-testid="metric-card-adherence"
          onClick={() => handleCardClick('adherence')}
          aria-label={t('fitness.progress.adherence')}
          className="min-w-[140px] flex-shrink-0 cursor-pointer rounded-xl bg-white p-4 text-left shadow-sm active:scale-95 dark:bg-slate-800"
        >
          <Target className="h-5 w-5 text-amber-500" aria-hidden="true" />
          <p className="mt-2 text-xl font-bold text-slate-800 dark:text-slate-100">{adherencePercent}%</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('fitness.progress.adherence')}</p>
        </button>

        <button
          type="button"
          data-testid="metric-card-sessions"
          onClick={() => handleCardClick('sessions')}
          aria-label={t('fitness.progress.sessions')}
          className="min-w-[140px] flex-shrink-0 cursor-pointer rounded-xl bg-white p-4 text-left shadow-sm active:scale-95 dark:bg-slate-800"
        >
          <Calendar className="h-5 w-5 text-emerald-500" aria-hidden="true" />
          <p className="mt-2 text-xl font-bold text-slate-800 dark:text-slate-100">{completedSessions}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('fitness.progress.sessions')}</p>
        </button>
      </div>

      {cycleProgress && (
        <div data-testid="cycle-progress" className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('fitness.progress.cycleProgress')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('fitness.progress.weekOf', {
                current: cycleProgress.currentWeek,
                total: cycleProgress.totalWeeks,
              })}
            </p>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700" aria-hidden="true">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${cycleProgress.percentComplete}%` }}
            />
          </div>
          <progress
            className="sr-only"
            value={cycleProgress.percentComplete}
            max={100}
            aria-label={t('fitness.progress.cycleProgress')}
          />
        </div>
      )}

      {visibleInsights.length > 0 && (
        <div data-testid="insights-section" className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('fitness.progress.insights')}</p>
          {visibleInsights.map(insight => (
            <div
              key={insight.id}
              data-testid={`insight-${insight.id}`}
              className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800"
            >
              <p className="text-sm text-slate-600 dark:text-slate-300">{insight.text}</p>
              <button
                type="button"
                data-testid={`dismiss-${insight.id}`}
                onClick={() => handleDismiss(insight.id)}
                className="ml-2 flex-shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label={t('fitness.progress.dismiss')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedCard && (
        <div data-testid="metric-bottom-sheet" className="fixed inset-0 z-50 flex items-end">
          <button
            type="button"
            data-testid="bottom-sheet-backdrop"
            className="absolute inset-0 border-0 bg-black/40"
            onClick={handleCloseSheet}
            aria-label={t('fitness.progress.dismiss')}
          />
          <div className="relative z-10 w-full rounded-t-2xl bg-white p-5 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                <p className="font-medium text-slate-800 dark:text-slate-100">{t(CARD_TITLE_KEYS[selectedCard])}</p>
              </div>
              <button
                type="button"
                data-testid="close-bottom-sheet"
                onClick={handleCloseSheet}
                aria-label={t('fitness.progress.dismiss')}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div data-testid="time-range-filter" className="mt-4 flex gap-2">
              {TIME_RANGES.map(range => (
                <button
                  key={range}
                  type="button"
                  data-testid={`time-range-${range}`}
                  onClick={() => handleTimeRangeChange(range)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    timeRange === range
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <SimpleBarChart data={bottomSheetChartData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const ProgressDashboard = memo(ProgressDashboardInner);
