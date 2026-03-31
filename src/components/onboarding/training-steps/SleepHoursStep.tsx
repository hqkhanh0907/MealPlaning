import { useTranslation } from 'react-i18next';
import { useController } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const SLEEP_OPTIONS = [4, 5, 6, 7, 8, 9, 10] as const;
const LOW_SLEEP_THRESHOLD = 7;

export function SleepHoursStep({ form, goNext, goBack }: StepProps) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'sleepHours' });
  const showWarning = field.field.value != null && field.field.value < LOW_SLEEP_THRESHOLD;

  return (
    <StepLayout
      title={t('fitness.onboarding.sleepHours')}
      subtitle={t('fitness.onboarding.sleepHoursDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fitness.onboarding.sleepHours')}>
        {SLEEP_OPTIONS.map((hours) => (
          <button
            key={hours}
            type="button"
            role="radio"
            aria-checked={field.field.value === hours}
            onClick={() => field.field.onChange(hours)}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl border-2 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
              field.field.value === hours
                ? hours < LOW_SLEEP_THRESHOLD
                  ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
            )}
          >
            {hours}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        {t('fitness.onboarding.hoursUnit')}
      </p>
      {showWarning && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t('fitness.onboarding.sleepWarning')}
          </p>
        </div>
      )}
    </StepLayout>
  );
}
