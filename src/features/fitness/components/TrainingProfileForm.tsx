import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { FieldError } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getActiveSteps } from '@/components/onboarding/trainingStepConfig';
import { generateUUID } from '@/utils/helpers';

import { ChipSelect } from '../../../components/form/ChipSelect';
import { FormField } from '../../../components/form/FormField';
import { RadioPills } from '../../../components/form/RadioPills';
import {
  trainingProfileDefaults,
  type TrainingProfileFormData,
  trainingProfileSchema,
} from '../../../schemas/trainingProfileSchema';
import { useFitnessStore } from '../../../store/fitnessStore';
import { EQUIPMENT_DISPLAY } from '../constants';
import type {
  BodyRegion,
  EquipmentType,
  MuscleGroup,
  PeriodizationModel,
  TrainingExperience,
  TrainingGoal,
  TrainingProfile,
} from '../types';
import { getSmartDefaults } from '../utils/getSmartDefaults';

const GOALS: TrainingGoal[] = ['strength', 'hypertrophy', 'endurance', 'general'];
const EXPERIENCES: TrainingExperience[] = ['beginner', 'intermediate', 'advanced'];
const DAYS_OPTIONS = [2, 3, 4, 5, 6];
const SESSION_DURATIONS = [30, 45, 60, 90];
const EQUIPMENT_OPTIONS: EquipmentType[] = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'bands',
  'kettlebell',
];
const INJURY_OPTIONS: BodyRegion[] = ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'];
const CARDIO_OPTIONS = [0, 1, 2, 3, 4, 5];
const PERIODIZATION_OPTIONS: PeriodizationModel[] = ['linear', 'undulating', 'block'];
const CYCLE_WEEKS_OPTIONS = [4, 6, 8, 12];
const MUSCLE_OPTIONS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];
const MAX_PRIORITY_MUSCLES = 3;

interface TrainingProfileFormProps {
  embedded?: boolean;
  saveRef?: React.RefObject<(() => Promise<boolean>) | null>;
}

export function TrainingProfileForm({ embedded, saveRef }: Readonly<TrainingProfileFormProps>) {
  const { t } = useTranslation();
  const trainingProfile = useFitnessStore(s => s.trainingProfile);
  const setTrainingProfile = useFitnessStore(s => s.setTrainingProfile);

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<TrainingProfileFormData>({
    resolver: zodResolver(trainingProfileSchema),
    mode: 'onBlur',
    defaultValues: trainingProfile
      ? {
          trainingGoal: trainingProfile.trainingGoal,
          trainingExperience: trainingProfile.trainingExperience,
          daysPerWeek: trainingProfile.daysPerWeek,
          sessionDurationMin: trainingProfile.sessionDurationMin,
          availableEquipment: trainingProfile.availableEquipment,
          injuryRestrictions: trainingProfile.injuryRestrictions,
          cardioSessionsWeek: trainingProfile.cardioSessionsWeek,
          periodizationModel: trainingProfile.periodizationModel,
          planCycleWeeks: trainingProfile.planCycleWeeks,
          priorityMuscles: trainingProfile.priorityMuscles,
          avgSleepHours: trainingProfile.avgSleepHours,
        }
      : trainingProfileDefaults,
  });

  const watchedExperience = useWatch({ control, name: 'trainingExperience' });

  const visibleStepIds = useMemo(
    () => new Set(getActiveSteps(watchedExperience ?? 'beginner').map(s => s.id)),
    [watchedExperience],
  );

  const showPeriodization = visibleStepIds.has('periodization');
  const showCycleWeeks = visibleStepIds.has('cycleWeeks');
  const showPriorityMuscles = visibleStepIds.has('priorityMuscles');
  const showSleepHours = visibleStepIds.has('sleepHours');
  const hasHiddenFields = !showPeriodization || !showCycleWeeks || !showPriorityMuscles || !showSleepHours;

  function onSubmit(data: TrainingProfileFormData): boolean {
    const experience = data.trainingExperience;
    const activeStepIds = new Set(getActiveSteps(experience).map(s => s.id));
    const smart = getSmartDefaults(data.trainingGoal, experience, data.daysPerWeek);

    const updatedProfile: TrainingProfile = {
      id: trainingProfile?.id ?? generateUUID(),
      trainingGoal: data.trainingGoal,
      trainingExperience: experience,
      daysPerWeek: data.daysPerWeek,
      sessionDurationMin: data.sessionDurationMin,
      availableEquipment: data.availableEquipment,
      injuryRestrictions: data.injuryRestrictions,
      cardioSessionsWeek: data.cardioSessionsWeek,
      // Use smart defaults for hidden fields, user values for visible ones
      periodizationModel: activeStepIds.has('periodization') ? data.periodizationModel : smart.periodizationModel,
      planCycleWeeks: activeStepIds.has('cycleWeeks') ? data.planCycleWeeks : smart.planCycleWeeks,
      priorityMuscles: activeStepIds.has('priorityMuscles') ? data.priorityMuscles : smart.priorityMuscles,
      avgSleepHours: activeStepIds.has('sleepHours') ? data.avgSleepHours : undefined,
      // Preserve fields not in this form; fall back to smart defaults
      cardioTypePref: trainingProfile?.cardioTypePref ?? smart.cardioTypePref,
      cardioDurationMin: trainingProfile?.cardioDurationMin ?? smart.cardioDurationMin,
      known1rm: trainingProfile?.known1rm,
      updatedAt: new Date().toISOString(),
    };
    setTrainingProfile(updatedProfile);
    reset(data);
    return true;
  }

  async function handleSave(): Promise<boolean> {
    let result = false;
    await handleSubmit(data => {
      result = onSubmit(data);
    })();
    return result;
  }

  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  });

  return (
    <div className={embedded ? 'space-y-6' : 'space-y-6 p-4'} data-testid="training-profile-form">
      <FormField label={t('fitness.onboarding.goal')} error={errors.trainingGoal}>
        <RadioPills<TrainingProfileFormData>
          name="trainingGoal"
          control={control}
          options={GOALS.map(g => ({ value: g, label: t(`fitness.onboarding.${g}`) }))}
          testIdPrefix="goal"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.experience')} error={errors.trainingExperience}>
        <RadioPills<TrainingProfileFormData>
          name="trainingExperience"
          control={control}
          options={EXPERIENCES.map(e => ({ value: e, label: t(`fitness.onboarding.${e}`) }))}
          testIdPrefix="experience"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.daysPerWeek')} error={errors.daysPerWeek}>
        <RadioPills<TrainingProfileFormData>
          name="daysPerWeek"
          control={control}
          options={DAYS_OPTIONS.map(d => ({ value: d, label: `${d}` }))}
          testIdPrefix="days"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.sessionDuration')} error={errors.sessionDurationMin}>
        <RadioPills<TrainingProfileFormData>
          name="sessionDurationMin"
          control={control}
          options={SESSION_DURATIONS.map(d => ({
            value: d,
            label: `${d} ${t('fitness.onboarding.minutesUnit')}`,
          }))}
          testIdPrefix="duration"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.equipment')} error={errors.availableEquipment as FieldError | undefined}>
        <ChipSelect<TrainingProfileFormData>
          name="availableEquipment"
          control={control}
          options={EQUIPMENT_OPTIONS.map(eq => ({
            value: eq,
            label: EQUIPMENT_DISPLAY[eq] ?? eq,
          }))}
          testIdPrefix="equipment"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.injuries')} error={errors.injuryRestrictions as FieldError | undefined}>
        <ChipSelect<TrainingProfileFormData>
          name="injuryRestrictions"
          control={control}
          options={INJURY_OPTIONS.map(inj => ({
            value: inj,
            label: t(`fitness.onboarding.injury_${inj}`),
          }))}
          testIdPrefix="injury"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.cardioSessions')} error={errors.cardioSessionsWeek}>
        <RadioPills<TrainingProfileFormData>
          name="cardioSessionsWeek"
          control={control}
          options={CARDIO_OPTIONS.map(c => ({ value: c, label: `${c}` }))}
          testIdPrefix="cardio"
        />
      </FormField>

      {showPeriodization && (
        <FormField label={t('fitness.onboarding.periodization')} error={errors.periodizationModel}>
          <RadioPills<TrainingProfileFormData>
            name="periodizationModel"
            control={control}
            options={PERIODIZATION_OPTIONS.map(p => ({
              value: p,
              label: t(`fitness.onboarding.period_${p}`),
            }))}
            testIdPrefix="periodization"
          />
        </FormField>
      )}

      {showCycleWeeks && (
        <FormField label={t('fitness.onboarding.cycleWeeks')} error={errors.planCycleWeeks}>
          <RadioPills<TrainingProfileFormData>
            name="planCycleWeeks"
            control={control}
            options={CYCLE_WEEKS_OPTIONS.map(w => ({
              value: w,
              label: `${w} ${t('fitness.onboarding.weeksUnit')}`,
            }))}
            testIdPrefix="cycle-weeks"
          />
        </FormField>
      )}

      {showPriorityMuscles && (
        <FormField
          label={`${t('fitness.onboarding.priorityMuscles')} (${t('fitness.onboarding.maxItems', { count: MAX_PRIORITY_MUSCLES })})`}
          error={errors.priorityMuscles as FieldError | undefined}
        >
          <ChipSelect<TrainingProfileFormData>
            name="priorityMuscles"
            control={control}
            options={MUSCLE_OPTIONS.map(m => ({
              value: m,
              label: t(`fitness.onboarding.muscle_${m}`),
            }))}
            maxItems={MAX_PRIORITY_MUSCLES}
            testIdPrefix="priority-muscles"
          />
        </FormField>
      )}

      {showSleepHours && (
        <FormField label={t('fitness.onboarding.sleepHours')} error={errors.avgSleepHours}>
          <input
            type="number"
            min={3}
            max={12}
            step={0.5}
            className="bg-card focus:border-primary focus:ring-ring border-border text-foreground w-full rounded-xl border px-4 py-3 text-sm transition-colors outline-none focus:ring-1"
            data-testid="sleep-hours-input"
            {...register('avgSleepHours', { valueAsNumber: true })}
          />
        </FormField>
      )}

      {hasHiddenFields && (
        <div
          className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
          data-testid="smart-defaults-banner"
        >
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('fitness.onboarding.smartDefaultsApplied')}</span>
        </div>
      )}
    </div>
  );
}
