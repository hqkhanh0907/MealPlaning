import {
  ArrowLeft,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Minus,
  Plus,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UnsavedChangesDialog } from '../../../components/shared/UnsavedChangesDialog';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useNavigationStore } from '../../../store/navigationStore';
import type { Exercise, SelectedExercise, TrainingPlanDay } from '../types';
import { safeJsonParse } from '../utils/safeJsonParse';
import { ExerciseSelector } from './ExerciseSelector';
import { SwapExerciseSheet } from './SwapExerciseSheet';

interface PlanDayEditorProps {
  planDay: TrainingPlanDay;
}

export const PlanDayEditor = memo(function PlanDayEditor({ planDay }: PlanDayEditorProps): React.JSX.Element {
  const { t } = useTranslation();
  const popPage = useNavigationStore(s => s.popPage);

  const [localExercises, setLocalExercises] = useState<SelectedExercise[]>(() =>
    safeJsonParse<SelectedExercise[]>(planDay.exercises ?? '[]', []),
  );
  const [showSelector, setShowSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{
    index: number;
    exercise: SelectedExercise;
  } | null>(null);
  const pendingRemovalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialSnapshot = useMemo(() => planDay.exercises, [planDay.exercises]);
  const hasChanges = JSON.stringify(localExercises) !== initialSnapshot;
  const isModified = planDay.originalExercises !== undefined && planDay.exercises !== planDay.originalExercises;

  const handleSave = useCallback(() => {
    useFitnessStore.getState().updatePlanDayExercises(planDay.id, localExercises);
    popPage();
  }, [planDay.id, localExercises, popPage]);

  const handleRestore = useCallback(() => {
    const original = safeJsonParse<SelectedExercise[]>(planDay.originalExercises ?? '[]', []);
    setLocalExercises(original);
    useFitnessStore.getState().restorePlanDayOriginal(planDay.id);
  }, [planDay.originalExercises, planDay.id]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      popPage();
    }
  }, [hasChanges, popPage]);

  const handleSaveAndBack = useCallback(() => {
    setShowConfirmDialog(false);
    handleSave();
  }, [handleSave]);

  const handleDiscardAndBack = useCallback(() => {
    setShowConfirmDialog(false);
    popPage();
  }, [popPage]);

  const handleCancelDiscard = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  const pendingRemovalRef = useRef<{
    index: number;
    exercise: SelectedExercise;
  } | null>(null);

  const commitRemoval = useCallback(() => {
    const current = pendingRemovalRef.current;
    if (current) {
      setLocalExercises(prev => prev.filter((_, i) => i !== current.index));
    }
    pendingRemovalRef.current = null;
    setPendingRemoval(null);
    pendingRemovalTimeoutRef.current = null;
  }, []);

  const handleRemove = useCallback(
    (index: number) => {
      if (pendingRemovalTimeoutRef.current) {
        clearTimeout(pendingRemovalTimeoutRef.current);
        commitRemoval();
      }
      const removed = localExercises[index];
      if (!removed) return;
      const removal = { index, exercise: removed };
      pendingRemovalRef.current = removal;
      setPendingRemoval(removal);
      pendingRemovalTimeoutRef.current = setTimeout(commitRemoval, 5000);
    },
    [localExercises, commitRemoval],
  );

  const handleUndo = useCallback(() => {
    if (pendingRemovalTimeoutRef.current) {
      clearTimeout(pendingRemovalTimeoutRef.current);
      pendingRemovalTimeoutRef.current = null;
    }
    pendingRemovalRef.current = null;
    setPendingRemoval(null);
  }, []);

  useEffect(() => {
    return () => {
      if (pendingRemovalTimeoutRef.current) {
        clearTimeout(pendingRemovalTimeoutRef.current);
      }
    };
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setLocalExercises(prev => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setLocalExercises(prev => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  }, []);

  const handleAddExercise = useCallback((exercise: Exercise) => {
    const selected: SelectedExercise = {
      exercise,
      sets: 3,
      repsMin: exercise.defaultRepsMin,
      repsMax: exercise.defaultRepsMax,
      restSeconds: 90,
    };
    setLocalExercises(prev => [...prev, selected]);
    setShowSelector(false);
  }, []);

  const handleOpenSelector = useCallback(() => {
    setShowSelector(true);
  }, []);

  const handleCloseSelector = useCallback(() => {
    setShowSelector(false);
  }, []);

  const handleToggleExpand = useCallback((index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  }, []);

  const handleUpdateField = useCallback(
    (
      index: number,
      field: keyof Pick<SelectedExercise, 'sets' | 'repsMin' | 'repsMax' | 'restSeconds'>,
      delta: number,
    ) => {
      setLocalExercises(prev => {
        const updated = [...prev];
        const item = { ...updated[index] };
        const newVal = item[field] + delta;

        if (field === 'sets') item.sets = Math.max(1, Math.min(10, newVal));
        else if (field === 'repsMin') item.repsMin = Math.max(1, Math.min(item.repsMax, newVal));
        else if (field === 'repsMax') item.repsMax = Math.max(item.repsMin, Math.min(30, newVal));
        else if (field === 'restSeconds') item.restSeconds = Math.max(30, Math.min(300, newVal));

        updated[index] = item;
        return updated;
      });
    },
    [],
  );

  const handleOpenSwap = useCallback((index: number) => {
    setSwapIndex(index);
  }, []);

  const handleCloseSwap = useCallback(() => {
    setSwapIndex(null);
  }, []);

  const handleSwapExercise = useCallback(
    (newExercise: Exercise) => {
      if (swapIndex === null) return;
      setLocalExercises(prev => {
        const updated = [...prev];
        const old = updated[swapIndex];
        updated[swapIndex] = {
          exercise: newExercise,
          sets: old.sets,
          repsMin: newExercise.defaultRepsMin,
          repsMax: newExercise.defaultRepsMax,
          restSeconds: old.restSeconds,
        };
        return updated;
      });
      setSwapIndex(null);
    },
    [swapIndex],
  );

  return (
    <div className="bg-card flex h-full flex-col">
      {/* Header */}
      <div className="pt-safe bg-primary border-border flex items-center gap-2 border-b px-4 py-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t('common.back')}
          className="text-primary-foreground active:bg-primary/80 flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-lg font-semibold text-white" title={t('fitness.plan.editExercises')}>
            {t('fitness.plan.editExercises')}
          </h1>
          {(isModified || hasChanges) && (
            <span className="text-primary-foreground/80 text-xs">{t('fitness.plan.modified')}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleRestore}
          aria-label={t('fitness.plan.restore')}
          className="text-primary-foreground active:bg-primary/80 flex h-11 items-center gap-1 rounded-lg px-3 text-sm transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">{t('fitness.plan.restore')}</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="text-primary-emphasis active:bg-primary-subtle bg-card flex h-11 items-center gap-1 rounded-lg px-4 text-sm font-medium transition-colors"
        >
          <Save className="h-4 w-4" />
          {t('fitness.plan.save')}
        </button>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24">
        {localExercises.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-16">
            <p className="text-sm">{t('fitness.plan.noExercises')}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {localExercises.map((item, index) => {
              const isExpanded = expandedIndex === index;
              const isPendingRemoval = pendingRemoval?.index === index;
              return (
                <li
                  key={`${item.exercise.id}-${index}`}
                  className={`border-border bg-muted rounded-xl border transition-opacity ${isPendingRemoval ? 'pointer-events-none opacity-0' : ''}`}
                >
                  <div className="flex items-center gap-2 p-3">
                    <GripVertical className="text-muted-foreground h-5 w-5 shrink-0" aria-hidden="true" />

                    <button
                      type="button"
                      onClick={() => handleToggleExpand(index)}
                      aria-expanded={isExpanded}
                      aria-controls={isExpanded ? `exercise-params-${index}` : undefined}
                      aria-label={`${t('fitness.plan.editParams')} ${item.exercise.nameVi}`}
                      className="focus-visible:ring-ring min-w-0 flex-1 rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <p
                        data-testid="exercise-name"
                        className="text-foreground line-clamp-2 font-medium"
                        title={item.exercise.nameVi}
                      >
                        {item.exercise.nameVi}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {item.sets} {t('fitness.plan.setsLabel')} &times; {item.repsMin}-{item.repsMax}{' '}
                        {t('fitness.plan.repsLabel')}
                        &middot; {item.restSeconds}s
                      </p>
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenSwap(index)}
                        aria-label={`${t('fitness.swap.title')} ${item.exercise.nameVi}`}
                        className="text-primary focus-visible:ring-ring active:bg-primary-subtle flex min-h-[44px] min-w-[44px] items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        data-testid={`swap-exercise-${index}`}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        aria-label={`Move up ${item.exercise.nameVi}`}
                        disabled={index === 0}
                        className="focus-visible:ring-ring text-muted-foreground enabled:active:bg-muted flex min-h-[44px] min-w-[44px] items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        aria-label={`Move down ${item.exercise.nameVi}`}
                        disabled={index === localExercises.length - 1}
                        className="focus-visible:ring-ring text-muted-foreground enabled:active:bg-muted flex min-h-[44px] min-w-[44px] items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        aria-label={`Remove ${item.exercise.nameVi}`}
                        className="text-destructive active:bg-destructive/10 focus-visible:ring-ring flex min-h-[44px] min-w-[44px] items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div data-testid={`exercise-params-${index}`} className="border-border border-t px-4 py-3">
                      <div className="grid grid-cols-2 gap-3">
                        <StepperField
                          label={t('fitness.plan.setsLabel')}
                          value={item.sets}
                          onDecrement={() => handleUpdateField(index, 'sets', -1)}
                          onIncrement={() => handleUpdateField(index, 'sets', 1)}
                          min={1}
                          max={10}
                          testId={`stepper-sets-${index}`}
                        />
                        <StepperField
                          label={t('fitness.plan.restLabel')}
                          value={item.restSeconds}
                          suffix="s"
                          onDecrement={() => handleUpdateField(index, 'restSeconds', -15)}
                          onIncrement={() => handleUpdateField(index, 'restSeconds', 15)}
                          min={30}
                          max={300}
                          testId={`stepper-rest-${index}`}
                        />
                        <StepperField
                          label={t('fitness.plan.repsMinLabel')}
                          value={item.repsMin}
                          onDecrement={() => handleUpdateField(index, 'repsMin', -1)}
                          onIncrement={() => handleUpdateField(index, 'repsMin', 1)}
                          min={1}
                          max={item.repsMax}
                          testId={`stepper-repsMin-${index}`}
                        />
                        <StepperField
                          label={t('fitness.plan.repsMaxLabel')}
                          value={item.repsMax}
                          onDecrement={() => handleUpdateField(index, 'repsMax', -1)}
                          onIncrement={() => handleUpdateField(index, 'repsMax', 1)}
                          min={item.repsMin}
                          max={30}
                          testId={`stepper-repsMax-${index}`}
                        />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Sticky add button */}
      <div className="pb-safe border-border bg-card sticky bottom-0 border-t p-4">
        <button
          type="button"
          onClick={handleOpenSelector}
          className="bg-primary text-primary-foreground active:bg-primary/80 focus-visible:ring-ring/50 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium focus-visible:ring-3"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          {t('fitness.plan.addExercise')}
        </button>
      </div>

      {/* Unsaved changes confirm dialog */}
      <UnsavedChangesDialog
        isOpen={showConfirmDialog}
        onSave={handleSaveAndBack}
        onDiscard={handleDiscardAndBack}
        onCancel={handleCancelDiscard}
      />

      {/* Undo removal toast */}
      {pendingRemoval && (
        <output
          aria-live="polite"
          className="bg-card fixed inset-x-4 bottom-20 z-50 flex items-center justify-between rounded-lg px-4 py-3 text-white shadow-lg"
        >
          <span className="text-sm">
            {pendingRemoval.exercise.exercise.nameVi} {t('fitness.plan.exerciseRemoved')}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="focus-visible:ring-ring text-primary min-h-[44px] min-w-[44px] text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
          >
            {t('fitness.plan.undo')}
          </button>
        </output>
      )}

      {/* Exercise selector bottom sheet */}
      <ExerciseSelector isOpen={showSelector} onClose={handleCloseSelector} onSelect={handleAddExercise} />

      {/* Swap exercise sheet */}
      {swapIndex !== null && localExercises[swapIndex] && (
        <SwapExerciseSheet
          isOpen={true}
          currentExercise={localExercises[swapIndex].exercise}
          onSelect={handleSwapExercise}
          onClose={handleCloseSwap}
        />
      )}
    </div>
  );
});

PlanDayEditor.displayName = 'PlanDayEditor';

interface StepperFieldProps {
  label: string;
  value: number;
  suffix?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  min: number;
  max: number;
  testId: string;
}

const StepperField = memo(function StepperField({
  label,
  value,
  suffix,
  onDecrement,
  onIncrement,
  min,
  max,
  testId,
}: StepperFieldProps) {
  return (
    <fieldset aria-label={label} className="m-0 flex flex-col items-center gap-1 border-0 p-0" data-testid={testId}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="focus-visible:ring-ring border-border text-foreground-secondary enabled:active:bg-muted flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="text-foreground min-w-[2.5rem] text-center text-sm font-semibold">
          {value}
          {suffix ?? ''}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="focus-visible:ring-ring border-border text-foreground-secondary enabled:active:bg-muted flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </fieldset>
  );
});
