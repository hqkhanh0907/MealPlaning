import { useMemo } from 'react';

import { useDayPlanStore } from '../../../store/dayPlanStore';
import { useDishStore } from '../../../store/dishStore';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useIngredientStore } from '../../../store/ingredientStore';
import { calculateDishesNutrition } from '../../../utils/nutrition';
import { calculateStreak } from '../../fitness/utils/gamification';
import { useNutritionTargets } from '../../health-profile/hooks/useNutritionTargets';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import type { HealthProfile } from '../../health-profile/types';
import { DEFAULT_HEALTH_PROFILE } from '../../health-profile/types';
import type { ScoreColor } from '../types';
import { calculateDailyScore } from '../utils/scoreCalculator';

export interface DailyScoreData {
  totalScore: number;
  factors: {
    calories: number | null;
    protein: number | null;
    workout: number | null;
    weightLog: number | null;
    streak: number | null;
  };
  color: ScoreColor;
  greeting: string;
  isFirstTimeUser: boolean;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Chào buổi sáng!';
  if (hour < 18) return 'Chào buổi chiều!';
  return 'Chào buổi tối!';
}

function isDefaultProfile(profile: HealthProfile | null): boolean {
  if (!profile) return true;
  return (
    profile.id === DEFAULT_HEALTH_PROFILE.id &&
    profile.gender === DEFAULT_HEALTH_PROFILE.gender &&
    profile.age === DEFAULT_HEALTH_PROFILE.age &&
    profile.heightCm === DEFAULT_HEALTH_PROFILE.heightCm &&
    profile.weightKg === DEFAULT_HEALTH_PROFILE.weightKg &&
    profile.activityLevel === DEFAULT_HEALTH_PROFILE.activityLevel
  );
}

export function useDailyScore(): DailyScoreData {
  const profile = useHealthProfileStore(s => s.profile);
  const { targetCalories, targetProtein } = useNutritionTargets();
  const dayPlans = useDayPlanStore(s => s.dayPlans);
  const dishes = useDishStore(s => s.dishes);
  const ingredients = useIngredientStore(s => s.ingredients);
  const workouts = useFitnessStore(s => s.workouts);
  const weightEntries = useFitnessStore(s => s.weightEntries);
  const trainingPlans = useFitnessStore(s => s.trainingPlans);
  const trainingPlanDays = useFitnessStore(s => s.trainingPlanDays);

  return useMemo(() => {
    const now = new Date();
    const today = formatLocalDate(now);
    const yesterday = formatLocalDate(new Date(now.getTime() - 86_400_000));
    const hour = now.getHours();
    const greeting = getGreeting(hour);

    const hasAnyMeals = dayPlans.some(
      p => p.breakfastDishIds.length > 0 || p.lunchDishIds.length > 0 || p.dinnerDishIds.length > 0,
    );
    const isFirstTimeUser = isDefaultProfile(profile) || !hasAnyMeals;

    const todayPlan = dayPlans.find(p => p.date === today);
    let actualCalories: number | undefined;
    let actualProtein: number | undefined;

    if (todayPlan) {
      const allDishIds = [...todayPlan.breakfastDishIds, ...todayPlan.lunchDishIds, ...todayPlan.dinnerDishIds];
      if (allDishIds.length > 0) {
        const nutrition = calculateDishesNutrition(allDishIds, dishes, ingredients, todayPlan.servings);
        actualCalories = nutrition.calories;
        actualProtein = nutrition.protein;
      }
    }

    const workoutCompleted = workouts.some(w => w.date === today);

    const activePlan = trainingPlans.find(p => p.status === 'active');
    const todayDayOfWeek = now.getDay();
    let isRestDay = false;

    if (activePlan) {
      const scheduledDays = trainingPlanDays.filter(d => d.planId === activePlan.id).map(d => d.dayOfWeek);
      isRestDay = !scheduledDays.includes(todayDayOfWeek);
    }

    const weightLoggedToday = weightEntries.some(e => e.date === today);
    const weightLoggedYesterday = weightEntries.some(e => e.date === yesterday);

    const planDaysForStreak = activePlan
      ? trainingPlanDays.filter(d => d.planId === activePlan.id).map(d => d.dayOfWeek)
      : [];
    const streakInfo = calculateStreak(workouts, planDaysForStreak, today);

    const scoreResult = calculateDailyScore({
      actualCalories,
      targetCalories,
      actualProteinG: actualProtein,
      targetProteinG: targetProtein,
      workoutCompleted,
      isRestDay,
      isBeforeEvening: hour < 20,
      weightLoggedToday,
      weightLoggedYesterday,
      streakDays: streakInfo.currentStreak,
    });

    return {
      totalScore: scoreResult.totalScore,
      factors: scoreResult.factors,
      color: scoreResult.color,
      greeting,
      isFirstTimeUser,
    };
  }, [
    profile,
    targetCalories,
    targetProtein,
    dayPlans,
    dishes,
    ingredients,
    workouts,
    weightEntries,
    trainingPlans,
    trainingPlanDays,
  ]);
}
