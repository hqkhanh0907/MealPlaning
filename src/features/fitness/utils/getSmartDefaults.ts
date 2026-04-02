import type {
  CardioTypePref,
  EquipmentType,
  MuscleGroup,
  PeriodizationModel,
  TrainingExperience,
  TrainingGoal,
  TrainingProfile,
} from '../types';

interface ExperienceDefaults {
  sessionDurationMin: number;
  availableEquipment: EquipmentType[];
  periodizationModel: PeriodizationModel;
  planCycleWeeks: number;
}

function getExperienceDefaults(experience: TrainingExperience): ExperienceDefaults {
  if (experience === 'intermediate') {
    return {
      sessionDurationMin: 60,
      availableEquipment: ['barbell', 'dumbbell', 'machine'],
      periodizationModel: 'undulating',
      planCycleWeeks: 8,
    };
  }
  if (experience === 'advanced') {
    return {
      sessionDurationMin: 90,
      availableEquipment: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands'],
      periodizationModel: 'block',
      planCycleWeeks: 12,
    };
  }
  return {
    sessionDurationMin: 45,
    availableEquipment: ['bodyweight', 'dumbbell'],
    periodizationModel: 'linear',
    planCycleWeeks: 8,
  };
}

interface GoalDefaults {
  cardioSessionsWeek: number;
  cardioTypePref: CardioTypePref;
  cardioDurationMin: number;
  priorityMuscles: MuscleGroup[];
}

function getGoalDefaults(goal: TrainingGoal, days: number): GoalDefaults {
  if (goal === 'strength') {
    return {
      cardioSessionsWeek: 1,
      cardioTypePref: 'liss',
      cardioDurationMin: 20,
      priorityMuscles: ['legs', 'back', 'chest'],
    };
  }
  if (goal === 'hypertrophy') {
    return {
      cardioSessionsWeek: 2,
      cardioTypePref: 'liss',
      cardioDurationMin: 20,
      priorityMuscles: ['chest', 'back', 'shoulders'],
    };
  }
  if (goal === 'endurance') {
    return {
      cardioSessionsWeek: Math.min(days, 4),
      cardioTypePref: 'hiit',
      cardioDurationMin: 30,
      priorityMuscles: ['legs', 'core'],
    };
  }
  return {
    cardioSessionsWeek: 2,
    cardioTypePref: 'mixed',
    cardioDurationMin: 25,
    priorityMuscles: [],
  };
}

export function getSmartDefaults(
  goal: TrainingGoal,
  experience: TrainingExperience,
  days: number,
): Omit<TrainingProfile, 'id' | 'updatedAt'> {
  const expDefaults = getExperienceDefaults(experience);
  const goalDefaults = getGoalDefaults(goal, days);

  return {
    trainingExperience: experience,
    daysPerWeek: days,
    trainingGoal: goal,
    sessionDurationMin: expDefaults.sessionDurationMin,
    availableEquipment: expDefaults.availableEquipment,
    injuryRestrictions: [],
    periodizationModel: expDefaults.periodizationModel,
    planCycleWeeks: expDefaults.planCycleWeeks,
    priorityMuscles: goalDefaults.priorityMuscles,
    cardioSessionsWeek: goalDefaults.cardioSessionsWeek,
    cardioTypePref: goalDefaults.cardioTypePref,
    cardioDurationMin: goalDefaults.cardioDurationMin,
  };
}
