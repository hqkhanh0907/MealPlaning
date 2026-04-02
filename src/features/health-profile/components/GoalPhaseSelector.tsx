import { zodResolver } from '@hookform/resolvers/zod';
import { Equal, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Input } from '@/components/ui/input';
import { validateTargetWeight } from '@/schemas/goalValidation';
import { generateUUID } from '@/utils/helpers';

import { useDatabase } from '../../../contexts/DatabaseContext';
import { getCalorieOffset } from '../../../services/nutritionEngine';
import { useHealthProfileStore } from '../store/healthProfileStore';
import type { Goal, GoalType, RateOfChange } from '../types';

/* ------------------------------------------------------------------ */
/* Schema */
/* ------------------------------------------------------------------ */
const goalPhaseSelectorSchema = z.object({
  goalType: z.enum(['cut', 'maintain', 'bulk']),
  rateOfChange: z.enum(['conservative', 'moderate', 'aggressive']),
  targetWeight: z.string(),
  manualOverride: z.boolean(),
  customOffset: z.string(),
});

type GoalPhaseSelectorFormData = z.infer<typeof goalPhaseSelectorSchema>;

/* ------------------------------------------------------------------ */
/* Constants */
/* ------------------------------------------------------------------ */
const GOAL_OPTIONS: {
  type: GoalType;
  labelKey: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}[] = [
  {
    type: 'cut',
    labelKey: 'goal.cut',
    icon: TrendingDown,
    color: 'text-amber-500 dark:text-amber-400',
    activeBg: 'bg-amber-50 dark:bg-amber-900/20',
    activeBorder: 'border-amber-500',
    activeText: 'text-amber-700 dark:text-amber-300',
  },
  {
    type: 'maintain',
    labelKey: 'goal.maintain',
    icon: Equal,
    color: 'text-primary',
    activeBg: 'bg-primary-subtle',
    activeBorder: 'border-primary',
    activeText: 'text-primary-emphasis',
  },
  {
    type: 'bulk',
    labelKey: 'goal.bulk',
    icon: TrendingUp,
    color: 'text-blue-500 dark:text-blue-400',
    activeBg: 'bg-blue-50 dark:bg-blue-900/20',
    activeBorder: 'border-blue-500',
    activeText: 'text-blue-700 dark:text-blue-300',
  },
];

const RATE_OPTIONS: { rate: RateOfChange; labelKey: string }[] = [
  { rate: 'conservative', labelKey: 'goal.conservative' },
  { rate: 'moderate', labelKey: 'goal.moderate' },
  { rate: 'aggressive', labelKey: 'goal.aggressive' },
];

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */
function formatOffset(offset: number): string {
  if (offset > 0) return `+${offset} kcal`;
  if (offset < 0) return `${offset} kcal`;
  return '±0 kcal';
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */
interface GoalPhaseSelectorProps {
  embedded?: boolean;
  saveRef?: React.RefObject<(() => Promise<boolean>) | null>;
}

export const GoalPhaseSelector = ({ embedded, saveRef }: GoalPhaseSelectorProps = {}) => {
  const { t } = useTranslation();
  const db = useDatabase();
  const saveGoal = useHealthProfileStore(s => s.saveGoal);
  const currentWeight = useHealthProfileStore(s => s.profile?.weightKg ?? 70);

  const form = useForm<GoalPhaseSelectorFormData>({
    resolver: zodResolver(goalPhaseSelectorSchema),
    defaultValues: {
      goalType: 'maintain',
      rateOfChange: 'moderate',
      targetWeight: '',
      manualOverride: false,
      customOffset: '',
    },
    mode: 'onChange',
  });

  const goalTypeField = useController({ control: form.control, name: 'goalType' });
  const rateField = useController({ control: form.control, name: 'rateOfChange' });
  const targetWeightField = useController({ control: form.control, name: 'targetWeight' });
  const manualOverrideField = useController({ control: form.control, name: 'manualOverride' });
  const customOffsetField = useController({ control: form.control, name: 'customOffset' });

  const goalType = goalTypeField.field.value as GoalType;
  const rateOfChange = rateField.field.value as RateOfChange;

  const autoOffset = useMemo(() => getCalorieOffset(goalType, rateOfChange), [goalType, rateOfChange]);

  const effectiveOffset = manualOverrideField.field.value
    ? Math.round(Number(customOffsetField.field.value)) || 0
    : autoOffset;

  const handleGoalTypeChange = useCallback(
    (type: GoalType) => {
      goalTypeField.field.onChange(type);
      if (type === 'maintain') {
        targetWeightField.field.onChange('');
        form.clearErrors('targetWeight');
      }
    },
    [goalTypeField.field, targetWeightField.field, form],
  );

  const handleRateChange = useCallback(
    (rate: RateOfChange) => {
      rateField.field.onChange(rate);
    },
    [rateField.field],
  );

  const handleTargetWeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const isValidDecimal = val === '' || (!Number.isNaN(Number(val)) && !val.includes(' ') && !val.includes('-'));
      if (isValidDecimal) {
        targetWeightField.field.onChange(val);
        form.clearErrors('targetWeight');
      }
    },
    [targetWeightField.field, form],
  );

  const handleCustomOffsetChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '' || val === '-' || /^-?\d*$/.test(val)) {
        customOffsetField.field.onChange(val);
      }
    },
    [customOffsetField.field],
  );

  const handleToggleOverride = useCallback(() => {
    const next = !manualOverrideField.field.value;
    manualOverrideField.field.onChange(next);
    if (next) {
      customOffsetField.field.onChange(String(autoOffset));
    }
  }, [manualOverrideField.field, customOffsetField.field, autoOffset]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    const values = form.getValues();
    const parsedTarget = values.targetWeight ? Number(values.targetWeight) : undefined;

    // Validate target weight vs current weight for cut/bulk
    if (values.goalType !== 'maintain' && parsedTarget != null && currentWeight != null) {
      const error = validateTargetWeight(values.goalType as GoalType, currentWeight, parsedTarget);
      if (error) {
        form.setError('targetWeight', { message: error });
        return false;
      }
    }

    // Validate target weight range
    if (parsedTarget != null && (parsedTarget < 30 || parsedTarget > 300)) {
      form.setError('targetWeight', { message: 'onboarding.validation.targetWeightRange' });
      return false;
    }

    try {
      const now = new Date().toISOString();
      const goal: Goal = {
        id: generateUUID(),
        type: values.goalType as GoalType,
        rateOfChange: values.rateOfChange as RateOfChange,
        targetWeightKg: parsedTarget,
        calorieOffset: effectiveOffset,
        startDate: now,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      await saveGoal(db, goal);
      return true;
    } catch {
      return false;
    }
  }, [db, form, currentWeight, effectiveOffset, saveGoal]);

  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  });

  const showRateSelector = goalType !== 'maintain';
  const showTargetWeight = goalType !== 'maintain';
  const targetWeightError = form.formState.errors.targetWeight;

  return (
    <div className="space-y-6" data-testid="goal-phase-selector">
      {!embedded && <h3 className="text-foreground text-lg font-bold">{t('goal.title')}</h3>}

      {/* Phase Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {GOAL_OPTIONS.map(({ type, labelKey, icon: Icon, color, activeBg, activeBorder, activeText }) => {
          const isActive = goalType === type;
          return (
            <button
              key={type}
              type="button"
              data-testid={`goal-type-${type}`}
              onClick={() => handleGoalTypeChange(type)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                isActive
                  ? `${activeBorder} ${activeBg} ${activeText}`
                  : 'border-border text-foreground hover:border-border dark:hover:border-border'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? color : ''}`} />
              <span className="text-sm font-bold">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Rate of Change Selector */}
      {showRateSelector && (
        <div data-testid="rate-selector">
          <label className="text-foreground mb-2 block text-sm font-medium">{t('goal.rateOfChange')}</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {RATE_OPTIONS.map(({ rate, labelKey }) => (
              <button
                key={rate}
                type="button"
                data-testid={`rate-${rate}`}
                onClick={() => handleRateChange(rate)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  rateOfChange === rate
                    ? 'border-primary bg-primary-subtle text-primary-emphasis'
                    : 'border-border text-foreground-secondary hover:border-border'
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Target Weight — hidden for maintain */}
      {showTargetWeight && (
        <div>
          <label htmlFor="target-weight" className="text-foreground mb-1 block text-sm font-medium">
            {t('goal.targetWeight')}
          </label>
          <Input
            id="target-weight"
            type="text"
            inputMode="decimal"
            data-testid="target-weight-input"
            value={targetWeightField.field.value}
            onChange={handleTargetWeightChange}
            onBlur={targetWeightField.field.onBlur}
            placeholder={t('goal.targetWeightOptional')}
            aria-invalid={!!targetWeightError}
            aria-describedby={targetWeightError ? 'target-weight-error' : undefined}
            className="text-foreground w-full"
          />
          {targetWeightError && (
            <p id="target-weight-error" role="alert" className="text-destructive mt-1 text-xs">
              {t(targetWeightError.message ?? 'onboarding.validation.required')}
            </p>
          )}
        </div>
      )}

      {/* Calorie Offset Display */}
      <div className="bg-muted space-y-3 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-foreground text-sm font-medium">{t('goal.calorieOffset')}</span>
          <span data-testid="calorie-offset-display" className="text-foreground text-lg font-bold">
            {formatOffset(effectiveOffset)}
          </span>
        </div>

        {/* Manual Override Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">
            {manualOverrideField.field.value ? t('goal.calorieOffsetCustom') : t('goal.calorieOffsetAuto')}
          </span>
          <button
            type="button"
            data-testid="manual-override-toggle"
            onClick={handleToggleOverride}
            role="switch"
            aria-checked={manualOverrideField.field.value}
            className={`relative h-5 w-10 rounded-full transition-colors ${
              manualOverrideField.field.value ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`bg-card absolute top-0.5 left-0.5 h-4 w-4 rounded-full shadow transition-transform ${
                manualOverrideField.field.value ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Custom Offset Input */}
        {manualOverrideField.field.value && (
          <Input
            type="text"
            inputMode="numeric"
            data-testid="custom-offset-input"
            value={customOffsetField.field.value}
            onChange={handleCustomOffsetChange}
            className="text-foreground w-full"
          />
        )}
      </div>

      {!embedded && (
        <button
          type="button"
          data-testid="save-goal-button"
          onClick={() => void handleSave()}
          className="bg-primary text-primary-foreground hover:bg-primary/80 active:bg-primary/70 w-full rounded-xl py-3 font-bold transition-all"
        >
          {t('goal.save')}
        </button>
      )}
    </div>
  );
};
