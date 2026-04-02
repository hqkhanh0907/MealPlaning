import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { SummaryRow } from './SummaryRow';
import type { StepProps } from './types';

export function TrainingConfirmStep({ form, goNext, goBack }: Readonly<StepProps>) {
  const { t } = useTranslation();
  const values = form.getValues();
  const experience = values.experience;

  return (
    <div className="flex flex-1 flex-col" data-testid="training-confirm-step">
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        <h2 className="text-foreground mb-6 text-xl font-bold">{t('onboarding.confirm.trainingTitle')}</h2>
        <div className="border-border divide-border divide-y rounded-xl border">
          <SummaryRow label={t('fitness.onboarding.goal')} value={t(`fitness.onboarding.${values.trainingGoal}`)} />
          <SummaryRow label={t('fitness.onboarding.experience')} value={t(`fitness.onboarding.${values.experience}`)} />
          <SummaryRow label={t('fitness.onboarding.daysPerWeek')} value={`${values.daysPerWeek}`} />
          {values.sessionDuration && (
            <SummaryRow
              label={t('fitness.onboarding.sessionDuration')}
              value={`${values.sessionDuration} ${t('fitness.onboarding.minutes')}`}
            />
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
            <SummaryRow
              label={t('fitness.onboarding.periodization')}
              value={t(`fitness.onboarding.period_${values.periodization}`)}
            />
          )}
          {experience !== 'beginner' && values.cycleWeeks && (
            <SummaryRow
              label={t('fitness.onboarding.cycleWeeks')}
              value={`${values.cycleWeeks} ${t('fitness.onboarding.weeksUnit')}`}
            />
          )}
          {experience !== 'beginner' && (values.priorityMuscles ?? []).length > 0 && (
            <SummaryRow
              label={t('fitness.onboarding.priorityMuscles')}
              value={(values.priorityMuscles ?? []).map(m => t(`fitness.onboarding.muscle_${m}`)).join(', ')}
            />
          )}
          {experience === 'advanced' && values.sleepHours != null && (
            <SummaryRow
              label={t('fitness.onboarding.sleepHours')}
              value={`${values.sleepHours} ${t('fitness.onboarding.hoursUnit')}`}
            />
          )}
        </div>
      </div>

      <div className="border-border bg-card/95 fixed inset-x-0 bottom-0 flex items-center justify-between border-t p-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={goBack}
          className="text-muted-foreground focus-visible:ring-ring min-h-[44px] px-4 py-2 text-sm font-medium focus-visible:rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('onboarding.nav.back')}
        </button>
        <Button
          onClick={goNext}
          className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring min-h-[44px] rounded-xl px-6 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {t('onboarding.nav.next')}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
