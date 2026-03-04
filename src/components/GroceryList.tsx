import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Check, Copy, Share2, CheckCircle2, CalendarDays } from 'lucide-react';
import { Ingredient, Dish, DishIngredient, DayPlan, SupportedLang } from '../types';
import { getLocalizedField } from '../utils/localize';
import { useNotification } from '../contexts/NotificationContext';
import { getWeekRange, isDateInRange } from '../utils/helpers';
import { usePersistedState } from '../hooks/usePersistedState';

type GroceryScope = 'day' | 'week' | 'custom';

interface GroceryListProps {
  currentPlan: DayPlan;
  dayPlans: DayPlan[];
  selectedDate: string;
  allDishes: Dish[];
  allIngredients: Ingredient[];
}

type GroceryItem = { id: string; name: string; amount: number; unit: string };

const collectDishIngredients = (dishIds: string[], allDishes: Dish[]): DishIngredient[] => {
  const result: DishIngredient[] = [];
  for (const dishId of dishIds) {
    const dish = allDishes.find(d => d.id === dishId);
    if (dish) result.push(...dish.ingredients);
  }
  return result;
};

const buildGroceryList = (dishIngredients: DishIngredient[], allIngredients: Ingredient[], lang: SupportedLang): GroceryItem[] => {
  const map: Record<string, GroceryItem> = {};
  for (const di of dishIngredients) {
    const ing = allIngredients.find(i => i.id === di.ingredientId);
    if (!ing) continue;
    if (map[ing.id]) {
      map[ing.id].amount += di.amount;
    } else {
      map[ing.id] = { id: ing.id, name: getLocalizedField(ing.name, lang), amount: di.amount, unit: getLocalizedField(ing.unit, lang) };
    }
  }
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
};


const getDishIdsFromPlans = (plans: DayPlan[]): string[] => {
  const ids: string[] = [];
  for (const p of plans) {
    ids.push(...p.breakfastDishIds, ...p.lunchDishIds, ...p.dinnerDishIds);
  }
  return ids;
};

const SCOPE_KEYS: GroceryScope[] = ['day', 'week', 'custom'];

const getScopeLabelKey = (scope: GroceryScope): string => {
  if (scope === 'day') return 'grocery.scopeToday';
  if (scope === 'week') return 'grocery.scopeWeek';
  return 'grocery.scopeAll';
};

const getScopeHeaderKey = (scope: GroceryScope): string => {
  if (scope === 'day') return 'grocery.headerDay';
  if (scope === 'week') return 'grocery.headerWeek';
  return 'grocery.headerAll';
};

const GroceryEmptyState: React.FC<{ t: (key: string) => string }> = ({ t }) => (
  <div data-testid="grocery-empty-state" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 sm:p-12 text-center">
    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
      <ShoppingCart className="w-10 h-10 text-emerald-300" />
    </div>
    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">{t('grocery.emptyTitle')}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
      {t('grocery.emptyDescription')}
    </p>
    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
      <CalendarDays className="w-4 h-4" />
      <span className="text-sm font-bold">{t('grocery.emptyAction')}</span>
    </div>
  </div>
);

export const GroceryList: React.FC<GroceryListProps> = React.memo(({ currentPlan, dayPlans, selectedDate, allDishes, allIngredients }) => {
  const notify = useNotification();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const [scope, setScope] = useState<GroceryScope>('day');
  const [persistedCheckedIds, setPersistedCheckedIds] = usePersistedState<string[]>('mp-grocery-checked', []);
  const checkedIds = useMemo(() => new Set(persistedCheckedIds), [persistedCheckedIds]);

  const filteredPlans = useMemo(() => {
    if (scope === 'day') return [currentPlan];
    if (scope === 'week') {
      const { start, end } = getWeekRange(selectedDate);
      return dayPlans.filter(p => isDateInRange(p.date, start, end));
    }
    return dayPlans; // 'custom' = all
  }, [scope, currentPlan, dayPlans, selectedDate]);

  const allDishIds = useMemo(() => getDishIdsFromPlans(filteredPlans), [filteredPlans]);
  const groceryItems = useMemo(() => {
    if (allDishIds.length === 0) return [];
    const dishIngredients = collectDishIngredients(allDishIds, allDishes);
    return buildGroceryList(dishIngredients, allIngredients, lang);
  }, [allDishIds, allDishes, allIngredients, lang]);

  const checkedCount = useMemo(() =>
    groceryItems.filter(item => checkedIds.has(item.id)).length,
    [groceryItems, checkedIds]
  );

  const toggleCheck = useCallback((id: string) => {
    setPersistedCheckedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      return [...prev, id];
    });
  }, [setPersistedCheckedIds]);

  const handleCopyList = useCallback(() => {
    const text = groceryItems
      .map(item => `${checkedIds.has(item.id) ? '✅' : '☐'} ${item.name} — ${Math.round(item.amount)} ${item.unit}`)
      .join('\n');
    const header = scope === 'day' ? t('grocery.headerDay', { date: selectedDate }) : t(getScopeHeaderKey(scope));
    navigator.clipboard.writeText(`${header}\n\n${text}`).then(() => {
      notify.success(t('common.copied'), t('grocery.copiedDesc'));
    }).catch(() => {
      notify.error(t('common.copyFailed'), t('grocery.copyFailedDesc'));
    });
  }, [groceryItems, checkedIds, scope, selectedDate, notify, t]);

  const handleShare = useCallback(async () => {
    const text = groceryItems
      .map(item => `• ${item.name} — ${Math.round(item.amount)} ${item.unit}`)
      .join('\n');
    const header = scope === 'day' ? t('grocery.headerDay', { date: selectedDate }) : t(getScopeHeaderKey(scope));

    if (navigator.share) {
      try {
        await navigator.share({ title: t('grocery.shareTitle'), text: `${header}\n\n${text}` });
      } catch { /* User cancelled */ }
    } else {
      handleCopyList();
    }
  }, [groceryItems, scope, selectedDate, handleCopyList, t]);

  if (groceryItems.length === 0 && scope === 'day') {
    // Check if other scopes have data
    const weekDishIds = getDishIdsFromPlans(dayPlans);
    if (weekDishIds.length === 0) return <GroceryEmptyState t={t} />;
  }

  return (
    <div className="space-y-4">
      {/* Scope Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide">
        {SCOPE_KEYS.map(key => (
          <button
            key={key}
            onClick={() => { setScope(key); setPersistedCheckedIds([]); }}
            data-testid={`tab-grocery-${key}`}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap min-h-11 ${
              scope === key ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 active:bg-slate-200 dark:active:bg-slate-600'
            }`}
          >
            {t(getScopeLabelKey(key))}
          </button>
        ))}
      </div>

      {groceryItems.length === 0 ? (
        <GroceryEmptyState t={t} />
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Header with counter and actions */}
          <div className="bg-emerald-50 dark:bg-emerald-900/30 px-4 sm:px-6 py-3 sm:py-4 border-b border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  {groceryItems.length} {t('grocery.ingredientCount')}
                </h3>
                {checkedCount > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {t('grocery.boughtCount', { count: checkedCount, total: groceryItems.length })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyList}
                data-testid="btn-grocery-copy"
                className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:bg-emerald-200 rounded-xl transition-all min-h-11 min-w-11 flex items-center justify-center"
                title={t('common.copy')}
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleShare}
                className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:bg-emerald-200 rounded-xl transition-all min-h-11 min-w-11 flex items-center justify-center"
                title={t('common.share')}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {checkedCount > 0 && (
            <div className="h-1 bg-emerald-100 dark:bg-emerald-900/30">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(checkedCount / groceryItems.length) * 100}%` }}
              />
            </div>
          )}

          {/* Items */}
          <div className="p-3 sm:p-4">
            <ul className="space-y-1">
              {groceryItems.map(item => {
                const isChecked = checkedIds.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => toggleCheck(item.id)}
                      className={`w-full flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl transition-all min-h-12 active:scale-[0.99] ${
                        isChecked ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                        isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`flex-1 text-left font-medium text-sm sm:text-base transition-all ${
                        isChecked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {item.name}
                      </span>
                      <span className={`text-sm font-medium shrink-0 transition-all ${
                        isChecked ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {Math.round(item.amount)} {item.unit}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* All done state */}
          {checkedCount === groceryItems.length && groceryItems.length > 0 && (
            <div className="px-4 sm:px-6 py-4 border-t border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('grocery.allBought')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

GroceryList.displayName = 'GroceryList';
