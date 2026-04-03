import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const INJURY_REGIONS = ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'] as const;

export function InjuriesStep({ form, goNext, goBack }: Readonly<StepProps>) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'injuryRestrictions' });
  const selected = (field.field.value ?? []) as string[];

  const toggle = (item: string) => {
    if (selected.includes(item)) {
      field.field.onChange(selected.filter(i => i !== item));
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
      <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0" aria-label={t('fitness.onboarding.injuries')}>
        {INJURY_REGIONS.map(region => (
          <button
            key={region}
            type="button"
            aria-pressed={selected.includes(region)}
            onClick={() => toggle(region)}
            className={cn(
              'focus-visible:ring-ring min-h-[44px] rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
              selected.includes(region)
                ? 'border-primary bg-primary-subtle text-primary-emphasis'
                : 'border-border text-foreground-secondary',
            )}
          >
            {t(`fitness.onboarding.injury_${region}`)}
          </button>
        ))}
      </fieldset>
    </StepLayout>
  );
}
