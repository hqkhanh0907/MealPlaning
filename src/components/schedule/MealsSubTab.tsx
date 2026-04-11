import { AlertCircle, CheckCircle2, ClipboardList, Clock, Plus } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DayNutritionSummary, Dish, MealType, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { EmptyState } from '../shared/EmptyState';
import { buildStateDescription, createSurfaceStateContract } from '../shared/surfaceState';
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
  onClearSlot?: (type: MealType) => void;
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
  onClearSlot,
}: MealsSubTabProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const [quickAddDishId, setQuickAddDishId] = useState<string | null>(null);
  const [debouncing, setDebouncing] = useState(false);
  const [activeSwipeSlot, setActiveSwipeSlot] = useState<MealType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
      setDebouncing(true);
      setTimeout(() => setDebouncing(false), 300);
    },
    [onQuickAdd],
  );

  const dismissDropdown = useCallback(() => setQuickAddDishId(null), []);

  useEffect(() => {
    if (!quickAddDishId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        dismissDropdown();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissDropdown();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [quickAddDishId, dismissDropdown]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !activeSwipeSlot) return;

    const handleScroll = () => setActiveSwipeSlot(null);
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeSwipeSlot]);

  const recentDishes = useMemo(() => {
    if (!recentDishIds?.length) return [];
    const map = new Map(dishes.map(d => [d.id, d]));
    return recentDishIds.map(id => map.get(id)).filter(Boolean) as Dish[];
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

  const filledCount = useMemo(() => {
    let count = 0;
    if (dayNutrition.breakfast.dishIds.length > 0) count++;
    if (dayNutrition.lunch.dishIds.length > 0) count++;
    if (dayNutrition.dinner.dishIds.length > 0) count++;
    return count;
  }, [dayNutrition]);

  const emptyDayContract = useMemo(
    () =>
      createSurfaceStateContract({
        surface: 'calendar.meals',
        state: 'empty',
        copy: {
          title: t('calendar.emptyDayTitle'),
          missing: t('calendar.emptyDayMissing'),
          reason: t('calendar.emptyDayReason'),
          nextStep: t('calendar.emptyDayNextStep'),
        },
        primaryAction: {
          label: t('calendar.emptyDayAction'),
          onAction: onOpenTypeSelection,
        },
      }),
    [onOpenTypeSelection, t],
  );

  const partialPlanContract = useMemo(
    () =>
      createSurfaceStateContract({
        surface: 'calendar.meals',
        state: 'warning',
        copy: {
          title: t('calendar.partialDayTitle'),
          missing: missingSlots,
          reason: t('calendar.partialDayReason', { filled: filledCount, total: MEAL_TYPES.length }),
          nextStep: t('calendar.partialDayNextStep'),
        },
        primaryAction: {
          label: t('calendar.partialDayAction'),
          onAction: onOpenTypeSelection,
        },
      }),
    [filledCount, missingSlots, onOpenTypeSelection, t],
  );

  const completePlanContract = useMemo(
    () =>
      createSurfaceStateContract({
        surface: 'calendar.meals',
        state: 'success',
        copy: {
          title: t('calendar.completeDayTitle'),
          missing: t('calendar.completeDayMissing'),
          reason: t('calendar.completeDayReason'),
          nextStep: t('calendar.completeDayNextStep'),
        },
        primaryAction: {
          label: t('calendar.completeDayAction'),
          onAction: onSwitchToNutrition,
        },
      }),
    [onSwitchToNutrition, t],
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
          ref={dropdownRef}
          className="bg-card border-border-subtle rounded-2xl border p-4 shadow-sm"
        >
          <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {t('calendar.recentDishesLabel')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recentDishes.map(dish => (
              <div key={dish.id} className="relative">
                <button
                  data-testid={`btn-recent-${dish.id}`}
                  disabled={debouncing}
                  onClick={() => {
                    if (debouncing) return;
                    if (emptySlots.length === 1) {
                      handleQuickAdd(emptySlots[0], dish.id);
                    } else {
                      setQuickAddDishId(prev => (prev === dish.id ? null : dish.id));
                    }
                  }}
                  className="dark:hover:border-primary border-border hover:bg-primary-subtle bg-muted text-foreground hover:border-primary/30 inline-flex min-h-11 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all disabled:pointer-events-none disabled:opacity-50"
                >
                  <Plus className="text-primary h-4 w-4" />
                  {getLocalizedField(dish.name, lang)}
                </button>
                {quickAddDishId === dish.id && emptySlots.length > 1 && (
                  <div
                    data-testid={`quick-add-dropdown-${dish.id}`}
                    className="border-border bg-card absolute top-full left-0 z-20 mt-1 min-w-28 rounded-xl border p-1 shadow-lg"
                  >
                    {emptySlots.map(type => (
                      <button
                        key={type}
                        data-testid={`btn-quick-add-${type}-${dish.id}`}
                        onClick={() => handleQuickAdd(type, dish.id)}
                        className="hover:bg-muted text-foreground flex min-h-11 w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors"
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

      <div
        ref={scrollContainerRef}
        className="bg-card border-border-subtle divide-border divide-y overflow-hidden rounded-2xl border shadow-sm"
      >
        {!allEmpty && (
          <div data-testid="meal-progress" className="flex items-center justify-between px-4 py-2">
            <span className="text-muted-foreground text-xs font-medium">
              {t('emptyState.mealProgress', { filled: filledCount, total: MEAL_TYPES.length })}
            </span>
            <div className="bg-muted flex h-1.5 w-20 overflow-hidden rounded-full" aria-hidden="true">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? 'bg-primary' : 'bg-warning'}`}
                style={{ width: `${(filledCount / MEAL_TYPES.length) * 100}%` }}
              />
            </div>
          </div>
        )}
        {MEAL_TYPES.map(type => (
          <div key={type} className="p-1">
            <MealSlot
              type={type}
              slot={dayNutrition[type]}
              dishes={dishes}
              servings={servings}
              onEdit={() => onPlanMeal(type)}
              onUpdateServings={onUpdateServings}
              onClearMeal={onClearSlot ? () => onClearSlot(type) : undefined}
              isSwipeOpen={activeSwipeSlot === type}
              onSwipeOpen={() => setActiveSwipeSlot(type)}
              onSwipeClose={() => setActiveSwipeSlot(null)}
            />
          </div>
        ))}
      </div>

      {/* Inline tip */}
      {allEmpty && (
        <EmptyState
          variant="standard"
          icon={ClipboardList}
          contract={emptyDayContract}
          className="border-info/20 bg-info/5 rounded-2xl border"
        />
      )}
      {!allEmpty && !isComplete && (
        <div data-testid="meal-plan-warning" className="border-warning/15 bg-warning/10 rounded-xl border p-4 text-sm">
          <div className="text-warning flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{partialPlanContract.copy.title}</p>
              <p className="mt-1">{buildStateDescription(partialPlanContract.copy)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={partialPlanContract.primaryAction?.onAction}
            className="text-warning mt-3 text-sm font-semibold underline underline-offset-2"
          >
            {partialPlanContract.primaryAction?.label}
          </button>
        </div>
      )}
      {isComplete && (
        <div
          data-testid="meal-plan-success"
          className="bg-primary-subtle border-primary/10 rounded-xl border p-4 text-sm"
        >
          <div className="text-primary-emphasis flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{completePlanContract.copy.title}</p>
              <p className="mt-1">{buildStateDescription(completePlanContract.copy)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={completePlanContract.primaryAction?.onAction}
            className="text-primary-emphasis mt-3 text-sm font-semibold underline underline-offset-2"
          >
            {completePlanContract.primaryAction?.label}
          </button>
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
