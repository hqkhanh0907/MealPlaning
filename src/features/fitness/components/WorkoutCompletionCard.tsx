import type { LucideIcon } from 'lucide-react';
import { Clock, Dumbbell, Layers, ListChecks, Save, Star, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PRDetection } from '../utils/gamification';

export interface WorkoutStats {
  duration: number;
  totalVolume: number;
  totalSets: number;
  exerciseCount: number;
}

export interface WorkoutCompletionCardProps {
  stats: WorkoutStats;
  personalRecords?: PRDetection[];
  streakMilestone?: number;
  sessionMilestone?: number;
  isFirstWorkout?: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

function StatCell({
  icon: Icon,
  label,
  value,
  testId,
}: Readonly<{ icon: LucideIcon; label: string; value: string; testId: string }>) {
  return (
    <div className="bg-muted/50 flex flex-col items-center gap-1 rounded-xl p-3" data-testid={testId}>
      <Icon className="text-muted-foreground h-5 w-5" aria-hidden="true" />
      <span className="text-foreground text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

export function WorkoutCompletionCard({
  stats,
  personalRecords,
  streakMilestone,
  sessionMilestone,
  isFirstWorkout,
  onSave,
  onDiscard,
}: Readonly<WorkoutCompletionCardProps>) {
  const { t } = useTranslation();

  if (stats.totalSets === 0) {
    return (
      <div className="text-center" data-testid="empty-workout">
        <p className="text-muted-foreground">{t('fitness.logger.emptyWorkout')}</p>
        <button
          type="button"
          data-testid="btn-discard-empty"
          onClick={onDiscard}
          className="text-destructive min-h-11 text-sm font-medium"
        >
          {t('fitness.logger.discardEmpty')}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-scale-in mx-auto max-w-sm space-y-4 p-4" data-testid="workout-completion-card">
      <div className="flex flex-col items-center text-center">
        <div className="bg-success/10 mb-3 flex h-16 w-16 items-center justify-center rounded-full">
          <Trophy className="text-success h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="text-foreground text-xl font-bold">{t('fitness.logger.workoutComplete')}</h2>
        {isFirstWorkout && (
          <p className="text-muted-foreground mt-1 text-sm">{t('fitness.logger.firstWorkoutMessage')}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3" data-testid="stats-grid">
        <StatCell
          icon={Clock}
          label={t('fitness.stats.duration')}
          value={`${stats.duration}m`}
          testId="stat-duration"
        />
        <StatCell
          icon={Dumbbell}
          label={t('fitness.stats.volume')}
          value={stats.totalVolume > 0 ? `${stats.totalVolume}kg` : '—'}
          testId="stat-volume"
        />
        <StatCell icon={Layers} label={t('fitness.stats.sets')} value={String(stats.totalSets)} testId="stat-sets" />
        <StatCell
          icon={ListChecks}
          label={t('fitness.stats.exercises')}
          value={String(stats.exerciseCount)}
          testId="stat-exercises"
        />
      </div>

      {personalRecords && personalRecords.length > 0 && (
        <div className="border-energy/20 bg-energy-subtle rounded-xl border p-3" data-testid="pr-section">
          <div className="mb-2 flex items-center gap-2">
            <Star className="text-energy h-4 w-4" aria-hidden="true" />
            <span className="text-energy text-sm font-semibold">{t('fitness.logger.newPRs')}</span>
          </div>
          {personalRecords.map(pr => (
            <div
              key={`${pr.exerciseId}-${pr.reps}`}
              className="text-foreground-secondary flex items-center justify-between py-1 text-sm"
              data-testid="pr-item"
            >
              <span className="truncate">{pr.exerciseName}</span>
              <span className="text-energy font-medium tabular-nums">
                +{pr.improvement}kg @ {pr.reps}rep
              </span>
            </div>
          ))}
        </div>
      )}

      {streakMilestone != null && streakMilestone > 0 && (
        <div
          className="animate-scale-in border-rose/20 bg-rose/5 rounded-xl border p-3 text-center"
          data-testid="streak-milestone"
        >
          <span className="text-2xl">🏆</span>
          <p className="text-rose text-sm font-semibold">{t('fitness.streak.milestone', { count: streakMilestone })}</p>
        </div>
      )}

      {sessionMilestone != null && sessionMilestone > 0 && (
        <div
          className="animate-scale-in border-primary/20 bg-primary/5 rounded-xl border p-3 text-center"
          data-testid="session-milestone"
        >
          <span className="text-2xl">🎯</span>
          <p className="text-primary text-sm font-semibold">
            {t('fitness.session.milestone', { count: sessionMilestone })}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          data-testid="btn-save-workout"
          onClick={onSave}
          className="bg-primary text-primary-foreground flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-lg font-semibold transition-[colors,transform] active:scale-[0.98] motion-reduce:transform-none"
        >
          <Save className="h-5 w-5" aria-hidden="true" />
          {t('fitness.logger.saveAndClose')}
        </button>
        <button
          type="button"
          data-testid="btn-discard-workout"
          onClick={onDiscard}
          className="text-destructive min-h-11 w-full text-sm font-medium"
        >
          {t('fitness.logger.discardWorkout')}
        </button>
      </div>
    </div>
  );
}
