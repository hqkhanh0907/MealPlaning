import { useTranslation } from 'react-i18next';
import { type UseFormReturn } from 'react-hook-form';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { getCalorieOffset } from '@/services/nutritionEngine';
import type { OnboardingFormData } from './onboardingSchema';
import { STEP_FIELDS } from './onboardingSchema';
import { getAge, type HealthProfile } from '@/features/health-profile/types';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useHealthProfileStore } from '@/features/health-profile/store/healthProfileStore';
import { useAppOnboardingStore } from '@/store/appOnboardingStore';

interface HealthConfirmStepProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
}

export function HealthConfirmStep({
  form,
  goNext,
  goBack,
}: HealthConfirmStepProps) {
  const { t } = useTranslation();
  const db = useDatabase();
  const saveProfile = useHealthProfileStore((s) => s.saveProfile);
  const saveGoal = useHealthProfileStore((s) => s.saveGoal);
  const setOnboardingSection = useAppOnboardingStore((s) => s.setOnboardingSection);
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
    const base = values.gender === 'male'
      ? 10 * values.weightKg + 6.25 * values.heightCm - 5 * age + 5
      : 10 * values.weightKg + 6.25 * values.heightCm - 5 * age - 161;
    const multipliers: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extra_active: 1.9,
    };
    return Math.round(base * (multipliers[values.activityLevel] ?? 1.55));
  }, [values, age]);

  const handleConfirm = async () => {
    const healthFields = [
      ...STEP_FIELDS['2a'],
      ...STEP_FIELDS['2b'],
      ...STEP_FIELDS['2c'],
    ] as const;
    const isValid = await form.trigger([...healthFields]);
    if (!isValid) return;

    const v = form.getValues();
    if (v.goalType === 'cut' && v.targetWeightKg != null && v.targetWeightKg >= v.weightKg) {
      form.setError('targetWeightKg', { message: t('onboarding.validation.cutTargetTooHigh') });
      return;
    }
    if (v.goalType === 'bulk' && v.targetWeightKg != null && v.targetWeightKg <= v.weightKg) {
      form.setError('targetWeightKg', { message: t('onboarding.validation.bulkTargetTooLow') });
      return;
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
        proteinRatio: currentValues.proteinRatio ?? 2.0,
        fatPct: 0.25,
        targetCalories: estimatedTdee,
      } as HealthProfile;
      await saveProfile(db, profileData);

      const calorieOffset = currentValues.goalType === 'maintain'
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
      console.error('Failed to save onboarding data:', error);
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
      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4">
        <h2 className="mb-1 text-xl font-bold text-slate-800 dark:text-slate-100">
          {t('onboarding.confirm.title', { name: values.name })}
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {t('onboarding.confirm.subtitle')}
        </p>

        {/* Hero Calorie */}
        <div className="mb-6 rounded-2xl bg-emerald-50 p-6 text-center dark:bg-emerald-900/20">
          <p className="mb-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {t('onboarding.confirm.dailyCalories')}
          </p>
          <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">
            {estimatedTdee}
          </p>
          <p className="mt-1 text-xs text-emerald-500/70">kcal / {t('onboarding.confirm.day')}</p>
        </div>

        {/* Summary */}
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
          {summaryItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">{item.label}</span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Expandable detail */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex w-full min-h-[44px] items-center justify-center gap-1 text-sm font-medium text-emerald-600 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-emerald-400"
        >
          {expanded ? t('onboarding.confirm.lessDetail') : t('onboarding.confirm.moreDetail')}
          {expanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
        </button>
        {expanded && (
          <div className="mt-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
            <p>{t('onboarding.confirm.activityLevel')}: {t(`health.activityLevel.${values.activityLevel}`)}</p>
            <p>{t('onboarding.goal.title')}: {t(`onboarding.goal.type_${values.goalType}`)}</p>
            {values.goalType !== 'maintain' && (
              <>
                <p>{t('onboarding.goal.rate')}: {t(`onboarding.goal.rate_${values.rateOfChange ?? 'moderate'}`)}</p>
                <p>{t('onboarding.goal.targetWeight')}: {values.targetWeightKg ?? values.weightKg} kg</p>
              </>
            )}
          </div>
        )}
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
          onClick={handleConfirm}
          disabled={saving}
          className="min-h-[44px] rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          data-testid="health-confirm-btn"
        >
          <Check className="mr-1 h-4 w-4" aria-hidden="true" />
          {saving ? '...' : t('onboarding.confirm.confirm')}
        </Button>
      </div>
    </div>
  );
}
