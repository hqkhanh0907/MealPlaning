import { ChevronDown, ChevronUp, Coffee, Moon, Sun, UtensilsCrossed } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DayNutritionSummary, MealType } from '../../types';

interface NutritionDetailsProps {
  dayNutrition: DayNutritionSummary;
  targetCalories: number;
  targetProtein: number;
  isSetup: boolean;
  onSwitchToMeals: () => void;
  onEditGoal: () => void;
}

type MealConfig = Readonly<{
  key: MealType;
  icon: React.ElementType;
  textColor: string;
  borderColor: string;
}>;

const MEAL_CONFIGS: readonly MealConfig[] = [
  { key: 'breakfast', icon: Coffee, textColor: 'text-meal-breakfast', borderColor: 'border-meal-breakfast' },
  { key: 'lunch', icon: Sun, textColor: 'text-meal-lunch', borderColor: 'border-meal-lunch' },
  { key: 'dinner', icon: Moon, textColor: 'text-meal-dinner', borderColor: 'border-meal-dinner' },
] as const;

const MEAL_I18N_KEYS: Record<MealType, string> = {
  breakfast: 'meal.breakfastFull',
  lunch: 'meal.lunchFull',
  dinner: 'meal.dinnerFull',
};

export const NutritionDetails = React.memo(function NutritionDetails({
  dayNutrition,
  targetCalories,
  targetProtein,
  isSetup,
  onSwitchToMeals,
  onEditGoal,
}: Readonly<NutritionDetailsProps>) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (isSetup) return null;

  const hasAnyMeal =
    dayNutrition.breakfast.dishIds.length > 0 ||
    dayNutrition.lunch.dishIds.length > 0 ||
    dayNutrition.dinner.dishIds.length > 0;

  const totalCalories = Math.round(
    dayNutrition.breakfast.calories + dayNutrition.lunch.calories + dayNutrition.dinner.calories,
  );
  const totalProtein = Math.round(
    dayNutrition.breakfast.protein + dayNutrition.lunch.protein + dayNutrition.dinner.protein,
  );
  const totalFat = Math.round(dayNutrition.breakfast.fat + dayNutrition.lunch.fat + dayNutrition.dinner.fat);
  const totalCarbs = Math.round(dayNutrition.breakfast.carbs + dayNutrition.lunch.carbs + dayNutrition.dinner.carbs);

  const proteinMet = totalProtein >= targetProtein;
  const deficit = targetCalories - totalCalories;
  const hasLargeDeficit = deficit > 300;

  const ChevronIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <div data-testid="nutrition-details" className="bg-card rounded-2xl border p-6 shadow-sm">
      <button
        type="button"
        data-testid="nutrition-details-header"
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full items-center justify-between"
        aria-expanded={expanded}
      >
        <span className="text-foreground text-sm font-semibold">{t('calendar.nutritionDetailsHeader')}</span>
        <ChevronIcon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
      </button>

      {expanded && (
        <div data-testid="nutrition-details-content" className="mt-4 space-y-4">
          {hasAnyMeal ? (
            <>
              <table data-testid="per-meal-table" className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs">
                    <th className="pb-2 text-left font-medium" />
                    <th className="pb-2 text-right font-medium">kcal</th>
                    <th className="pb-2 text-right font-medium">P</th>
                    <th className="pb-2 text-right font-medium">F</th>
                    <th className="pb-2 text-right font-medium">C</th>
                  </tr>
                </thead>
                <tbody>
                  {MEAL_CONFIGS.map(({ key, icon: Icon, textColor, borderColor }) => {
                    const slot = dayNutrition[key];
                    return (
                      <tr key={key} data-testid={`meal-row-${key}`}>
                        <td className={`border-l-2 ${borderColor} py-1.5 pl-2`}>
                          <span className={`inline-flex items-center gap-1.5 ${textColor}`}>
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{t(MEAL_I18N_KEYS[key])}</span>
                          </span>
                        </td>
                        <td className="py-1.5 text-right">{Math.round(slot.calories)}</td>
                        <td className="py-1.5 text-right">{Math.round(slot.protein)}g</td>
                        <td className="py-1.5 text-right">{Math.round(slot.fat)}g</td>
                        <td className="py-1.5 text-right">{Math.round(slot.carbs)}g</td>
                      </tr>
                    );
                  })}
                  <tr data-testid="meal-row-total" className="border-t font-bold">
                    <td className="pt-2">{t('calendar.nutritionDetailsTotalLabel')}</td>
                    <td className="pt-2 text-right">{totalCalories}</td>
                    <td className="pt-2 text-right">{totalProtein}g</td>
                    <td className="pt-2 text-right">{totalFat}g</td>
                    <td className="pt-2 text-right">{totalCarbs}g</td>
                  </tr>
                </tbody>
              </table>

              {(proteinMet || hasLargeDeficit) && (
                <div data-testid="tips-section" className="space-y-2">
                  {proteinMet && (
                    <div
                      data-testid="tip-success"
                      className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                    >
                      ✅ {t('common.protein')} ≥ {targetProtein}g
                    </div>
                  )}
                  {hasLargeDeficit && (
                    <div
                      data-testid="tip-warning"
                      className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                    >
                      ⚠️ -{deficit} kcal
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                data-testid="btn-edit-goal"
                onClick={onEditGoal}
                className="text-primary text-sm font-medium"
              >
                {t('calendar.nutritionDetailsGoalCta')} →
              </button>
            </>
          ) : (
            <div data-testid="nutrition-details-empty" className="flex flex-col items-center gap-3 py-4 text-center">
              <UtensilsCrossed className="text-muted-foreground h-8 w-8" aria-hidden="true" />
              <p className="text-muted-foreground text-sm">{t('calendar.nutritionDetailsNoMeals')}</p>
              <button
                type="button"
                data-testid="btn-switch-meals"
                onClick={onSwitchToMeals}
                className="text-primary text-sm font-medium"
              >
                {t('calendar.nutritionDetailsSwitch')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

NutritionDetails.displayName = 'NutritionDetails';
