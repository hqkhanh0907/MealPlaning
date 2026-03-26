import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, CheckCircle2, ChefHat, SlidersHorizontal } from 'lucide-react';
import { Dish, Ingredient, MealType, DayPlan, NutritionInfo, SupportedLang, FilterConfig } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { calculateDishNutrition, calculateDishesNutrition } from '../../utils/nutrition';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { FilterBottomSheet } from '../shared/FilterBottomSheet';

type SortOption = 'name-asc' | 'name-desc' | 'cal-asc' | 'cal-desc' | 'pro-asc' | 'pro-desc';

const sortDishes = (
  a: { name: string; nutrition: NutritionInfo },
  b: { name: string; nutrition: NutritionInfo },
  sortBy: SortOption,
): number => {
  switch (sortBy) {
    case 'name-asc': return a.name.localeCompare(b.name);
    case 'name-desc': return b.name.localeCompare(a.name);
    case 'cal-asc': return a.nutrition.calories - b.nutrition.calories;
    case 'cal-desc': return b.nutrition.calories - a.nutrition.calories;
    case 'pro-asc': return a.nutrition.protein - b.nutrition.protein;
    case 'pro-desc': return b.nutrition.protein - a.nutrition.protein;
  }
};

const getDishIdsForMeal = (plan: DayPlan, type: MealType): string[] => {
  switch (type) {
    case 'breakfast': return plan.breakfastDishIds;
    case 'lunch': return plan.lunchDishIds;
    case 'dinner': return plan.dinnerDishIds;
  }
};

const MEAL_TABS: { type: MealType; emoji: string; labelKey: string }[] = [
  { type: 'breakfast', emoji: '☀️', labelKey: 'meal.breakfastFull' },
  { type: 'lunch', emoji: '🌤️', labelKey: 'meal.lunchFull' },
  { type: 'dinner', emoji: '🌙', labelKey: 'meal.dinnerFull' },
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

export const MealPlannerModal: React.FC<MealPlannerModalProps> = ({
  dishes,
  ingredients,
  currentPlan,
  selectedDate,
  initialTab = 'breakfast',
  targetCalories,
  targetProtein,
  onConfirm,
  onClose,
}) => {
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

  const hasTabChanged = React.useCallback((type: MealType): boolean => {
    const original = new Set(getDishIdsForMeal(currentPlan, type));
    const current = selections[type];
    if (original.size !== current.size) return true;
    for (const id of original) {
      if (!current.has(id)) return true;
    }
    return false;
  }, [currentPlan, selections]);

  const changedTabs = React.useMemo(() => {
    return MEAL_TABS.filter(tab => hasTabChanged(tab.type));
  }, [hasTabChanged]);

  const hasActiveFilters = filterConfig.maxCalories !== undefined || filterConfig.minProtein !== undefined || (filterConfig.tags !== undefined && filterConfig.tags.length > 0);

  const filteredDishes = React.useMemo(() => {
    return dishes
      .filter(d => d.tags?.includes(activeTab))
      .filter(d =>
        Object.values(d.name).some((n: string) =>
          n.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
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
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[90dvh] overflow-hidden flex flex-col sm:mx-4">
        {/* Header */}
        <div className="px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
              {t('planning.planTitle')} — {selectedDate}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('planning.planSubtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all min-h-11 min-w-11 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-8 pt-3 pb-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex gap-2">
            {MEAL_TABS.map(tab => {
              const isActive = activeTab === tab.type;
              const count = selections[tab.type].size;
              const changed = hasTabChanged(tab.type);
              return (
                <button
                  key={tab.type}
                  onClick={() => handleTabChange(tab.type)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm transition-all min-h-11 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-sm font-bold'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 font-medium'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{t(tab.labelKey)}</span>
                  {count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full min-w-5 text-center ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {changed && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isActive ? 'bg-white' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + Sort */}
        <div className="px-4 py-3 sm:px-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="meal-planner-search"
                name="meal-planner-search"
                placeholder={t('planning.searchPlaceholder')}
                aria-label={t('planning.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                data-testid="input-search-plan"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none bg-white dark:bg-slate-700 dark:text-slate-100 shadow-sm text-base"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              data-testid="btn-filter"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200 font-medium text-sm min-h-11 hover:border-emerald-400 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('filter.button')}
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>
        </div>

        {/* Dish list */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8 space-y-3">
          {filteredDishes.length === 0 && (
            <div className="text-center py-12">
              <ChefHat className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {t('planning.noMatchTitle', { meal: activeTabLabel })}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
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
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between group min-h-16 active:scale-[0.98] ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20'
                    : 'border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-600'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`font-bold text-base truncate ${
                        isSelected
                          ? 'text-emerald-900 dark:text-emerald-300'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {getLocalizedField(dish.name, lang)}
                    </h4>
                    <div className="flex gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                        🔥 {Math.round(nutrition.calories)} kcal
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        💪 {Math.round(nutrition.protein)}g
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ml-3 ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-200 dark:border-slate-600 text-transparent group-hover:border-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 sm:px-8 sm:py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {t('planning.totalDay')}:{' '}
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {totalDayDishCount} {t('common.item')}
              </span>
            </span>
            {totalDayDishCount > 0 && (
              <span className="text-slate-500 dark:text-slate-400">
                🔥 {Math.round(totalDayNutrition.calories)} kcal · 💪 {Math.round(totalDayNutrition.protein)}g Pro
              </span>
            )}
          </div>
          {remainingBudget && totalDayDishCount > 0 && (
            <div data-testid="meal-planner-remaining-budget" className="flex items-center justify-between text-xs mb-1">
              {remainingBudget.calories !== null && (
                <span data-testid="meal-planner-remaining-cal" className={`font-medium ${remainingBudget.calories >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {remainingBudget.calories >= 0
                    ? t('summary.remaining', { value: remainingBudget.calories, unit: 'kcal' })
                    : t('summary.over', { value: Math.abs(remainingBudget.calories), unit: 'kcal' })}
                </span>
              )}
              {remainingBudget.protein !== null && (
                <span data-testid="meal-planner-remaining-pro" className={`font-medium ${remainingBudget.protein >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {remainingBudget.protein >= 0
                    ? t('summary.remaining', { value: remainingBudget.protein, unit: 'g' })
                    : t('summary.over', { value: Math.abs(remainingBudget.protein), unit: 'g' })}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-slate-400 dark:text-slate-500">
              {activeTabLabel}:{' '}
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {selections[activeTab].size} {t('common.item')}
              </span>
            </span>
            {selections[activeTab].size > 0 && (
              <span className="text-slate-400 dark:text-slate-500">
                {Math.round(activeTabNutrition.calories)} kcal · {Math.round(activeTabNutrition.protein)}g Pro
              </span>
            )}
          </div>
          <button
            onClick={handleConfirm}
            data-testid="btn-confirm-plan"
            className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg min-h-12"
          >
            <CheckCircle2 className="w-5 h-5" />
            {confirmButtonLabel}
          </button>
        </div>
        {isFilterOpen && (
          <FilterBottomSheet
            config={filterConfig}
            onChange={setFilterConfig}
            onClose={() => setIsFilterOpen(false)}
          />
        )}
      </div>
    </ModalBackdrop>
  );
};
