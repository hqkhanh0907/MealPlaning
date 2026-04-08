import { ChevronRight, Dumbbell } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { ExerciseSessionMeta } from '../types';

interface NextExercisePreviewProps {
  meta: ExerciseSessionMeta | null;
  onNavigate: () => void;
}

export const NextExercisePreview = React.memo(function NextExercisePreview({
  meta,
  onNavigate,
}: Readonly<NextExercisePreviewProps>) {
  const { t } = useTranslation();

  if (!meta) return null;

  return (
    <div className="mt-4">
      <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
        {t('fitness.logger.nextExercise')}
      </p>
      <button
        type="button"
        onClick={onNavigate}
        data-testid="next-exercise-card"
        className="bg-card border-border hover:bg-accent flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors"
      >
        <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Dumbbell className="text-muted-foreground h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">{meta.exercise.nameVi}</p>
          <p className="text-muted-foreground text-xs">
            {t('fitness.logger.nextExerciseDetail', {
              sets: meta.plannedSets,
              repsMin: meta.repsMin,
              repsMax: meta.repsMax,
            })}
          </p>
        </div>
        <ChevronRight className="text-muted-foreground h-5 w-5 shrink-0" aria-hidden="true" />
      </button>
    </div>
  );
});
