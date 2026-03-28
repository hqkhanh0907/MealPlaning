import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dumbbell } from 'lucide-react';
import { TrainingProfileSection } from '../../features/fitness/components/TrainingProfileSection';
import { TrainingProfileForm } from '../../features/fitness/components/TrainingProfileForm';
import { useFitnessStore } from '../../store/fitnessStore';
import { SettingsDetailLayout } from './SettingsDetailLayout';

function TrainingProfileDetailPageInner({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const trainingProfile = useFitnessStore((s) => s.trainingProfile);
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
      title={t('settings.trainingProfileSection')}
      icon={<Dumbbell className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
      isEditing={isEditing}
      hasChanges={isEditing}
      onBack={onBack}
      onEdit={() => setIsEditing(true)}
      onSave={() => void handleSave()}
      onCancel={handleCancel}
    >
      {isEditing ? (
        <TrainingProfileForm embedded saveRef={saveRef} />
      ) : (
        trainingProfile ? (
          <TrainingProfileSection />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="training-profile-empty">
            <Dumbbell className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {t('settings.notConfigured')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {t('settings.notConfiguredDesc')}
            </p>
          </div>
        )
      )}
    </SettingsDetailLayout>
  );
}

export default function TrainingProfileDetailPage({ onBack }: { onBack: () => void }) {
  return <TrainingProfileDetailPageInner onBack={onBack} />;
}
