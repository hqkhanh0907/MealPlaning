import { Check, Minus, Plus, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';
import { MIN_REPS, MIN_WEIGHT_KG, REPS_INCREMENT, RPE_OPTIONS, WEIGHT_INCREMENT } from '../constants';

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
  const [weightStr, setWeightStr] = useState(String(initialWeight));
  const [repsStr, setRepsStr] = useState(String(initialReps));

  const handleWeightDecrement = useCallback(() => {
    setWeight(prev => {
      const next = Math.max(MIN_WEIGHT_KG, prev - WEIGHT_INCREMENT);
      setWeightStr(String(next));
      return next;
    });
  }, []);

  const handleWeightIncrement = useCallback(() => {
    setWeight(prev => {
      const next = prev + WEIGHT_INCREMENT;
      setWeightStr(String(next));
      return next;
    });
  }, []);

  const handleWeightInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setWeightStr(raw);
    if (raw !== '') {
      const value = Number(raw);
      if (!Number.isNaN(value)) {
        setWeight(value);
      }
    }
  }, []);

  const handleWeightBlur = useCallback(() => {
    if (weightStr !== '' && !Number.isNaN(Number(weightStr))) {
      setWeightStr(String(weight));
    }
  }, [weightStr, weight]);

  const handleWeightChip = useCallback((value: number) => {
    setWeight(value);
    setWeightStr(String(value));
  }, []);

  const handleRepsDecrement = useCallback(() => {
    setReps(prev => {
      const next = Math.max(MIN_REPS, prev - REPS_INCREMENT);
      setRepsStr(String(next));
      return next;
    });
  }, []);

  const handleRepsIncrement = useCallback(() => {
    setReps(prev => {
      const next = prev + REPS_INCREMENT;
      setRepsStr(String(next));
      return next;
    });
  }, []);

  const handleRepsInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRepsStr(raw);
    if (raw !== '') {
      const value = Number(raw);
      if (!Number.isNaN(value)) {
        setReps(value);
      }
    }
  }, []);

  const handleRepsBlur = useCallback(() => {
    if (repsStr !== '' && !Number.isNaN(Number(repsStr))) {
      setRepsStr(String(reps));
    }
  }, [repsStr, reps]);

  const handleRpeSelect = useCallback((value: number) => {
    setRpe(prev => (prev === value ? undefined : value));
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
      <dialog
        open
        className="bg-card relative w-full max-w-md rounded-t-2xl p-6 shadow-xl sm:rounded-2xl"
        aria-modal="true"
        aria-label={t('fitness.editor.title')}
        data-testid="set-editor"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-foreground text-lg font-semibold">{t('fitness.editor.title')}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8 rounded-full"
            aria-label={t('common.close')}
            data-testid="editor-close-button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Weight section */}
        <div className="mb-4">
          <label className="text-muted-foreground mb-2 block text-xs font-medium">
            {t('fitness.editor.weight')} ({t('fitness.editor.kg')})
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleWeightDecrement}
              className="h-11 w-11 shrink-0"
              aria-label={`${t('common.decrease')} ${t('fitness.editor.weight')}`}
              data-testid="weight-minus-button"
            >
              <Minus className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Input
              type="number"
              value={weightStr}
              onChange={handleWeightInput}
              onBlur={handleWeightBlur}
              min={MIN_WEIGHT_KG}
              step={WEIGHT_INCREMENT}
              className="text-foreground w-full text-center font-semibold tabular-nums"
              data-testid="weight-input"
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={handleWeightIncrement}
              className="h-11 w-11 shrink-0"
              aria-label={`${t('common.increase')} ${t('fitness.editor.weight')}`}
              data-testid="weight-plus-button"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Recent weight chips */}
        {recentWeights.length > 0 && (
          <div className="mb-4" data-testid="recent-weights-section">
            <span className="text-muted-foreground mb-2 block text-xs font-medium">
              {t('fitness.editor.recentWeights')}
            </span>
            <div className="flex flex-wrap gap-2">
              {recentWeights.map(w => (
                <Button
                  key={w}
                  variant={weight === w ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleWeightChip(w)}
                  className="rounded-full tabular-nums"
                  data-testid={`weight-chip-${w}`}
                >
                  {w}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Reps section */}
        <div className="mb-4">
          <label className="text-muted-foreground mb-2 block text-xs font-medium">{t('fitness.editor.reps')}</label>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleRepsDecrement}
              className="h-11 w-11 shrink-0"
              aria-label={`${t('common.decrease')} ${t('fitness.editor.reps')}`}
              data-testid="reps-minus-button"
            >
              <Minus className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Input
              type="number"
              value={repsStr}
              onChange={handleRepsInput}
              onBlur={handleRepsBlur}
              min={MIN_REPS}
              step={REPS_INCREMENT}
              className="text-foreground w-full text-center font-semibold tabular-nums"
              data-testid="reps-input"
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={handleRepsIncrement}
              className="h-11 w-11 shrink-0"
              aria-label={`${t('common.increase')} ${t('fitness.editor.reps')}`}
              data-testid="reps-plus-button"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* RPE selector */}
        <div className="mb-6">
          <label className="text-muted-foreground mb-2 block text-xs font-medium">{t('fitness.editor.rpe')}</label>
          <fieldset
            className="m-0 flex gap-2 border-0 p-0"
            aria-label={t('fitness.editor.rpe')}
            data-testid="rpe-selector"
          >
            {RPE_OPTIONS.map(value => (
              <Button
                key={value}
                variant={rpe === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRpeSelect(value)}
                className="h-11 w-11 rounded-full tabular-nums"
                aria-pressed={rpe === value}
                data-testid={`rpe-button-${value}`}
              >
                {value}
              </Button>
            ))}
          </fieldset>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={onCancel} className="flex-1" data-testid="cancel-button">
            <X className="h-4 w-4" aria-hidden="true" />
            {t('fitness.editor.cancel')}
          </Button>
          <Button variant="default" size="lg" onClick={handleSave} className="flex-1" data-testid="save-button">
            <Check className="h-4 w-4" aria-hidden="true" />
            {t('fitness.editor.save')}
          </Button>
        </div>
      </dialog>
    </ModalBackdrop>
  );
});
