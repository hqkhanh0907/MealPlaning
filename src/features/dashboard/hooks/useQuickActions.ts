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

function makeAction(id: ActionType, icon: string, label: string, isPrimary: boolean): QuickAction {
  return { id, icon, label, isPrimary };
}

function determineCenterAction(input: QuickActionsInput, allMealsLogged: boolean): QuickAction {
  if (allMealsLogged && input.workoutCompleted) {
    return makeAction('view-results', '📊', 'quickActions.viewResults', true);
  }
  if (input.isRestDay || input.workoutCompleted) {
    return makeAction('log-meal', '➕', 'quickActions.logMeal', true);
  }
  if (allMealsLogged) {
    return input.hasTrainingPlan
      ? makeAction('start-workout', '🏋️', 'quickActions.startWorkout', true)
      : makeAction('log-meal', '➕', 'quickActions.logMeal', true);
  }
  if (!input.hasBreakfast) {
    return makeAction('log-breakfast', '➕', 'quickActions.logBreakfast', true);
  }
  if (input.hasLunch) {
    return makeAction('log-dinner', '➕', 'quickActions.logDinner', true);
  }
  return makeAction('log-lunch', '➕', 'quickActions.logLunch', true);
}

function determineRightAction(input: QuickActionsInput, allMealsLogged: boolean): QuickAction {
  if (allMealsLogged && (input.workoutCompleted || !input.isRestDay)) {
    return makeAction('log-snack', '➕', 'quickActions.addSnack', false);
  }
  if (!input.isRestDay && input.workoutCompleted) {
    return makeAction('view-results', '📊', 'quickActions.viewResults', false);
  }
  if (!input.isRestDay && input.hasTrainingPlan) {
    return makeAction('start-workout', '🏋️', 'quickActions.startWorkout', false);
  }
  return makeAction('log-cardio', '🏃', 'quickActions.logCardio', false);
}

export function determineQuickActions(input: QuickActionsInput): [QuickAction, QuickAction, QuickAction] {
  const allMealsLogged = input.hasBreakfast && input.hasLunch && input.hasDinner;

  const left = makeAction('log-weight', '⚖️', 'quickActions.logWeight', false);
  const center = determineCenterAction(input, allMealsLogged);
  const right = determineRightAction(input, allMealsLogged);

  return [left, center, right];
}

export function useQuickActions(options?: { onLogWeight?: () => void }): {
  actions: [QuickAction, QuickAction, QuickAction];
  handleAction: (action: QuickAction) => void;
} {
  const today = new Date().toISOString().split('T')[0];
  const dayPlans = useDayPlanStore(s => s.dayPlans);
  const weightLoggedToday = useFitnessStore(s => s.weightEntries.some(e => e.date.split('T')[0] === today));
  const workoutCompletedToday = useFitnessStore(s => s.workouts.some(w => w.date.split('T')[0] === today));
  const hasTrainingPlan = useFitnessStore(s => s.trainingPlans.some(p => p.status === 'active'));
  const navigateTab = useNavigationStore(s => s.navigateTab);

  const actions = useMemo(() => {
    const todayPlan = dayPlans.find(p => p.date === today);

    const hasBreakfast = (todayPlan?.breakfastDishIds?.length ?? 0) > 0;
    const hasLunch = (todayPlan?.lunchDishIds?.length ?? 0) > 0;
    const hasDinner = (todayPlan?.dinnerDishIds?.length ?? 0) > 0;
    const mealsCount = (hasBreakfast ? 1 : 0) + (hasLunch ? 1 : 0) + (hasDinner ? 1 : 0);

    return determineQuickActions({
      mealsLoggedToday: mealsCount,
      hasBreakfast,
      hasLunch,
      hasDinner,
      workoutCompleted: workoutCompletedToday,
      isRestDay: false,
      weightLoggedToday,
      hasTrainingPlan,
    });
  }, [dayPlans, today, weightLoggedToday, workoutCompletedToday, hasTrainingPlan]);

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
