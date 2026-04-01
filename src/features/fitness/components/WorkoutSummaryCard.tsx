import { useTranslation } from 'react-i18next';
import { Trophy, Clock, Dumbbell, Flame } from 'lucide-react';
import { formatElapsed } from '../utils/timeFormat';

interface WorkoutSummaryCardProps {
  durationSeconds: number;
  totalVolume: number;
  setsCompleted: number;
  personalRecords: { exerciseName: string; weight: number }[];
  onSave: () => void;
}

export function WorkoutSummaryCard({
  durationSeconds,
  totalVolume,
  setsCompleted,
  personalRecords,
  onSave,
}: Readonly<WorkoutSummaryCardProps>) {
  const { t } = useTranslation();
  const hasPR = personalRecords.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white pt-safe pb-safe dark:bg-slate-900"
      data-testid="workout-summary-card"
    >
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {hasPR && (
          <div
            className="mb-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-3 text-white shadow-lg"
            data-testid="pr-celebration"
          >
            <Trophy className="mx-auto mb-1 h-8 w-8" />
            <p className="text-center text-sm font-bold">
              {t('fitness.summary.newPR', { count: personalRecords.length })}
            </p>
            {personalRecords.map((pr) => (
              <p key={`${pr.exerciseName}-${pr.weight}`} className="text-center text-xs">
                {pr.exerciseName}: {pr.weight}kg
              </p>
            ))}
          </div>
        )}
        <h2 className="mb-6 text-2xl font-bold">
          {t('fitness.summary.title')}
        </h2>
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="text-slate-500">
              {t('fitness.logger.duration')}
            </span>
            <span className="ml-auto font-semibold">
              {formatElapsed(durationSeconds)}
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <Dumbbell className="h-5 w-5 text-green-500" />
            <span className="text-slate-500">
              {t('fitness.logger.totalVolume')}
            </span>
            <span className="ml-auto font-semibold">
              {totalVolume.toLocaleString()} kg
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-slate-500">
              {t('fitness.logger.setsCompleted')}
            </span>
            <span className="ml-auto font-semibold">{setsCompleted}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="mt-8 w-full max-w-sm rounded-xl bg-blue-600 py-3 font-semibold text-white"
          data-testid="save-workout-button"
        >
          {t('fitness.logger.save')}
        </button>
      </div>
    </div>
  );
}
