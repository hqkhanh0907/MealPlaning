/**
 * Service layer for meal plan business logic.
 * Pure functions extracted from App.tsx for testability and SRP.
 */

import { DayPlan, MealType } from '../types';
import { getWeekRange, isDateInRange, parseLocalDate } from '../utils/helpers';

/** Create an empty day plan for a given date */
export const createEmptyDayPlan = (date: string): DayPlan => ({
  date,
  breakfastDishIds: [],
  lunchDishIds: [],
  dinnerDishIds: [],
});

/** Map MealType to the corresponding DayPlan key */
export const getDayPlanSlotKey = (type: MealType): keyof DayPlan => {
  const map: Record<MealType, keyof DayPlan> = {
    breakfast: 'breakfastDishIds',
    lunch: 'lunchDishIds',
    dinner: 'dinnerDishIds',
  };
  return map[type];
};

/** Clear plans by scope: day, week, or month */
export const clearPlansByScope = (
  plans: DayPlan[],
  selectedDate: string,
  scope: 'day' | 'week' | 'month'
): DayPlan[] => {
  if (scope === 'day') return plans.filter(p => p.date !== selectedDate);
  if (scope === 'week') {
    const { start, end } = getWeekRange(selectedDate);
    return plans.filter(p => !isDateInRange(p.date, start, end));
  }
  const targetDate = parseLocalDate(selectedDate);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  return plans.filter(p => {
    const pDate = parseLocalDate(p.date);
    return pDate.getFullYear() !== year || pDate.getMonth() !== month;
  });
};

/** Apply AI suggestion to existing day plans, preserving non-suggested slots */
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

/** Update a specific meal slot in day plans */
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

