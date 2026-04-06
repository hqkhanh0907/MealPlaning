import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { useDayPlanStore } from '../../../store/dayPlanStore';
import { useDishStore } from '../../../store/dishStore';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useIngredientStore } from '../../../store/ingredientStore';
import { selectActivePlan } from '../../../store/selectors/fitnessSelectors';
import { calculateDishesNutrition } from '../../../utils/nutrition';
import { calculateStreak } from '../../fitness/utils/gamification';
import { useNutritionTargets } from '../../health-profile/hooks/useNutritionTargets';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import type { HealthProfile } from '../../health-profile/types';
import { DEFAULT_HEALTH_PROFILE, getAge } from '../../health-profile/types';
import type { ScoreColor } from '../types';
import { calculateDailyScore } from '../utils/scoreCalculator';

export type HeroContext =
  | 'first-time'
  | 'rest-day-with-meals'
  | 'training-day-needs-workout'
  | 'workout-done-needs-fuel'
  | 'balanced-day'
  | 'empty-day'
  | 'rest-day-empty';

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
  heroContext: HeroContext;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getGreeting(hour: number, t: (key: string) => string): string {
  if (hour < 12) return t('dashboard.greetingMorning');
  if (hour < 18) return t('dashboard.greetingAfternoon');
  return t('dashboard.greetingEvening');
}

function isDefaultProfile(profile: HealthProfile | null): boolean {
  if (!profile) return true;
  if (profile.dateOfBirth != null) return false;
  return (
    profile.id === DEFAULT_HEALTH_PROFILE.id &&
    profile.gender === DEFAULT_HEALTH_PROFILE.gender &&
    getAge(profile) === DEFAULT_HEALTH_PROFILE.age &&
    profile.heightCm === DEFAULT_HEALTH_PROFILE.heightCm &&
    profile.weightKg === DEFAULT_HEALTH_PROFILE.weightKg &&
    profile.activityLevel === DEFAULT_HEALTH_PROFILE.activityLevel
  );
}

function determineHeroContext(
  isFirstTimeUser: boolean,
  isRestDay: boolean,
  hasMealsToday: boolean,
  workoutCompleted: boolean,
): HeroContext {
  if (isFirstTimeUser) return 'first-time';
  if (isRestDay && hasMealsToday) return 'rest-day-with-meals';
  if (isRestDay) return 'rest-day-empty';
  if (!workoutCompleted && hasMealsToday) return 'training-day-needs-workout';
  if (workoutCompleted && !hasMealsToday) return 'workout-done-needs-fuel';
  if (workoutCompleted && hasMealsToday) return 'balanced-day';
  return 'empty-day';
}

export function useDailyScore(): DailyScoreData {
  const { t } = useTranslation();
  const profile = useHealthProfileStore(s => s.profile);
  const { targetCalories, targetProtein } = useNutritionTargets();
  const dayPlans = useDayPlanStore(s => s.dayPlans);
  const dishes = useDishStore(s => s.dishes);
  const ingredients = useIngredientStore(s => s.ingredients);
  // Shared selector — re-renders only when active plan identity changes
  const activePlan = useFitnessStore(selectActivePlan);

  // Consolidate remaining arrays with useShallow (3 subscriptions → 1)
  const { workouts, weightEntries, trainingPlanDays } = useFitnessStore(
    useShallow(s => ({
      workouts: s.workouts,
      weightEntries: s.weightEntries,
      trainingPlanDays: s.trainingPlanDays,
    })),
  );

  return useMemo(() => {
    const now = new Date();
    const today = formatLocalDate(now);
    const yesterday = formatLocalDate(new Date(now.getTime() - 86_400_000));
    const hour = now.getHours();
    const greeting = getGreeting(hour, t);

    const hasAnyMeals = dayPlans.some(
      p => p.breakfastDishIds.length > 0 || p.lunchDishIds.length > 0 || p.dinnerDishIds.length > 0,
    );
    const hasLoggedWorkout = workouts.length > 0;
    const allSetupComplete = !isDefaultProfile(profile) && hasAnyMeals && hasLoggedWorkout;
    const isFirstTimeUser = !allSetupComplete;

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

    // Convert JS Sunday=0 to ISO Sunday=7 to match trainingPlanDays.dayOfWeek
    const todayDayOfWeek = now.getDay() || 7;
    const scheduledDays = activePlan
      ? trainingPlanDays.filter(d => d.planId === activePlan.id).map(d => d.dayOfWeek)
      : [];
    const isRestDay = activePlan ? !scheduledDays.includes(todayDayOfWeek) : false;

    const weightLoggedToday = weightEntries.some(e => e.date === today);
    const weightLoggedYesterday = weightEntries.some(e => e.date === yesterday);

    const streakInfo = calculateStreak(workouts, scheduledDays, today);

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
      skipWorkoutFactor: !activePlan || scheduledDays.length === 0,
    });

    const hasMealsToday =
      todayPlan != null &&
      (todayPlan.breakfastDishIds.length > 0 ||
        todayPlan.lunchDishIds.length > 0 ||
        todayPlan.dinnerDishIds.length > 0);

    const heroContext = determineHeroContext(isFirstTimeUser, isRestDay, hasMealsToday, workoutCompleted);

    return {
      totalScore: scoreResult.totalScore,
      factors: scoreResult.factors,
      color: scoreResult.color,
      greeting,
      isFirstTimeUser,
      heroContext,
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
    activePlan,
    trainingPlanDays,
    t,
  ]);
}
