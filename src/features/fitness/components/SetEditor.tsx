import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, X, Check } from 'lucide-react';
import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';
import { RPE_OPTIONS, WEIGHT_INCREMENT, REPS_INCREMENT, MIN_WEIGHT_KG, MIN_REPS } from '../constants';

interface SetEditorProps {
  initialWeight: number;
  initialReps: number;
  initialRpe?: number;
  recentWeights: number[];
  onSave: (data: { weight: number; reps: number; rpe?: number }) => void;
  onCancel: () => void;
  isVisible: boolean;
}



export const SetEditor = React.memo(function SetEditor({
  initialWeight,
  initialReps,
  initialRpe,
  recentWeights,
  onSave,
  onCancel,
  isVisible,
}: SetEditorProps) {
  const { t } = useTranslation();
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [rpe, setRpe] = useState<number | undefined>(initialRpe);

  const handleWeightDecrement = useCallback(() => {
    setWeight((prev) => Math.max(MIN_WEIGHT_KG, prev - WEIGHT_INCREMENT));
  }, []);

  const handleWeightIncrement = useCallback(() => {
    setWeight((prev) => prev + WEIGHT_INCREMENT);
  }, []);

  const handleWeightInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setWeight(Math.max(MIN_WEIGHT_KG, value));
    },
    [],
  );

  const handleWeightChip = useCallback((value: number) => {
    setWeight(value);
  }, []);

  const handleRepsDecrement = useCallback(() => {
    setReps((prev) => Math.max(MIN_REPS, prev - REPS_INCREMENT));
  }, []);

  const handleRepsIncrement = useCallback(() => {
    setReps((prev) => prev + REPS_INCREMENT);
  }, []);

  const handleRepsInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setReps(Math.max(MIN_REPS, value));
    },
    [],
  );

  const handleRpeSelect = useCallback((value: number) => {
    setRpe((prev) => (prev === value ? undefined : value));
  }, []);

  const handleSave = useCallback(() => {
    onSave({
      weight: Math.max(MIN_WEIGHT_KG, weight),
      reps: Math.max(MIN_REPS, reps),
      rpe,
    });
  }, [weight, reps, rpe, onSave]);

  if (!isVisible) return null;

  return (
    <ModalBackdrop onClose={onCancel} zIndex="z-50">
      <div
        className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl dark:bg-slate-800"
        role="dialog"
        aria-modal="true"
        aria-label={t('fitness.editor.title')}
        data-testid="set-editor"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t('fitness.editor.title')}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            data-testid="editor-close-button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Weight section */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('fitness.editor.weight')} ({t('fitness.editor.kg')})
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWeightDecrement}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              data-testid="weight-minus-button"
            >
              <Minus className="h-5 w-5" aria-hidden="true" />
            </button>
            <input
              type="number"
              value={weight}
              onChange={handleWeightInput}
              min={MIN_WEIGHT_KG}
              step={WEIGHT_INCREMENT}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-center text-base font-semibold tabular-nums text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              data-testid="weight-input"
            />
            <button
              type="button"
              onClick={handleWeightIncrement}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              data-testid="weight-plus-button"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Recent weight chips */}
        {recentWeights.length > 0 && (
          <div className="mb-4" data-testid="recent-weights-section">
            <span className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('fitness.editor.recentWeights')}
            </span>
            <div className="flex flex-wrap gap-2">
              {recentWeights.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleWeightChip(w)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium tabular-nums transition-colors ${
                    weight === w
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                  data-testid={`weight-chip-${w}`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reps section */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('fitness.editor.reps')}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRepsDecrement}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              data-testid="reps-minus-button"
            >
              <Minus className="h-5 w-5" aria-hidden="true" />
            </button>
            <input
              type="number"
              value={reps}
              onChange={handleRepsInput}
              min={MIN_REPS}
              step={REPS_INCREMENT}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-center text-base font-semibold tabular-nums text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              data-testid="reps-input"
            />
            <button
              type="button"
              onClick={handleRepsIncrement}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              data-testid="reps-plus-button"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* RPE selector */}
        <div className="mb-6">
          <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('fitness.editor.rpe')}
          </label>
          <div
            className="flex gap-2"
            role="group"
            aria-label={t('fitness.editor.rpe')}
            data-testid="rpe-selector"
          >
            {RPE_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRpeSelect(value)}
                className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors ${
                  rpe === value
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
                aria-pressed={rpe === value}
                data-testid={`rpe-button-${value}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            data-testid="cancel-button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            {t('fitness.editor.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            data-testid="save-button"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {t('fitness.editor.save')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
});
