import { ChevronRight } from 'lucide-react';
import { useController, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import type { OnboardingFormData } from './onboardingSchema';
import { STEP_FIELDS } from './onboardingSchema';

interface HealthBasicStepProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
}

export function HealthBasicStep({ form, goNext, goBack }: Readonly<HealthBasicStepProps>) {
  const { t } = useTranslation();
  const { control, trigger } = form;

  const nameField = useController({ control, name: 'name' });
  const genderField = useController({ control, name: 'gender' });
  const dobField = useController({ control, name: 'dateOfBirth' });
  const heightField = useController({ control, name: 'heightCm' });
  const weightField = useController({ control, name: 'weightKg' });

  const handleNext = async () => {
    const valid = await trigger([...STEP_FIELDS['2a']]);
    if (valid) goNext();
  };

  return (
    <div className="flex flex-1 flex-col" data-testid="health-basic-step">
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        <h2 className="text-foreground mb-1 text-xl font-bold">{t('onboarding.health.title')}</h2>
        <p className="text-muted-foreground mb-6 text-sm">{t('onboarding.health.subtitle')}</p>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="ob-name" className="text-foreground mb-1 block text-sm font-medium">
              {t('onboarding.health.name')}
            </label>
            <input
              id="ob-name"
              name="name"
              type="text"
              autoComplete="name"
              aria-invalid={!!nameField.fieldState.error}
              aria-describedby={nameField.fieldState.error ? 'ob-name-error' : undefined}
              className="bg-card focus-visible:ring-ring border-border text-foreground w-full rounded-xl border px-4 py-3 text-base focus-visible:ring-2 focus-visible:outline-none"
              value={nameField.field.value}
              onChange={nameField.field.onChange}
              onBlur={nameField.field.onBlur}
            />
            {nameField.fieldState.error && (
              <p id="ob-name-error" role="alert" className="text-destructive mt-1 text-xs">
                {t('onboarding.validation.required')}
              </p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">{t('onboarding.health.gender')}</label>
            <fieldset className="m-0 flex gap-3 border-0 p-0" aria-label={t('onboarding.health.gender')}>
              {(['male', 'female'] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={genderField.field.value === g}
                  onClick={() => genderField.field.onChange(g)}
                  className={`focus-visible:ring-ring min-h-[44px] flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                    genderField.field.value === g
                      ? 'border-primary bg-primary-subtle text-primary-emphasis'
                      : 'border-border text-foreground-secondary'
                  }`}
                >
                  {t(`onboarding.health.gender_${g}`)}
                </button>
              ))}
            </fieldset>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="ob-dob" className="text-foreground mb-1 block text-sm font-medium">
              {t('onboarding.health.dateOfBirth')}
            </label>
            <input
              id="ob-dob"
              name="dateOfBirth"
              type="date"
              aria-invalid={!!dobField.fieldState.error}
              aria-describedby={dobField.fieldState.error ? 'ob-dob-error' : undefined}
              className="bg-card focus-visible:ring-ring border-border text-foreground w-full rounded-xl border px-4 py-3 text-base focus-visible:ring-2 focus-visible:outline-none"
              value={dobField.field.value}
              onChange={dobField.field.onChange}
              onBlur={dobField.field.onBlur}
            />
            {dobField.fieldState.error && (
              <p id="ob-dob-error" role="alert" className="text-destructive mt-1 text-xs">
                {t('onboarding.validation.required')}
              </p>
            )}
          </div>

          {/* Height */}
          <div>
            <label htmlFor="ob-height" className="text-foreground mb-1 block text-sm font-medium">
              {t('onboarding.health.height')}
            </label>
            <div className="relative">
              <input
                id="ob-height"
                name="heightCm"
                type="number"
                inputMode="decimal"
                placeholder="170"
                aria-invalid={!!heightField.fieldState.error}
                aria-describedby={heightField.fieldState.error ? 'ob-height-error' : undefined}
                className="bg-card focus-visible:ring-ring border-border text-foreground w-full rounded-xl border px-4 py-3 pr-12 text-base focus-visible:ring-2 focus-visible:outline-none"
                value={heightField.field.value ?? ''}
                onChange={e => heightField.field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                onBlur={heightField.field.onBlur}
              />
              <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-sm">cm</span>
            </div>
            {heightField.field.value != null && heightField.field.value < 3 && heightField.field.value > 0 && (
              <p className="mt-1 text-xs text-amber-500">{t('onboarding.validation.heightHint')}</p>
            )}
            {heightField.fieldState.error && (
              <p id="ob-height-error" role="alert" className="text-destructive mt-1 text-xs">
                {t('onboarding.validation.heightRange')}
              </p>
            )}
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="ob-weight" className="text-foreground mb-1 block text-sm font-medium">
              {t('onboarding.health.weight')}
            </label>
            <div className="relative">
              <input
                id="ob-weight"
                name="weightKg"
                type="number"
                inputMode="decimal"
                placeholder="70"
                aria-invalid={!!weightField.fieldState.error}
                aria-describedby={weightField.fieldState.error ? 'ob-weight-error' : undefined}
                className="bg-card focus-visible:ring-ring border-border text-foreground w-full rounded-xl border px-4 py-3 pr-12 text-base focus-visible:ring-2 focus-visible:outline-none"
                value={weightField.field.value ?? ''}
                onChange={e => weightField.field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                onBlur={weightField.field.onBlur}
              />
              <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-sm">kg</span>
            </div>
            {weightField.fieldState.error && (
              <p id="ob-weight-error" role="alert" className="text-destructive mt-1 text-xs">
                {t('onboarding.validation.weightRange')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="border-border bg-card/95 fixed inset-x-0 bottom-0 flex items-center justify-between border-t p-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={goBack}
          className="text-muted-foreground focus-visible:ring-ring min-h-[44px] px-4 py-2 text-sm font-medium focus-visible:rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('onboarding.nav.back')}
        </button>
        <Button
          onClick={handleNext}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring min-h-[44px] rounded-xl px-6 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2"
          data-testid="health-basic-next"
        >
          {t('onboarding.nav.next')}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
