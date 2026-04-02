import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Resolver } from 'react-hook-form';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormField } from '../../../components/form/FormField';
import { RadioPills } from '../../../components/form/RadioPills';
import { StringNumberController } from '../../../components/form/StringNumberController';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { type HealthProfileFormData, healthProfileSchema } from '../../../schemas/healthProfileSchema';
import { calculateBMR, calculateMacros, calculateTDEE } from '../../../services/nutritionEngine';
import { useHealthProfileStore } from '../store/healthProfileStore';
import type { ActivityLevel, HealthProfile } from '../types';

const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'extra_active'];

const ACTIVITY_LEVEL_I18N: Record<ActivityLevel, string> = {
  sedentary: 'healthProfile.sedentary',
  light: 'healthProfile.light',
  moderate: 'healthProfile.moderate',
  active: 'healthProfile.active',
  extra_active: 'healthProfile.extraActive',
};

interface HealthProfileFormProps {
  embedded?: boolean;
  saveRef?: React.RefObject<(() => Promise<boolean>) | null>;
  blankDefaults?: boolean;
}

export function HealthProfileForm({ embedded, saveRef, blankDefaults }: HealthProfileFormProps = {}) {
  const { t } = useTranslation();
  const db = useDatabase();
  const profile = useHealthProfileStore(s => s.profile);
  const saveProfileAction = useHealthProfileStore(s => s.saveProfile);
  const activeGoal = useHealthProfileStore(s => s.activeGoal);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<HealthProfileFormData>({
    resolver: zodResolver(healthProfileSchema) as unknown as Resolver<HealthProfileFormData>,
    mode: 'onBlur',
    defaultValues:
      blankDefaults || !profile
        ? {
            gender: 'male' as const,
            age: '' as unknown as number,
            heightCm: '' as unknown as number,
            weightKg: '' as unknown as number,
            activityLevel: 'moderate' as const,
            bodyFatPct: undefined,
            bmrOverrideEnabled: false,
            bmrOverride: undefined,
            proteinRatio: '' as unknown as number,
          }
        : {
            gender: profile.gender,
            age: profile.age,
            heightCm: profile.heightCm,
            weightKg: profile.weightKg,
            activityLevel: profile.activityLevel,
            bodyFatPct: profile.bodyFatPct,
            bmrOverrideEnabled: profile.bmrOverride != null,
            bmrOverride: profile.bmrOverride,
            proteinRatio: profile.proteinRatio,
          },
  });

  const [saved, setSaved] = useState(false);

  const [
    watchedGender,
    watchedAge,
    watchedHeightCm,
    watchedWeightKg,
    watchedActivityLevel,
    watchedBmrOverrideEnabled,
    watchedBmrOverride,
    watchedBodyFatPct,
    watchedProteinRatio,
  ] = useWatch({
    control,
    name: [
      'gender',
      'age',
      'heightCm',
      'weightKg',
      'activityLevel',
      'bmrOverrideEnabled',
      'bmrOverride',
      'bodyFatPct',
      'proteinRatio',
    ],
  });

  const bmr = useMemo(() => {
    if (watchedBmrOverrideEnabled && watchedBmrOverride) return watchedBmrOverride;
    const isValid =
      watchedWeightKg >= 30 &&
      watchedWeightKg <= 300 &&
      watchedHeightCm >= 100 &&
      watchedHeightCm <= 250 &&
      watchedAge >= 10 &&
      watchedAge <= 100;
    if (!isValid) return 0;
    return Math.max(0, calculateBMR(watchedWeightKg, watchedHeightCm, watchedAge, watchedGender));
  }, [watchedBmrOverrideEnabled, watchedBmrOverride, watchedWeightKg, watchedHeightCm, watchedAge, watchedGender]);

  const tdee = useMemo(() => calculateTDEE(bmr, watchedActivityLevel), [bmr, watchedActivityLevel]);

  const macros = useMemo(() => {
    const bodyFatFraction = typeof watchedBodyFatPct === 'number' ? watchedBodyFatPct / 100 : undefined;
    return calculateMacros(tdee, watchedWeightKg, watchedProteinRatio, profile?.fatPct ?? 0.25, bodyFatFraction);
  }, [tdee, watchedWeightKg, watchedProteinRatio, profile?.fatPct, watchedBodyFatPct]);

  const goalWeightWarning = useMemo(() => {
    if (!activeGoal || activeGoal.type === 'maintain' || !activeGoal.targetWeightKg) return null;
    const w = Number(watchedWeightKg);
    if (!w || Number.isNaN(w)) return null;
    const target = activeGoal.targetWeightKg;
    if (activeGoal.type === 'cut' && w <= target) {
      return t('healthProfile.goalWeightConflictCut');
    }
    if (activeGoal.type === 'bulk' && w >= target) {
      return t('healthProfile.goalWeightConflictBulk');
    }
    return null;
  }, [activeGoal, watchedWeightKg, t]);

  async function onSubmit(data: HealthProfileFormData): Promise<boolean> {
    try {
      const base: HealthProfile = profile ?? {
        id: 'default',
        name: '',
        gender: 'male',
        age: 30,
        dateOfBirth: null,
        heightCm: 170,
        weightKg: 70,
        activityLevel: 'moderate',
        proteinRatio: 2,
        fatPct: 0.25,
        targetCalories: 1500,
        updatedAt: new Date().toISOString(),
      };
      const profileToSave: HealthProfile = {
        ...base,
        gender: data.gender,
        age: data.age,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        activityLevel: data.activityLevel,
        bodyFatPct: typeof data.bodyFatPct === 'number' ? data.bodyFatPct : undefined,
        bmrOverride: data.bmrOverrideEnabled ? data.bmrOverride : undefined,
        proteinRatio: data.proteinRatio,
      };
      await saveProfileAction(db, profileToSave);
      setSaved(true);
      reset(data);
      return true;
    } catch {
      return false;
    }
  }

  async function handleSave(): Promise<boolean> {
    let result = false;
    await handleSubmit(async data => {
      result = await onSubmit(data);
    })();
    return result;
  }

  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  });

  const inputBase =
    'w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all';

  function inputClass(field: keyof HealthProfileFormData): string {
    const borderColor = errors[field]
      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
      : 'border-slate-300 dark:border-slate-600 focus:ring-emerald-500/50 focus:border-emerald-500';
    return `${inputBase} border ${borderColor}`;
  }

  return (
    <div className="space-y-6" data-testid="health-profile-form">
      {!embedded && (
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('healthProfile.title')}</h3>
      )}

      {/* Gender Toggle */}
      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('healthProfile.gender')}
        </legend>
        <RadioPills<HealthProfileFormData>
          name="gender"
          control={control}
          options={[
            { value: 'male', label: t('healthProfile.male') },
            { value: 'female', label: t('healthProfile.female') },
          ]}
          className="flex gap-2"
        />
      </fieldset>

      {/* Age */}
      <FormField label={t('healthProfile.age')} error={errors.age} className="">
        <StringNumberController<HealthProfileFormData>
          name="age"
          control={control}
          testId="hp-age"
          ariaLabel={t('healthProfile.age')}
          inputMode="numeric"
          className={inputClass('age')}
        />
      </FormField>

      {/* Height */}
      <FormField label={t('healthProfile.height')} error={errors.heightCm} className="">
        <StringNumberController<HealthProfileFormData>
          name="heightCm"
          control={control}
          testId="hp-height"
          ariaLabel={t('healthProfile.height')}
          step={0.5}
          className={inputClass('heightCm')}
        />
      </FormField>

      {/* Weight */}
      <FormField label={t('healthProfile.weight')} error={errors.weightKg} className="">
        <StringNumberController<HealthProfileFormData>
          name="weightKg"
          control={control}
          testId="hp-weight"
          ariaLabel={t('healthProfile.weight')}
          step={0.1}
          className={inputClass('weightKg')}
        />
      </FormField>

      {goalWeightWarning && (
        <div
          data-testid="goal-weight-warning"
          className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{goalWeightWarning}</span>
        </div>
      )}

      {/* Activity Level */}
      <div>
        <label htmlFor="hp-activity" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('healthProfile.activityLevel')}
        </label>
        <Controller
          name="activityLevel"
          control={control}
          render={({ field }) => (
            <select
              id="hp-activity"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              className={`${inputBase} border border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/50 dark:border-slate-600`}
            >
              {ACTIVITY_LEVELS.map(level => (
                <option key={level} value={level}>
                  {t(ACTIVITY_LEVEL_I18N[level])}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      {/* Body Fat % */}
      <div>
        <label htmlFor="hp-bodyfat" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('healthProfile.bodyFat')}
          <span className="ml-1 text-xs text-slate-400">({t('healthProfile.bodyFatOptional')})</span>
        </label>
        <StringNumberController<HealthProfileFormData>
          name="bodyFatPct"
          control={control}
          testId="hp-bodyfat"
          ariaLabel={t('healthProfile.bodyFat')}
          step={0.1}
          placeholder={t('healthProfile.bodyFatOptional')}
          className={inputClass('bodyFatPct')}
        />
      </div>

      {/* BMR Override */}
      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('healthProfile.bmr')}
        </legend>
        <Controller
          name="bmrOverrideEnabled"
          control={control}
          render={({ field }) => (
            <div className="mb-2 flex gap-2" role="radiogroup" aria-label={t('healthProfile.bmr')}>
              <label
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none ${
                  field.value
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={!field.value}
                  aria-checked={!field.value}
                  onChange={() => field.onChange(false)}
                  name="bmr-override"
                />
                {t('healthProfile.bmrAuto')}
              </label>
              <label
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none ${
                  field.value
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={field.value === true}
                  aria-checked={field.value === true}
                  onChange={() => field.onChange(true)}
                  name="bmr-override"
                />
                {t('healthProfile.bmrCustom')}
              </label>
            </div>
          )}
        />
        {watchedBmrOverrideEnabled && (
          <StringNumberController<HealthProfileFormData>
            name="bmrOverride"
            control={control}
            testId="bmr-override-input"
            ariaLabel={`${t('healthProfile.bmr')} ${t('healthProfile.bmrCustom')}`}
            inputMode="numeric"
            className={inputClass('bmrOverride')}
          />
        )}
      </fieldset>

      {/* Protein Ratio */}
      <FormField label={t('healthProfile.proteinRatio')} error={errors.proteinRatio} className="">
        <StringNumberController<HealthProfileFormData>
          name="proteinRatio"
          control={control}
          testId="hp-protein"
          ariaLabel={t('healthProfile.proteinRatio')}
          step={0.1}
          className={inputClass('proteinRatio')}
        />
      </FormField>

      {/* Computed Values */}
      <div className="space-y-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{t('healthProfile.bmr')}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200" data-testid="bmr-value">
            {bmr} kcal
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{t('healthProfile.tdee')}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200" data-testid="tdee-value">
            {tdee} kcal
          </span>
        </div>
        <div className="border-t border-emerald-200 pt-2 dark:border-emerald-800">
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('healthProfile.macroPreview')}
          </p>
          <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3">
            <div className="rounded-lg bg-white p-2 dark:bg-slate-800">
              <p className="text-slate-500 dark:text-slate-400">{t('common.protein')}</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400" data-testid="macro-protein">
                {macros.proteinG}g
              </p>
            </div>
            <div className="rounded-lg bg-white p-2 dark:bg-slate-800">
              <p className="text-slate-500 dark:text-slate-400">{t('common.fat')}</p>
              <p className="font-bold text-amber-600 dark:text-amber-400" data-testid="macro-fat">
                {macros.fatG}g
              </p>
            </div>
            <div className="rounded-lg bg-white p-2 dark:bg-slate-800">
              <p className="text-slate-500 dark:text-slate-400">{t('common.carbs')}</p>
              <p className="font-bold text-blue-600 dark:text-blue-400" data-testid="macro-carbs">
                {macros.carbsG}g
              </p>
            </div>
          </div>
        </div>
      </div>

      {!embedded && (
        <button
          type="button"
          onClick={() => void handleSave()}
          className="w-full rounded-xl bg-emerald-500 py-3 font-medium text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-[0.98]"
        >
          {saved && !isDirty ? t('healthProfile.saved') : t('healthProfile.save')}
        </button>
      )}
    </div>
  );
}
