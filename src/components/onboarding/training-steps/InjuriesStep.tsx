import { useTranslation } from 'react-i18next';
import { useController } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const INJURY_REGIONS = ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'] as const;

export function InjuriesStep({ form, goNext, goBack }: StepProps) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'injuries' });
  const selected = (field.field.value ?? []) as string[];

  const toggle = (item: string) => {
    if (selected.includes(item)) {
      field.field.onChange(selected.filter((i) => i !== item));
    } else {
      field.field.onChange([...selected, item]);
    }
  };

  return (
    <StepLayout
      title={t('fitness.onboarding.injuries')}
      subtitle={t('fitness.onboarding.injuriesDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('fitness.onboarding.injuries')}>
        {INJURY_REGIONS.map((region) => (
          <button
            key={region}
            type="button"
            role="checkbox"
            aria-checked={selected.includes(region)}
            onClick={() => toggle(region)}
            className={cn(
              'min-h-[44px] rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
              selected.includes(region)
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
            )}
          >
            {t(`fitness.onboarding.injury_${region}`)}
          </button>
        ))}
      </div>
    </StepLayout>
  );
}
