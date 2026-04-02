// Enums / Unions
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'glutes';
export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'bands' | 'kettlebell';
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

// Split type — normalized enum for plan structure
export type SplitType = 'full_body' | 'upper_lower' | 'ppl' | 'bro_split' | 'custom';

const SPLIT_TYPES: readonly SplitType[] = ['full_body', 'upper_lower', 'ppl', 'bro_split', 'custom'];

export function isSplitType(value: string): value is SplitType {
  return (SPLIT_TYPES as readonly string[]).includes(value);
}

export function normalizeSplitType(raw: string): SplitType {
  const lower = raw.toLowerCase().replaceAll(/[\s/-]/g, '_');
  if (lower.includes('full') && lower.includes('body')) return 'full_body';
  if (lower.includes('upper') && lower.includes('lower')) return 'upper_lower';
  if (lower.includes('push') || lower === 'ppl') return 'ppl';
  if (lower.includes('bro')) return 'bro_split';
  return 'custom';
}

export function safeParseJsonArray<T>(json: string | null | undefined, fallback: T[] = []): T[] {
  if (!json) return fallback;
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    // Fallback: handle legacy comma-separated format (e.g. "chest,shoulders")
    return json
      .split(',')
      .map(s => s.trim())
      .filter(Boolean) as T[];
  }
}

// Training Plan
export interface TrainingPlan {
  id: string;
  name: string;
  status: PlanStatus;
  splitType: SplitType;
  durationWeeks: number;
  currentWeek?: number;
  startDate: string;
  endDate?: string;
  templateId?: string | null;
  trainingDays: number[];
  restDays: number[];
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
  isUserAssigned: boolean;
  originalDayOfWeek: number;
  notes?: string;
}

// Plan template for quick-start gallery
export interface PlanTemplate {
  id: string;
  name: string;
  splitType: SplitType;
  daysPerWeek: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
  trainingGoal: TrainingGoal | 'general';
  equipmentRequired: EquipmentType[];
  description: string;
  dayConfigs: TemplateDayConfig[];
  popularityScore: number;
  isBuiltin: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateDayConfig {
  dayLabel: string;
  workoutType: string;
  muscleGroups: MuscleGroup[];
  exercises: SelectedExercise[];
}

// Preview for split change confirmation
export interface SplitChangePreview {
  mapped: Array<{ from: TrainingPlanDay; toDay: string; toMuscleGroups: MuscleGroup[] }>;
  suggested: Array<{ day: string; muscleGroups: MuscleGroup[]; reason: string }>;
  unmapped: TrainingPlanDay[];
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
export type TodayPlanState = 'training-pending' | 'training-partial' | 'training-completed' | 'rest-day' | 'no-plan';
