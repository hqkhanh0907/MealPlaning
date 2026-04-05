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
          className="bg-primary flex-1 rounded-t"
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
    const exerciseIds = [...new Set(workoutSets.map(s => s.exerciseId).filter((id): id is string => id !== null))];
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
          <div className="bg-muted h-24 rounded-2xl" />
          <div className="flex gap-3">
            <div className="bg-muted h-20 flex-1 rounded-xl" />
            <div className="bg-muted h-20 flex-1 rounded-xl" />
          </div>
          <div className="bg-muted h-8 rounded-lg" />
        </div>
        <p className="text-muted-foreground mt-6 text-sm">{t('fitness.progress.noData')}</p>
        <button
          type="button"
          data-testid="start-training-cta"
          className="bg-primary text-primary-foreground active:bg-primary/80 focus-visible:ring-ring/50 mt-4 rounded-full px-6 py-2.5 text-sm font-medium focus-visible:ring-3"
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
        className="from-primary/90 to-primary rounded-2xl bg-gradient-to-br p-4 text-white shadow-lg"
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
              className="bg-card/30 flex-1 rounded-sm"
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
          className="bg-card min-w-[140px] flex-shrink-0 cursor-pointer rounded-xl p-4 text-left shadow-sm active:scale-95"
        >
          <Scale className="text-info h-5 w-5" aria-hidden="true" />
          <p className="text-foreground mt-2 text-xl font-semibold">
            {latestWeight ? `${latestWeight.weightKg}kg` : '—'}
          </p>
          <p className="text-muted-foreground text-xs">{t('fitness.progress.weight')}</p>
          {weightDelta !== 0 && (
            <span
              data-testid="weight-delta"
              className={`text-xs font-medium ${weightDelta > 0 ? 'text-destructive' : 'text-primary'}`}
            >
              {weightDelta > 0 ? '↑' : '↓'} {Math.abs(weightDelta)}kg
            </span>
          )}
          {weightDelta === 0 && latestWeight && (
            <span data-testid="weight-stable" className="text-muted-foreground text-xs font-medium">
              →
            </span>
          )}
        </button>

        <button
          type="button"
          data-testid="metric-card-1rm"
          onClick={() => handleCardClick('1rm')}
          aria-label={t('fitness.progress.estimated1rm')}
          className="bg-card min-w-[140px] flex-shrink-0 cursor-pointer rounded-xl p-4 text-left shadow-sm active:scale-95"
        >
          <Dumbbell className="text-ai h-5 w-5" aria-hidden="true" />
          <p className="text-foreground mt-2 text-xl font-semibold">{best1RM > 0 ? `${best1RM}kg` : '—'}</p>
          <p className="text-muted-foreground text-xs">{t('fitness.progress.estimated1rm')}</p>
        </button>

        <button
          type="button"
          data-testid="metric-card-adherence"
          onClick={() => handleCardClick('adherence')}
          aria-label={t('fitness.progress.adherence')}
          className="bg-card min-w-[140px] flex-shrink-0 cursor-pointer rounded-xl p-4 text-left shadow-sm active:scale-95"
        >
          <Target className="text-warning h-5 w-5" aria-hidden="true" />
          <p className="text-foreground mt-2 text-xl font-semibold">{adherencePercent}%</p>
          <p className="text-muted-foreground text-xs">{t('fitness.progress.adherence')}</p>
        </button>

        <button
          type="button"
          data-testid="metric-card-sessions"
          onClick={() => handleCardClick('sessions')}
          aria-label={t('fitness.progress.sessions')}
          className="bg-card min-w-[140px] flex-shrink-0 cursor-pointer rounded-xl p-4 text-left shadow-sm active:scale-95"
        >
          <Calendar className="text-primary h-5 w-5" aria-hidden="true" />
          <p className="text-foreground mt-2 text-xl font-semibold">{completedSessions}</p>
          <p className="text-muted-foreground text-xs">{t('fitness.progress.sessions')}</p>
        </button>
      </div>

      {cycleProgress && (
        <div data-testid="cycle-progress" className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm font-medium">{t('fitness.progress.cycleProgress')}</p>
            <p className="text-muted-foreground text-xs">
              {t('fitness.progress.weekOf', {
                current: cycleProgress.currentWeek,
                total: cycleProgress.totalWeeks,
              })}
            </p>
          </div>
          <div className="bg-muted mt-2 h-2 w-full rounded-full" aria-hidden="true">
            <div
              className="bg-primary h-full rounded-full transition-all"
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
          <p className="text-foreground text-sm font-medium">{t('fitness.progress.insights')}</p>
          {visibleInsights.map(insight => (
            <div
              key={insight.id}
              data-testid={`insight-${insight.id}`}
              className="bg-card flex items-center justify-between rounded-lg p-4 shadow-sm"
            >
              <p className="text-foreground-secondary text-sm">{insight.text}</p>
              <button
                type="button"
                data-testid={`dismiss-${insight.id}`}
                onClick={() => handleDismiss(insight.id)}
                className="text-muted-foreground hover:bg-accent ml-2 flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-full p-1"
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
          <div className="bg-card relative z-10 w-full rounded-t-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-primary h-5 w-5" aria-hidden="true" />
                <p className="text-foreground font-medium">{t(CARD_TITLE_KEYS[selectedCard])}</p>
              </div>
              <button
                type="button"
                data-testid="close-bottom-sheet"
                onClick={handleCloseSheet}
                aria-label={t('fitness.progress.dismiss')}
                className="text-muted-foreground hover:bg-accent flex min-h-11 min-w-11 items-center justify-center rounded-full p-1"
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
                    timeRange === range ? 'bg-primary text-primary-foreground' : 'text-foreground-secondary bg-muted'
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
