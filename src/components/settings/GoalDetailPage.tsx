import type { LucideIcon } from 'lucide-react';
import { Flame, Minus, Scale, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/shared/EmptyState';
import { createSurfaceStateContract, resolveCanonicalSurfaceState } from '@/components/shared/surfaceState';

import { GoalPhaseSelector } from '../../features/health-profile/components/GoalPhaseSelector';
import { useHealthProfileStore } from '../../features/health-profile/store/healthProfileStore';
import { SettingsDetailLayout } from './SettingsDetailLayout';

const GOAL_ICON: Record<string, typeof TrendingDown> = {
  cut: TrendingDown,
  maintain: Minus,
  bulk: TrendingUp,
};

const GOAL_COLOR: Record<string, string> = {
  cut: 'text-info',
  maintain: 'text-primary',
  bulk: 'text-energy',
};

function GoalViewMode() {
  const { t } = useTranslation();
  const activeGoal = useHealthProfileStore(s => s.activeGoal);

  const fields: { label: string; value: string; icon: LucideIcon; color: string }[] = useMemo(() => {
    if (!activeGoal) return [];
    const result: { label: string; value: string; icon: LucideIcon; color: string }[] = [
      { label: t('goal.title'), value: t(`goal.${activeGoal.type}`), icon: Target, color: 'text-primary' },
    ];
    if (activeGoal.type !== 'maintain' && activeGoal.rateOfChange) {
      result.push({
        label: t('goal.rateOfChange'),
        value: t(`goal.${activeGoal.rateOfChange}`),
        icon: Zap,
        color: 'text-warning',
      });
    }
    if (activeGoal.targetWeightKg) {
      result.push({
        label: t('goal.targetWeight'),
        value: `${activeGoal.targetWeightKg} kg`,
        icon: Scale,
        color: 'text-muted-foreground',
      });
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
      color: 'text-energy',
    });
    return result;
  }, [activeGoal, t]);

  if (!activeGoal) {
    const emptyStateContract = createSurfaceStateContract({
      surface: 'settings.goal',
      state: resolveCanonicalSurfaceState({ isConfigured: false }),
      copy: {
        title: t('settings.goalNotSet'),
        missing: t('settings.goalSection'),
        reason: t('settings.goalDesc'),
        nextStep: t('settings.goalMissingNextStep'),
      },
    });

    return (
      <div data-testid="goal-view-empty">
        <EmptyState icon={Target} title={t('settings.goalNotSet')} contract={emptyStateContract} className="py-12" />
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
          <p className="text-foreground text-xl font-semibold">{t(`goal.${activeGoal.type}`)}</p>
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
                return <Icon className={`${field.color} size-5`} aria-hidden="true" />;
              })()}
            </span>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">{field.label}</p>
              <p className="text-foreground text-sm font-medium tabular-nums">{field.value}</p>
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
    setIsFormValid(true);
  };

  return (
    <SettingsDetailLayout
      title={t('settings.goalSection')}
      icon={<Target className="text-primary h-5 w-5" />}
      isEditing={isEditing}
      hasChanges={isEditing && isFormValid}
      isSaving={isSaving}
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
