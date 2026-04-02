import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const DURATIONS = [30, 45, 60, 75, 90] as const;

export function DurationStep({ form, goNext, goBack }: Readonly<StepProps>) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'sessionDuration' });

  return (
    <StepLayout
      title={t('fitness.onboarding.sessionDuration')}
      subtitle={t('fitness.onboarding.sessionDurationDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0" aria-label={t('fitness.onboarding.sessionDuration')}>
        {DURATIONS.map(d => (
          <button
            key={d}
            type="button"
            aria-pressed={field.field.value === d}
            onClick={() => field.field.onChange(d)}
            className={cn(
              'focus-visible:ring-ring min-h-[44px] rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
              field.field.value === d
                ? 'border-primary bg-primary-subtle text-primary-emphasis'
                : 'border-border text-foreground-secondary',
            )}
          >
            {d} {t('fitness.onboarding.minutes')}
          </button>
        ))}
      </fieldset>
    </StepLayout>
  );
}
