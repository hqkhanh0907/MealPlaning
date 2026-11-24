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

export const muscleLabels: Record<MuscleGroup, string> = {
  chest: 'Ngực',
  back: 'Lưng',
  shoulders: 'Vai',
  biceps: 'Tay trước',
  triceps: 'Tay sau',
  quads: 'Đùi trước',
  hamstrings: 'Đùi sau',
  glutes: 'Mông',
  calves: 'Bắp chân',
  abs: 'Core',
  forearms: 'Cẳng tay',
  full_body: 'Toàn thân',
};

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

export type WorkoutSetStatus = 'logged' | 'skipped';

export function isTimedExercise(id: string): boolean {
  return [
    'ex_plank',
    'ex_farmer_carry',
    'ex_treadmill_run',
    'ex_stationary_bike',
    'ex_rowing_machine',
  ].includes(id);
}

export const workoutNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  duration_seconds?: number | null;
  legacy_unit_unknown?: number;
  rest_seconds: number | null;
  effort: WorkoutEffort | null;
  notes: string | null;
  status: WorkoutSetStatus;
  completed_at: string | null;
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
  planned_sets?: number | null;
  planned_min?: number | null;
  planned_max?: number | null;
  planned_rest?: number | null;
  equipment?: string | null;
  sets: WorkoutSet[];
}

export function setValueLabel(set: WorkoutSet): string {
  const load = workoutNumber.format(set.weight_kg) + ' kg';
  if (set.legacy_unit_unknown) return load + ' · ' + set.reps + ' (bản cũ chưa ghi đơn vị)';
  if (set.duration_seconds != null) {
    return (set.weight_kg ? load + ' · ' : '') + set.duration_seconds + ' giây';
  }
  return load + ' × ' + set.reps + ' lần';
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

export interface TrainingPlanExerciseDraft {
  readonly exerciseId: string;
  readonly sets: number;
  readonly repsMin: number;
  readonly repsMax: number;
  readonly restSeconds: number;
  readonly notes: string | null;
}

export interface TrainingPlanDayDraft {
  readonly dayOfWeek: number;
  readonly name: string;
  readonly isRestDay: boolean;
  readonly exercises: readonly TrainingPlanExerciseDraft[];
}

export interface PersonalTrainingPlanDraft {
  readonly name: string;
  readonly days: readonly TrainingPlanDayDraft[];
}

export interface AiTrainingPlanDraft extends PersonalTrainingPlanDraft {
  readonly description: string;
  readonly frequency: number;
  readonly rationale: string;
}
