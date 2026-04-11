import type { LucideIcon } from 'lucide-react';
import { BarChart3, CalendarDays, Undo2, UtensilsCrossed } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CloseButton } from '@/components/shared/CloseButton';

import { MEAL_TYPE_ICONS } from '../data/constants';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { CalendarSubTab, useUIStore } from '../store/uiStore';
import { DayNutritionSummary, DayPlan, Dish, Ingredient, MealType } from '../types';
import { parseLocalDate } from '../utils/helpers';
import { getLocalizedField } from '../utils/localize';
import { DateSelector } from './DateSelector';
import { GroceryList } from './GroceryList';
import { MealsSubTab } from './schedule/MealsSubTab';
import { NutritionSubTab } from './schedule/NutritionSubTab';
import { UNDO_TOAST_DURATION_MS, UndoToast } from './schedule/UndoToast';
import { ModalBackdrop } from './shared/ModalBackdrop';

export interface CalendarTabProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayPlans: DayPlan[];
  dishes: Dish[];
  ingredients: Ingredient[];
  currentPlan: DayPlan;
  dayNutrition: DayNutritionSummary;
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
  onClearSlot?: (type: MealType) => void;
  onUpdateServings?: (dishId: string, servings: number) => void;
  restoreDayPlans?: (snapshot: DayPlan[]) => void;
  caloriesOut?: number;
}

export const CalendarTab = React.memo(function CalendarTab({
  selectedDate,
  onSelectDate,
  dayPlans,
  dishes,
  ingredients,
  currentPlan,
  dayNutrition,
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
  onClearSlot,
  onUpdateServings,
  restoreDayPlans,
  caloriesOut,
}: CalendarTabProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const lang = i18n.language as 'vi' | 'en';
  const activeSubTab = useUIStore(s => s.activeCalendarSubTab);
  const setActiveSubTab = useUIStore(s => s.setCalendarSubTab);
  const [showGrocery, setShowGrocery] = useState(false);
  const isDesktop = useIsDesktop();

  // --- Undo mechanism ---
  const undoSnapshot = useRef<{ date: string; plan: DayPlan | null } | null>(null);
  const [undoToast, setUndoToast] = useState<{ message: string; icon: LucideIcon } | null>(null);

  const captureSnapshot = useCallback(
    (date: string) => {
      const plan = dayPlans.find(p => p.date === date) ?? null;
      undoSnapshot.current = { date, plan: plan ? { ...plan } : null };
    },
    [dayPlans],
  );

  const handleUndo = useCallback(() => {
    if (!undoSnapshot.current || !restoreDayPlans) return;
    const { date, plan } = undoSnapshot.current;
    if (plan) {
      restoreDayPlans([plan]);
    } else {
      restoreDayPlans([{ date, breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] }]);
    }
    undoSnapshot.current = null;
    setUndoToast(null);
  }, [restoreDayPlans]);

  const handleUndoDismiss = useCallback(() => {
    undoSnapshot.current = null;
    setUndoToast(null);
  }, []);

  const mealTypeLabels: Record<MealType, string> = useMemo(
    () => ({
      breakfast: t('calendar.morning'),
      lunch: t('calendar.afternoon'),
      dinner: t('calendar.evening'),
    }),
    [t],
  );

  const wrappedQuickAdd = useCallback(
    (type: MealType, dishId: string) => {
      captureSnapshot(selectedDate);
      const dish = dishes.find(d => d.id === dishId);
      const dishName = dish ? getLocalizedField(dish.name, lang) : dishId;
      setUndoToast({
        message: t('calendar.undoQuickAdd', { dishName, mealType: mealTypeLabels[type] }),
        icon: MEAL_TYPE_ICONS[type],
      });
      onQuickAdd?.(type, dishId);
    },
    [captureSnapshot, selectedDate, dishes, lang, t, mealTypeLabels, onQuickAdd],
  );

  const wrappedClearSlot = useCallback(
    (type: MealType) => {
      captureSnapshot(selectedDate);
      setUndoToast({
        message: t('calendar.undoSwipeClear', { mealType: mealTypeLabels[type] }),
        icon: Undo2,
      });
      onClearSlot?.(type);
    },
    [captureSnapshot, selectedDate, t, mealTypeLabels, onClearSlot],
  );

  const wrappedClearPlan = useCallback(() => {
    captureSnapshot(selectedDate);
    setUndoToast({
      message: t('calendar.undoClearPlan'),
      icon: Undo2,
    });
    onOpenClearPlan();
  }, [captureSnapshot, selectedDate, t, onOpenClearPlan]);

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

  const SUB_TABS: { key: CalendarSubTab; label: string; icon: React.ReactNode }[] = [
    { key: 'meals', label: t('schedule.mealsTab'), icon: <UtensilsCrossed className="text-energy h-4 w-4" /> },
    { key: 'nutrition', label: t('schedule.nutritionTab'), icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Date Selection */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="text-foreground flex items-center gap-2 text-xl font-semibold">
            <CalendarDays className="text-primary h-6 w-6" />
            <h2>{t('calendar.selectDate')}</h2>
          </div>
          <div className="bg-card text-muted-foreground border-border rounded-xl border px-4 py-2.5 text-center text-sm font-medium sm:rounded-full sm:py-1.5">
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
          <div className="bg-muted flex rounded-xl p-1" data-testid="schedule-subtabs">
            {SUB_TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSubTab(key)}
                data-testid={`subtab-${key}`}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeSubTab === key
                    ? 'text-primary-emphasis bg-card shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
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
              onOpenClearPlan={wrappedClearPlan}
              onCopyPlan={onCopyPlan}
              onSaveTemplate={onSaveTemplate}
              onOpenTemplateManager={onOpenTemplateManager}
              onSwitchToNutrition={() => setActiveSubTab('nutrition')}
              recentDishIds={recentDishIds}
              onQuickAdd={onQuickAdd ? wrappedQuickAdd : undefined}
              onUpdateServings={onUpdateServings}
              onOpenGrocery={handleOpenGrocery}
              onClearSlot={onClearSlot ? wrappedClearSlot : undefined}
            />
          )}
          {activeSubTab === 'nutrition' && (
            <NutritionSubTab
              dayNutrition={dayNutrition}
              targetCalories={targetCalories}
              targetProtein={targetProtein}
              onEditGoals={onOpenGoalModal}
              onSwitchToMeals={() => setActiveSubTab('meals')}
              caloriesOut={caloriesOut}
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
              onOpenClearPlan={wrappedClearPlan}
              onCopyPlan={onCopyPlan}
              onSaveTemplate={onSaveTemplate}
              onOpenTemplateManager={onOpenTemplateManager}
              onSwitchToNutrition={() => setActiveSubTab('nutrition')}
              recentDishIds={recentDishIds}
              onQuickAdd={onQuickAdd ? wrappedQuickAdd : undefined}
              onUpdateServings={onUpdateServings}
              onOpenGrocery={handleOpenGrocery}
              onClearSlot={onClearSlot ? wrappedClearSlot : undefined}
            />
          </div>
          <div>
            <NutritionSubTab
              dayNutrition={dayNutrition}
              targetCalories={targetCalories}
              targetProtein={targetProtein}
              onEditGoals={onOpenGoalModal}
              caloriesOut={caloriesOut}
            />
          </div>
        </div>
      )}

      {showGrocery && (
        <ModalBackdrop onClose={handleCloseGrocery} zIndex="z-50">
          <div
            data-testid="grocery-modal"
            className="bg-card relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-lg sm:rounded-2xl"
          >
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-foreground text-lg font-semibold">{t('grocery.title')}</h2>
              <CloseButton onClick={handleCloseGrocery} data-testid="btn-close-grocery" ariaLabel={t('common.close')} />
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

      {undoToast && (
        <UndoToast
          message={undoToast.message}
          icon={undoToast.icon}
          onUndo={handleUndo}
          onDismiss={handleUndoDismiss}
          duration={UNDO_TOAST_DURATION_MS}
        />
      )}
    </div>
  );
});

CalendarTab.displayName = 'CalendarTab';
