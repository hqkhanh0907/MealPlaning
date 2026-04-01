import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SummaryRow } from './SummaryRow';
import type { StepProps } from './types';

export function TrainingConfirmStep({ form, goNext, goBack }: Readonly<StepProps>) {
  const { t } = useTranslation();
  const values = form.getValues();
  const experience = values.experience;

  return (
    <div className="flex flex-1 flex-col" data-testid="training-confirm-step">
      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4">
        <h2 className="mb-6 text-xl font-bold text-slate-800 dark:text-slate-100">
          {t('onboarding.confirm.trainingTitle')}
        </h2>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
          <SummaryRow label={t('fitness.onboarding.goal')} value={t(`fitness.onboarding.${values.trainingGoal}`)} />
          <SummaryRow label={t('fitness.onboarding.experience')} value={t(`fitness.onboarding.${values.experience}`)} />
          <SummaryRow label={t('fitness.onboarding.daysPerWeek')} value={`${values.daysPerWeek}`} />
          {values.sessionDuration && (
            <SummaryRow label={t('fitness.onboarding.sessionDuration')} value={`${values.sessionDuration} ${t('fitness.onboarding.minutes')}`} />
          )}
          {values.cardioSessions != null && (
            <SummaryRow label={t('fitness.onboarding.cardioSessions')} value={`${values.cardioSessions}`} />
          )}
          {(values.injuries ?? []).length > 0 && (
            <SummaryRow
              label={t('fitness.onboarding.injuries')}
              value={(values.injuries ?? []).map(inj => t(`fitness.onboarding.injury_${inj}`)).join(', ')}
            />
          )}
          {experience !== 'beginner' && values.periodization && (
            <SummaryRow label={t('fitness.onboarding.periodization')} value={t(`fitness.onboarding.period_${values.periodization}`)} />
          )}
          {experience !== 'beginner' && values.cycleWeeks && (
            <SummaryRow label={t('fitness.onboarding.cycleWeeks')} value={`${values.cycleWeeks} ${t('fitness.onboarding.weeksUnit')}`} />
          )}
          {experience !== 'beginner' && (values.priorityMuscles ?? []).length > 0 && (
            <SummaryRow
              label={t('fitness.onboarding.priorityMuscles')}
              value={(values.priorityMuscles ?? []).map(m => t(`fitness.onboarding.muscle_${m}`)).join(', ')}
            />
          )}
          {experience === 'advanced' && values.sleepHours != null && (
            <SummaryRow label={t('fitness.onboarding.sleepHours')} value={`${values.sleepHours} ${t('fitness.onboarding.hoursUnit')}`} />
          )}
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
          onClick={goNext}
          className="min-h-[44px] rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          {t('onboarding.nav.next')}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
