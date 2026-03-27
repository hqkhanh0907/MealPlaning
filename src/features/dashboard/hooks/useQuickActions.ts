import { useCallback, useMemo } from 'react';
import { useDayPlanStore } from '../../../store/dayPlanStore';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useNavigationStore } from '../../../store/navigationStore';

export type ActionType =
  | 'log-weight'
  | 'log-breakfast'
  | 'log-lunch'
  | 'log-dinner'
  | 'log-meal'
  | 'log-snack'
  | 'start-workout'
  | 'log-cardio'
  | 'view-results';

export interface QuickAction {
  id: ActionType;
  icon: string;
  label: string;
  isPrimary: boolean;
}

export interface QuickActionsInput {
  mealsLoggedToday: number;
  hasBreakfast: boolean;
  hasLunch: boolean;
  hasDinner: boolean;
  workoutCompleted: boolean;
  isRestDay: boolean;
  weightLoggedToday: boolean;
  hasTrainingPlan: boolean;
}

function makeAction(
  id: ActionType,
  icon: string,
  label: string,
  isPrimary: boolean,
): QuickAction {
  return { id, icon, label, isPrimary };
}

export function determineQuickActions(
  input: QuickActionsInput,
): [QuickAction, QuickAction, QuickAction] {
  const allMealsLogged =
    input.hasBreakfast && input.hasLunch && input.hasDinner;

  const left = makeAction(
    'log-weight',
    '⚖️',
    'quickActions.logWeight',
    false,
  );

  let center: QuickAction;
  if (allMealsLogged && input.workoutCompleted) {
    center = makeAction(
      'view-results',
      '📊',
      'quickActions.viewResults',
      true,
    );
  } else if (input.isRestDay) {
    center = makeAction('log-meal', '➕', 'quickActions.logMeal', true);
  } else if (input.workoutCompleted) {
    center = makeAction('log-meal', '➕', 'quickActions.logMeal', true);
  } else if (allMealsLogged) {
    if (input.hasTrainingPlan) {
      center = makeAction(
        'start-workout',
        '🏋️',
        'quickActions.startWorkout',
        true,
      );
    } else {
      center = makeAction('log-meal', '➕', 'quickActions.logMeal', true);
    }
  } else if (!input.hasBreakfast) {
    center = makeAction(
      'log-breakfast',
      '➕',
      'quickActions.logBreakfast',
      true,
    );
  } else if (!input.hasLunch) {
    center = makeAction('log-lunch', '➕', 'quickActions.logLunch', true);
  } else {
    center = makeAction(
      'log-dinner',
      '➕',
      'quickActions.logDinner',
      true,
    );
  }

  let right: QuickAction;
  if (allMealsLogged && input.workoutCompleted) {
    right = makeAction(
      'log-snack',
      '➕',
      'quickActions.addSnack',
      false,
    );
  } else if (input.isRestDay) {
    right = makeAction('log-cardio', '🏃', 'quickActions.logCardio', false);
  } else if (input.workoutCompleted) {
    right = makeAction(
      'view-results',
      '📊',
      'quickActions.viewResults',
      false,
    );
  } else if (allMealsLogged) {
    right = makeAction(
      'log-snack',
      '➕',
      'quickActions.addSnack',
      false,
    );
  } else if (input.hasTrainingPlan) {
    right = makeAction(
      'start-workout',
      '🏋️',
      'quickActions.startWorkout',
      false,
    );
  } else {
    right = makeAction('log-cardio', '🏃', 'quickActions.logCardio', false);
  }

  return [left, center, right];
}

export function useQuickActions(options?: {
  onLogWeight?: () => void;
}): {
  actions: [QuickAction, QuickAction, QuickAction];
  handleAction: (action: QuickAction) => void;
} {
  const dayPlans = useDayPlanStore((s) => s.dayPlans);
  const weightEntries = useFitnessStore((s) => s.weightEntries);
  const workouts = useFitnessStore((s) => s.workouts);
  const trainingPlans = useFitnessStore((s) => s.trainingPlans);
  const navigateTab = useNavigationStore((s) => s.navigateTab);

  const actions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayPlan = dayPlans.find((p) => p.date === today);

    const hasBreakfast = (todayPlan?.breakfastDishIds?.length ?? 0) > 0;
    const hasLunch = (todayPlan?.lunchDishIds?.length ?? 0) > 0;
    const hasDinner = (todayPlan?.dinnerDishIds?.length ?? 0) > 0;
    const mealsCount =
      (hasBreakfast ? 1 : 0) + (hasLunch ? 1 : 0) + (hasDinner ? 1 : 0);

    const weightLoggedToday = weightEntries.some(
      (w) => w.date.split('T')[0] === today,
    );
    const workoutCompleted = workouts.some(
      (w) => w.date.split('T')[0] === today,
    );
    const hasTrainingPlan = trainingPlans.some((p) => p.status === 'active');

    return determineQuickActions({
      mealsLoggedToday: mealsCount,
      hasBreakfast,
      hasLunch,
      hasDinner,
      workoutCompleted,
      isRestDay: false,
      weightLoggedToday,
      hasTrainingPlan,
    });
  }, [dayPlans, weightEntries, workouts, trainingPlans]);

  const handleAction = useCallback(
    (action: QuickAction) => {
      switch (action.id) {
        case 'log-weight':
          if (options?.onLogWeight) {
            options.onLogWeight();
          } else {
            navigateTab('fitness');
          }
          break;
        case 'start-workout':
        case 'log-cardio':
        case 'view-results':
          navigateTab('fitness');
          break;
        case 'log-breakfast':
        case 'log-lunch':
        case 'log-dinner':
        case 'log-meal':
        case 'log-snack':
          navigateTab('calendar');
          break;
      }
    },
    [navigateTab, options],
  );

  return { actions, handleAction };
}
