import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { DayNutritionSummary, Dish, MealType } from '../../types';
import { MealSlot } from './MealSlot';
import { MealActionBar } from './MealActionBar';
import { MiniNutritionBar } from './MiniNutritionBar';

export interface MealsSubTabProps {
  dayNutrition: DayNutritionSummary;
  dishes: Dish[];
  targetCalories: number;
  targetProtein: number;
  isSuggesting: boolean;
  onPlanMeal: (type: MealType) => void;
  onOpenTypeSelection: () => void;
  onSuggestMealPlan: () => void;
  onOpenClearPlan: () => void;
  onCopyPlan?: () => void;
  onSaveTemplate?: () => void;
  onOpenTemplateManager?: () => void;
  onSwitchToNutrition: () => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export const MealsSubTab: React.FC<MealsSubTabProps> = React.memo(({
  dayNutrition, dishes,
  targetCalories, targetProtein, isSuggesting,
  onPlanMeal, onOpenTypeSelection, onSuggestMealPlan, onOpenClearPlan,
  onCopyPlan, onSaveTemplate, onOpenTemplateManager, onSwitchToNutrition,
}) => {
  const { t } = useTranslation();
  const allEmpty = dayNutrition.breakfast.dishIds.length === 0
    && dayNutrition.lunch.dishIds.length === 0
    && dayNutrition.dinner.dishIds.length === 0;
  const isComplete = dayNutrition.breakfast.dishIds.length > 0
    && dayNutrition.lunch.dishIds.length > 0
    && dayNutrition.dinner.dishIds.length > 0;

  const missingSlots = useMemo(() => {
    const missing: string[] = [];
    if (dayNutrition.breakfast.dishIds.length === 0) missing.push(t('tips.mealBreakfast'));
    if (dayNutrition.lunch.dishIds.length === 0) missing.push(t('tips.mealLunch'));
    if (dayNutrition.dinner.dishIds.length === 0) missing.push(t('tips.mealDinner'));
    return missing.join(', ');
  }, [dayNutrition, t]);

  return (
    <div data-testid="meals-subtab" className="space-y-4">
      <MealActionBar
        allEmpty={allEmpty}
        isSuggesting={isSuggesting}
        onOpenTypeSelection={onOpenTypeSelection}
        onSuggestMealPlan={onSuggestMealPlan}
        onOpenClearPlan={onOpenClearPlan}
        onCopyPlan={onCopyPlan}
        onSaveTemplate={onSaveTemplate}
        onOpenTemplateManager={onOpenTemplateManager}
      />

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
        {MEAL_TYPES.map((type) => (
          <div key={type} className="p-1">
            <MealSlot
              type={type}
              slot={dayNutrition[type]}
              dishes={dishes}
              targetCalories={targetCalories}
              targetProtein={targetProtein}
              onEdit={() => onPlanMeal(type)}
            />
          </div>
        ))}
      </div>

      {/* Inline tip */}
      {allEmpty && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 text-sm">
          <span className="shrink-0">📋</span>
          <p className="font-medium">{t('tips.noPlan')}</p>
        </div>
      )}
      {!allEmpty && !isComplete && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 text-amber-700 dark:text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="font-medium">{t('recommendation.missing')} {missingSlots}</p>
        </div>
      )}
      {isComplete && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p className="font-medium">{t('recommendation.planComplete')}</p>
        </div>
      )}

      <MiniNutritionBar
        dayNutrition={dayNutrition}
        targetCalories={targetCalories}
        targetProtein={targetProtein}
        onSwitchToNutrition={onSwitchToNutrition}
      />
    </div>
  );
});

MealsSubTab.displayName = 'MealsSubTab';
