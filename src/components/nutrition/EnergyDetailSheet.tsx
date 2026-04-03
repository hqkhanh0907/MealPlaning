import { Activity, Dumbbell, Flame, Target, UtensilsCrossed, X } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useNutritionTargets } from '@/features/health-profile/hooks/useNutritionTargets';
import { useTodayCaloriesOut } from '@/hooks/useTodayCaloriesOut';
import { useTodayNutrition } from '@/hooks/useTodayNutrition';
import { useDayPlanStore } from '@/store/dayPlanStore';
import { useDishStore } from '@/store/dishStore';
import { useIngredientStore } from '@/store/ingredientStore';
import { calculateDishNutrition } from '@/utils/nutrition';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { MacroDonutChart } from './MacroDonutChart';

interface EnergyDetailSheetProps {
  onClose: () => void;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const EnergyDetailSheet = React.memo(function EnergyDetailSheet({ onClose }: EnergyDetailSheetProps) {
  const { t } = useTranslation();
  useModalBackHandler(true, onClose);

  const { bmr, tdee, targetCalories } = useNutritionTargets();
  const { eaten } = useTodayNutrition();
  const caloriesOut = useTodayCaloriesOut();

  const today = todayStr();
  const dayPlan = useDayPlanStore(s => s.dayPlans.find(p => p.date === today));
  const dishes = useDishStore(s => s.dishes);
  const ingredients = useIngredientStore(s => s.ingredients);

  const mealData = useMemo(() => {
    if (!dayPlan) return { breakfast: 0, lunch: 0, dinner: 0, protein: 0, fat: 0, carbs: 0 };

    const calcMeal = (dishIds: string[]) => {
      let cal = 0;
      let pro = 0;
      let fat = 0;
      let carb = 0;
      for (const id of dishIds) {
        const dish = dishes.find(d => d.id === id);
        if (!dish) continue;
        const n = calculateDishNutrition(dish, ingredients);
        cal += n.calories;
        pro += n.protein;
        fat += n.fat;
        carb += n.carbs;
      }
      return { cal, pro, fat, carb };
    };

    const b = calcMeal(dayPlan.breakfastDishIds);
    const l = calcMeal(dayPlan.lunchDishIds);
    const d = calcMeal(dayPlan.dinnerDishIds);

    return {
      breakfast: b.cal,
      lunch: l.cal,
      dinner: d.cal,
      protein: b.pro + l.pro + d.pro,
      fat: b.fat + l.fat + d.fat,
      carbs: b.carb + l.carb + d.carb,
    };
  }, [dayPlan, dishes, ingredients]);

  const net = Math.round(eaten - caloriesOut);
  const remaining = Math.round(targetCalories - net);

  return (
    <ModalBackdrop onClose={onClose} zIndex="z-80">
      <div
        data-testid="energy-detail-sheet"
        className="bg-card relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-md sm:rounded-2xl"
      >
        <div className="border-border-subtle flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-foreground text-lg font-bold">{t('energyDetail.title')}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            data-testid="btn-close-energy-detail"
            className="text-muted-foreground hover:bg-accent rounded-full p-2 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-6">
          {/* BMR / TDEE / Target */}
          <div className="grid grid-cols-3 gap-3" data-testid="energy-breakdown">
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-muted-foreground text-xs font-medium">BMR</p>
              <p className="text-foreground text-lg font-bold" data-testid="bmr-value">
                {Math.round(bmr)}
              </p>
              <p className="text-muted-foreground text-xs">kcal</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-muted-foreground text-xs font-medium">TDEE</p>
              <p className="text-foreground text-lg font-bold" data-testid="tdee-value">
                {Math.round(tdee)}
              </p>
              <p className="text-muted-foreground text-xs">kcal</p>
            </div>
            <div className="bg-primary-subtle rounded-xl p-3 text-center">
              <p className="text-primary text-xs font-medium">{t('energyDetail.target')}</p>
              <p className="text-primary text-lg font-bold" data-testid="target-value">
                {Math.round(targetCalories)}
              </p>
              <p className="text-primary text-xs">kcal</p>
            </div>
          </div>

          {/* Macro Donut */}
          <div className="flex flex-col items-center gap-3">
            <h4 className="text-foreground text-sm font-semibold">{t('energyDetail.macroBreakdown')}</h4>
            <MacroDonutChart
              proteinG={Math.round(mealData.protein)}
              fatG={Math.round(mealData.fat)}
              carbsG={Math.round(mealData.carbs)}
              size={140}
            />
          </div>

          {/* Energy Summary */}
          <div className="bg-muted space-y-2 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                {t('energyDetail.caloriesIn')}
              </span>
              <span className="text-foreground font-bold">{Math.round(eaten)} kcal</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                {t('energyDetail.caloriesOut')}
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">-{Math.round(caloriesOut)} kcal</span>
            </div>
            <div className="border-border-subtle border-t pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  {t('energyDetail.netCalories')}
                </span>
                <span className="text-foreground font-bold">{net} kcal</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                {t('energyDetail.remaining')}
              </span>
              <span className={`font-bold ${remaining >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {remaining} kcal
              </span>
            </div>
          </div>

          {/* Per-meal breakdown */}
          <div>
            <h4 className="text-foreground mb-3 text-sm font-semibold">{t('energyDetail.perMeal')}</h4>
            <div className="space-y-2" data-testid="per-meal-breakdown">
              {[
                { key: 'breakfast', label: t('meal.breakfastFull'), cal: mealData.breakfast },
                { key: 'lunch', label: t('meal.lunchFull'), cal: mealData.lunch },
                { key: 'dinner', label: t('meal.dinnerFull'), cal: mealData.dinner },
              ].map(meal => (
                <div key={meal.key} className="bg-muted flex items-center justify-between rounded-lg px-4 py-2.5">
                  <span className="text-foreground text-sm font-medium">{meal.label}</span>
                  <span className="text-muted-foreground text-sm font-bold">{Math.round(meal.cal)} kcal</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
});

EnergyDetailSheet.displayName = 'EnergyDetailSheet';
