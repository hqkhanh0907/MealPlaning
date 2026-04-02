import { Fragment } from 'react';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const PERIODIZATION_OPTIONS = ['linear', 'undulating', 'block'] as const;

export function PeriodizationStep({ form, goNext, goBack }: Readonly<StepProps>) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'periodization' });

  return (
    <StepLayout
      title={t('fitness.onboarding.periodization')}
      subtitle={t('fitness.onboarding.periodizationDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <fieldset className="m-0 space-y-3 border-0 p-0" aria-label={t('fitness.onboarding.periodization')}>
        {PERIODIZATION_OPTIONS.map(opt => (
          <Fragment key={opt}>
            <input
              type="radio"
              className="sr-only flex min-h-[56px] w-full flex-col items-start"
              name="periodization"
              checked={field.field.value === opt}
              onChange={() => field.field.onChange(opt)}
              value={opt}
            />
            <button
              type="button"
              aria-pressed={field.field.value === opt}
              onClick={() => field.field.onChange(opt)}
              className={cn(
                'focus-visible:ring-ring flex min-h-[56px] w-full flex-col items-start rounded-xl border-2 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                field.field.value === opt ? 'border-primary bg-primary-subtle' : 'border-border',
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  field.field.value === opt ? 'text-primary-emphasis' : 'text-slate-700 dark:text-slate-300',
                )}
              >
                {t(`fitness.onboarding.period_${opt}`)}
              </span>
              <span className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {t(`fitness.onboarding.period_${opt}_desc`)}
              </span>
            </button>
          </Fragment>
        ))}
      </fieldset>
    </StepLayout>
  );
}
