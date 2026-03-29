import React, { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Save,
  RotateCcw,
} from 'lucide-react';
import { ExerciseSelector } from './ExerciseSelector';
import { useNavigationStore } from '../../../store/navigationStore';
import { useFitnessStore } from '../../../store/fitnessStore';
import { safeJsonParse } from '../utils/safeJsonParse';
import type { TrainingPlanDay, SelectedExercise, Exercise } from '../types';

interface PlanDayEditorProps {
  planDay: TrainingPlanDay;
}

export const PlanDayEditor = memo(function PlanDayEditor({
  planDay,
}: PlanDayEditorProps): React.JSX.Element {
  const { t } = useTranslation();
  const { popPage } = useNavigationStore();

  const [localExercises, setLocalExercises] = useState<SelectedExercise[]>(
    () => safeJsonParse<SelectedExercise[]>(planDay.exercises ?? '[]', []),
  );
  const [showSelector, setShowSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const initialSnapshot = useMemo(() => planDay.exercises, [planDay.exercises]);
  const hasChanges = JSON.stringify(localExercises) !== initialSnapshot;
  const isModified =
    planDay.originalExercises !== undefined &&
    planDay.exercises !== planDay.originalExercises;

  const handleSave = useCallback(() => {
    useFitnessStore
      .getState()
      .updatePlanDayExercises(planDay.id, localExercises);
    popPage();
  }, [planDay.id, localExercises, popPage]);

  const handleRestore = useCallback(() => {
    const original = safeJsonParse<SelectedExercise[]>(
      planDay.originalExercises ?? '[]',
      [],
    );
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

  const handleConfirmDiscard = useCallback(() => {
    setShowConfirmDialog(false);
    popPage();
  }, [popPage]);

  const handleCancelDiscard = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setLocalExercises((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setLocalExercises((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setLocalExercises((prev) => {
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
    setLocalExercises((prev) => [...prev, selected]);
    setShowSelector(false);
  }, []);

  const handleOpenSelector = useCallback(() => {
    setShowSelector(true);
  }, []);

  const handleCloseSelector = useCallback(() => {
    setShowSelector(false);
  }, []);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-600 px-4 py-3 dark:border-slate-700">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t('common.back')}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white active:bg-emerald-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-lg font-semibold text-white">
            {t('fitness.plan.editExercises')}
          </h1>
          {(isModified || hasChanges) && (
            <span className="text-xs text-emerald-100">
              {t('fitness.plan.modified')}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleRestore}
          className="flex h-11 items-center gap-1 rounded-lg px-3 text-sm text-white active:bg-emerald-700"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t('fitness.plan.restore')}
          </span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex h-11 items-center gap-1 rounded-lg bg-white px-4 text-sm font-medium text-emerald-700 active:bg-emerald-50"
        >
          <Save className="h-4 w-4" />
          {t('fitness.plan.save')}
        </button>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24">
        {localExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <p className="text-sm">{t('fitness.plan.noExercises')}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {localExercises.map((item, index) => (
              <li
                key={`${item.exercise.id}-${index}`}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <GripVertical className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />

                <div className="min-w-0 flex-1">
                  <p
                    data-testid="exercise-name"
                    className="truncate font-medium text-slate-900 dark:text-slate-100"
                  >
                    {item.exercise.nameVi}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.sets} sets &times; {item.repsMin}-{item.repsMax} reps
                    &middot; {item.restSeconds}s rest
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    aria-label={`Move up ${item.exercise.nameVi}`}
                    disabled={index === 0}
                    className="flex h-11 w-9 items-center justify-center rounded text-slate-400 enabled:active:bg-slate-200 disabled:opacity-30 dark:text-slate-500 dark:enabled:active:bg-slate-700"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    aria-label={`Move down ${item.exercise.nameVi}`}
                    disabled={index === localExercises.length - 1}
                    className="flex h-11 w-9 items-center justify-center rounded text-slate-400 enabled:active:bg-slate-200 disabled:opacity-30 dark:text-slate-500 dark:enabled:active:bg-slate-700"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    aria-label={`Remove ${item.exercise.nameVi}`}
                    className="flex h-11 w-9 items-center justify-center rounded text-red-400 active:bg-red-50 dark:text-red-500 dark:active:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sticky add button */}
      <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={handleOpenSelector}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-medium text-white active:bg-emerald-700"
        >
          <Plus className="h-5 w-5" />
          {t('fitness.plan.addExercise')}
        </button>
      </div>

      {/* Unsaved changes confirm dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <p className="mb-6 text-sm text-slate-700 dark:text-slate-300">
              {t('fitness.plan.unsavedChanges')}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelDiscard}
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 text-sm font-medium text-slate-700 active:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:active:bg-slate-700"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="flex h-11 flex-1 items-center justify-center rounded-xl bg-red-500 text-sm font-medium text-white active:bg-red-600"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise selector bottom sheet */}
      <ExerciseSelector
        isOpen={showSelector}
        onClose={handleCloseSelector}
        onSelect={handleAddExercise}
      />
    </div>
  );
});
