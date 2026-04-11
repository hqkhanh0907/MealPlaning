import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CloseButton } from '@/components/shared/CloseButton';
import { ModalBackdrop } from '@/components/shared/ModalBackdrop';
import { Button } from '@/components/ui/button';

import { DEFAULT_REST_SECONDS, MIN_REPS, MIN_WEIGHT_KG, RPE_OPTIONS } from '../constants';
import { StepperInput } from './StepperInput';

const REST_STEP = 15;
const WEIGHT_WARNING_THRESHOLD = 300;

const RPE_COLOR_MAP: Record<number, { selected: string; unselected: string }> = {
  6: {
    selected: 'bg-green-500 text-white border-green-500',
    unselected: 'bg-green-500/10 text-green-600 border-green-500/30',
  },
  7: {
    selected: 'bg-lime-500 text-white border-lime-500',
    unselected: 'bg-lime-500/10 text-lime-600 border-lime-500/30',
  },
  8: {
    selected: 'bg-yellow-500 text-white border-yellow-500',
    unselected: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  },
  9: {
    selected: 'bg-orange-500 text-white border-orange-500',
    unselected: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  },
  10: {
    selected: 'bg-red-500 text-white border-red-500',
    unselected: 'bg-red-500/10 text-red-600 border-red-500/30',
  },
};

interface SetEditorProps {
  initialWeight: number;
  initialReps: number;
  initialRpe?: number;
  initialRestSeconds?: number;
  recentWeights: number[];
  onSave: (data: { weight: number; reps: number; rpe?: number; restSeconds: number }) => void;
  onCancel: () => void;
  isVisible: boolean;
}

export function SetEditor({
  initialWeight,
  initialReps,
  initialRpe,
  initialRestSeconds,
  recentWeights,
  onSave,
  onCancel,
  isVisible,
}: Readonly<SetEditorProps>) {
  const { t } = useTranslation();
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [restSeconds, setRestSeconds] = useState(initialRestSeconds ?? DEFAULT_REST_SECONDS);
  const [rpe, setRpe] = useState<number | undefined>(initialRpe);

  if (!isVisible) return null;

  const handleRpeSelect = (value: number) => {
    setRpe(prev => (prev === value ? undefined : value));
  };

  const handleSave = () => {
    onSave({
      weight: Math.max(MIN_WEIGHT_KG, weight),
      reps: Math.max(MIN_REPS, reps),
      rpe,
      restSeconds,
    });
  };

  return (
    <ModalBackdrop onClose={onCancel} zIndex="z-50">
      <div
        className="animate-slide-up bg-card relative w-full max-w-md rounded-t-2xl p-6 shadow-xl sm:rounded-2xl"
        aria-label={t('fitness.editor.title')}
        data-testid="set-editor"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-foreground text-xl font-semibold">{t('fitness.editor.title')}</h3>
          <CloseButton onClick={onCancel} data-testid="editor-close-button" ariaLabel={t('common.close')} />
        </div>

        {/* Weight */}
        <div className="mb-4">
          <label className="text-muted-foreground mb-2 block text-xs leading-relaxed font-medium">
            {t('fitness.editor.weight')}
          </label>
          <StepperInput
            value={weight}
            onChange={setWeight}
            step={0.5}
            min={MIN_WEIGHT_KG}
            warningThreshold={WEIGHT_WARNING_THRESHOLD}
            unit="kg"
            label={t('fitness.editor.weight')}
            testId="weight-stepper"
          />
        </div>

        {/* Recent weight chips */}
        {recentWeights.length > 0 && (
          <div className="mb-4" data-testid="recent-weights-section">
            <span className="text-muted-foreground mb-2 block text-xs leading-relaxed font-medium">
              {t('fitness.editor.recentWeights')}
            </span>
            <div className="flex flex-wrap gap-2">
              {recentWeights.map(w => (
                <Button
                  key={w}
                  variant={weight === w ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWeight(w)}
                  className="rounded-full tabular-nums"
                  data-testid={`weight-chip-${w}`}
                >
                  {w}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Reps */}
        <div className="mb-4">
          <label className="text-muted-foreground mb-2 block text-xs font-medium">{t('fitness.editor.reps')}</label>
          <StepperInput
            value={reps}
            onChange={setReps}
            step={1}
            min={MIN_REPS}
            unit="rep"
            label={t('fitness.editor.reps')}
            testId="reps-stepper"
          />
        </div>

        {/* RPE selector */}
        <div className="mb-4">
          <label className="text-muted-foreground mb-2 block text-xs font-medium">{t('fitness.editor.rpe')}</label>
          <fieldset
            className="m-0 flex gap-2 border-0 p-0"
            aria-label={t('fitness.editor.rpe')}
            data-testid="rpe-selector"
          >
            {RPE_OPTIONS.map(value => {
              const isSelected = rpe === value;
              const colors = RPE_COLOR_MAP[value];
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRpeSelect(value)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors ${isSelected ? colors.selected : colors.unselected}`}
                  aria-pressed={isSelected}
                  data-testid={`rpe-button-${value}`}
                >
                  {value}
                </button>
              );
            })}
          </fieldset>
        </div>

        {/* Rest seconds */}
        <div className="mb-6">
          <label className="text-muted-foreground mb-2 block text-xs font-medium">
            {t('fitness.editor.restSeconds')}
          </label>
          <StepperInput
            value={restSeconds}
            onChange={setRestSeconds}
            step={REST_STEP}
            min={0}
            unit="s"
            label={t('fitness.editor.restSeconds')}
            testId="rest-stepper"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onCancel}
            className="min-h-12 flex-1"
            data-testid="cancel-button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            {t('fitness.editor.cancel')}
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={handleSave}
            className="min-h-12 flex-1"
            data-testid="save-button"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {t('fitness.editor.save')}
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
