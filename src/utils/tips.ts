import { TFunction } from 'i18next';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  TrendingDown,
  Dumbbell,
  Beef,
  Leaf,
  Droplets,
  FileText,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';
import { DayNutritionSummary } from '../types';

export interface NutritionTip {
  icon: LucideIcon;
  text: string;
  type: 'success' | 'warning' | 'info';
}

// --- Named thresholds for nutrition analysis ---
const CALORIE_OVER_THRESHOLD = 1.15;
const CALORIE_UNDER_THRESHOLD = 0.7;
const PROTEIN_LOW_THRESHOLD = 0.8;
const MIN_FIBER_GRAMS = 15;
const FAT_CALORIE_PERCENT_LIMIT = 40;
const MAX_TIPS_DISPLAYED = 2;

interface NutritionTotals {
  calories: number;
  protein: number;
  fiber: number;
  fat: number;
}

interface MealStatus {
  hasBreakfast: boolean;
  hasLunch: boolean;
  hasDinner: boolean;
  isComplete: boolean;
  hasAnyPlan: boolean;
}

function computeTotals(dayNutrition: DayNutritionSummary): NutritionTotals {
  return {
    calories: dayNutrition.breakfast.calories + dayNutrition.lunch.calories + dayNutrition.dinner.calories,
    protein: dayNutrition.breakfast.protein + dayNutrition.lunch.protein + dayNutrition.dinner.protein,
    fiber: dayNutrition.breakfast.fiber + dayNutrition.lunch.fiber + dayNutrition.dinner.fiber,
    fat: dayNutrition.breakfast.fat + dayNutrition.lunch.fat + dayNutrition.dinner.fat,
  };
}

function computeMealStatus(dayNutrition: DayNutritionSummary): MealStatus {
  const hasBreakfast = dayNutrition.breakfast.dishIds.length > 0;
  const hasLunch = dayNutrition.lunch.dishIds.length > 0;
  const hasDinner = dayNutrition.dinner.dishIds.length > 0;
  return {
    hasBreakfast,
    hasLunch,
    hasDinner,
    isComplete: hasBreakfast && hasLunch && hasDinner,
    hasAnyPlan: hasBreakfast || hasLunch || hasDinner,
  };
}

function getCalorieTip(totals: NutritionTotals, targetCalories: number, isComplete: boolean, t: TFunction): NutritionTip | null {
  if (totals.calories <= 0) return null;
  if (totals.calories > targetCalories * CALORIE_OVER_THRESHOLD) {
    return { icon: AlertTriangle, text: t('tips.caloriesOver', { amount: Math.round(totals.calories - targetCalories) }), type: 'warning' };
  }
  if (isComplete && totals.calories < targetCalories * CALORIE_UNDER_THRESHOLD) {
    return { icon: TrendingDown, text: t('tips.caloriesLow', { amount: Math.round(totals.calories) }), type: 'warning' };
  }
  return null;
}

function getProteinTip(totals: NutritionTotals, targetProtein: number, isComplete: boolean, t: TFunction): NutritionTip | null {
  if (totals.protein <= 0) return null;
  if (totals.protein >= targetProtein) {
    return { icon: Dumbbell, text: t('tips.proteinMet', { current: Math.round(totals.protein), target: targetProtein }), type: 'success' };
  }
  if (isComplete && totals.protein < targetProtein * PROTEIN_LOW_THRESHOLD) {
    return { icon: Beef, text: t('tips.proteinLow', { current: Math.round(totals.protein), target: targetProtein }), type: 'warning' };
  }
  return null;
}

function getFiberTip(totals: NutritionTotals, isComplete: boolean, t: TFunction): NutritionTip | null {
  if (totals.fiber > 0 && totals.fiber < MIN_FIBER_GRAMS && isComplete) {
    return { icon: Leaf, text: t('tips.fiberLow'), type: 'info' };
  }
  return null;
}

function getFatTip(totals: NutritionTotals, t: TFunction): NutritionTip | null {
  if (totals.fat <= 0 || totals.calories <= 0) return null;
  const fatCalPercent = (totals.fat * 9 / totals.calories) * 100;
  if (fatCalPercent > FAT_CALORIE_PERCENT_LIMIT) {
    return { icon: Droplets, text: t('tips.fatHigh', { percent: Math.round(fatCalPercent) }), type: 'info' };
  }
  return null;
}

function getMissingMealsTip(status: MealStatus, t: TFunction): NutritionTip | null {
  if (status.isComplete || !status.hasAnyPlan) return null;
  const missing: string[] = [];
  if (!status.hasBreakfast) missing.push(t('tips.mealBreakfast'));
  if (!status.hasLunch) missing.push(t('tips.mealLunch'));
  if (!status.hasDinner) missing.push(t('tips.mealDinner'));
  return { icon: FileText, text: t('tips.missingMeals', { meals: missing.join(', ') }), type: 'info' };
}

/**
 * Pure function that generates dynamic nutrition tips based on the current day's nutrition data.
 * Returns up to 2 most relevant tips.
 */
export const getDynamicTips = (
  dayNutrition: DayNutritionSummary,
  targetCalories: number,
  targetProtein: number,
  t: TFunction,
): NutritionTip[] => {
  const totals = computeTotals(dayNutrition);
  const status = computeMealStatus(dayNutrition);

  // No plan yet
  if (!status.hasAnyPlan) {
    return [{ icon: ClipboardList, text: t('tips.noPlan'), type: 'info' }];
  }

  const tipGenerators = [
    getCalorieTip(totals, targetCalories, status.isComplete, t),
    getProteinTip(totals, targetProtein, status.isComplete, t),
    getFiberTip(totals, status.isComplete, t),
    getFatTip(totals, t),
  ];

  const tips: NutritionTip[] = tipGenerators.filter((tip): tip is NutritionTip => tip !== null);

  // All good
  if (status.isComplete && tips.length === 0) {
    tips.push({ icon: CheckCircle2, text: t('tips.balanced'), type: 'success' });
  }

  // Missing meals
  const missingTip = getMissingMealsTip(status, t);
  if (missingTip) tips.push(missingTip);

  return tips.slice(0, MAX_TIPS_DISPLAYED);
};

