import { Check } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import type { OnboardingFormData } from './onboardingSchema';

interface PlanPreviewScreenProps {
  form: UseFormReturn<OnboardingFormData>;
  completeOnboarding: () => void;
}

export function PlanPreviewScreen({ form, completeOnboarding }: Readonly<PlanPreviewScreenProps>) {
  const { t } = useTranslation();
  const values = form.getValues();
  const daysPerWeek = values.daysPerWeek;

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const activeDays = new Set(weekDays.slice(0, daysPerWeek));
  const restDays = weekDays.slice(daysPerWeek);

  return (
    <div className="flex flex-1 flex-col" data-testid="plan-preview">
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        <h2 className="text-foreground mb-1 text-xl font-bold">
          {t('onboarding.preview.title', { name: values.name })}
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">{t('onboarding.preview.subtitle')}</p>

        {/* Week Overview */}
        <div className="mb-6 flex gap-1.5">
          {weekDays.map(day => {
            const isActive = activeDays.has(day);
            return (
              <div
                key={day}
                className={`flex flex-1 flex-col items-center rounded-lg py-2 text-xs font-medium ${
                  isActive ? 'bg-primary-subtle text-primary-emphasis' : 'bg-muted text-muted-foreground'
                }`}
              >
                <span>{day}</span>
                <span className="mt-1 text-xs">{isActive ? '💪' : t('fitness.plan.restDay')}</span>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="bg-muted rounded-xl p-3 text-center">
            <p className="text-foreground text-lg font-bold">{daysPerWeek}</p>
            <p className="text-muted-foreground text-xs">
              {t('onboarding.preview.workoutDays', { count: daysPerWeek })}
            </p>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <p className="text-foreground text-lg font-bold">{restDays.length}</p>
            <p className="text-muted-foreground text-xs">
              {t('onboarding.preview.restDays', { count: restDays.length })}
            </p>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <p className="text-foreground text-lg font-bold">{values.sessionDuration ?? 60}</p>
            <p className="text-muted-foreground text-xs">{t('onboarding.preview.minutesPerSession')}</p>
          </div>
        </div>

        {/* Plan note */}
        <div className="bg-primary-subtle border-primary/20 rounded-xl border p-4">
          <p className="text-primary-emphasis text-sm">{t('onboarding.preview.editNote')}</p>
        </div>
      </div>

      <div className="border-border bg-card/95 fixed inset-x-0 bottom-0 flex items-center justify-center border-t p-4 backdrop-blur-sm">
        <Button
          onClick={completeOnboarding}
          className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring min-h-[44px] rounded-xl px-6 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2"
          data-testid="onboarding-complete"
        >
          <Check className="mr-1 h-4 w-4" aria-hidden="true" />
          {t('onboarding.preview.start')}
        </Button>
      </div>
    </div>
  );
}
