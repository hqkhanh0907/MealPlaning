import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Dumbbell,
  HeartPulse,
  Info,
  Moon,
  RefreshCw,
  ShieldAlert,
  Target,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getActiveSteps } from '@/components/onboarding/trainingStepConfig';

import { useFitnessStore } from '../../../store/fitnessStore';
import { EQUIPMENT_DISPLAY } from '../constants';

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
  const trainingProfile = useFitnessStore(s => s.trainingProfile);

  const visibleStepIds = useMemo(
    () => new Set(getActiveSteps(trainingProfile?.trainingExperience ?? 'beginner').map(s => s.id)),
    [trainingProfile?.trainingExperience],
  );

  if (!trainingProfile) {
    return (
      <div className="bg-muted flex items-center gap-3 rounded-xl p-4">
        <Info className="text-muted-foreground h-5 w-5 shrink-0" />
        <div>
          <p className="text-foreground-secondary text-sm font-medium">{t('settings.notConfigured')}</p>
          <p className="text-muted-foreground text-xs">{t('settings.notConfiguredDesc')}</p>
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
      value: trainingProfile.availableEquipment.map(eq => EQUIPMENT_DISPLAY[eq] ?? eq).join(', '),
    },
    ...(trainingProfile.injuryRestrictions.length > 0
      ? [
          {
            key: 'injuryRestrictions',
            label: t('fitness.onboarding.injuries'),
            value: trainingProfile.injuryRestrictions.map(inj => t(`fitness.onboarding.injury_${inj}`)).join(', '),
          },
        ]
      : []),
    {
      key: 'cardioSessionsWeek',
      label: t('fitness.onboarding.cardioSessions'),
      value: `${trainingProfile.cardioSessionsWeek} ${t('fitness.onboarding.sessionsUnit')}`,
    },
    ...(visibleStepIds.has('periodization')
      ? [
          {
            key: 'periodizationModel',
            label: t('fitness.onboarding.periodization'),
            value: t(`fitness.onboarding.period_${trainingProfile.periodizationModel}`),
          },
        ]
      : []),
    ...(visibleStepIds.has('cycleWeeks')
      ? [
          {
            key: 'planCycleWeeks',
            label: t('fitness.onboarding.cycleWeeks'),
            value: `${trainingProfile.planCycleWeeks} ${t('fitness.onboarding.weeksUnit')}`,
          },
        ]
      : []),
    ...(visibleStepIds.has('priorityMuscles') && trainingProfile.priorityMuscles.length > 0
      ? [
          {
            key: 'priorityMuscles',
            label: t('fitness.onboarding.priorityMuscles'),
            value: trainingProfile.priorityMuscles.map(m => t(`fitness.onboarding.muscle_${m}`)).join(', '),
          },
        ]
      : []),
    ...(visibleStepIds.has('sleepHours') && trainingProfile.avgSleepHours
      ? [
          {
            key: 'avgSleepHours',
            label: t('fitness.onboarding.sleepHours'),
            value: `${trainingProfile.avgSleepHours}h`,
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {fields.map(field => (
        <div key={field.key} className="bg-muted flex items-start gap-2.5 rounded-xl p-3">
          <span className="mt-0.5 text-base leading-normal">
            {(() => {
              const Icon = FIELD_ICON[field.key] ?? ClipboardList;
              return <Icon className="text-muted-foreground size-5" aria-hidden="true" />;
            })()}
          </span>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">{field.label}</p>
            <p className="text-foreground truncate text-sm font-medium">{field.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
