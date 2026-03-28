import { useTranslation } from 'react-i18next';
import { useFitnessStore } from '../../../store/fitnessStore';
import { EQUIPMENT_DISPLAY } from '../constants';
import {
  Info,
  Target,
  BarChart3,
  Calendar,
  Timer,
  Dumbbell,
  ShieldAlert,
  TrendingUp,
  RefreshCw,
  HeartPulse,
  Moon,
  ClipboardList,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const FIELD_ICON: Record<string, LucideIcon> = {
  trainingGoal: Target,
  trainingExperience: BarChart3,
  daysPerWeek: Calendar,
  sessionDurationMin: Timer,
  availableEquipment: Dumbbell,
  injuryRestrictions: ShieldAlert,
  periodizationModel: TrendingUp,
  planCycleWeeks: RefreshCw,
  priorityMuscles: Dumbbell,
  cardioSessionsWeek: HeartPulse,
  avgSleepHours: Moon,
};

export function TrainingProfileSection() {
  const { t } = useTranslation();
  const trainingProfile = useFitnessStore((s) => s.trainingProfile);

  if (!trainingProfile) {
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
        <Info className="w-5 h-5 text-slate-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t('settings.notConfigured')}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('settings.notConfiguredDesc')}
          </p>
        </div>
      </div>
    );
  }

  const fields = [
    {
      key: 'trainingGoal',
      label: t('fitness.onboarding.goal'),
      value: t(`fitness.onboarding.${trainingProfile.trainingGoal}`),
    },
    {
      key: 'trainingExperience',
      label: t('fitness.onboarding.experience'),
      value: t(`fitness.onboarding.${trainingProfile.trainingExperience}`),
    },
    {
      key: 'daysPerWeek',
      label: t('fitness.onboarding.daysPerWeek'),
      value: `${trainingProfile.daysPerWeek} ${t('fitness.onboarding.daysUnit')}`,
    },
    {
      key: 'sessionDurationMin',
      label: t('fitness.onboarding.sessionDuration'),
      value: `${trainingProfile.sessionDurationMin} ${t('fitness.onboarding.minutesUnit')}`,
    },
    {
      key: 'availableEquipment',
      label: t('fitness.onboarding.equipment'),
      value: trainingProfile.availableEquipment
        .map((eq) => EQUIPMENT_DISPLAY[eq] ?? eq)
        .join(', '),
    },
    ...(trainingProfile.injuryRestrictions.length > 0
      ? [{
          key: 'injuryRestrictions',
          label: t('fitness.onboarding.injuries'),
          value: trainingProfile.injuryRestrictions
            .map((inj) => t(`fitness.onboarding.injury_${inj}`))
            .join(', '),
        }]
      : []),
    {
      key: 'cardioSessionsWeek',
      label: t('fitness.onboarding.cardioSessions'),
      value: `${trainingProfile.cardioSessionsWeek} ${t('fitness.onboarding.sessionsUnit')}`,
    },
    {
      key: 'periodizationModel',
      label: t('fitness.onboarding.periodization'),
      value: t(`fitness.onboarding.period_${trainingProfile.periodizationModel}`),
    },
    {
      key: 'planCycleWeeks',
      label: t('fitness.onboarding.cycleWeeks'),
      value: `${trainingProfile.planCycleWeeks} ${t('fitness.onboarding.weeksUnit')}`,
    },
    ...(trainingProfile.priorityMuscles.length > 0
      ? [{
          key: 'priorityMuscles',
          label: t('fitness.onboarding.priorityMuscles'),
          value: trainingProfile.priorityMuscles
            .map((m) => t(`fitness.onboarding.muscle_${m}`))
            .join(', '),
        }]
      : []),
    ...(trainingProfile.avgSleepHours
      ? [{
          key: 'avgSleepHours',
          label: t('fitness.onboarding.sleepHours'),
          value: `${trainingProfile.avgSleepHours}h`,
        }]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map((field) => (
        <div
          key={field.key}
          className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
        >
          <span className="text-base leading-none mt-0.5">
            {(() => { const Icon = FIELD_ICON[field.key] ?? ClipboardList; return <Icon className="size-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />; })()}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {field.label}
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {field.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
