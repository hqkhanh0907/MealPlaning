/**
 * Service layer for meal plan business logic.
 * Pure functions extracted from App.tsx for testability and SRP.
 */

import { DayPlan, MealType } from '../types';
import { getWeekRange, isDateInRange, parseLocalDate } from '../utils/helpers';

export const createEmptyDayPlan = (date: string): DayPlan => ({
  date,
  breakfastDishIds: [],
  lunchDishIds: [],
  dinnerDishIds: [],
});

export const getDayPlanSlotKey = (type: MealType): keyof DayPlan => {
  const map: Record<MealType, keyof DayPlan> = {
    breakfast: 'breakfastDishIds',
    lunch: 'lunchDishIds',
    dinner: 'dinnerDishIds',
  };
  return map[type];
};

export const clearPlansByScope = (
  plans: DayPlan[],
  selectedDate: string,
  scope: 'day' | 'week' | 'month',
  meals?: MealType[]
): DayPlan[] => {
  const allMeals = !meals || meals.length === 3;
  const clearMeals = (p: DayPlan): DayPlan => ({
    ...p,
    breakfastDishIds: meals?.includes('breakfast') ? [] : p.breakfastDishIds,
    lunchDishIds: meals?.includes('lunch') ? [] : p.lunchDishIds,
    dinnerDishIds: meals?.includes('dinner') ? [] : p.dinnerDishIds,
  });
  const filterOrClear = (predicate: (p: DayPlan) => boolean): DayPlan[] => {
    if (allMeals) return plans.filter(p => !predicate(p));
    return plans.map(p => predicate(p) ? clearMeals(p) : p);
  };

  if (scope === 'day') return filterOrClear(p => p.date === selectedDate);
  if (scope === 'week') {
    const { start, end } = getWeekRange(selectedDate);
    return filterOrClear(p => isDateInRange(p.date, start, end));
  }
  const targetDate = parseLocalDate(selectedDate);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  return filterOrClear(p => {
    const pDate = parseLocalDate(p.date);
    return pDate.getFullYear() === year && pDate.getMonth() === month;
  });
};

// Preserves non-suggested slots so partial AI suggestions don't wipe existing meals
export const applySuggestionToDayPlans = (
  plans: DayPlan[],
  selectedDate: string,
  suggestion: { breakfastDishIds: string[]; lunchDishIds: string[]; dinnerDishIds: string[] }
): DayPlan[] => {
  const existing = plans.find(p => p.date === selectedDate);
  const merged: DayPlan = {
    date: selectedDate,
    breakfastDishIds: suggestion.breakfastDishIds.length > 0
      ? suggestion.breakfastDishIds
      : (existing?.breakfastDishIds ?? []),
    lunchDishIds: suggestion.lunchDishIds.length > 0
      ? suggestion.lunchDishIds
      : (existing?.lunchDishIds ?? []),
    dinnerDishIds: suggestion.dinnerDishIds.length > 0
      ? suggestion.dinnerDishIds
      : (existing?.dinnerDishIds ?? []),
  };
  if (existing) {
    return plans.map(p => p.date === selectedDate ? merged : p);
  }
  return [...plans, merged];
};

export const updateDayPlanSlot = (
  plans: DayPlan[],
  selectedDate: string,
  type: MealType,
  dishIds: string[]
): DayPlan[] => {
  const slotKey = getDayPlanSlotKey(type);
  const existing = plans.find(p => p.date === selectedDate);
  if (existing) {
    return plans.map(p =>
      p.date === selectedDate ? { ...p, [slotKey]: dishIds } : p
    );
  }
  return [...plans, { ...createEmptyDayPlan(selectedDate), [slotKey]: dishIds }];
};

