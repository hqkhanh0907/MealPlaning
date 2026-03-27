import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useHealthProfileStore } from '../store/healthProfileStore';
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
} from '../../../services/nutritionEngine';
import type { HealthProfile, Gender, ActivityLevel } from '../types';

const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'extra_active',
];

const ACTIVITY_LEVEL_I18N: Record<ActivityLevel, string> = {
  sedentary: 'healthProfile.sedentary',
  light: 'healthProfile.light',
  moderate: 'healthProfile.moderate',
  active: 'healthProfile.active',
  extra_active: 'healthProfile.extraActive',
};

export function HealthProfileForm() {
  const { t } = useTranslation();
  const db = useDatabase();
  const profile = useHealthProfileStore((s) => s.profile);
  const saveProfileAction = useHealthProfileStore((s) => s.saveProfile);

  const [form, setForm] = useState<HealthProfile>(() => ({ ...profile }));
  const [bmrOverrideEnabled, setBmrOverrideEnabled] = useState(
    () => profile.bmrOverride != null,
  );
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  function updateField<K extends keyof HealthProfile>(
    key: K,
    value: HealthProfile[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): boolean {
    const e: Record<string, boolean> = {};
    if (!form.age || form.age < 10 || form.age > 100) e.age = true;
    if (!form.heightCm || form.heightCm < 100 || form.heightCm > 250)
      e.heightCm = true;
    if (!form.weightKg || form.weightKg < 30 || form.weightKg > 300)
      e.weightKg = true;
    if (
      !form.proteinRatio ||
      form.proteinRatio < 0.8 ||
      form.proteinRatio > 4.0
    )
      e.proteinRatio = true;
    if (
      form.bodyFatPct != null &&
      (form.bodyFatPct < 3 || form.bodyFatPct > 60)
    )
      e.bodyFatPct = true;
    if (bmrOverrideEnabled && (!form.bmrOverride || form.bmrOverride <= 0))
      e.bmrOverride = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const bmr = useMemo(() => {
    if (bmrOverrideEnabled && form.bmrOverride) return form.bmrOverride;
    return calculateBMR(form.weightKg, form.heightCm, form.age, form.gender);
  }, [
    bmrOverrideEnabled,
    form.bmrOverride,
    form.weightKg,
    form.heightCm,
    form.age,
    form.gender,
  ]);

  const tdee = useMemo(
    () => calculateTDEE(bmr, form.activityLevel),
    [bmr, form.activityLevel],
  );

  const macros = useMemo(() => {
    const bodyFatFraction =
      form.bodyFatPct != null ? form.bodyFatPct / 100 : undefined;
    return calculateMacros(
      tdee,
      form.weightKg,
      form.proteinRatio,
      form.fatPct,
      bodyFatFraction,
    );
  }, [tdee, form.weightKg, form.proteinRatio, form.fatPct, form.bodyFatPct]);

  async function handleSave() {
    if (!validate()) return;
    const profileToSave: HealthProfile = {
      ...form,
      bmrOverride: bmrOverrideEnabled ? form.bmrOverride : undefined,
    };
    await saveProfileAction(db, profileToSave);
    setSaved(true);
  }

  const inputBase =
    'w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all';

  function inputClass(field: string): string {
    const borderColor = errors[field]
      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
      : 'border-slate-300 dark:border-slate-600 focus:ring-emerald-500/50 focus:border-emerald-500';
    return `${inputBase} border ${borderColor}`;
  }

  return (
    <div className="space-y-6" data-testid="health-profile-form">
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
        {t('healthProfile.title')}
      </h3>

      {/* Gender Toggle */}
      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('healthProfile.gender')}
        </legend>
        <div
          className="flex gap-2"
          role="radiogroup"
          aria-label={t('healthProfile.gender')}
        >
          {(['male', 'female'] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={form.gender === g}
              onClick={() => updateField('gender', g)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                form.gender === g
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {t(`healthProfile.${g}`)}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Age */}
      <div>
        <label
          htmlFor="hp-age"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {t('healthProfile.age')}
        </label>
        <input
          id="hp-age"
          type="number"
          min={10}
          max={100}
          value={form.age}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) updateField('age', v);
          }}
          className={inputClass('age')}
        />
      </div>

      {/* Height */}
      <div>
        <label
          htmlFor="hp-height"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {t('healthProfile.height')}
        </label>
        <input
          id="hp-height"
          type="number"
          min={100}
          max={250}
          value={form.heightCm}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) updateField('heightCm', v);
          }}
          className={inputClass('heightCm')}
        />
      </div>

      {/* Weight */}
      <div>
        <label
          htmlFor="hp-weight"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {t('healthProfile.weight')}
        </label>
        <input
          id="hp-weight"
          type="number"
          min={30}
          max={300}
          value={form.weightKg}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) updateField('weightKg', v);
          }}
          className={inputClass('weightKg')}
        />
      </div>

      {/* Activity Level */}
      <div>
        <label
          htmlFor="hp-activity"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {t('healthProfile.activityLevel')}
        </label>
        <select
          id="hp-activity"
          value={form.activityLevel}
          onChange={(e) =>
            updateField('activityLevel', e.target.value as ActivityLevel)
          }
          className={`${inputBase} border border-slate-300 dark:border-slate-600 focus:ring-emerald-500/50 focus:border-emerald-500`}
        >
          {ACTIVITY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {t(ACTIVITY_LEVEL_I18N[level])}
            </option>
          ))}
        </select>
      </div>

      {/* Body Fat % */}
      <div>
        <label
          htmlFor="hp-bodyfat"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {t('healthProfile.bodyFat')}
          <span className="ml-1 text-slate-400 text-xs">
            ({t('healthProfile.bodyFatOptional')})
          </span>
        </label>
        <input
          id="hp-bodyfat"
          type="number"
          min={3}
          max={60}
          step={0.1}
          value={form.bodyFatPct ?? ''}
          onChange={(e) => {
            if (e.target.value === '') {
              updateField('bodyFatPct', undefined);
            } else {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) updateField('bodyFatPct', v);
            }
          }}
          placeholder={t('healthProfile.bodyFatOptional')}
          className={inputClass('bodyFatPct')}
        />
      </div>

      {/* BMR Override */}
      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('healthProfile.bmr')}
        </legend>
        <div
          className="flex gap-2 mb-2"
          role="radiogroup"
          aria-label={t('healthProfile.bmr')}
        >
          <button
            type="button"
            role="radio"
            aria-checked={!bmrOverrideEnabled}
            onClick={() => {
              setBmrOverrideEnabled(false);
              setSaved(false);
            }}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !bmrOverrideEnabled
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {t('healthProfile.bmrAuto')}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={bmrOverrideEnabled}
            onClick={() => {
              setBmrOverrideEnabled(true);
              setSaved(false);
            }}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              bmrOverrideEnabled
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {t('healthProfile.bmrCustom')}
          </button>
        </div>
        {bmrOverrideEnabled && (
          <input
            data-testid="bmr-override-input"
            type="number"
            aria-label={`${t('healthProfile.bmr')} ${t('healthProfile.bmrCustom')}`}
            min={1}
            value={form.bmrOverride ?? ''}
            onChange={(e) => {
              if (e.target.value === '') {
                updateField('bmrOverride', undefined);
              } else {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) updateField('bmrOverride', v);
              }
            }}
            className={inputClass('bmrOverride')}
          />
        )}
      </fieldset>

      {/* Protein Ratio */}
      <div>
        <label
          htmlFor="hp-protein"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {t('healthProfile.proteinRatio')}
        </label>
        <input
          id="hp-protein"
          type="number"
          min={0.8}
          max={4.0}
          step={0.1}
          value={form.proteinRatio}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) updateField('proteinRatio', v);
          }}
          className={inputClass('proteinRatio')}
        />
      </div>

      {/* Computed Values */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {t('healthProfile.bmr')}
          </span>
          <span
            className="font-semibold text-slate-800 dark:text-slate-200"
            data-testid="bmr-value"
          >
            {bmr} kcal
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {t('healthProfile.tdee')}
          </span>
          <span
            className="font-semibold text-slate-800 dark:text-slate-200"
            data-testid="tdee-value"
          >
            {tdee} kcal
          </span>
        </div>
        <div className="border-t border-emerald-200 dark:border-emerald-800 pt-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('healthProfile.macroPreview')}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">
                {t('common.protein')}
              </p>
              <p
                className="font-bold text-emerald-600 dark:text-emerald-400"
                data-testid="macro-protein"
              >
                {macros.proteinG}g
              </p>
            </div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">
                {t('common.fat')}
              </p>
              <p
                className="font-bold text-amber-600 dark:text-amber-400"
                data-testid="macro-fat"
              >
                {macros.fatG}g
              </p>
            </div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">
                {t('common.carbs')}
              </p>
              <p
                className="font-bold text-blue-600 dark:text-blue-400"
                data-testid="macro-carbs"
              >
                {macros.carbsG}g
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={() => void handleSave()}
        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all active:scale-[0.98] shadow-sm"
      >
        {saved ? t('healthProfile.saved') : t('healthProfile.save')}
      </button>
    </div>
  );
}
