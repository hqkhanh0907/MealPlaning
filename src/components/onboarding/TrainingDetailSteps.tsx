import { useWatch, type UseFormReturn } from 'react-hook-form';
import { useFitnessStore } from '@/store/fitnessStore';
import { getSmartDefaults } from '@/features/fitness/utils/getSmartDefaults';
import type { BodyRegion, EquipmentType, MuscleGroup, TrainingExperience, TrainingGoal } from '@/features/fitness/types';
import { generateUUID } from '@/utils/helpers';
import type { OnboardingFormData } from './onboardingSchema';
import { getActiveSteps } from './trainingStepConfig';
import {
  DurationStep,
  EquipmentStep,
  InjuriesStep,
  CardioStep,
  PeriodizationStep,
  CycleWeeksStep,
  PriorityMusclesStep,
  SleepHoursStep,
  TrainingConfirmStep,
} from './training-steps';

interface TrainingDetailStepsProps {
  step: number;
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
  setOnboardingSection: (section: number | null) => void;
}

const STEP_COMPONENTS: Record<string, React.ComponentType<{ form: UseFormReturn<OnboardingFormData>; goNext: () => void; goBack: () => void }>> = {
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

export function TrainingDetailSteps({ step, form, goNext, goBack, setOnboardingSection }: TrainingDetailStepsProps) {
  const experience = useWatch({ control: form.control, name: 'experience' }) as TrainingExperience;
  const setTrainingProfile = useFitnessStore((s) => s.setTrainingProfile);

  const handleConfirmTraining = () => {
    const values = form.getValues();
    const smart = getSmartDefaults(
      values.trainingGoal as TrainingGoal,
      values.experience as TrainingExperience,
      values.daysPerWeek,
    );

    setTrainingProfile({
      id: generateUUID(),
      trainingGoal: values.trainingGoal as TrainingGoal,
      trainingExperience: values.experience as TrainingExperience,
      daysPerWeek: values.daysPerWeek,
      sessionDurationMin: values.sessionDuration ?? smart.sessionDurationMin,
      availableEquipment: (values.equipment ?? []) as EquipmentType[],
      cardioSessionsWeek: values.cardioSessions ?? smart.cardioSessionsWeek,
      periodizationModel: (values.periodization ?? smart.periodizationModel),
      injuryRestrictions: (values.injuries ?? []) as BodyRegion[],
      planCycleWeeks: values.cycleWeeks ?? smart.planCycleWeeks,
      priorityMuscles: (values.priorityMuscles ?? []) as MuscleGroup[],
      cardioTypePref: smart.cardioTypePref,
      cardioDurationMin: smart.cardioDurationMin,
      avgSleepHours: values.sleepHours,
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
