import { ChevronRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useController, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { validateTargetWeight } from '@/schemas/goalValidation';

import type { OnboardingFormData } from './onboardingSchema';
import { STEP_FIELDS } from './onboardingSchema';

interface NutritionGoalStepProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
}

const GOALS = [
  { value: 'cut', icon: TrendingDown, color: 'text-blue-500' },
  { value: 'maintain', icon: Minus, color: 'text-primary' },
  { value: 'bulk', icon: TrendingUp, color: 'text-orange-500' },
] as const;

const RATES = ['conservative', 'moderate', 'aggressive'] as const;

export function NutritionGoalStep({ form, goNext, goBack }: Readonly<NutritionGoalStepProps>) {
  const { t } = useTranslation();
  const goalField = useController({ control: form.control, name: 'goalType' });
  const rateField = useController({ control: form.control, name: 'rateOfChange' });
  const targetField = useController({ control: form.control, name: 'targetWeightKg' });

  const showConditional = goalField.field.value !== 'maintain';

  const handleNext = async () => {
    const valid = await form.trigger([...STEP_FIELDS['2c']], { shouldFocus: true });
    if (!valid) return;

    // Cross-field validation: trigger() doesn't run superRefine,
    // so we must manually check goal direction vs current weight.
    const v = form.getValues();
    if (v.goalType !== 'maintain' && v.targetWeightKg != null) {
      const error = validateTargetWeight(v.goalType, v.weightKg, v.targetWeightKg);
      if (error) {
        form.setError('targetWeightKg', { message: error }, { shouldFocus: true });
        return;
      }
    }

    goNext();
  };

  return (
    <div className="flex flex-1 flex-col" data-testid="nutrition-goal-step">
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        <h2 className="text-foreground mb-1 text-xl font-bold">{t('onboarding.goal.title')}</h2>
        <p className="text-muted-foreground mb-6 text-sm">{t('onboarding.goal.subtitle')}</p>

        {/* Goal Type */}
        <fieldset className="m-0 mb-6 space-y-3 border-0 p-0" aria-label={t('onboarding.goal.title')}>
          {GOALS.map(({ value, icon: Icon, color }) => (
            <button
              key={value}
              type="button"
              aria-pressed={goalField.field.value === value}
              onClick={() => goalField.field.onChange(value)}
              className={cn(
                'focus-visible:ring-ring flex min-h-[56px] w-full items-center gap-4 rounded-xl border-2 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                goalField.field.value === value ? 'border-primary bg-primary-subtle' : 'border-border',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', color)} aria-hidden="true" />
              <div>
                <p
                  className={cn(
                    'text-sm font-medium',
                    goalField.field.value === value ? 'text-primary-emphasis' : 'text-foreground',
                  )}
                >
                  {t(`onboarding.goal.type_${value}`)}
                </p>
                <p className="text-muted-foreground text-xs">{t(`onboarding.goal.type_${value}_desc`)}</p>
              </div>
            </button>
          ))}
        </fieldset>

        {/* Conditional: Rate & Target Weight */}
        {showConditional && (
          <div className="space-y-4">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">{t('onboarding.goal.rate')}</label>
              <fieldset className="m-0 flex gap-2 border-0 p-0" aria-label={t('onboarding.goal.rate')}>
                {RATES.map(rate => (
                  <button
                    key={rate}
                    type="button"
                    aria-pressed={rateField.field.value === rate}
                    onClick={() => rateField.field.onChange(rate)}
                    className={cn(
                      'focus-visible:ring-ring min-h-[44px] flex-1 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                      rateField.field.value === rate
                        ? 'border-primary bg-primary-subtle text-primary-emphasis'
                        : 'border-border text-foreground-secondary',
                    )}
                  >
                    {t(`onboarding.goal.rate_${rate}`)}
                  </button>
                ))}
              </fieldset>
            </div>

            <div>
              <label htmlFor="ob-target" className="text-foreground mb-1 block text-sm font-medium">
                {t('onboarding.goal.targetWeight')}
              </label>
              <div className="relative">
                <input
                  id="ob-target"
                  name="targetWeightKg"
                  type="number"
                  inputMode="decimal"
                  aria-invalid={!!targetField.fieldState.error}
                  aria-describedby={targetField.fieldState.error ? 'ob-target-error' : undefined}
                  className="bg-card focus-visible:ring-ring border-border text-foreground w-full rounded-xl border px-4 py-3 pr-12 text-base focus-visible:ring-2 focus-visible:outline-none"
                  value={targetField.field.value ?? ''}
                  onChange={e => targetField.field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  onBlur={targetField.field.onBlur}
                />
                <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-sm">kg</span>
              </div>
              {targetField.fieldState.error && (
                <p id="ob-target-error" role="alert" className="text-destructive mt-1 text-xs">
                  {t(targetField.fieldState.error.message ?? 'onboarding.validation.required')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-border bg-card/95 fixed inset-x-0 bottom-0 flex items-center justify-between border-t p-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={goBack}
          className="text-muted-foreground focus-visible:ring-ring min-h-[44px] px-4 py-2 text-sm font-medium focus-visible:rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('onboarding.nav.back')}
        </button>
        <Button
          onClick={handleNext}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring min-h-[44px] rounded-xl px-6 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {t('onboarding.nav.next')}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
