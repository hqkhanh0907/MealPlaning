import type { LucideIcon } from 'lucide-react';
import { Activity, BarChart3, Beef, Calendar, CalendarDays, Heart, Ruler, Scale, User, UserCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
          <div key={field.label} className="bg-muted flex items-start gap-2.5 rounded-xl p-3">
            <span className="mt-0.5 text-base leading-normal">
              {(() => {
                const Icon = field.icon;
                return <Icon className="text-muted-foreground size-5" aria-hidden="true" />;
              })()}
            </span>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">{field.label}</p>
              <p className="text-foreground text-sm font-medium">{field.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Computed Values */}
      <div className="bg-primary-subtle space-y-3 rounded-xl p-4">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">{t('healthProfile.bmr')}</span>
          <span className="text-foreground font-semibold">{bmr} kcal</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">{t('healthProfile.tdee')}</span>
          <span className="text-foreground font-semibold">{tdee} kcal</span>
        </div>
        <div className="border-primary/20 border-t pt-2">
          <p className="text-foreground mb-2 text-sm font-medium">{t('healthProfile.macroPreview')}</p>
          <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3">
            <div className="bg-card rounded-lg p-4">
              <p className="text-muted-foreground">{t('common.protein')}</p>
              <p className="text-primary font-semibold">{macros.proteinG}g</p>
            </div>
            <div className="bg-card rounded-lg p-4">
              <p className="text-muted-foreground">{t('common.fat')}</p>
              <p className="text-color-energy font-semibold">{macros.fatG}g</p>
            </div>
            <div className="bg-card rounded-lg p-4">
              <p className="text-muted-foreground">{t('common.carbs')}</p>
              <p className="text-macro-carbs font-semibold">{macros.carbsG}g</p>
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
  const [isSaving, setIsSaving] = useState(false);
  const saveRef = useRef<(() => Promise<boolean>) | null>(null);

  const handleSave = async () => {
    if (saveRef.current) {
      setIsSaving(true);
      try {
        const success = await saveRef.current();
        if (success) {
          setIsEditing(false);
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <SettingsDetailLayout
      title={t('settings.healthProfileSection')}
      icon={<Heart className="text-color-rose h-5 w-5" />}
      isEditing={isEditing}
      hasChanges={isEditing}
      isSaving={isSaving}
      onBack={onBack}
      onEdit={() => setIsEditing(true)}
      onSave={() => void handleSave()}
      onCancel={handleCancel}
    >
      {isEditing ? <HealthProfileForm embedded saveRef={saveRef} /> : <HealthProfileViewMode />}
    </SettingsDetailLayout>
  );
}

export default function HealthProfileDetailPage({ onBack }: Readonly<{ onBack: () => void }>) {
  return <HealthProfileDetailPageInner onBack={onBack} />;
}
