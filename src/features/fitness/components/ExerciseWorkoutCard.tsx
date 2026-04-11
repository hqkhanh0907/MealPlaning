import { AlertTriangle, ArrowRightLeft, Check, Copy, History, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
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

function isValidSuggestion(suggestion: OverloadSuggestion): boolean {
  return Number.isFinite(suggestion.weight) && Number.isFinite(suggestion.reps) && suggestion.weight > 0;
}

interface ExerciseWorkoutCardProps {
  meta: ExerciseSessionMeta;
  exerciseIndex: number;
  totalExercises: number;
  loggedSets: WorkoutSet[];
  lastSessionSet: WorkoutSet | null;
  currentInput: SetInputData;
  overloadSuggestion: OverloadSuggestion | null;
  onWeightChange: (delta: number) => void;
  onRepsChange: (delta: number) => void;
  onRpeSelect: (rpe: number | undefined) => void;
  onWeightInput: (value: string) => void;
  onRepsInput: (value: string) => void;
  onDeleteSet: (setId: string) => void;
  onEditSet: (set: WorkoutSet) => void;
  onCopyLastSet: () => void;
  onCopyPrevSession: () => void;
  onApplyOverload: (suggestion: OverloadSuggestion) => void;
  onSwapExercise: () => void;
  onLogSet: () => void;
}

export default function ExerciseWorkoutCard({
  meta,
  exerciseIndex,
  totalExercises,
  loggedSets,
  lastSessionSet,
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
  onCopyPrevSession,
  onApplyOverload,
  onSwapExercise,
  onLogSet,
}: Readonly<ExerciseWorkoutCardProps>): React.JSX.Element {
  const { t } = useTranslation();

  const muscleGroups = [meta.exercise.muscleGroup, ...meta.exercise.secondaryMuscles]
    .map(mg => t(MUSCLE_GROUP_I18N_KEYS[mg]))
    .join(' • ');

  const nextSetNumber = loggedSets.length + 1;
  const lastSetThisSession = loggedSets.at(-1) ?? null;
  const isPlateaued = overloadSuggestion?.isPlateaued ?? false;
  const showOverloadChip = overloadSuggestion != null && isValidSuggestion(overloadSuggestion);

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm" data-testid="exercise-workout-card">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span
            className="text-muted-foreground mb-1 block text-xs font-bold tracking-wide uppercase"
            data-testid="exercise-progress"
          >
            {t('fitness.logger.exerciseProgress', { current: exerciseIndex + 1, total: totalExercises })}
          </span>
          <h3 className="text-foreground text-xl font-extrabold tracking-tight">{meta.exercise.nameVi}</h3>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            {t('fitness.logger.muscleGroupLabel')}
          </p>
          <p className="text-muted-foreground text-sm font-medium" data-testid="muscle-groups">
            {muscleGroups}
          </p>
        </div>
      </div>

      {/* Copy Previous Set + Overload Suggestion Chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        {lastSetThisSession && (
          <button
            type="button"
            onClick={onCopyLastSet}
            className="bg-primary/5 text-primary border-primary/20 active:bg-primary/10 flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none"
            data-testid="btn-copy-last-set"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            <span>
              {t('fitness.logger.repeatSet')}: {lastSetThisSession.weightKg}
              {t('fitness.logger.weightUnit')} × {lastSetThisSession.reps ?? 0}
            </span>
          </button>
        )}
        {lastSessionSet && !lastSetThisSession && (
          <button
            type="button"
            onClick={onCopyPrevSession}
            className="bg-muted text-muted-foreground flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none"
            data-testid="btn-copy-prev-session"
          >
            <History className="h-4 w-4" aria-hidden="true" />
            <span>
              {t('fitness.logger.prevSession')}: {lastSessionSet.weightKg}
              {t('fitness.logger.weightUnit')} × {lastSessionSet.reps ?? 0}
            </span>
          </button>
        )}
        {showOverloadChip && !isPlateaued && (
          <button
            type="button"
            onClick={() => onApplyOverload(overloadSuggestion)}
            className="bg-energy-subtle text-energy border-energy/20 flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none"
            data-testid="btn-overload-suggestion"
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <span>
              ↑ {overloadSuggestion.weight}
              {t('fitness.logger.weightUnit')} × {overloadSuggestion.reps}
            </span>
          </button>
        )}
      </div>

      {/* Plateau Warning */}
      {showOverloadChip && isPlateaued && (
        <div className="mb-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onApplyOverload(overloadSuggestion)}
            className="bg-warning/10 text-warning border-warning/20 flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none"
            data-testid="btn-overload-suggestion"
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>
              ↑ {overloadSuggestion.weight}
              {t('fitness.logger.weightUnit')} × {overloadSuggestion.reps}
            </span>
          </button>
          {overloadSuggestion.plateauWeeks != null && (
            <div
              className="bg-warning/10 text-warning flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
              data-testid="plateau-warning"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('fitness.logger.plateauWarning', { weeks: overloadSuggestion.plateauWeeks })}
            </div>
          )}
        </div>
      )}

      {/* Completed Sets */}
      <div className="mb-3">
        {loggedSets.map(set => (
          <div
            key={set.id}
            className="border-border-subtle flex items-center border-b py-3"
            data-testid={`logged-set-${set.id}`}
          >
            <span className="bg-muted text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-bold">
              {set.setNumber}
            </span>
            <div className="ml-3 flex flex-1 items-baseline gap-1.5">
              <span className="text-foreground text-xl font-bold">{set.weightKg}</span>
              <span className="text-muted-foreground text-xs font-medium uppercase">
                {t('fitness.logger.weightUnit')}
              </span>
              <span className="text-muted-foreground mx-1 text-sm">×</span>
              <span className="text-foreground text-xl font-bold">{set.reps ?? 0}</span>
              <span className="text-muted-foreground text-xs font-medium uppercase">
                {t('fitness.logger.repsUnit')}
              </span>
              {set.rpe != null && (
                <span className="bg-muted text-muted-foreground ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium">
                  RPE {set.rpe}
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEditSet(set)}
                data-testid={`edit-set-${set.id}`}
                aria-label={t('fitness.logger.editSet')}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-8 w-8"
                onClick={() => onDeleteSet(set.id)}
                data-testid={`delete-set-${set.id}`}
                aria-label={t('fitness.logger.deleteSet')}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Active Set Card */}
      <div className="bg-foreground text-background mb-3 rounded-xl p-4" data-testid="active-set-card">
        {/* Active header */}
        <div className="mb-4 flex items-center gap-2">
          <span className="border-muted-foreground flex h-7 w-7 items-center justify-center rounded-md border text-sm font-bold">
            {nextSetNumber}
          </span>
          <span className="border-muted-foreground rounded border px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase">
            {t('fitness.logger.activeSet')}
          </span>
        </div>

        {/* Stepper groups */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          {/* Weight stepper */}
          <div>
            <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
              {t('fitness.logger.weight')} ({t('fitness.logger.weightUnit')})
            </p>
            <div className="border-muted-foreground/30 flex items-center overflow-hidden rounded-lg border">
              <Button
                variant="ghost"
                size="icon"
                className="text-background h-[52px] w-11 shrink-0 rounded-none text-xl hover:bg-[rgba(255,255,255,0.1)]"
                onClick={() => onWeightChange(-WEIGHT_INCREMENT)}
                data-testid="weight-minus"
                aria-label={t('fitness.logger.decreaseWeight')}
              >
                −
              </Button>
              <input
                type="text"
                inputMode="decimal"
                aria-label={t('fitness.logger.weight')}
                value={Number.isNaN(currentInput.weight) ? '' : String(currentInput.weight)}
                onChange={e => onWeightInput(e.target.value)}
                className="border-muted-foreground/30 text-background h-[52px] min-w-0 flex-1 border-x bg-transparent text-center text-2xl font-bold outline-none"
                data-testid="weight-input"
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-background h-[52px] w-11 shrink-0 rounded-none text-xl hover:bg-[rgba(255,255,255,0.1)]"
                onClick={() => onWeightChange(WEIGHT_INCREMENT)}
                data-testid="weight-plus"
                aria-label={t('fitness.logger.increaseWeight')}
              >
                +
              </Button>
            </div>
          </div>

          {/* Reps stepper */}
          <div>
            <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
              {t('fitness.logger.reps')}
            </p>
            <div className="border-muted-foreground/30 flex items-center overflow-hidden rounded-lg border">
              <Button
                variant="ghost"
                size="icon"
                className="text-background h-[52px] w-11 shrink-0 rounded-none text-xl hover:bg-[rgba(255,255,255,0.1)]"
                onClick={() => onRepsChange(-REPS_INCREMENT)}
                data-testid="reps-minus"
                aria-label={t('fitness.logger.decreaseReps')}
              >
                −
              </Button>
              <input
                type="text"
                inputMode="numeric"
                aria-label={t('fitness.logger.reps')}
                value={Number.isNaN(currentInput.reps) ? '' : String(currentInput.reps)}
                onChange={e => onRepsInput(e.target.value)}
                className="border-muted-foreground/30 text-background h-[52px] min-w-0 flex-1 border-x bg-transparent text-center text-2xl font-bold outline-none"
                data-testid="reps-input"
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-background h-[52px] w-11 shrink-0 rounded-none text-xl hover:bg-[rgba(255,255,255,0.1)]"
                onClick={() => onRepsChange(REPS_INCREMENT)}
                data-testid="reps-plus"
                aria-label={t('fitness.logger.increaseReps')}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom: RPE + Confirm */}
        <div className="flex items-center gap-3">
          <div className="border-muted-foreground/30 flex flex-1 items-center rounded-lg border px-3 py-2.5">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">RPE</span>
            <div className="ml-auto">
              <select
                value={currentInput.rpe ?? ''}
                onChange={e => {
                  const val = e.target.value;
                  onRpeSelect(val ? Number(val) : undefined);
                }}
                className="text-background bg-transparent text-lg font-bold outline-none"
                data-testid="rpe-select"
              >
                <option value="" className="bg-background text-foreground">
                  —
                </option>
                {RPE_OPTIONS.map(rpe => (
                  <option key={rpe} value={rpe} className="bg-background text-foreground">
                    {rpe}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="bg-background text-foreground hover:bg-background/90 h-12 w-14 shrink-0 rounded-lg"
            onClick={onLogSet}
            data-testid="confirm-set-btn"
            aria-label={t('fitness.logger.logSet')}
          >
            <Check className="h-6 w-6" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Swap Exercise */}
      <Button
        variant="outline"
        size="sm"
        onClick={onSwapExercise}
        className="min-h-11 w-full active:scale-[0.98] motion-reduce:transform-none"
        data-testid="swap-exercise"
      >
        <ArrowRightLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        {t('fitness.logger.swapExercise')}
      </Button>
    </div>
  );
}
