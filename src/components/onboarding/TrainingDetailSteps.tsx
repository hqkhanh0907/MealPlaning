import { type UseFormReturn, useWatch } from 'react-hook-form';

import type {
  BodyRegion,
  EquipmentType,
  MuscleGroup,
  TrainingExperience,
  TrainingGoal,
} from '@/features/fitness/types';
import { getSmartDefaults } from '@/features/fitness/utils/getSmartDefaults';
import { useFitnessStore } from '@/store/fitnessStore';
import { generateUUID } from '@/utils/helpers';

import type { OnboardingFormData } from './onboardingSchema';
import {
  CardioStep,
  CycleWeeksStep,
  DurationStep,
  EquipmentStep,
  InjuriesStep,
  PeriodizationStep,
  PriorityMusclesStep,
  SleepHoursStep,
  TrainingConfirmStep,
} from './training-steps';
import { getActiveSteps } from './trainingStepConfig';

interface TrainingDetailStepsProps {
  step: number;
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
  setOnboardingSection: (section: number | null) => void;
}

const STEP_COMPONENTS: Record<
  string,
  React.ComponentType<{ form: UseFormReturn<OnboardingFormData>; goNext: () => void; goBack: () => void }>
> = {
  duration: DurationStep,
  equipment: EquipmentStep,
  injuries: InjuriesStep,
  cardio: CardioStep,
  periodization: PeriodizationStep,
  cycleWeeks: CycleWeeksStep,
  priorityMuscles: PriorityMusclesStep,
  sleepHours: SleepHoursStep,
  confirm: TrainingConfirmStep,
};

export function TrainingDetailSteps({
  step,
  form,
  goNext,
  goBack,
  setOnboardingSection,
}: Readonly<TrainingDetailStepsProps>) {
  const experience = useWatch({ control: form.control, name: 'trainingExperience' }) as TrainingExperience;
  const setTrainingProfile = useFitnessStore(s => s.setTrainingProfile);

  const handleConfirmTraining = () => {
    const values = form.getValues();
    const smart = getSmartDefaults(
      values.trainingGoal as TrainingGoal,
      values.trainingExperience as TrainingExperience,
      values.daysPerWeek,
    );

    setTrainingProfile({
      id: generateUUID(),
      trainingGoal: values.trainingGoal as TrainingGoal,
      trainingExperience: values.trainingExperience as TrainingExperience,
      daysPerWeek: values.daysPerWeek,
      sessionDurationMin: values.sessionDurationMin ?? smart.sessionDurationMin,
      availableEquipment: (values.availableEquipment ?? []) as EquipmentType[],
      cardioSessionsWeek: values.cardioSessionsWeek ?? smart.cardioSessionsWeek,
      periodizationModel: values.periodizationModel ?? smart.periodizationModel,
      injuryRestrictions: (values.injuryRestrictions ?? []) as BodyRegion[],
      planCycleWeeks: values.planCycleWeeks ?? smart.planCycleWeeks,
      priorityMuscles: (values.priorityMuscles ?? []) as MuscleGroup[],
      cardioTypePref: smart.cardioTypePref,
      cardioDurationMin: smart.cardioDurationMin,
      avgSleepHours: values.avgSleepHours,
      updatedAt: new Date().toISOString(),
    });
    setOnboardingSection(5);
    goNext();
  };

  const activeSteps = getActiveSteps(experience ?? 'beginner');
  const currentStep = activeSteps[step];
  if (!currentStep) return null;

  const Component = STEP_COMPONENTS[currentStep.id];
  if (!Component) return null;

  const isConfirm = currentStep.id === 'confirm';
  return <Component form={form} goNext={isConfirm ? handleConfirmTraining : goNext} goBack={goBack} />;
}
