import { useTranslation } from 'react-i18next';
import { useController } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const DURATIONS = [30, 45, 60, 75, 90] as const;

export function DurationStep({ form, goNext, goBack }: StepProps) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'sessionDuration' });

  return (
    <StepLayout
      title={t('fitness.onboarding.sessionDuration')}
      subtitle={t('fitness.onboarding.sessionDurationDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fitness.onboarding.sessionDuration')}>
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={field.field.value === d}
            onClick={() => field.field.onChange(d)}
            className={cn(
              'min-h-[44px] rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
              field.field.value === d
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
            )}
          >
            {d} {t('fitness.onboarding.minutes')}
          </button>
        ))}
      </div>
    </StepLayout>
  );
}
