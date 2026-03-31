import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useFitnessStore } from '../../../store/fitnessStore';
import {
  trainingProfileSchema,
  trainingProfileDefaults,
  type TrainingProfileFormData,
} from '../../../schemas/trainingProfileSchema';
import { RadioPills } from '../../../components/form/RadioPills';
import { ChipSelect } from '../../../components/form/ChipSelect';
import { FormField } from '../../../components/form/FormField';
import { EQUIPMENT_DISPLAY } from '../constants';
import type {
  TrainingGoal,
  TrainingExperience,
  TrainingProfile,
  PeriodizationModel,
  EquipmentType,
  BodyRegion,
  MuscleGroup,
} from '../types';

const GOALS: TrainingGoal[] = ['strength', 'hypertrophy', 'endurance', 'general'];
const EXPERIENCES: TrainingExperience[] = ['beginner', 'intermediate', 'advanced'];
const DAYS_OPTIONS = [2, 3, 4, 5, 6];
const SESSION_DURATIONS = [30, 45, 60, 90];
const EQUIPMENT_OPTIONS: EquipmentType[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands', 'kettlebell'];
const INJURY_OPTIONS: BodyRegion[] = ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'];
const CARDIO_OPTIONS = [0, 1, 2, 3, 4, 5];
const PERIODIZATION_OPTIONS: PeriodizationModel[] = ['linear', 'undulating', 'block'];
const CYCLE_WEEKS_OPTIONS = [4, 6, 8, 12];
const MUSCLE_OPTIONS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];
const MAX_PRIORITY_MUSCLES = 3;

interface TrainingProfileFormProps {
  embedded?: boolean;
  saveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

export function TrainingProfileForm({ embedded, saveRef }: TrainingProfileFormProps) {
  const { t } = useTranslation();
  const trainingProfile = useFitnessStore((s) => s.trainingProfile);
  const setTrainingProfile = useFitnessStore((s) => s.setTrainingProfile);

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<TrainingProfileFormData>({
    resolver: zodResolver(trainingProfileSchema) as unknown as Resolver<TrainingProfileFormData>,
    mode: 'onBlur',
    defaultValues: trainingProfile
      ? {
          trainingGoal: trainingProfile.trainingGoal,
          trainingExperience: trainingProfile.trainingExperience,
          daysPerWeek: String(trainingProfile.daysPerWeek) as TrainingProfileFormData['daysPerWeek'],
          sessionDurationMin: String(trainingProfile.sessionDurationMin) as TrainingProfileFormData['sessionDurationMin'],
          availableEquipment: trainingProfile.availableEquipment,
          injuryRestrictions: trainingProfile.injuryRestrictions,
          cardioSessionsWeek: String(trainingProfile.cardioSessionsWeek) as TrainingProfileFormData['cardioSessionsWeek'],
          periodizationModel: trainingProfile.periodizationModel,
          planCycleWeeks: String(trainingProfile.planCycleWeeks) as TrainingProfileFormData['planCycleWeeks'],
          priorityMuscles: trainingProfile.priorityMuscles,
          avgSleepHours: trainingProfile.avgSleepHours,
        }
      : trainingProfileDefaults,
  });

  function onSubmit(data: TrainingProfileFormData): boolean {
    // Coerce string RadioPills values to numbers for TrainingProfile interface
    const updatedProfile: TrainingProfile = {
      id: trainingProfile?.id ?? crypto.randomUUID(),
      trainingGoal: data.trainingGoal,
      trainingExperience: data.trainingExperience,
      daysPerWeek: Number(data.daysPerWeek),
      sessionDurationMin: Number(data.sessionDurationMin),
      availableEquipment: data.availableEquipment,
      injuryRestrictions: data.injuryRestrictions,
      cardioSessionsWeek: Number(data.cardioSessionsWeek),
      periodizationModel: data.periodizationModel,
      planCycleWeeks: Number(data.planCycleWeeks),
      priorityMuscles: data.priorityMuscles,
      avgSleepHours: data.avgSleepHours,
      // Preserve fields not in this form
      cardioTypePref: trainingProfile?.cardioTypePref ?? 'mixed',
      cardioDurationMin: trainingProfile?.cardioDurationMin ?? 20,
      known1rm: trainingProfile?.known1rm,
      updatedAt: new Date().toISOString(),
    };
    setTrainingProfile(updatedProfile);
    reset(data);
    return true;
  }

  async function handleSave(): Promise<boolean> {
    let result = false;
    await handleSubmit((data) => {
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
          options={GOALS.map((g) => ({ value: g, label: t(`fitness.onboarding.${g}`) }))}
          testIdPrefix="goal"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.experience')} error={errors.trainingExperience}>
        <RadioPills<TrainingProfileFormData>
          name="trainingExperience"
          control={control}
          options={EXPERIENCES.map((e) => ({ value: e, label: t(`fitness.onboarding.${e}`) }))}
          testIdPrefix="experience"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.daysPerWeek')} error={errors.daysPerWeek}>
        <RadioPills<TrainingProfileFormData>
          name="daysPerWeek"
          control={control}
          options={DAYS_OPTIONS.map((d) => ({ value: String(d), label: `${d}` }))}
          testIdPrefix="days"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.sessionDuration')} error={errors.sessionDurationMin}>
        <RadioPills<TrainingProfileFormData>
          name="sessionDurationMin"
          control={control}
          options={SESSION_DURATIONS.map((d) => ({
            value: String(d),
            label: `${d} ${t('fitness.onboarding.minutesUnit')}`,
          }))}
          testIdPrefix="duration"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.equipment')} error={errors.availableEquipment as FieldError | undefined}>
        <ChipSelect<TrainingProfileFormData>
          name="availableEquipment"
          control={control}
          options={EQUIPMENT_OPTIONS.map((eq) => ({
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
          options={INJURY_OPTIONS.map((inj) => ({
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
          options={CARDIO_OPTIONS.map((c) => ({ value: String(c), label: `${c}` }))}
          testIdPrefix="cardio"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.periodization')} error={errors.periodizationModel}>
        <RadioPills<TrainingProfileFormData>
          name="periodizationModel"
          control={control}
          options={PERIODIZATION_OPTIONS.map((p) => ({
            value: p,
            label: t(`fitness.onboarding.period_${p}`),
          }))}
          testIdPrefix="periodization"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.cycleWeeks')} error={errors.planCycleWeeks}>
        <RadioPills<TrainingProfileFormData>
          name="planCycleWeeks"
          control={control}
          options={CYCLE_WEEKS_OPTIONS.map((w) => ({
            value: String(w),
            label: `${w} ${t('fitness.onboarding.weeksUnit')}`,
          }))}
          testIdPrefix="cycle-weeks"
        />
      </FormField>

      <FormField
        label={`${t('fitness.onboarding.priorityMuscles')} (${t('fitness.onboarding.maxItems', { count: MAX_PRIORITY_MUSCLES })})`}
        error={errors.priorityMuscles as FieldError | undefined}
      >
        <ChipSelect<TrainingProfileFormData>
          name="priorityMuscles"
          control={control}
          options={MUSCLE_OPTIONS.map((m) => ({
            value: m,
            label: t(`fitness.onboarding.muscle_${m}`),
          }))}
          maxItems={MAX_PRIORITY_MUSCLES}
          testIdPrefix="priority-muscles"
        />
      </FormField>

      <FormField label={t('fitness.onboarding.sleepHours')} error={errors.avgSleepHours}>
        <input
          type="number"
          min={3}
          max={12}
          step={0.5}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
          data-testid="sleep-hours-input"
          {...register('avgSleepHours', { valueAsNumber: true })}
        />
      </FormField>
    </div>
  );
}
