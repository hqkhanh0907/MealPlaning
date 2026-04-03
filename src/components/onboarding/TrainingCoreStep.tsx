import { ChevronRight } from 'lucide-react';
import { useController, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { OnboardingFormData } from './onboardingSchema';
import { STEP_FIELDS } from './onboardingSchema';

interface TrainingCoreStepProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
}

const TRAINING_GOALS = ['strength', 'hypertrophy', 'endurance', 'general'] as const;
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export function TrainingCoreStep({ form, goNext, goBack }: Readonly<TrainingCoreStepProps>) {
  const { t } = useTranslation();
  const goalField = useController({ control: form.control, name: 'trainingGoal' });
  const expField = useController({ control: form.control, name: 'trainingExperience' });
  const daysField = useController({ control: form.control, name: 'daysPerWeek' });

  const handleNext = async () => {
    const valid = await form.trigger([...STEP_FIELDS['3']]);
    if (valid) goNext();
  };

  return (
    <div className="flex flex-1 flex-col" data-testid="training-core-step">
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        <h2 className="text-foreground mb-1 text-xl font-bold">{t('fitness.onboarding.step1Title')}</h2>
        <p className="text-muted-foreground mb-6 text-sm">{t('fitness.onboarding.step1Desc')}</p>

        {/* Training Goal */}
        <div className="mb-6">
          <label className="text-foreground mb-2 block text-sm font-medium">{t('fitness.onboarding.goal')}</label>
          <fieldset className="m-0 grid grid-cols-2 gap-2 border-0 p-0" aria-label={t('fitness.onboarding.goal')}>
            {TRAINING_GOALS.map(goal => (
              <button
                key={goal}
                type="button"
                aria-pressed={goalField.field.value === goal}
                onClick={() => goalField.field.onChange(goal)}
                className={cn(
                  'focus-visible:ring-ring min-h-[44px] rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                  goalField.field.value === goal
                    ? 'border-primary bg-primary-subtle text-primary-emphasis'
                    : 'border-border text-foreground-secondary',
                )}
              >
                {t(`fitness.onboarding.${goal}`)}
              </button>
            ))}
          </fieldset>
        </div>

        {/* Experience Level */}
        <div className="mb-6">
          <label className="text-foreground mb-2 block text-sm font-medium">{t('fitness.onboarding.experience')}</label>
          <fieldset className="m-0 flex gap-2 border-0 p-0" aria-label={t('fitness.onboarding.experience')}>
            {EXPERIENCE_LEVELS.map(level => (
              <button
                key={level}
                type="button"
                aria-pressed={expField.field.value === level}
                onClick={() => expField.field.onChange(level)}
                className={cn(
                  'focus-visible:ring-ring min-h-[44px] flex-1 rounded-xl border-2 px-3 py-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                  expField.field.value === level
                    ? 'border-primary bg-primary-subtle text-primary-emphasis'
                    : 'border-border text-foreground-secondary',
                )}
              >
                {t(`fitness.onboarding.${level}`)}
              </button>
            ))}
          </fieldset>
        </div>

        {/* Days Per Week */}
        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">
            {t('fitness.onboarding.daysPerWeek')}
          </label>
          <fieldset className="m-0 flex gap-2 border-0 p-0" aria-label={t('fitness.onboarding.daysPerWeek')}>
            {[2, 3, 4, 5, 6].map(d => (
              <button
                key={d}
                type="button"
                aria-pressed={daysField.field.value === d}
                onClick={() => daysField.field.onChange(d)}
                className={cn(
                  'focus-visible:ring-ring flex h-12 w-12 items-center justify-center rounded-xl border-2 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none',
                  daysField.field.value === d
                    ? 'border-primary bg-primary-subtle text-primary-emphasis'
                    : 'border-border text-foreground-secondary',
                )}
              >
                {d}
              </button>
            ))}
          </fieldset>
          <p className="text-muted-foreground mt-1 text-xs">{t('fitness.onboarding.daysPerWeekUnit')}</p>
        </div>
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
          className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring min-h-[44px] rounded-xl px-6 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {t('onboarding.nav.next')}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
