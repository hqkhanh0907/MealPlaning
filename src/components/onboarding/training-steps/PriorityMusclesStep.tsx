import { useTranslation } from 'react-i18next';
import { useController } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { StepLayout } from './StepLayout';
import type { StepProps } from './types';

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'] as const;
const MAX_PRIORITY_MUSCLES = 3;

export function PriorityMusclesStep({ form, goNext, goBack }: Readonly<StepProps>) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'priorityMuscles' });
  const selected = (field.field.value ?? []) as string[];
  const atMax = selected.length >= MAX_PRIORITY_MUSCLES;

  const toggle = (muscle: string) => {
    if (selected.includes(muscle)) {
      field.field.onChange(selected.filter((m) => m !== muscle));
    } else if (!atMax) {
      field.field.onChange([...selected, muscle]);
    }
  };

  return (
    <StepLayout
      title={t('fitness.onboarding.priorityMuscles')}
      subtitle={t('fitness.onboarding.priorityMusclesDesc')}
      goNext={goNext}
      goBack={goBack}
    >
      <p className="mb-3 text-xs font-medium text-slate-400 dark:text-slate-500">
        {t('fitness.onboarding.maxItems', { count: MAX_PRIORITY_MUSCLES })} ({selected.length}/{MAX_PRIORITY_MUSCLES})
      </p>
      <fieldset className="flex flex-wrap gap-2 border-0 p-0 m-0" aria-label={t('fitness.onboarding.priorityMuscles')}>
        {MUSCLE_GROUPS.map((muscle) => {
          const isSelected = selected.includes(muscle);
          const isDisabled = atMax && !isSelected;

          let stateClass: string;
          if (isSelected) {
            stateClass = 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
          } else if (isDisabled) {
            stateClass = 'cursor-not-allowed border-slate-100 text-slate-300 dark:border-slate-800 dark:text-slate-600';
          } else {
            stateClass = 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400';
          }

          return (
            <button
              key={muscle}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => toggle(muscle)}
              className={cn(
                'min-h-[44px] rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
                stateClass,
              )}
            >
              {t(`fitness.onboarding.muscle_${muscle}`)}
            </button>
          );
        })}
      </fieldset>
    </StepLayout>
  );
}
