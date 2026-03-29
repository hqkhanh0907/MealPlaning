import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UseFormReturn } from 'react-hook-form';
import type { OnboardingFormData } from './onboardingSchema';

interface PlanPreviewScreenProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
  completeOnboarding: () => void;
}

export function PlanPreviewScreen({ form, goBack, completeOnboarding }: PlanPreviewScreenProps) {
  const { t } = useTranslation();
  const values = form.getValues();
  const daysPerWeek = values.daysPerWeek;

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const activeDays = weekDays.slice(0, daysPerWeek);
  const restDays = weekDays.slice(daysPerWeek);

  return (
    <div className="flex flex-1 flex-col" data-testid="plan-preview">
      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4">
        <h2 className="mb-1 text-xl font-bold text-slate-800 dark:text-slate-100">
          {t('onboarding.preview.title', { name: values.name })}
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {t('onboarding.preview.subtitle')}
        </p>

        {/* Week Overview */}
        <div className="mb-6 flex gap-1.5">
          {weekDays.map((day) => {
            const isActive = activeDays.includes(day);
            return (
              <div
                key={day}
                className={`flex flex-1 flex-col items-center rounded-lg py-2 text-xs font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                <span>{day}</span>
                <span className="mt-1 text-[10px]">
                  {isActive ? '💪' : t('fitness.plan.restDay')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{daysPerWeek}</p>
            <p className="text-[10px] text-slate-500">{t('onboarding.preview.workoutDays', { count: daysPerWeek })}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{restDays.length}</p>
            <p className="text-[10px] text-slate-500">{t('onboarding.preview.restDays', { count: restDays.length })}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{values.sessionDuration ?? 60}</p>
            <p className="text-[10px] text-slate-500">{t('onboarding.preview.minutesPerSession')}</p>
          </div>
        </div>

        {/* Plan note */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {t('onboarding.preview.editNote')}
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
          onClick={completeOnboarding}
          className="min-h-[44px] rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          data-testid="onboarding-complete"
        >
          <Check className="mr-1 h-4 w-4" aria-hidden="true" />
          {t('onboarding.preview.start')}
        </Button>
      </div>
    </div>
  );
}
