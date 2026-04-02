import type { LucideIcon } from 'lucide-react';
import { Activity, BarChart3, Beef, Calendar, CalendarDays, Heart, Ruler, Scale, User, UserCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DatabaseProvider } from '../../contexts/DatabaseContext';
import { HealthProfileForm } from '../../features/health-profile/components/HealthProfileForm';
import { useHealthProfileStore } from '../../features/health-profile/store/healthProfileStore';
import { getAge } from '../../features/health-profile/types';
import { calculateBMR, calculateMacros, calculateTDEE } from '../../services/nutritionEngine';
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
  const profile = useHealthProfileStore(s => s.profile);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{t('healthProfile.notConfigured')}</p>
      </div>
    );
  }

  const computedAge = getAge(profile);

  const bmr = profile.bmrOverride ?? calculateBMR(profile.weightKg, profile.heightCm, computedAge, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const macros = (() => {
    const bodyFatFraction = profile.bodyFatPct == null ? undefined : profile.bodyFatPct / 100;
    return calculateMacros(tdee, profile.weightKg, profile.proteinRatio, profile.fatPct, bodyFatFraction);
  })();

  const formatDob = (dob: string | null): string => {
    if (!dob) return t('healthProfile.notSet');
    const d = new Date(dob);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const fields: { label: string; value: string; icon: LucideIcon }[] = [
    ...(profile.name ? [{ label: t('healthProfile.name'), value: profile.name, icon: UserCircle as LucideIcon }] : []),
    { label: t('healthProfile.gender'), value: t(`healthProfile.${profile.gender}`), icon: User },
    ...(profile.dateOfBirth
      ? [
          {
            label: t('healthProfile.dateOfBirth'),
            value: formatDob(profile.dateOfBirth),
            icon: CalendarDays as LucideIcon,
          },
        ]
      : []),
    { label: t('healthProfile.age'), value: `${computedAge}`, icon: Calendar },
    { label: t('healthProfile.height'), value: `${profile.heightCm} cm`, icon: Ruler },
    { label: t('healthProfile.weight'), value: `${profile.weightKg} kg`, icon: Scale },
    {
      label: t('healthProfile.activityLevel'),
      value: t(ACTIVITY_LEVEL_I18N[profile.activityLevel] ?? ''),
      icon: Activity,
    },
    { label: t('healthProfile.proteinRatio'), value: `${profile.proteinRatio} g/kg`, icon: Beef },
    ...(profile.bodyFatPct == null
      ? []
      : [{ label: t('healthProfile.bodyFat'), value: `${profile.bodyFatPct}%`, icon: BarChart3 as LucideIcon }]),
  ];

  return (
    <div className="space-y-6" data-testid="health-profile-view">
      {/* Profile Fields */}
      <div className="grid grid-cols-2 gap-3">
        {fields.map(field => (
          <div key={field.label} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-700/50">
            <span className="mt-0.5 text-base leading-none">
              {(() => {
                const Icon = field.icon;
                return <Icon className="text-muted-foreground size-5" aria-hidden="true" />;
              })()}
            </span>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">{field.label}</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{field.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Computed Values */}
      <div className="space-y-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{t('healthProfile.bmr')}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{bmr} kcal</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{t('healthProfile.tdee')}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{tdee} kcal</span>
        </div>
        <div className="border-t border-emerald-200 pt-2 dark:border-emerald-800">
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('healthProfile.macroPreview')}
          </p>
          <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3">
            <div className="bg-card rounded-lg p-2">
              <p className="text-muted-foreground">{t('common.protein')}</p>
              <p className="text-primary font-bold">{macros.proteinG}g</p>
            </div>
            <div className="bg-card rounded-lg p-2">
              <p className="text-muted-foreground">{t('common.fat')}</p>
              <p className="font-bold text-amber-600 dark:text-amber-400">{macros.fatG}g</p>
            </div>
            <div className="bg-card rounded-lg p-2">
              <p className="text-muted-foreground">{t('common.carbs')}</p>
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
      icon={<Heart className="h-5 w-5 text-rose-500 dark:text-rose-400" />}
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
