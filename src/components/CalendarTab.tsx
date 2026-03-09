import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, UtensilsCrossed, BarChart3 } from 'lucide-react';
import { Dish, Ingredient, DayPlan, MealType, DayNutritionSummary } from '../types';
import { DateSelector } from './DateSelector';
import { MealsSubTab } from './schedule/MealsSubTab';
import { NutritionSubTab } from './schedule/NutritionSubTab';
import { parseLocalDate } from '../utils/helpers';
import { useIsDesktop } from '../hooks/useIsDesktop';

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
  onOpenTypeSelection: () => void;
  onOpenClearPlan: () => void;
  onOpenGoalModal: () => void;
  onPlanMeal: (type: MealType) => void;
  onSuggestMealPlan: () => void;
  onCopyPlan?: () => void;
  onSaveTemplate?: () => void;
  onOpenTemplateManager?: () => void;
  onQuickAdd?: (type: MealType, dishId: string) => void;
}

export const CalendarTab: React.FC<CalendarTabProps> = React.memo(({
  selectedDate, onSelectDate, dayPlans, dishes, ingredients: _ingredients,
  currentPlan: _currentPlan, dayNutrition, userWeight, targetCalories, targetProtein,
  isSuggesting, onOpenTypeSelection, onOpenClearPlan, onOpenGoalModal, onPlanMeal, onSuggestMealPlan,
  onCopyPlan, onSaveTemplate, onOpenTemplateManager, onQuickAdd,
}) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const [activeSubTab, setActiveSubTab] = useState<ScheduleSubTab>('meals');
  const isDesktop = useIsDesktop();

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
    { key: 'meals', label: t('schedule.mealsTab'), icon: <UtensilsCrossed className="w-4 h-4" /> },
    { key: 'nutrition', label: t('schedule.nutritionTab'), icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Date Selection */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-xl">
            <CalendarDays className="w-6 h-6 text-emerald-500" />
            <h2>{t('calendar.selectDate')}</h2>
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full border border-slate-200 dark:border-slate-700 text-center">
            <span className="sm:hidden">{parseLocalDate(selectedDate).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>
            <span className="hidden sm:inline">{parseLocalDate(selectedDate).toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <DateSelector selectedDate={selectedDate} onSelectDate={onSelectDate} onPlanClick={onOpenTypeSelection} dayPlans={dayPlans} />
      </section>

      {/* Mobile: Sub-tabs */}
      {!isDesktop && (
        <>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl" data-testid="schedule-subtabs">
            {SUB_TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSubTab(key)}
                data-testid={`subtab-${key}`}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-11 ${
                  activeSubTab === key
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
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
    </div>
  );
});

CalendarTab.displayName = 'CalendarTab';

