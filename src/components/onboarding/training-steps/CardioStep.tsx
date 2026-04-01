import { useTranslation } from 'react-i18next';
import { useController } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

export function CardioStep({ form, goNext, goBack }: StepProps) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'cardioSessions' });

  return (
    <StepLayout
      title={t('fitness.onboarding.cardioSessions')}
      subtitle={t('fitness.onboarding.cardioSessionsDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <fieldset className="flex gap-2 border-0 p-0 m-0" aria-label={t('fitness.onboarding.cardioSessions')}>
        {[0, 1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={field.field.value === n}
            onClick={() => field.field.onChange(n)}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl border-2 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
              field.field.value === n
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
            )}
          >
            {n}
          </button>
        ))}
      </fieldset>
    </StepLayout>
  );
}
