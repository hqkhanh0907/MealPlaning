// Enums / Unions
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'glutes';
export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'bands';
export type BodyRegion = 'shoulders' | 'lower_back' | 'knees' | 'wrists' | 'neck' | 'hips';

const BODY_REGIONS: readonly BodyRegion[] = ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'];

export function isBodyRegion(value: string): value is BodyRegion {
  return (BODY_REGIONS as readonly string[]).includes(value);
}

export type ExerciseCategory = 'compound' | 'secondary' | 'isolation';
export type ExerciseType = 'strength' | 'cardio';
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';
export type TrainingGoal = 'strength' | 'hypertrophy' | 'endurance' | 'general';
export type PeriodizationModel = 'linear' | 'undulating' | 'block';
export type CardioTypePref = 'liss' | 'hiit' | 'mixed';
export type CardioType = 'running' | 'cycling' | 'swimming' | 'hiit' | 'walking' | 'elliptical' | 'rowing';
export type CardioIntensity = 'low' | 'moderate' | 'high';
export type PlanStatus = 'active' | 'completed' | 'paused';

// Exercise
export interface Exercise {
  id: string;
  nameVi: string;
  nameEn?: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  category: ExerciseCategory;
  equipment: EquipmentType[];
  contraindicated: BodyRegion[];
  exerciseType: ExerciseType;
  defaultRepsMin: number;
  defaultRepsMax: number;
  isCustom: boolean;
  updatedAt: string;
}

// Training Profile (14 fields from onboarding)
export interface TrainingProfile {
  id: string;
  trainingExperience: TrainingExperience;
  daysPerWeek: number;
  sessionDurationMin: number;
  trainingGoal: TrainingGoal;
  availableEquipment: EquipmentType[];
  injuryRestrictions: BodyRegion[];
  periodizationModel: PeriodizationModel;
  planCycleWeeks: number;
  priorityMuscles: MuscleGroup[];
  cardioSessionsWeek: number;
  cardioTypePref: CardioTypePref;
  cardioDurationMin: number;
  known1rm?: Record<string, number>;
  avgSleepHours?: number;
  updatedAt: string;
}

// Training Plan
export interface TrainingPlan {
  id: string;
  name: string;
  status: PlanStatus;
  splitType: string;
  durationWeeks: number;
  currentWeek: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlanDay {
  id: string;
  planId: string;
  dayOfWeek: number;
  sessionOrder: number;
  workoutType: string;
  muscleGroups?: string;
  exercises?: string;
  originalExercises?: string;
  notes?: string;
}

// Workout Logging
export interface Workout {
  id: string;
  date: string;
  name: string;
  planDayId?: string;
  durationMin?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weightKg: number;
  rpe?: number;
  restSeconds?: number;
  durationMin?: number;
  distanceKm?: number;
  avgHeartRate?: number;
  intensity?: CardioIntensity;
  estimatedCalories?: number;
  updatedAt: string;
}

// Suggestions
export interface SetSuggestion {
  weight: number;
  reps: number;
  source: 'progressive_overload' | 'rep_progression' | 'manual';
}

// Cardio Session
export interface CardioSession {
  type: CardioType;
  durationMin: number;
  distanceKm?: number;
  avgHeartRate?: number;
  intensity: CardioIntensity;
  estimatedCalories: number;
}

// Weight Log
export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Volume landmarks
export interface VolumeLandmarks {
  mev: number;
  mav: number;
  mrv: number;
}

// Selected exercise for plan generation
export interface SelectedExercise {
  exercise: Exercise;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
}

// Today's plan state for multi-session support
export type TodayPlanState =
  | 'training-pending'
  | 'training-partial'
  | 'training-completed'
  | 'rest-day'
  | 'no-plan';
