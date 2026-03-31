import { useTranslation } from 'react-i18next';
import { useController } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const PERIODIZATION_OPTIONS = ['linear', 'undulating', 'block'] as const;

export function PeriodizationStep({ form, goNext, goBack }: StepProps) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'periodization' });

  return (
    <StepLayout
      title={t('fitness.onboarding.periodization')}
      subtitle={t('fitness.onboarding.periodizationDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <div className="space-y-3" role="radiogroup" aria-label={t('fitness.onboarding.periodization')}>
        {PERIODIZATION_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={field.field.value === opt}
            onClick={() => field.field.onChange(opt)}
            className={cn(
              'flex w-full min-h-[56px] flex-col items-start rounded-xl border-2 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
              field.field.value === opt
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-slate-200 dark:border-slate-700',
            )}
          >
            <span className={cn(
              'text-sm font-medium',
              field.field.value === opt
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-slate-700 dark:text-slate-300',
            )}>
              {t(`fitness.onboarding.period_${opt}`)}
            </span>
            <span className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {t(`fitness.onboarding.period_${opt}_desc`)}
            </span>
          </button>
        ))}
      </div>
    </StepLayout>
  );
}
