import { BarChart3, CalendarDays, UtensilsCrossed, X } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsDesktop } from '../hooks/useIsDesktop';
import { DayNutritionSummary, DayPlan, Dish, Ingredient, MealType } from '../types';
import { parseLocalDate } from '../utils/helpers';
import { DateSelector } from './DateSelector';
import { GroceryList } from './GroceryList';
import { MealsSubTab } from './schedule/MealsSubTab';
import { NutritionSubTab } from './schedule/NutritionSubTab';
import { ModalBackdrop } from './shared/ModalBackdrop';

type ScheduleSubTab = 'meals' | 'nutrition';

export interface CalendarTabProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayPlans: DayPlan[];
  dishes: Dish[];
  ingredients: Ingredient[];
  currentPlan: DayPlan;
  dayNutrition: DayNutritionSummary;
  userWeight: number;
  targetCalories: number;
  targetProtein: number;
  isSuggesting: boolean;
  servings?: Record<string, number>;
  onOpenTypeSelection: () => void;
  onOpenClearPlan: () => void;
  onOpenGoalModal: () => void;
  onPlanMeal: (type: MealType) => void;
  onSuggestMealPlan: () => void;
  onCopyPlan?: () => void;
  onSaveTemplate?: () => void;
  onOpenTemplateManager?: () => void;
  onQuickAdd?: (type: MealType, dishId: string) => void;
  onUpdateServings?: (dishId: string, servings: number) => void;
}

export const CalendarTab = React.memo(function CalendarTab({
  selectedDate,
  onSelectDate,
  dayPlans,
  dishes,
  ingredients,
  currentPlan,
  dayNutrition,
  userWeight,
  targetCalories,
  targetProtein,
  isSuggesting,
  servings,
  onOpenTypeSelection,
  onOpenClearPlan,
  onOpenGoalModal,
  onPlanMeal,
  onSuggestMealPlan,
  onCopyPlan,
  onSaveTemplate,
  onOpenTemplateManager,
  onQuickAdd,
  onUpdateServings,
}: CalendarTabProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const [activeSubTab, setActiveSubTab] = useState<ScheduleSubTab>('meals');
  const [showGrocery, setShowGrocery] = useState(false);
  const isDesktop = useIsDesktop();

  const handleOpenGrocery = useCallback(() => setShowGrocery(true), []);
  const handleCloseGrocery = useCallback(() => setShowGrocery(false), []);

  const recentDishIds = useMemo(() => {
    const today = selectedDate;
    const allIds: string[] = [];
    const sorted = [...dayPlans]
      .filter(p => p.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);
    for (const plan of sorted) {
      for (const id of [...plan.breakfastDishIds, ...plan.lunchDishIds, ...plan.dinnerDishIds]) {
        if (!allIds.includes(id)) allIds.push(id);
      }
      if (allIds.length >= 8) break;
    }
    return allIds.slice(0, 8);
  }, [dayPlans, selectedDate]);

  const SUB_TABS: { key: ScheduleSubTab; label: string; icon: React.ReactNode }[] = [
    { key: 'meals', label: t('schedule.mealsTab'), icon: <UtensilsCrossed className="h-4 w-4" /> },
    { key: 'nutrition', label: t('schedule.nutritionTab'), icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Date Selection */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-100">
            <CalendarDays className="h-6 w-6 text-emerald-500" />
            <h2>{t('calendar.selectDate')}</h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-500 sm:rounded-full sm:py-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <span className="sm:hidden">
              {parseLocalDate(selectedDate).toLocaleDateString(dateLocale, {
                weekday: 'short',
                day: 'numeric',
                month: 'numeric',
              })}
            </span>
            <span className="hidden sm:inline">
              {parseLocalDate(selectedDate).toLocaleDateString(dateLocale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onPlanClick={onOpenTypeSelection}
          dayPlans={dayPlans}
        />
      </section>

      {/* Mobile: Sub-tabs */}
      {!isDesktop && (
        <>
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800" data-testid="schedule-subtabs">
            {SUB_TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSubTab(key)}
                data-testid={`subtab-${key}`}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeSubTab === key
                    ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {activeSubTab === 'meals' && (
            <MealsSubTab
              dayNutrition={dayNutrition}
              dishes={dishes}
              targetCalories={targetCalories}
              targetProtein={targetProtein}
              isSuggesting={isSuggesting}
              servings={servings}
              onPlanMeal={onPlanMeal}
              onOpenTypeSelection={onOpenTypeSelection}
              onSuggestMealPlan={onSuggestMealPlan}
              onOpenClearPlan={onOpenClearPlan}
              onCopyPlan={onCopyPlan}
              onSaveTemplate={onSaveTemplate}
              onOpenTemplateManager={onOpenTemplateManager}
              onSwitchToNutrition={() => setActiveSubTab('nutrition')}
              recentDishIds={recentDishIds}
              onQuickAdd={onQuickAdd}
              onUpdateServings={onUpdateServings}
              onOpenGrocery={handleOpenGrocery}
            />
          )}
          {activeSubTab === 'nutrition' && (
            <NutritionSubTab
              dayNutrition={dayNutrition}
              targetCalories={targetCalories}
              targetProtein={targetProtein}
              userWeight={userWeight}
              onEditGoals={onOpenGoalModal}
              onSwitchToMeals={() => setActiveSubTab('meals')}
            />
          )}
        </>
      )}

      {/* Desktop: Side-by-side Layout */}
      {isDesktop && (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <MealsSubTab
              dayNutrition={dayNutrition}
              dishes={dishes}
              targetCalories={targetCalories}
              targetProtein={targetProtein}
              isSuggesting={isSuggesting}
              servings={servings}
              onPlanMeal={onPlanMeal}
              onOpenTypeSelection={onOpenTypeSelection}
              onSuggestMealPlan={onSuggestMealPlan}
              onOpenClearPlan={onOpenClearPlan}
              onCopyPlan={onCopyPlan}
              onSaveTemplate={onSaveTemplate}
              onOpenTemplateManager={onOpenTemplateManager}
              onSwitchToNutrition={() => setActiveSubTab('nutrition')}
              recentDishIds={recentDishIds}
              onQuickAdd={onQuickAdd}
              onUpdateServings={onUpdateServings}
              onOpenGrocery={handleOpenGrocery}
            />
          </div>
          <div>
            <NutritionSubTab
              dayNutrition={dayNutrition}
              targetCalories={targetCalories}
              targetProtein={targetProtein}
              userWeight={userWeight}
              onEditGoals={onOpenGoalModal}
            />
          </div>
        </div>
      )}

      {showGrocery && (
        <ModalBackdrop onClose={handleCloseGrocery} zIndex="z-50">
          <div
            data-testid="grocery-modal"
            className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:mx-4 sm:max-w-lg sm:rounded-3xl dark:bg-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('grocery.title')}</h2>
              <button
                type="button"
                onClick={handleCloseGrocery}
                data-testid="btn-close-grocery"
                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <GroceryList
                currentPlan={currentPlan}
                dayPlans={dayPlans}
                selectedDate={selectedDate}
                allDishes={dishes}
                allIngredients={ingredients}
              />
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
});

CalendarTab.displayName = 'CalendarTab';
