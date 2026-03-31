import { useTranslation } from 'react-i18next';
import { useController } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { EQUIPMENT_DISPLAY } from '@/features/fitness/constants';
import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbell', 'cable', 'machine',
  'bodyweight', 'resistance_band', 'kettlebell',
] as const;

export function EquipmentStep({ form, goNext, goBack }: StepProps) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'equipment' });
  const selected = field.field.value ?? [];

  const toggle = (item: string) => {
    const current = selected as string[];
    if (current.includes(item)) {
      field.field.onChange(current.filter((i) => i !== item));
    } else {
      field.field.onChange([...current, item]);
    }
  };

  return (
    <StepLayout
      title={t('fitness.onboarding.equipment')}
      subtitle={t('fitness.onboarding.equipmentDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('fitness.onboarding.equipment')}>
        {EQUIPMENT_OPTIONS.map((eq) => (
          <button
            key={eq}
            type="button"
            role="checkbox"
            aria-checked={(selected as string[]).includes(eq)}
            onClick={() => toggle(eq)}
            className={cn(
              'min-h-[44px] rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
              (selected as string[]).includes(eq)
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
            )}
          >
            {EQUIPMENT_DISPLAY[eq] ?? eq}
          </button>
        ))}
      </div>
    </StepLayout>
  );
}
