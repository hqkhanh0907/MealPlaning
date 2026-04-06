import { Activity, Armchair, ChevronRight, Dumbbell, Footprints, type LucideIcon, Zap } from 'lucide-react';
import { useController, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { OnboardingFormData } from './onboardingSchema';

interface ActivityLevelStepProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
}

const LEVELS: ReadonlyArray<{ value: string; icon: LucideIcon; multiplier: number }> = [
  { value: 'sedentary', icon: Armchair, multiplier: 1.2 },
  { value: 'light', icon: Footprints, multiplier: 1.375 },
  { value: 'moderate', icon: Activity, multiplier: 1.55 },
  { value: 'active', icon: Dumbbell, multiplier: 1.725 },
  { value: 'extra_active', icon: Zap, multiplier: 1.9 },
];

export function ActivityLevelStep({ form, goNext, goBack }: Readonly<ActivityLevelStepProps>) {
  const { t } = useTranslation();
  const field = useController({ control: form.control, name: 'activityLevel' });

  return (
    <div className="flex flex-1 flex-col" data-testid="activity-level-step">
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        <h2 className="text-foreground mb-1 text-xl font-semibold">{t('onboarding.health.activityLevel')}</h2>
        <p className="text-muted-foreground mb-6 text-sm">{t('onboarding.health.activityLevelDesc')}</p>

        <fieldset className="m-0 space-y-3 border-0 p-0" aria-label={t('onboarding.health.activityLevel')}>
          {LEVELS.map(level => (
            <button
              key={level.value}
              type="button"
              aria-pressed={field.field.value === level.value}
              onClick={() => field.field.onChange(level.value)}
              className={cn(
                'focus-visible:ring-ring flex min-h-[56px] w-full items-center gap-4 rounded-xl border-2 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                field.field.value === level.value ? 'border-primary bg-primary-subtle' : 'border-border',
              )}
            >
              <level.icon className="text-primary h-6 w-6 shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    field.field.value === level.value ? 'text-primary-emphasis' : 'text-foreground',
                  )}
                >
                  {t(`health.activityLevel.${level.value}`)}
                </p>
                <p className="text-muted-foreground text-xs">{t(`onboarding.health.activity_${level.value}_desc`)}</p>
              </div>
            </button>
          ))}
        </fieldset>
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
