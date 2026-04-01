import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, User, Calendar, Ruler, Scale, Activity, Beef, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DatabaseProvider } from '../../contexts/DatabaseContext';
import { useHealthProfileStore } from '../../features/health-profile/store/healthProfileStore';
import { HealthProfileForm } from '../../features/health-profile/components/HealthProfileForm';
import { calculateBMR, calculateTDEE, calculateMacros } from '../../services/nutritionEngine';
import { SettingsDetailLayout } from './SettingsDetailLayout';

const ACTIVITY_LEVEL_I18N: Record<string, string> = {
  sedentary: 'healthProfile.sedentary',
  light: 'healthProfile.light',
  moderate: 'healthProfile.moderate',
  active: 'healthProfile.active',
  extra_active: 'healthProfile.extraActive',
};

function HealthProfileViewMode() {
  const { t } = useTranslation();
  const profile = useHealthProfileStore((s) => s.profile);

  const bmr = useMemo(
    () => profile.bmrOverride ?? calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender),
    [profile.bmrOverride, profile.weightKg, profile.heightCm, profile.age, profile.gender],
  );
  const tdee = useMemo(() => calculateTDEE(bmr, profile.activityLevel), [bmr, profile.activityLevel]);
  const macros = useMemo(() => {
    const bodyFatFraction = profile.bodyFatPct == null ? undefined : profile.bodyFatPct / 100;
    return calculateMacros(tdee, profile.weightKg, profile.proteinRatio, profile.fatPct, bodyFatFraction);
  }, [tdee, profile.weightKg, profile.proteinRatio, profile.fatPct, profile.bodyFatPct]);

  const fields: { label: string; value: string; icon: LucideIcon }[] = [
    { label: t('healthProfile.gender'), value: t(`healthProfile.${profile.gender}`), icon: User },
    { label: t('healthProfile.age'), value: `${profile.age}`, icon: Calendar },
    { label: t('healthProfile.height'), value: `${profile.heightCm} cm`, icon: Ruler },
    { label: t('healthProfile.weight'), value: `${profile.weightKg} kg`, icon: Scale },
    { label: t('healthProfile.activityLevel'), value: t(ACTIVITY_LEVEL_I18N[profile.activityLevel] ?? ''), icon: Activity },
    { label: t('healthProfile.proteinRatio'), value: `${profile.proteinRatio} g/kg`, icon: Beef },
    ...(profile.bodyFatPct == null ? [] : [{ label: t('healthProfile.bodyFat'), value: `${profile.bodyFatPct}%`, icon: BarChart3 }]),
  ];

  return (
    <div className="space-y-6" data-testid="health-profile-view">
      {/* Profile Fields */}
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <div
            key={field.label}
            className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
          >
            <span className="text-base leading-none mt-0.5">{(() => { const Icon = field.icon; return <Icon className="size-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />; })()}</span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">{field.label}</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{field.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Computed Values */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{t('healthProfile.bmr')}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{bmr} kcal</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{t('healthProfile.tdee')}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{tdee} kcal</span>
        </div>
        <div className="border-t border-emerald-200 dark:border-emerald-800 pt-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('healthProfile.macroPreview')}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">{t('common.protein')}</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">{macros.proteinG}g</p>
            </div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">{t('common.fat')}</p>
              <p className="font-bold text-amber-600 dark:text-amber-400">{macros.fatG}g</p>
            </div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">{t('common.carbs')}</p>
              <p className="font-bold text-blue-600 dark:text-blue-400">{macros.carbsG}g</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthProfileDetailPageInner({ onBack }: Readonly<{ onBack: () => void }>) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const saveRef = useRef<(() => Promise<boolean>) | null>(null);

  const handleSave = async () => {
    if (saveRef.current) {
      const success = await saveRef.current();
      if (success) {
        setIsEditing(false);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <SettingsDetailLayout
      title={t('settings.healthProfileSection')}
      icon={<Heart className="w-5 h-5 text-rose-500 dark:text-rose-400" />}
      isEditing={isEditing}
      hasChanges={isEditing}
      onBack={onBack}
      onEdit={() => setIsEditing(true)}
      onSave={() => void handleSave()}
      onCancel={handleCancel}
    >
      {isEditing ? (
        <DatabaseProvider>
          <HealthProfileForm embedded saveRef={saveRef} />
        </DatabaseProvider>
      ) : (
        <HealthProfileViewMode />
      )}
    </SettingsDetailLayout>
  );
}

export default function HealthProfileDetailPage({ onBack }: Readonly<{ onBack: () => void }>) {
  return <HealthProfileDetailPageInner onBack={onBack} />;
}
