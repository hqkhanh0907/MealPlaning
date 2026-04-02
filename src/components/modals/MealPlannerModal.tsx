import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, ChefHat, Dumbbell, Flame, Moon, Search, SlidersHorizontal, Sun, Sunrise, X } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { DayPlan, Dish, FilterConfig, Ingredient, MealType, NutritionInfo, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { calculateDishesNutrition, calculateDishNutrition } from '../../utils/nutrition';
import { FilterBottomSheet } from '../shared/FilterBottomSheet';
import { ModalBackdrop } from '../shared/ModalBackdrop';

type SortOption = 'name-asc' | 'name-desc' | 'cal-asc' | 'cal-desc' | 'pro-asc' | 'pro-desc';

const sortDishes = (
  a: { name: string; nutrition: NutritionInfo },
  b: { name: string; nutrition: NutritionInfo },
  sortBy: SortOption,
): number => {
  switch (sortBy) {
    case 'name-asc':
      return a.name.localeCompare(b.name);
    case 'name-desc':
      return b.name.localeCompare(a.name);
    case 'cal-asc':
      return a.nutrition.calories - b.nutrition.calories;
    case 'cal-desc':
      return b.nutrition.calories - a.nutrition.calories;
    case 'pro-asc':
      return a.nutrition.protein - b.nutrition.protein;
    case 'pro-desc':
      return b.nutrition.protein - a.nutrition.protein;
  }
};

const getDishIdsForMeal = (plan: DayPlan, type: MealType): string[] => {
  switch (type) {
    case 'breakfast':
      return plan.breakfastDishIds;
    case 'lunch':
      return plan.lunchDishIds;
    case 'dinner':
      return plan.dinnerDishIds;
  }
};

const MEAL_TABS: { type: MealType; icon: LucideIcon; labelKey: string }[] = [
  { type: 'breakfast', icon: Sunrise, labelKey: 'meal.breakfastFull' },
  { type: 'lunch', icon: Sun, labelKey: 'meal.lunchFull' },
  { type: 'dinner', icon: Moon, labelKey: 'meal.dinnerFull' },
];

interface MealPlannerModalProps {
  dishes: Dish[];
  ingredients: Ingredient[];
  currentPlan: DayPlan;
  selectedDate: string;
  initialTab?: MealType;
  targetCalories?: number;
  targetProtein?: number;
  onConfirm: (changes: Record<MealType, string[]>) => void;
  onClose: () => void;
}

export const MealPlannerModal = ({
  dishes,
  ingredients,
  currentPlan,
  selectedDate,
  initialTab = 'breakfast',
  targetCalories,
  targetProtein,
  onConfirm,
  onClose,
}: MealPlannerModalProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;

  const [activeTab, setActiveTab] = React.useState<MealType>(initialTab);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterConfig, setFilterConfig] = React.useState<FilterConfig>({ sortBy: 'name-asc' });
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [selections, setSelections] = React.useState<Record<MealType, Set<string>>>(() => ({
    breakfast: new Set(currentPlan.breakfastDishIds),
    lunch: new Set(currentPlan.lunchDishIds),
    dinner: new Set(currentPlan.dinnerDishIds),
  }));

  useModalBackHandler(true, onClose);

  const handleTabChange = (tab: MealType) => {
    setActiveTab(tab);
  };

  const toggleDish = (dishId: string) => {
    setSelections(prev => {
      const next = new Set(prev[activeTab]);
      if (next.has(dishId)) next.delete(dishId);
      else next.add(dishId);
      return { ...prev, [activeTab]: next };
    });
  };

  const hasTabChanged = React.useCallback(
    (type: MealType): boolean => {
      const original = new Set(getDishIdsForMeal(currentPlan, type));
      const current = selections[type];
      if (original.size !== current.size) return true;
      for (const id of original) {
        if (!current.has(id)) return true;
      }
      return false;
    },
    [currentPlan, selections],
  );

  const changedTabs = React.useMemo(() => {
    return MEAL_TABS.filter(tab => hasTabChanged(tab.type));
  }, [hasTabChanged]);

  const hasActiveFilters =
    filterConfig.maxCalories !== undefined ||
    filterConfig.minProtein !== undefined ||
    (filterConfig.tags !== undefined && filterConfig.tags.length > 0);

  const filteredDishes = React.useMemo(() => {
    return dishes
      .filter(d => d.tags?.includes(activeTab))
      .filter(d => Object.values(d.name).some((n: string) => n.toLowerCase().includes(searchQuery.toLowerCase())))
      .map(d => ({ dish: d, nutrition: calculateDishNutrition(d, ingredients) }))
      .filter(({ nutrition }) => {
        if (filterConfig.maxCalories && nutrition.calories > filterConfig.maxCalories) return false;
        if (filterConfig.minProtein && nutrition.protein < filterConfig.minProtein) return false;
        return true;
      })
      .sort((a, b) =>
        sortDishes(
          { name: getLocalizedField(a.dish.name, lang), nutrition: a.nutrition },
          { name: getLocalizedField(b.dish.name, lang), nutrition: b.nutrition },
          filterConfig.sortBy,
        ),
      );
  }, [dishes, activeTab, searchQuery, ingredients, filterConfig, lang]);

  const activeTabNutrition = React.useMemo(() => {
    return calculateDishesNutrition(Array.from(selections[activeTab]), dishes, ingredients);
  }, [selections, activeTab, dishes, ingredients]);

  const totalDayNutrition = React.useMemo(() => {
    const allIds = [
      ...Array.from(selections.breakfast),
      ...Array.from(selections.lunch),
      ...Array.from(selections.dinner),
    ];
    return calculateDishesNutrition(allIds, dishes, ingredients);
  }, [selections, dishes, ingredients]);

  const totalDayDishCount = selections.breakfast.size + selections.lunch.size + selections.dinner.size;

  const remainingBudget = React.useMemo(() => {
    if (targetCalories === undefined && targetProtein === undefined) return null;
    const remainingCal = targetCalories === undefined ? null : Math.round(targetCalories - totalDayNutrition.calories);
    const remainingPro = targetProtein === undefined ? null : Math.round(targetProtein - totalDayNutrition.protein);
    return { calories: remainingCal, protein: remainingPro };
  }, [targetCalories, targetProtein, totalDayNutrition]);

  const handleConfirm = () => {
    const changes: Partial<Record<MealType, string[]>> = {};
    for (const tab of MEAL_TABS) {
      if (hasTabChanged(tab.type)) {
        changes[tab.type] = Array.from(selections[tab.type]);
      }
    }
    onConfirm(changes as Record<MealType, string[]>);
  };

  const confirmButtonLabel = React.useMemo(() => {
    if (changedTabs.length <= 1) {
      const count = changedTabs.length === 1 ? selections[changedTabs[0].type].size : 0;
      return count > 0 ? `${t('common.confirm')} (${count})` : t('common.confirm');
    }
    const totalDishes = changedTabs.reduce((sum, tab) => sum + selections[tab.type].size, 0);
    return `${t('planning.saveAll')} (${t('planning.mealCount', { count: totalDishes })} · ${t('planning.mealsChanged', { count: changedTabs.length })})`;
  }, [changedTabs, selections, t]);

  const activeTabConfig = MEAL_TABS.find(tab => tab.type === activeTab);
  const activeTabLabel = t(activeTabConfig?.labelKey ?? 'meal.breakfastFull');

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card relative flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="border-border-subtle flex items-center justify-between border-b px-4 py-4 sm:px-8 sm:py-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 sm:text-xl dark:text-slate-100">
              {t('planning.planTitle')} — {selectedDate}
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm">{t('planning.planSubtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-border-subtle border-b bg-slate-50 px-4 pt-3 pb-3 sm:px-8 dark:bg-slate-800/50">
          <div className="flex gap-2">
            {MEAL_TABS.map(tab => {
              const isActive = activeTab === tab.type;
              const count = selections[tab.type].size;
              const changed = hasTabChanged(tab.type);
              return (
                <button
                  key={tab.type}
                  onClick={() => handleTabChange(tab.type)}
                  className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                      : 'bg-card text-foreground-secondary font-medium hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600'
                  }`}
                >
                  <span>
                    <tab.icon className="inline-block size-4" aria-hidden="true" />
                  </span>
                  <span>{t(tab.labelKey)}</span>
                  {count > 0 && (
                    <span
                      className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs ${
                        isActive ? 'bg-white/20 text-white' : 'text-foreground-secondary bg-slate-100 dark:bg-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {changed && (
                    <span className={`h-2 w-2 shrink-0 rounded-full ${isActive ? 'bg-white' : 'bg-primary'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + Sort */}
        <div className="border-border-subtle sticky top-0 z-10 border-b bg-slate-50 px-4 py-3 sm:px-8 dark:bg-slate-800/50">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                id="meal-planner-search"
                name="meal-planner-search"
                autoComplete="off"
                placeholder={t('planning.searchPlaceholder')}
                aria-label={t('planning.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                data-testid="input-search-plan"
                className="w-full pr-4 pl-10 shadow-sm"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              data-testid="btn-filter"
              className="border-border bg-card flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-emerald-400 dark:bg-slate-700 dark:text-slate-200"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('filter.button')}
              {hasActiveFilters && <span className="bg-primary h-2 w-2 rounded-full" />}
            </button>
          </div>
        </div>

        {/* Dish list */}
        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-8">
          {filteredDishes.length === 0 && (
            <div className="py-12 text-center">
              <ChefHat className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="text-muted-foreground font-medium">
                {t('planning.noMatchTitle', { meal: activeTabLabel })}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t('planning.noMatchHint', { meal: activeTabLabel })}
              </p>
            </div>
          )}
          {filteredDishes.map(({ dish, nutrition }) => {
            const isSelected = selections[activeTab].has(dish.id);
            return (
              <button
                key={dish.id}
                onClick={() => toggleDish(dish.id)}
                className={`group flex min-h-16 w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98] sm:p-5 ${
                  isSelected
                    ? 'border-primary bg-primary-subtle/50'
                    : 'dark:hover:border-primary border-border-subtle hover:border-emerald-200'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'text-muted-foreground bg-slate-50 dark:bg-slate-700'
                    }`}
                  >
                    <ChefHat className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`truncate text-base font-bold ${
                        isSelected ? 'text-emerald-900' : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {getLocalizedField(dish.name, lang)}
                    </h4>
                    <div className="mt-1 flex gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                        <Flame className="inline-block size-3.5" aria-hidden="true" /> {Math.round(nutrition.calories)}{' '}
                        kcal
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        <Dumbbell className="inline-block size-3.5" aria-hidden="true" />{' '}
                        {Math.round(nutrition.protein)}g
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={`ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-transparent group-hover:border-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-card border-border-subtle border-t px-4 py-4 sm:px-8 sm:py-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">
              {t('planning.totalDay')}:{' '}
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {totalDayDishCount} {t('common.item')}
              </span>
            </span>
            {totalDayDishCount > 0 && (
              <span className="text-muted-foreground">
                <Flame className="inline-block size-3.5" aria-hidden="true" /> {Math.round(totalDayNutrition.calories)}{' '}
                kcal · <Dumbbell className="inline-block size-3.5" aria-hidden="true" />{' '}
                {Math.round(totalDayNutrition.protein)}g Pro
              </span>
            )}
          </div>
          {remainingBudget && totalDayDishCount > 0 && (
            <div data-testid="meal-planner-remaining-budget" className="mb-1 flex items-center justify-between text-xs">
              {remainingBudget.calories !== null && (
                <span
                  data-testid="meal-planner-remaining-cal"
                  className={`font-medium ${remainingBudget.calories >= 0 ? 'text-primary' : 'text-rose-600 dark:text-rose-400'}`}
                >
                  {remainingBudget.calories >= 0
                    ? t('summary.remaining', { value: remainingBudget.calories, unit: 'kcal' })
                    : t('summary.over', { value: Math.abs(remainingBudget.calories), unit: 'kcal' })}
                </span>
              )}
              {remainingBudget.protein !== null && (
                <span
                  data-testid="meal-planner-remaining-pro"
                  className={`font-medium ${remainingBudget.protein >= 0 ? 'text-primary' : 'text-rose-600 dark:text-rose-400'}`}
                >
                  {remainingBudget.protein >= 0
                    ? t('summary.remaining', { value: remainingBudget.protein, unit: 'g' })
                    : t('summary.over', { value: Math.abs(remainingBudget.protein), unit: 'g' })}
                </span>
              )}
            </div>
          )}
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {activeTabLabel}:{' '}
              <span className="text-foreground-secondary font-semibold">
                {selections[activeTab].size} {t('common.item')}
              </span>
            </span>
            {selections[activeTab].size > 0 && (
              <span className="text-muted-foreground">
                {Math.round(activeTabNutrition.calories)} kcal · {Math.round(activeTabNutrition.protein)}g Pro
              </span>
            )}
          </div>
          <button
            onClick={handleConfirm}
            data-testid="btn-confirm-plan"
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-xl py-3.5 text-lg font-bold shadow-sm transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            {confirmButtonLabel}
          </button>
        </div>
        {isFilterOpen && (
          <FilterBottomSheet config={filterConfig} onChange={setFilterConfig} onClose={() => setIsFilterOpen(false)} />
        )}
      </div>
    </ModalBackdrop>
  );
};
