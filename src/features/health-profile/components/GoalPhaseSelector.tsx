import { zodResolver } from '@hookform/resolvers/zod';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import {
  createGoalValidationSchema,
  type GoalFormData,
  goalFormDefaults,
  validateTargetWeight,
} from '@/schemas/goalValidation';
import { generateUUID } from '@/utils/helpers';

import { useDatabase } from '../../../contexts/DatabaseContext';
import { getCalorieOffset } from '../../../services/nutritionEngine';
import { useHealthProfileStore } from '../store/healthProfileStore';
import type { Goal, GoalType, RateOfChange } from '../types';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const GOAL_OPTIONS = [
  { type: 'cut' as const, icon: TrendingDown, color: 'text-blue-500' },
  { type: 'maintain' as const, icon: Minus, color: 'text-primary' },
  { type: 'bulk' as const, icon: TrendingUp, color: 'text-orange-500' },
] as const;

const RATE_OPTIONS = [
  { rate: 'conservative' as const, labelKey: 'goal.rate_conservative' },
  { rate: 'moderate' as const, labelKey: 'goal.rate_moderate' },
  { rate: 'aggressive' as const, labelKey: 'goal.rate_aggressive' },
] as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function formatOffset(offset: number): string {
  if (offset > 0) return `+${offset} kcal`;
  if (offset < 0) return `${offset} kcal`;
  return '±0 kcal';
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
interface GoalPhaseSelectorProps {
  embedded?: boolean;
  saveRef?: React.RefObject<(() => Promise<boolean>) | null>;
  onValidityChange?: (isValid: boolean) => void;
}

export const GoalPhaseSelector = ({ embedded, saveRef, onValidityChange }: GoalPhaseSelectorProps = {}) => {
  const { t } = useTranslation();
  const db = useDatabase();
  const saveGoal = useHealthProfileStore(s => s.saveGoal);
  const currentWeight = useHealthProfileStore(s => s.profile?.weightKg ?? 70);
  const activeGoal = useHealthProfileStore(s => s.activeGoal);

  const isDirtyRef = useRef(false);

  const schema = useMemo(() => createGoalValidationSchema(currentWeight), [currentWeight]);

  const form = useForm<GoalFormData>({
    resolver: zodResolver(schema),
    defaultValues: goalFormDefaults(activeGoal),
    mode: 'onChange',
  });

  // Sync form when activeGoal changes — but only if form hasn't been manually edited
  useEffect(() => {
    if (activeGoal && !isDirtyRef.current) {
      form.reset(goalFormDefaults(activeGoal));
    }
  }, [activeGoal, form]);

  // Notify parent of validity changes
  const isValid = form.formState.isValid;
  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  const goalTypeField = useController({ control: form.control, name: 'goalType' });
  const rateField = useController({ control: form.control, name: 'rateOfChange' });
  const targetWeightField = useController({ control: form.control, name: 'targetWeightKg' });
  const manualOverrideField = useController({ control: form.control, name: 'manualOverride' });
  const customOffsetField = useController({ control: form.control, name: 'customOffset' });

  const goalType = goalTypeField.field.value as GoalType;
  const rateOfChange = (rateField.field.value ?? 'moderate') as RateOfChange;

  const autoOffset = useMemo(() => getCalorieOffset(goalType, rateOfChange), [goalType, rateOfChange]);

  const effectiveOffset = manualOverrideField.field.value
    ? Math.round(Number(customOffsetField.field.value) || 0)
    : autoOffset;

  // Live cross-field validation: checks targetWeight vs currentWeight based on goalType
  const checkDirectionError = useCallback(
    (type: GoalType, weight: number | undefined) => {
      if (type === 'maintain' || weight == null) {
        form.clearErrors('targetWeightKg');
        return;
      }
      const error = validateTargetWeight(type, currentWeight, weight);
      if (error) {
        form.setError('targetWeightKg', { message: error });
      } else {
        form.clearErrors('targetWeightKg');
      }
    },
    [form, currentWeight],
  );

  const handleGoalTypeChange = useCallback(
    (type: GoalType) => {
      goalTypeField.field.onChange(type);
      isDirtyRef.current = true;
      if (type === 'maintain') {
        targetWeightField.field.onChange(undefined);
        form.clearErrors('targetWeightKg');
      } else {
        checkDirectionError(type, targetWeightField.field.value);
      }
    },
    [goalTypeField.field, targetWeightField.field, form, checkDirectionError],
  );

  const handleRateChange = useCallback(
    (rate: RateOfChange) => {
      rateField.field.onChange(rate);
      isDirtyRef.current = true;
    },
    [rateField.field],
  );

  const handleTargetWeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      let newWeight: number | undefined;
      if (val === '') {
        targetWeightField.field.onChange(undefined);
      } else {
        const num = Number(val);
        if (!Number.isNaN(num)) {
          targetWeightField.field.onChange(num);
          newWeight = num;
        }
      }
      checkDirectionError(goalType, newWeight);
      isDirtyRef.current = true;
    },
    [targetWeightField.field, checkDirectionError, goalType],
  );

  const handleCustomOffsetChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '' || val === '-') {
        customOffsetField.field.onChange(undefined);
      } else {
        customOffsetField.field.onChange(val);
      }
      isDirtyRef.current = true;
    },
    [customOffsetField.field],
  );

  const handleToggleOverride = useCallback(() => {
    const next = !manualOverrideField.field.value;
    manualOverrideField.field.onChange(next);
    if (next) {
      customOffsetField.field.onChange(String(autoOffset));
    }
    isDirtyRef.current = true;
  }, [manualOverrideField.field, customOffsetField.field, autoOffset]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    // Trigger full form validation (schema superRefine handles cross-field checks)
    const valid = await form.trigger();
    if (!valid) return false;

    const values = form.getValues();

    try {
      const now = new Date().toISOString();
      const goal: Goal = {
        id: activeGoal?.id ?? generateUUID(),
        type: values.goalType as GoalType,
        rateOfChange: (values.rateOfChange ?? 'moderate') as RateOfChange,
        targetWeightKg: values.targetWeightKg,
        calorieOffset: effectiveOffset,
        startDate: activeGoal?.startDate ?? now,
        isActive: true,
        createdAt: activeGoal?.createdAt ?? now,
        updatedAt: now,
      };
      await saveGoal(db, goal);
      isDirtyRef.current = false;
      return true;
    } catch {
      return false;
    }
  }, [db, form, effectiveOffset, saveGoal, activeGoal]);

  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  });

  const showRateSelector = goalType !== 'maintain';
  const showTargetWeight = goalType !== 'maintain';
  const targetWeightError = form.formState.errors.targetWeightKg;

  return (
    <div className="space-y-6" data-testid="goal-phase-selector">
      {!embedded && <h3 className="text-foreground text-lg font-bold">{t('goal.title')}</h3>}

      {/* Goal Type Buttons — unified with onboarding NutritionGoalStep */}
      <fieldset className="m-0 space-y-3 border-0 p-0" aria-label={t('goal.title')}>
        {GOAL_OPTIONS.map(({ type, icon: Icon, color }) => {
          const isActive = goalType === type;
          return (
            <button
              key={type}
              type="button"
              data-testid={`goal-type-${type}`}
              aria-pressed={isActive}
              onClick={() => handleGoalTypeChange(type)}
              className={cn(
                'focus-visible:ring-ring flex min-h-[56px] w-full items-center gap-4 rounded-xl border-2 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                isActive ? 'border-primary bg-primary-subtle' : 'border-border',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', color)} aria-hidden="true" />
              <div>
                <p className={cn('text-sm font-medium', isActive ? 'text-primary-emphasis' : 'text-foreground')}>
                  {t(`goal.type_${type}`)}
                </p>
                <p className="text-muted-foreground text-xs">{t(`goal.type_${type}_desc`)}</p>
              </div>
            </button>
          );
        })}
      </fieldset>

      {/* Rate of Change Selector */}
      {showRateSelector && (
        <div data-testid="rate-selector">
          <label className="text-foreground mb-2 block text-sm font-medium">{t('goal.rate')}</label>
          <fieldset className="m-0 flex gap-2 border-0 p-0" aria-label={t('goal.rate')}>
            {RATE_OPTIONS.map(({ rate, labelKey }) => (
              <button
                key={rate}
                type="button"
                data-testid={`rate-${rate}`}
                aria-pressed={rateOfChange === rate}
                onClick={() => handleRateChange(rate)}
                className={cn(
                  'focus-visible:ring-ring min-h-[44px] flex-1 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                  rateOfChange === rate
                    ? 'border-primary bg-primary-subtle text-primary-emphasis'
                    : 'border-border text-foreground-secondary',
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </fieldset>
        </div>
      )}

      {/* Target Weight — hidden for maintain */}
      {showTargetWeight && (
        <div>
          <label htmlFor="target-weight" className="text-foreground mb-1 block text-sm font-medium">
            {t('goal.targetWeight')}
          </label>
          <div className="relative">
            <input
              id="target-weight"
              type="number"
              inputMode="decimal"
              data-testid="target-weight-input"
              value={targetWeightField.field.value ?? ''}
              onChange={handleTargetWeightChange}
              onBlur={targetWeightField.field.onBlur}
              aria-invalid={!!targetWeightError}
              aria-describedby={targetWeightError ? 'target-weight-error' : undefined}
              className="bg-card focus-visible:ring-ring border-border text-foreground w-full rounded-xl border px-4 py-3 pr-12 text-base focus-visible:ring-2 focus-visible:outline-none"
            />
            <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-sm">kg</span>
          </div>
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
            className={cn(
              'relative h-5 w-10 rounded-full transition-colors',
              manualOverrideField.field.value ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600',
            )}
          >
            <span
              className={cn(
                'bg-card absolute top-0.5 left-0.5 h-4 w-4 rounded-full shadow transition-transform',
                manualOverrideField.field.value ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        {/* Custom Offset Input */}
        {manualOverrideField.field.value && (
          <input
            type="number"
            inputMode="numeric"
            data-testid="custom-offset-input"
            value={customOffsetField.field.value ?? ''}
            onChange={handleCustomOffsetChange}
            className="bg-card focus-visible:ring-ring border-border text-foreground w-full rounded-xl border px-4 py-3 text-base focus-visible:ring-2 focus-visible:outline-none"
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
