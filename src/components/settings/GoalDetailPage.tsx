import type { LucideIcon } from 'lucide-react';
import { Flame, Minus, Scale, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GoalPhaseSelector } from '../../features/health-profile/components/GoalPhaseSelector';
import { useHealthProfileStore } from '../../features/health-profile/store/healthProfileStore';
import { SettingsDetailLayout } from './SettingsDetailLayout';

const GOAL_ICON: Record<string, typeof TrendingDown> = {
  cut: TrendingDown,
  maintain: Minus,
  bulk: TrendingUp,
};

const GOAL_COLOR: Record<string, string> = {
  cut: 'text-blue-600 dark:text-blue-400',
  maintain: 'text-primary',
  bulk: 'text-orange-600 dark:text-orange-400',
};

function GoalViewMode() {
  const { t } = useTranslation();
  const activeGoal = useHealthProfileStore(s => s.activeGoal);

  const fields: { label: string; value: string; icon: LucideIcon }[] = useMemo(() => {
    if (!activeGoal) return [];
    const result: { label: string; value: string; icon: LucideIcon }[] = [
      { label: t('goal.title'), value: t(`goal.${activeGoal.type}`), icon: Target },
    ];
    if (activeGoal.type !== 'maintain' && activeGoal.rateOfChange) {
      result.push({ label: t('goal.rateOfChange'), value: t(`goal.${activeGoal.rateOfChange}`), icon: Zap });
    }
    if (activeGoal.targetWeightKg) {
      result.push({ label: t('goal.targetWeight'), value: `${activeGoal.targetWeightKg} kg`, icon: Scale });
    }
    let calorieLabel: string;
    if (activeGoal.calorieOffset > 0) {
      calorieLabel = `+${activeGoal.calorieOffset} kcal`;
    } else if (activeGoal.calorieOffset < 0) {
      calorieLabel = `${activeGoal.calorieOffset} kcal`;
    } else {
      calorieLabel = '±0 kcal';
    }
    result.push({
      label: t('goal.calorieOffset'),
      value: calorieLabel,
      icon: Flame,
    });
    return result;
  }, [activeGoal, t]);

  if (!activeGoal) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="goal-view-empty">
        <Target className="text-muted-foreground mb-3 h-12 w-12" />
        <p className="text-foreground-secondary text-sm font-medium">{t('settings.goalNotSet')}</p>
        <p className="text-muted-foreground mt-1 text-xs">{t('settings.goalDesc')}</p>
      </div>
    );
  }

  const GoalIcon = GOAL_ICON[activeGoal.type] ?? Minus;
  const goalColor = GOAL_COLOR[activeGoal.type] ?? '';

  return (
    <div className="space-y-6" data-testid="goal-view">
      {/* Goal Type Badge */}
      <div className="bg-muted flex items-center gap-3 rounded-xl p-4">
        <GoalIcon className={`h-6 w-6 ${goalColor}`} />
        <div>
          <p className="text-foreground text-lg font-bold">{t(`goal.${activeGoal.type}`)}</p>
          <p className="text-muted-foreground text-xs">
            {activeGoal.startDate ? new Date(activeGoal.startDate).toLocaleDateString('vi-VN') : ''}
          </p>
        </div>
      </div>

      {/* Goal Fields */}
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
    </div>
  );
}

function GoalDetailPageInner({ onBack }: Readonly<{ onBack: () => void }>) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isFormValid, setIsFormValid] = useState(true);
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
    setIsFormValid(true);
  };

  return (
    <SettingsDetailLayout
      title={t('settings.goalSection')}
      icon={<Target className="text-primary h-5 w-5" />}
      isEditing={isEditing}
      hasChanges={isEditing && isFormValid}
      onBack={onBack}
      onEdit={() => setIsEditing(true)}
      onSave={() => void handleSave()}
      onCancel={handleCancel}
    >
      {isEditing ? (
        <GoalPhaseSelector embedded saveRef={saveRef} onValidityChange={setIsFormValid} />
      ) : (
        <GoalViewMode />
      )}
    </SettingsDetailLayout>
  );
}

export default function GoalDetailPage({ onBack }: Readonly<{ onBack: () => void }>) {
  return <GoalDetailPageInner onBack={onBack} />;
}
