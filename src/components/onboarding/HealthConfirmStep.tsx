import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useHealthProfileStore } from '@/features/health-profile/store/healthProfileStore';
import { getAge, type HealthProfile } from '@/features/health-profile/types';
import { validateTargetWeight } from '@/schemas/goalValidation';
import { getCalorieOffset } from '@/services/nutritionEngine';
import { useAppOnboardingStore } from '@/store/appOnboardingStore';
import { logger } from '@/utils/logger';

import type { OnboardingFormData } from './onboardingSchema';
import { STEP_FIELDS } from './onboardingSchema';

interface HealthConfirmStepProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
}

export function HealthConfirmStep({ form, goNext, goBack }: Readonly<HealthConfirmStepProps>) {
  const { t } = useTranslation();
  const db = useDatabase();
  const saveProfile = useHealthProfileStore(s => s.saveProfile);
  const saveGoal = useHealthProfileStore(s => s.saveGoal);
  const setOnboardingSection = useAppOnboardingStore(s => s.setOnboardingSection);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const values = form.getValues();

  const age = useMemo(() => {
    if (values.dateOfBirth) {
      return getAge({ dateOfBirth: values.dateOfBirth, age: 0 } as Parameters<typeof getAge>[0]);
    }
    return 0;
  }, [values.dateOfBirth]);

  const bmi = useMemo(() => {
    const h = values.heightCm / 100;
    return (values.weightKg / (h * h)).toFixed(1);
  }, [values.heightCm, values.weightKg]);

  const estimatedTdee = useMemo(() => {
    const base =
      values.gender === 'male'
        ? 10 * values.weightKg + 6.25 * values.heightCm - 5 * age + 5
        : 10 * values.weightKg + 6.25 * values.heightCm - 5 * age - 161;
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      extra_active: 1.9,
    };
    return Math.round(base * (multipliers[values.activityLevel] ?? 1.55));
  }, [values, age]);

  const handleConfirm = async () => {
    const healthFields = [...STEP_FIELDS['2a'], ...STEP_FIELDS['2b'], ...STEP_FIELDS['2c']] as const;
    const isValid = await form.trigger([...healthFields]);
    if (!isValid) return;

    const v = form.getValues();
    if (v.goalType !== 'maintain' && v.targetWeightKg != null) {
      const error = validateTargetWeight(v.goalType, v.weightKg, v.targetWeightKg);
      if (error) {
        form.setError('targetWeightKg', { message: t(error) });
        return;
      }
    }

    setSaving(true);
    try {
      const currentValues = form.getValues();
      const profileData = {
        id: 'default',
        name: currentValues.name,
        gender: currentValues.gender,
        dateOfBirth: currentValues.dateOfBirth,
        age,
        heightCm: currentValues.heightCm,
        weightKg: currentValues.weightKg,
        activityLevel: currentValues.activityLevel,
        bodyFatPct: currentValues.bodyFatPct,
        bmrOverride: currentValues.bmrOverride,
        proteinRatio: currentValues.proteinRatio ?? 2,
        fatPct: 0.25,
        targetCalories: estimatedTdee,
      } as HealthProfile;
      await saveProfile(db, profileData);

      const calorieOffset =
        currentValues.goalType === 'maintain'
          ? 0
          : getCalorieOffset(currentValues.goalType, currentValues.rateOfChange ?? 'moderate');
      const now = new Date().toISOString();
      await saveGoal(db, {
        id: 'default',
        type: currentValues.goalType,
        rateOfChange: currentValues.rateOfChange ?? 'moderate',
        targetWeightKg: currentValues.targetWeightKg ?? currentValues.weightKg,
        calorieOffset,
        startDate: now,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      setOnboardingSection(3);
      goNext();
    } catch (error) {
      logger.error({ component: 'HealthConfirmStep', action: 'saveOnboarding' }, error);
    } finally {
      setSaving(false);
    }
  };

  const summaryItems = [
    { label: t('onboarding.health.name'), value: values.name },
    { label: t('onboarding.health.gender'), value: t(`onboarding.health.gender_${values.gender}`) },
    { label: t('onboarding.confirm.age'), value: `${age} ${t('onboarding.confirm.years')}` },
    { label: t('onboarding.health.height'), value: `${values.heightCm} cm` },
    { label: t('onboarding.health.weight'), value: `${values.weightKg} kg` },
    { label: 'BMI', value: bmi },
  ];

  return (
    <div className="flex flex-1 flex-col" data-testid="health-confirm-step">
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
        <h2 className="text-foreground mb-1 text-xl font-bold">
          {t('onboarding.confirm.title', { name: values.name })}
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">{t('onboarding.confirm.subtitle')}</p>

        {/* Hero Calorie */}
        <div className="bg-primary-subtle mb-6 rounded-2xl p-6 text-center">
          <p className="text-primary mb-1 text-sm font-medium">{t('onboarding.confirm.dailyCaloriesLabel')}</p>
          <p className="text-primary-emphasis text-4xl font-bold">{estimatedTdee}</p>
          <p className="text-primary/70 mt-1 text-xs">kcal / {t('onboarding.confirm.day')}</p>
          <p className="text-primary/70/70 mt-2 text-xs leading-relaxed">{t('onboarding.confirm.dailyCaloriesDesc')}</p>
        </div>

        {/* Summary */}
        <div className="border-border divide-border divide-y rounded-xl border">
          {summaryItems.map(item => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-muted-foreground text-sm">{item.label}</span>
              <span className="text-foreground text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Expandable detail */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-primary focus-visible:ring-ring mt-3 flex min-h-[44px] w-full items-center justify-center gap-1 text-sm font-medium focus-visible:rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          {expanded ? t('onboarding.confirm.lessDetail') : t('onboarding.confirm.moreDetail')}
          {expanded ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        {expanded && (
          <div className="border-border text-foreground-secondary mt-2 rounded-xl border p-4 text-sm">
            <p>
              {t('onboarding.confirm.activityLevel')}: {t(`health.activityLevel.${values.activityLevel}`)}
            </p>
            <p>
              {t('onboarding.confirm.goalLabel')}: {t(`onboarding.goal.type_${values.goalType}`)}
            </p>
            {values.goalType !== 'maintain' && (
              <>
                <p>
                  {t('onboarding.goal.rate')}: {t(`onboarding.goal.rate_${values.rateOfChange ?? 'moderate'}`)}
                </p>
                <p>
                  {t('onboarding.goal.targetWeight')}: {values.targetWeightKg ?? values.weightKg} kg
                </p>
              </>
            )}
          </div>
        )}
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
          onClick={handleConfirm}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring min-h-[44px] rounded-xl px-6 py-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2"
          data-testid="health-confirm-btn"
        >
          <Check className="mr-1 h-4 w-4" aria-hidden="true" />
          {saving ? '...' : t('onboarding.confirm.confirm')}
        </Button>
      </div>
    </div>
  );
}
