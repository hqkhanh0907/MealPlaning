import { Dumbbell } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TrainingProfileForm } from '../../features/fitness/components/TrainingProfileForm';
import { TrainingProfileSection } from '../../features/fitness/components/TrainingProfileSection';
import { useFitnessStore } from '../../store/fitnessStore';
import { SettingsDetailLayout } from './SettingsDetailLayout';

function TrainingProfileDetailPageInner({ onBack }: Readonly<{ onBack: () => void }>) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const trainingProfile = useFitnessStore(s => s.trainingProfile);
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
      icon={<Dumbbell className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
      isEditing={isEditing}
      hasChanges={isEditing}
      onBack={onBack}
      onEdit={() => setIsEditing(true)}
      onSave={() => void handleSave()}
      onCancel={handleCancel}
    >
      {isEditing && <TrainingProfileForm embedded saveRef={saveRef} />}
      {!isEditing && trainingProfile && <TrainingProfileSection />}
      {!isEditing && !trainingProfile && (
        <div
          className="flex flex-col items-center justify-center py-12 text-center"
          data-testid="training-profile-empty"
        >
          <Dumbbell className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="text-foreground-secondary text-sm font-medium">{t('settings.notConfigured')}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{t('settings.notConfiguredDesc')}</p>
        </div>
      )}
    </SettingsDetailLayout>
  );
}

export default function TrainingProfileDetailPage({ onBack }: Readonly<{ onBack: () => void }>) {
  return <TrainingProfileDetailPageInner onBack={onBack} />;
}
