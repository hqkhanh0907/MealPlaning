import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, TrendingDown, Equal, TrendingUp, Zap, Scale, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DatabaseProvider } from '../../contexts/DatabaseContext';
import { useHealthProfileStore } from '../../features/health-profile/store/healthProfileStore';
import { GoalPhaseSelector } from '../../features/health-profile/components/GoalPhaseSelector';
import { SettingsDetailLayout } from './SettingsDetailLayout';

const GOAL_ICON: Record<string, typeof TrendingDown> = {
  cut: TrendingDown,
  maintain: Equal,
  bulk: TrendingUp,
};

const GOAL_COLOR: Record<string, string> = {
  cut: 'text-amber-600 dark:text-amber-400',
  maintain: 'text-emerald-600 dark:text-emerald-400',
  bulk: 'text-blue-600 dark:text-blue-400',
};

function GoalViewMode() {
  const { t } = useTranslation();
  const activeGoal = useHealthProfileStore((s) => s.activeGoal);

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
        <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {t('settings.goalNotSet')}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {t('settings.goalDesc')}
        </p>
      </div>
    );
  }

  const GoalIcon = GOAL_ICON[activeGoal.type] ?? Equal;
  const goalColor = GOAL_COLOR[activeGoal.type] ?? '';

  return (
    <div className="space-y-6" data-testid="goal-view">
      {/* Goal Type Badge */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
        <GoalIcon className={`w-8 h-8 ${goalColor}`} />
        <div>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {t(`goal.${activeGoal.type}`)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeGoal.startDate ? new Date(activeGoal.startDate).toLocaleDateString('vi-VN') : ''}
          </p>
        </div>
      </div>

      {/* Goal Fields */}
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
    </div>
  );
}

function GoalDetailPageInner({ onBack }: Readonly<{ onBack: () => void }>) {
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
      title={t('settings.goalSection')}
      icon={<Target className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />}
      isEditing={isEditing}
      hasChanges={isEditing}
      onBack={onBack}
      onEdit={() => setIsEditing(true)}
      onSave={() => void handleSave()}
      onCancel={handleCancel}
    >
      {isEditing ? (
        <DatabaseProvider>
          <GoalPhaseSelector embedded saveRef={saveRef} />
        </DatabaseProvider>
      ) : (
        <GoalViewMode />
      )}
    </SettingsDetailLayout>
  );
}

export default function GoalDetailPage({ onBack }: Readonly<{ onBack: () => void }>) {
  return <GoalDetailPageInner onBack={onBack} />;
}
