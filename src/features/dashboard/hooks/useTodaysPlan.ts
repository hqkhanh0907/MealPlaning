import { useFitnessStore } from '../../../store/fitnessStore';
import { useDayPlanStore } from '../../../store/dayPlanStore';
import type {
  TrainingPlan,
  TrainingPlanDay,
  Workout,
  SelectedExercise,
  TodayPlanState,
} from '../../fitness/types';

export type { TodayPlanState };

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
  totalSessions: number;
  completedSessions: number;
  todayPlanDays: TrainingPlanDay[];
  nextUncompletedSession?: TrainingPlanDay;
}

export function determineTodayPlanState(
  activePlan: TrainingPlan | undefined,
  todayPlanDays: TrainingPlanDay[],
  todayWorkouts: Workout[],
): TodayPlanState {
  if (!activePlan) return 'no-plan';
  if (todayPlanDays.length === 0) return 'rest-day';

  const completedSessionIds = new Set(
    todayWorkouts.filter((w) => w.planDayId).map((w) => w.planDayId),
  );
  const completedCount = todayPlanDays.filter((d) =>
    completedSessionIds.has(d.id),
  ).length;

  if (completedCount === 0) return 'training-pending';
  if (completedCount < todayPlanDays.length) return 'training-partial';
  return 'training-completed';
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
  const todayDow = today.getDay() === 0 ? 7 : today.getDay();
  const tomorrowDow = todayDow === 7 ? 1 : todayDow + 1;

  const trainingPlans = useFitnessStore((s) => s.trainingPlans);
  const trainingPlanDays = useFitnessStore((s) => s.trainingPlanDays);
  const workouts = useFitnessStore((s) => s.workouts);
  const workoutSets = useFitnessStore((s) => s.workoutSets);

  const dayPlans = useDayPlanStore((s) => s.dayPlans);

  const activePlan = trainingPlans.find((p) => p.status === 'active');
  const planDays = activePlan
    ? trainingPlanDays.filter((d) => d.planId === activePlan.id)
    : [];

  const todayPlanDays = planDays
    .filter((d) => d.dayOfWeek === todayDow)
    .sort((a, b) => a.sessionOrder - b.sessionOrder);
  const todayWorkouts = workouts.filter((w) => w.date === todayStr);

  const state = determineTodayPlanState(activePlan, todayPlanDays, todayWorkouts);

  const primaryPlanDay = todayPlanDays[0];
  const exercises = primaryPlanDay
    ? parseExercises(primaryPlanDay.exercises)
    : [];

  const estimatedDuration =
    exercises.length > 0 ? estimateDurationMinutes(exercises) : undefined;

  const tomorrowPlanDay = planDays.find(
    (d) => d.dayOfWeek === tomorrowDow,
  );

  const tomorrowExercises = tomorrowPlanDay
    ? parseExercises(tomorrowPlanDay.exercises)
    : [];

  const firstTodayWorkout = todayWorkouts[0];
  let completedWorkout: TodaysPlanData['completedWorkout'];
  if (firstTodayWorkout) {
    const sets = workoutSets.filter(
      (s) => s.workoutId === firstTodayWorkout.id,
    );
    completedWorkout = {
      durationMin: firstTodayWorkout.durationMin ?? 0,
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

  const completedSessionCount = todayPlanDays.filter((d) =>
    todayWorkouts.some((w) => w.planDayId === d.id),
  ).length;

  return {
    state,
    workoutType: primaryPlanDay?.workoutType,
    muscleGroups: primaryPlanDay?.muscleGroups,
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
    totalSessions: todayPlanDays.length,
    completedSessions: completedSessionCount,
    todayPlanDays,
    nextUncompletedSession: todayPlanDays.find(
      (d) => !todayWorkouts.some((w) => w.planDayId === d.id),
    ),
  };
}
