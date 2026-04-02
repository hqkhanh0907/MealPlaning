import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

export function CardioStep({ form, goNext, goBack }: Readonly<StepProps>) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'cardioSessions' });

  return (
    <StepLayout
      title={t('fitness.onboarding.cardioSessions')}
      subtitle={t('fitness.onboarding.cardioSessionsDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <fieldset className="m-0 flex gap-2 border-0 p-0" aria-label={t('fitness.onboarding.cardioSessions')}>
        {[0, 1, 2, 3].map(n => (
          <button
            key={n}
            type="button"
            aria-pressed={field.field.value === n}
            onClick={() => field.field.onChange(n)}
            className={cn(
              'focus-visible:ring-ring flex h-12 w-12 items-center justify-center rounded-xl border-2 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none',
              field.field.value === n
                ? 'border-primary bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30'
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
