import { AlertTriangle } from 'lucide-react';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const SLEEP_OPTIONS = [4, 5, 6, 7, 8, 9, 10] as const;
const LOW_SLEEP_THRESHOLD = 7;

export function SleepHoursStep({ form, goNext, goBack }: Readonly<StepProps>) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'avgSleepHours' });
  const showWarning = field.field.value != null && field.field.value < LOW_SLEEP_THRESHOLD;

  return (
    <StepLayout
      title={t('fitness.onboarding.sleepHours')}
      subtitle={t('fitness.onboarding.sleepHoursDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0" aria-label={t('fitness.onboarding.sleepHours')}>
        {SLEEP_OPTIONS.map(hours => {
          const isActive = field.field.value === hours;

          let stateClass: string;
          if (isActive && hours < LOW_SLEEP_THRESHOLD) {
            stateClass = 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
          } else if (isActive) {
            stateClass = 'border-primary bg-primary-subtle text-primary-emphasis';
          } else {
            stateClass = 'border-border text-foreground-secondary';
          }

          return (
            <button
              key={hours}
              type="button"
              aria-pressed={isActive}
              onClick={() => field.field.onChange(hours)}
              className={cn(
                'focus-visible:ring-ring flex h-12 w-12 items-center justify-center rounded-xl border-2 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none',
                stateClass,
              )}
            >
              {hours}
            </button>
          );
        })}
      </fieldset>
      <p className="text-muted-foreground mt-2 text-xs">{t('fitness.onboarding.hoursUnit')}</p>
      {showWarning && (
        <output className="border-warning/20 bg-warning/10 mt-4 flex items-start gap-2 rounded-lg border p-3">
          <AlertTriangle className="text-warning mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-warning text-xs">{t('fitness.onboarding.sleepWarning')}</span>
        </output>
      )}
    </StepLayout>
  );
}
