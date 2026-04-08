import { AlertTriangle, ArrowRightLeft, Copy, Dumbbell, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SetInputData } from '@/schemas/workoutLoggerSchema';

import { REPS_INCREMENT, RPE_OPTIONS, WEIGHT_INCREMENT } from '../constants';
import type { OverloadSuggestion } from '../hooks/useProgressiveOverload';
import type { ExerciseSessionMeta, MuscleGroup, WorkoutSet } from '../types';

const MUSCLE_GROUP_I18N_KEYS: Record<MuscleGroup, string> = {
  chest: 'fitness.exerciseSelector.muscleChest',
  back: 'fitness.exerciseSelector.muscleBack',
  shoulders: 'fitness.exerciseSelector.muscleShoulders',
  legs: 'fitness.exerciseSelector.muscleLegs',
  arms: 'fitness.exerciseSelector.muscleArms',
  core: 'fitness.exerciseSelector.muscleCore',
  glutes: 'fitness.exerciseSelector.muscleGlutes',
};

interface ExerciseWorkoutCardProps {
  meta: ExerciseSessionMeta;
  exerciseIndex: number;
  totalExercises: number;
  loggedSets: WorkoutSet[];
  currentInput: SetInputData;
  overloadSuggestion: OverloadSuggestion | null;
  onWeightChange: (delta: number) => void;
  onRepsChange: (delta: number) => void;
  onRpeSelect: (rpe: number) => void;
  onWeightInput: (value: string) => void;
  onRepsInput: (value: string) => void;
  onDeleteSet: (setId: string) => void;
  onEditSet: (set: WorkoutSet) => void;
  onCopyLastSet: () => void;
  onApplyOverload: (suggestion: OverloadSuggestion) => void;
  onSwapExercise: () => void;
}

export default function ExerciseWorkoutCard({
  meta,
  exerciseIndex,
  totalExercises,
  loggedSets,
  currentInput,
  overloadSuggestion,
  onWeightChange,
  onRepsChange,
  onRpeSelect,
  onWeightInput,
  onRepsInput,
  onDeleteSet,
  onEditSet,
  onCopyLastSet,
  onApplyOverload,
  onSwapExercise,
}: Readonly<ExerciseWorkoutCardProps>): React.JSX.Element {
  const { t } = useTranslation();

  const muscleGroups = [meta.exercise.muscleGroup, ...meta.exercise.secondaryMuscles]
    .map(mg => t(MUSCLE_GROUP_I18N_KEYS[mg]))
    .join(' • ');

  const nextSetNumber = loggedSets.length + 1;
  const isPlateaued = overloadSuggestion?.isPlateaued ?? false;

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm" data-testid="exercise-workout-card">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-foreground h-5 w-5" aria-hidden="true" />
          <div>
            <h3 className="text-foreground text-base font-semibold">{meta.exercise.nameVi}</h3>
            <p className="text-muted-foreground text-xs" data-testid="muscle-groups">
              {muscleGroups}
            </p>
          </div>
        </div>
        <span className="text-muted-foreground text-sm" data-testid="exercise-progress">
          {t('fitness.logger.exerciseProgress', { current: exerciseIndex + 1, total: totalExercises })}
        </span>
      </div>

      {/* Progressive Overload Chip */}
      {overloadSuggestion && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onApplyOverload(overloadSuggestion)}
          className={cn(
            'mb-3 w-full rounded-full px-3 py-1.5 text-xs',
            isPlateaued ? 'bg-warning/10 text-warning hover:bg-warning/15' : 'bg-info/10 text-info hover:bg-info/15',
          )}
          data-testid="overload-chip"
        >
          {isPlateaued ? (
            <AlertTriangle className="mr-1 inline h-3 w-3" aria-hidden="true" />
          ) : (
            <TrendingUp className="mr-1 inline h-3 w-3" aria-hidden="true" />
          )}{' '}
          {t('fitness.setFormat', { weight: overloadSuggestion.weight, reps: overloadSuggestion.reps })}
          {isPlateaued && overloadSuggestion.plateauWeeks != null && ` (plateau ${overloadSuggestion.plateauWeeks}w)`}
        </Button>
      )}

      {/* Set Table */}
      <div className="mb-3">
        {/* Table Header */}
        <div className="border-border-subtle text-muted-foreground grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_3rem_4rem] items-center gap-x-2 border-b pb-1 text-xs font-medium">
          <span className="w-8 text-center">{t('fitness.logger.set')}</span>
          <span className="text-center">{t('fitness.logger.weight')}</span>
          <span className="text-center">{t('fitness.logger.reps')}</span>
          <span className="w-12 text-center">{t('fitness.logger.rpe')}</span>
          <span className="w-16" />
        </div>

        {/* Completed Sets */}
        {loggedSets.map(set => (
          <div
            key={set.id}
            className="border-border-subtle grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_3rem_4rem] items-center gap-x-2 border-b py-1.5"
            data-testid={`logged-set-${set.id}`}
          >
            <span className="border-primary text-foreground w-8 border-l-2 pl-2 text-center text-sm font-medium">
              {set.setNumber}
            </span>
            <span className="text-foreground text-center text-sm">{set.weightKg}</span>
            <span className="text-foreground text-center text-sm">{set.reps ?? 0}</span>
            <span className="text-muted-foreground w-12 text-center text-sm">{set.rpe ?? '—'}</span>
            <div className="flex w-16 justify-end gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEditSet(set)}
                data-testid={`edit-set-${set.id}`}
                aria-label={t('fitness.logger.editSet')}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-7 w-7"
                onClick={() => onDeleteSet(set.id)}
                data-testid={`delete-set-${set.id}`}
                aria-label={t('fitness.logger.deleteSet')}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}

        {/* Active Input Row */}
        <div className="bg-muted/50 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_3rem_4rem] items-center gap-x-2 rounded-b-lg py-2">
          <span className="text-muted-foreground w-8 text-center text-sm font-medium">{nextSetNumber}</span>

          {/* Weight input with +/- */}
          <div className="flex min-w-0 items-center justify-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onWeightChange(-WEIGHT_INCREMENT)}
              data-testid="weight-minus"
              aria-label={t('fitness.logger.decreaseWeight')}
            >
              −
            </Button>
            <input
              type="text"
              inputMode="decimal"
              value={Number.isNaN(currentInput.weight) ? '' : String(currentInput.weight)}
              onChange={e => onWeightInput(e.target.value)}
              className="border-border bg-background h-8 w-12 rounded border text-center text-sm"
              data-testid="weight-input"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onWeightChange(WEIGHT_INCREMENT)}
              data-testid="weight-plus"
              aria-label={t('fitness.logger.increaseWeight')}
            >
              +
            </Button>
          </div>

          {/* Reps input with +/- */}
          <div className="flex min-w-0 items-center justify-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onRepsChange(-REPS_INCREMENT)}
              data-testid="reps-minus"
              aria-label={t('fitness.logger.decreaseReps')}
            >
              −
            </Button>
            <input
              type="text"
              inputMode="numeric"
              value={Number.isNaN(currentInput.reps) ? '' : String(currentInput.reps)}
              onChange={e => onRepsInput(e.target.value)}
              className="border-border bg-background h-8 w-12 rounded border text-center text-sm"
              data-testid="reps-input"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onRepsChange(REPS_INCREMENT)}
              data-testid="reps-plus"
              aria-label={t('fitness.logger.increaseReps')}
            >
              +
            </Button>
          </div>

          {/* RPE select */}
          <select
            value={currentInput.rpe ?? ''}
            onChange={e => {
              const val = e.target.value;
              if (val) onRpeSelect(Number(val));
            }}
            className="border-border bg-background h-8 w-12 rounded border px-1 text-center text-sm"
            data-testid="rpe-select"
          >
            <option value="">—</option>
            {RPE_OPTIONS.map(rpe => (
              <option key={rpe} value={rpe}>
                {rpe}
              </option>
            ))}
          </select>

          <span className="w-16" />
        </div>
      </div>

      {/* Copy Last Set */}
      {loggedSets.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopyLastSet}
          className="text-muted-foreground mb-2 w-full"
          data-testid="copy-last-set"
        >
          <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('fitness.logger.copyLastSet')}
        </Button>
      )}

      {/* Swap Exercise */}
      <Button variant="outline" size="sm" onClick={onSwapExercise} className="w-full" data-testid="swap-exercise">
        <ArrowRightLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        {t('fitness.logger.swapExercise')}
      </Button>
    </div>
  );
}
