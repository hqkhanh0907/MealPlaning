import { useMemo } from 'react';

import { useDayPlanStore } from '../store/dayPlanStore';
import { useDishStore } from '../store/dishStore';
import { useIngredientStore } from '../store/ingredientStore';
import { calculateDishesNutrition } from '../utils/nutrition';

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useTodayNutrition(): { eaten: number; protein: number } {
  const dayPlans = useDayPlanStore(s => s.dayPlans);
  const dishes = useDishStore(s => s.dishes);
  const ingredients = useIngredientStore(s => s.ingredients);

  return useMemo(() => {
    const today = formatLocalDate(new Date());
    const todayPlan = dayPlans.find(p => p.date === today);
    if (!todayPlan) return { eaten: 0, protein: 0 };

    const allDishIds = [...todayPlan.breakfastDishIds, ...todayPlan.lunchDishIds, ...todayPlan.dinnerDishIds];
    if (allDishIds.length === 0) return { eaten: 0, protein: 0 };

    const result = calculateDishesNutrition(allDishIds, dishes, ingredients, todayPlan.servings);
    return { eaten: result.calories, protein: result.protein };
  }, [dayPlans, dishes, ingredients]);
}
