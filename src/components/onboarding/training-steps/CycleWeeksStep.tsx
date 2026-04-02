import { Fragment } from 'react';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const CYCLE_OPTIONS = [4, 6, 8, 12] as const;

export function CycleWeeksStep({ form, goNext, goBack }: Readonly<StepProps>) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'cycleWeeks' });

  return (
    <StepLayout
      title={t('fitness.onboarding.cycleWeeks')}
      subtitle={t('fitness.onboarding.cycleWeeksDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <fieldset className="m-0 space-y-3 border-0 p-0" aria-label={t('fitness.onboarding.cycleWeeks')}>
        {CYCLE_OPTIONS.map(weeks => (
          <Fragment key={weeks}>
            <input
              type="radio"
              className="sr-only flex min-h-[56px] w-full flex-col items-start"
              name="cycleWeeks"
              checked={field.field.value === weeks}
              onChange={() => field.field.onChange(weeks)}
              value={weeks}
            />
            <button
              type="button"
              aria-pressed={field.field.value === weeks}
              onClick={() => field.field.onChange(weeks)}
              className={cn(
                'focus-visible:ring-ring flex min-h-[56px] w-full flex-col items-start rounded-xl border-2 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                field.field.value === weeks
                  ? 'border-primary bg-emerald-50 dark:bg-emerald-900/30'
                  : 'border-slate-200 dark:border-slate-700',
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  field.field.value === weeks ? 'text-emerald-700' : 'text-slate-700 dark:text-slate-300',
                )}
              >
                {weeks} {t('fitness.onboarding.weeksUnit')}
              </span>
              <span className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {t(`fitness.onboarding.cycleWeeks${weeks}Desc`)}
              </span>
            </button>
          </Fragment>
        ))}
      </fieldset>
    </StepLayout>
  );
}
