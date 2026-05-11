export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'forearms'
  | 'full_body';

export type ExerciseCategory = 'compound' | 'isolation' | 'cardio';
export type ExerciseSource = 'db' | 'custom' | 'ai';
export type TrainingPlanType = 'full_body' | 'upper_lower' | 'ppl' | 'ai_custom';
export type TrainingPlanSource = 'preset' | 'ai' | 'custom';
export type WorkoutMode = 'guided' | 'free';
export type WorkoutEffort = 'easy' | 'just_right' | 'hard' | 'maxed';

export interface Exercise {
  id: string;
  name: string;
  name_vi: string | null;
  muscle_group: MuscleGroup;
  category: ExerciseCategory;
  equipment: string | null;
  instructions: string | null;
  source: ExerciseSource;
  created_at: string;
}

export interface TrainingPlanSummary {
  id: string;
  name: string;
  type: TrainingPlanType;
  frequency: number;
  is_active: number;
  description: string | null;
  source: TrainingPlanSource;
  created_at: string;
  updated_at: string | null;
  training_days: number;
  planned_exercises: number;
}

export interface PlannedExerciseWithExercise {
  id: string;
  training_plan_day_id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_name_vi: string | null;
  muscle_group: MuscleGroup;
  category: ExerciseCategory;
  equipment: string | null;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  notes: string | null;
  sort_order: number;
}

export interface TrainingPlanDayWithExercises {
  id: string;
  training_plan_id: string;
  day_of_week: number;
  name: string;
  is_rest_day: number;
  sort_order: number;
  exercises: PlannedExerciseWithExercise[];
}

export interface ActiveTrainingPlan extends TrainingPlanSummary {
  days: TrainingPlanDayWithExercises[];
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rest_seconds: number | null;
  effort: WorkoutEffort | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutExerciseDetail {
  id: string;
  workout_session_id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_name_vi: string | null;
  muscle_group: MuscleGroup;
  category: ExerciseCategory;
  sort_order: number;
  total_volume: number;
  sets: WorkoutSet[];
}

export interface WorkoutSessionDetail {
  id: string;
  date: string;
  training_plan_day_id: string | null;
  training_day_name: string | null;
  mode: WorkoutMode;
  total_volume: number;
  duration_minutes: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  exercises: WorkoutExerciseDetail[];
}

export interface WorkoutSetDraft {
  weightKg: string;
  reps: string;
  restSeconds: string;
  effort: WorkoutEffort | null;
  notes: string;
}

export interface WeeklyVolumePoint {
  muscle_group: MuscleGroup;
  label: string;
  volume: number;
}

export interface StrengthPoint {
  exercise_id: string;
  exercise_name: string;
  exercise_name_vi: string | null;
  estimated_1rm: number;
}

export interface FitnessProgressSummary {
  currentWeekVolume: number;
  previousWeekVolume: number;
  workoutStreakWeeks: number;
  weeklyAvgWeightKg: number | null;
  weightSource: 'weight_log' | 'profile' | null;
  volumeByMuscle: WeeklyVolumePoint[];
  strength: StrengthPoint[];
}

export interface AiTrainingPlanExerciseDraft {
  readonly exerciseId: string;
  readonly sets: number;
  readonly repsMin: number;
  readonly repsMax: number;
  readonly restSeconds: number;
  readonly notes: string | null;
}

export interface AiTrainingPlanDayDraft {
  readonly dayOfWeek: number;
  readonly name: string;
  readonly isRestDay: boolean;
  readonly exercises: readonly AiTrainingPlanExerciseDraft[];
}

export interface AiTrainingPlanDraft {
  readonly name: string;
  readonly description: string;
  readonly frequency: number;
  readonly rationale: string;
  readonly days: readonly AiTrainingPlanDayDraft[];
}
