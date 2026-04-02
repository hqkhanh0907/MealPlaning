import { AlertCircle, CheckCircle2, ClipboardList, Clock, Plus } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DayNutritionSummary, Dish, MealType, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { MealActionBar } from './MealActionBar';
import { MealSlot } from './MealSlot';
import { MiniNutritionBar } from './MiniNutritionBar';

export interface MealsSubTabProps {
  dayNutrition: DayNutritionSummary;
  dishes: Dish[];
  targetCalories: number;
  targetProtein: number;
  isSuggesting: boolean;
  servings?: Record<string, number>;
  onPlanMeal: (type: MealType) => void;
  onOpenTypeSelection: () => void;
  onSuggestMealPlan: () => void;
  onOpenClearPlan: () => void;
  onCopyPlan?: () => void;
  onSaveTemplate?: () => void;
  onOpenTemplateManager?: () => void;
  onSwitchToNutrition: () => void;
  recentDishIds?: string[];
  onQuickAdd?: (type: MealType, dishId: string) => void;
  onUpdateServings?: (dishId: string, servings: number) => void;
  onOpenGrocery?: () => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export const MealsSubTab = React.memo(function MealsSubTab({
  dayNutrition,
  dishes,
  targetCalories,
  targetProtein,
  isSuggesting,
  servings,
  onPlanMeal,
  onOpenTypeSelection,
  onSuggestMealPlan,
  onOpenClearPlan,
  onCopyPlan,
  onSaveTemplate,
  onOpenTemplateManager,
  onSwitchToNutrition,
  recentDishIds,
  onQuickAdd,
  onUpdateServings,
  onOpenGrocery,
}: MealsSubTabProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const [quickAddDishId, setQuickAddDishId] = useState<string | null>(null);
  const allEmpty =
    dayNutrition.breakfast.dishIds.length === 0 &&
    dayNutrition.lunch.dishIds.length === 0 &&
    dayNutrition.dinner.dishIds.length === 0;
  const isComplete =
    dayNutrition.breakfast.dishIds.length > 0 &&
    dayNutrition.lunch.dishIds.length > 0 &&
    dayNutrition.dinner.dishIds.length > 0;

  const missingSlots = useMemo(() => {
    const missing: string[] = [];
    if (dayNutrition.breakfast.dishIds.length === 0) missing.push(t('tips.mealBreakfast'));
    if (dayNutrition.lunch.dishIds.length === 0) missing.push(t('tips.mealLunch'));
    if (dayNutrition.dinner.dishIds.length === 0) missing.push(t('tips.mealDinner'));
    return missing.join(', ');
  }, [dayNutrition, t]);

  const handleQuickAdd = useCallback(
    (type: MealType, dishId: string) => {
      onQuickAdd?.(type, dishId);
      setQuickAddDishId(null);
    },
    [onQuickAdd],
  );

  const recentDishes = useMemo(() => {
    if (!recentDishIds?.length) return [];
    return recentDishIds.map(id => dishes.find(d => d.id === id)).filter(Boolean) as Dish[];
  }, [recentDishIds, dishes]);

  const emptySlots = useMemo(() => {
    const slots: MealType[] = [];
    if (dayNutrition.breakfast.dishIds.length === 0) slots.push('breakfast');
    if (dayNutrition.lunch.dishIds.length === 0) slots.push('lunch');
    if (dayNutrition.dinner.dishIds.length === 0) slots.push('dinner');
    return slots;
  }, [dayNutrition]);

  const mealTypeLabels: Record<MealType, string> = useMemo(
    () => ({
      breakfast: t('calendar.morning'),
      lunch: t('calendar.afternoon'),
      dinner: t('calendar.evening'),
    }),
    [t],
  );

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
        onOpenGrocery={onOpenGrocery}
      />

      {recentDishes.length > 0 && emptySlots.length > 0 && onQuickAdd && (
        <div
          data-testid="recent-dishes-section"
          className="bg-card rounded-2xl border border-slate-100 p-3 shadow-sm dark:border-slate-700"
        >
          <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
            <Clock className="h-3.5 w-3.5" />
            {t('recentDishes.title')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recentDishes.map(dish => (
              <div key={dish.id} className="relative">
                <button
                  data-testid={`btn-recent-${dish.id}`}
                  onClick={() => {
                    if (emptySlots.length === 1) {
                      handleQuickAdd(emptySlots[0], dish.id);
                    } else {
                      setQuickAddDishId(prev => (prev === dish.id ? null : dish.id));
                    }
                  }}
                  className="dark:hover:border-primary inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-emerald-900/20"
                >
                  <Plus className="text-primary h-3 w-3" />
                  {getLocalizedField(dish.name, lang)}
                </button>
                {quickAddDishId === dish.id && emptySlots.length > 1 && (
                  <div className="absolute top-full left-0 z-20 mt-1 min-w-28 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-700">
                    {emptySlots.map(type => (
                      <button
                        key={type}
                        data-testid={`btn-quick-add-${type}-${dish.id}`}
                        onClick={() => handleQuickAdd(type, dish.id)}
                        className="flex min-h-11 w-full items-center px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-900/20"
                      >
                        {mealTypeLabels[type]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 shadow-sm dark:divide-slate-700 dark:border-slate-700">
        {MEAL_TYPES.map(type => (
          <div key={type} className="p-1">
            <MealSlot
              type={type}
              slot={dayNutrition[type]}
              dishes={dishes}
              servings={servings}
              onEdit={() => onPlanMeal(type)}
              onUpdateServings={onUpdateServings}
            />
          </div>
        ))}
      </div>

      {/* Inline tip */}
      {allEmpty && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-300">
          <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
          <p className="font-medium">{t('tips.noPlan')}</p>
        </div>
      )}
      {!allEmpty && !isComplete && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="font-medium">
            {t('recommendation.missing')} {missingSlots}
          </p>
        </div>
      )}
      {isComplete && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800/30 dark:bg-emerald-900/20">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
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
