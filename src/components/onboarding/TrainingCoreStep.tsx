import { useTranslation } from 'react-i18next';
import { useController, type UseFormReturn } from 'react-hook-form';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OnboardingFormData } from './onboardingSchema';
import { STEP_FIELDS } from './onboardingSchema';

interface TrainingCoreStepProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
}

const TRAINING_GOALS = ['strength', 'hypertrophy', 'endurance', 'general'] as const;
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export function TrainingCoreStep({ form, goNext, goBack }: TrainingCoreStepProps) {
  const { t } = useTranslation();
  const goalField = useController({ control: form.control, name: 'trainingGoal' });
  const expField = useController({ control: form.control, name: 'experience' });
  const daysField = useController({ control: form.control, name: 'daysPerWeek' });

  const handleNext = async () => {
    const valid = await form.trigger([...STEP_FIELDS['3']]);
    if (valid) goNext();
  };

  return (
    <div className="flex flex-1 flex-col" data-testid="training-core-step">
      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4">
        <h2 className="mb-1 text-xl font-bold text-slate-800 dark:text-slate-100">
          {t('fitness.onboarding.step1Title')}
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {t('fitness.onboarding.step1Desc')}
        </p>

        {/* Training Goal */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('fitness.onboarding.goal')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TRAINING_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => goalField.field.onChange(goal)}
                className={cn(
                  'min-h-[44px] rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
                  goalField.field.value === goal
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
                )}
              >
                {t(`fitness.onboarding.goal_${goal}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('fitness.onboarding.experience')}
          </label>
          <div className="flex gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => expField.field.onChange(level)}
                className={cn(
                  'min-h-[44px] flex-1 rounded-xl border-2 px-3 py-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
                  expField.field.value === level
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
                )}
              >
                {t(`fitness.onboarding.experience_${level}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Days Per Week */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('fitness.onboarding.daysPerWeek')}
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => daysField.field.onChange(d)}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl border-2 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none',
                  daysField.field.value === d
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t('fitness.onboarding.daysPerWeekUnit')}
          </p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 flex items-center justify-between border-t border-slate-200 bg-white/95 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
        <button
          type="button"
          onClick={goBack}
          className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-500 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-slate-400"
        >
          {t('onboarding.nav.back')}
        </button>
        <Button
          onClick={handleNext}
          className="min-h-[44px] rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          {t('onboarding.nav.next')}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
