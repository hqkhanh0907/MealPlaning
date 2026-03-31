import { useTranslation } from 'react-i18next';
import { useController } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const CYCLE_OPTIONS = [4, 6, 8, 12] as const;

export function CycleWeeksStep({ form, goNext, goBack }: StepProps) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'cycleWeeks' });

  return (
    <StepLayout
      title={t('fitness.onboarding.cycleWeeks')}
      subtitle={t('fitness.onboarding.cycleWeeksDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <div className="space-y-3" role="radiogroup" aria-label={t('fitness.onboarding.cycleWeeks')}>
        {CYCLE_OPTIONS.map((weeks) => (
          <button
            key={weeks}
            type="button"
            role="radio"
            aria-checked={field.field.value === weeks}
            onClick={() => field.field.onChange(weeks)}
            className={cn(
              'flex w-full min-h-[56px] flex-col items-start rounded-xl border-2 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
              field.field.value === weeks
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-slate-200 dark:border-slate-700',
            )}
          >
            <span className={cn(
              'text-sm font-medium',
              field.field.value === weeks
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-slate-700 dark:text-slate-300',
            )}>
              {weeks} {t('fitness.onboarding.weeksUnit')}
            </span>
            <span className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {t(`fitness.onboarding.cycleWeeks${weeks}Desc`)}
            </span>
          </button>
        ))}
      </div>
    </StepLayout>
  );
}
