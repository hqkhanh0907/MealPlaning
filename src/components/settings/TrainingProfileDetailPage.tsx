import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dumbbell, Info } from 'lucide-react';
import { TrainingProfileSection } from '../../features/fitness/components/TrainingProfileSection';
import { useFitnessStore } from '../../store/fitnessStore';
import { SettingsDetailLayout } from './SettingsDetailLayout';

function TrainingProfileDetailPageInner({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const trainingProfile = useFitnessStore((s) => s.trainingProfile);

  const handleSave = () => {
    setIsEditing(false);
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
      onSave={handleSave}
      onCancel={handleCancel}
    >
      {isEditing ? (
        <div className="space-y-4" data-testid="training-profile-edit">
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('settings.trainingProfileEditHint')}
            </p>
          </div>
          <TrainingProfileSection />
        </div>
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
