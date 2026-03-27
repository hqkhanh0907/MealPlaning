import { useFitnessStore } from '../../../store/fitnessStore';
import { useDayPlanStore } from '../../../store/dayPlanStore';
import type {
  TrainingPlan,
  TrainingPlanDay,
  Workout,
  SelectedExercise,
} from '../../fitness/types';

export type TodayPlanState =
  | 'training-pending'
  | 'training-completed'
  | 'rest-day'
  | 'no-plan';

export interface TodaysPlanData {
  state: TodayPlanState;
  workoutType?: string;
  muscleGroups?: string;
  exerciseCount?: number;
  estimatedDuration?: number;
  completedWorkout?: {
    durationMin: number;
    totalSets: number;
    hasPR: boolean;
  };
  tomorrowWorkoutType?: string;
  tomorrowMuscleGroups?: string;
  tomorrowExerciseCount?: number;
  nextMealToLog?: 'breakfast' | 'lunch' | 'dinner';
  mealsLogged: number;
  totalMealsPlanned: number;
  hasReachedTarget: boolean;
}

export function determineTodayPlanState(
  activePlan: TrainingPlan | undefined,
  todayPlanDay: TrainingPlanDay | undefined,
  todayWorkout: Workout | undefined,
): TodayPlanState {
  if (!activePlan) return 'no-plan';
  if (!todayPlanDay) return 'rest-day';
  if (todayWorkout) return 'training-completed';
  return 'training-pending';
}

function parseExercises(exercises?: string): SelectedExercise[] {
  if (!exercises) return [];
  try {
    return JSON.parse(exercises) as SelectedExercise[];
  } catch {
    return [];
  }
}

function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function estimateDurationMinutes(exercises: SelectedExercise[]): number {
  const totalSeconds = exercises.reduce((total, ex) => {
    const avgReps = (ex.repsMin + ex.repsMax) / 2;
    const secondsPerSet = avgReps * 3 + ex.restSeconds;
    return total + ex.sets * secondsPerSet;
  }, 0);
  return Math.round(totalSeconds / 60);
}

const TOTAL_MEALS_PLANNED = 3;

export function useTodaysPlan(): TodaysPlanData {
  const today = new Date();
  const todayStr = formatDateToISO(today);
  const todayDayOfWeek = today.getDay();
  const tomorrowDayOfWeek = (todayDayOfWeek + 1) % 7;

  const trainingPlans = useFitnessStore((s) => s.trainingPlans);
  const trainingPlanDays = useFitnessStore((s) => s.trainingPlanDays);
  const workouts = useFitnessStore((s) => s.workouts);
  const workoutSets = useFitnessStore((s) => s.workoutSets);

  const dayPlans = useDayPlanStore((s) => s.dayPlans);

  const activePlan = trainingPlans.find((p) => p.status === 'active');
  const planDays = activePlan
    ? trainingPlanDays.filter((d) => d.planId === activePlan.id)
    : [];

  const todayPlanDay = planDays.find((d) => d.dayOfWeek === todayDayOfWeek);
  const todayWorkout = workouts.find((w) => w.date === todayStr);

  const state = determineTodayPlanState(activePlan, todayPlanDay, todayWorkout);

  const exercises = todayPlanDay
    ? parseExercises(todayPlanDay.exercises)
    : [];

  const estimatedDuration =
    exercises.length > 0 ? estimateDurationMinutes(exercises) : undefined;

  const tomorrowPlanDay = planDays.find(
    (d) => d.dayOfWeek === tomorrowDayOfWeek,
  );

  const tomorrowExercises = tomorrowPlanDay
    ? parseExercises(tomorrowPlanDay.exercises)
    : [];

  let completedWorkout: TodaysPlanData['completedWorkout'];
  if (todayWorkout) {
    const sets = workoutSets.filter((s) => s.workoutId === todayWorkout.id);
    completedWorkout = {
      durationMin: todayWorkout.durationMin ?? 0,
      totalSets: sets.length,
      hasPR: false,
    };
  }

  const todayDayPlan = dayPlans.find((p) => p.date === todayStr);
  let mealsLogged = 0;
  if (todayDayPlan) {
    if (todayDayPlan.breakfastDishIds.length > 0) mealsLogged++;
    if (todayDayPlan.lunchDishIds.length > 0) mealsLogged++;
    if (todayDayPlan.dinnerDishIds.length > 0) mealsLogged++;
  }

  let nextMealToLog: 'breakfast' | 'lunch' | 'dinner' | undefined;
  if (todayDayPlan) {
    if (todayDayPlan.breakfastDishIds.length === 0) nextMealToLog = 'breakfast';
    else if (todayDayPlan.lunchDishIds.length === 0) nextMealToLog = 'lunch';
    else if (todayDayPlan.dinnerDishIds.length === 0) nextMealToLog = 'dinner';
  } else {
    nextMealToLog = 'breakfast';
  }

  return {
    state,
    workoutType: todayPlanDay?.workoutType,
    muscleGroups: todayPlanDay?.muscleGroups,
    exerciseCount: exercises.length > 0 ? exercises.length : undefined,
    estimatedDuration,
    completedWorkout,
    tomorrowWorkoutType: tomorrowPlanDay?.workoutType,
    tomorrowMuscleGroups: tomorrowPlanDay?.muscleGroups,
    tomorrowExerciseCount:
      tomorrowExercises.length > 0 ? tomorrowExercises.length : undefined,
    nextMealToLog: mealsLogged < TOTAL_MEALS_PLANNED ? nextMealToLog : undefined,
    mealsLogged,
    totalMealsPlanned: TOTAL_MEALS_PLANNED,
    hasReachedTarget: mealsLogged >= TOTAL_MEALS_PLANNED,
  };
}
