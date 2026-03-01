import React, { useState, useMemo, useCallback } from 'react';
import { ShoppingCart, Check, Copy, Share2, CheckCircle2, CalendarDays } from 'lucide-react';
import { Ingredient, Dish, DishIngredient, DayPlan } from '../types';
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

const buildGroceryList = (dishIngredients: DishIngredient[], allIngredients: Ingredient[]): GroceryItem[] => {
  const map: Record<string, GroceryItem> = {};
  for (const di of dishIngredients) {
    const ing = allIngredients.find(i => i.id === di.ingredientId);
    if (!ing) continue;
    if (map[ing.id]) {
      map[ing.id].amount += di.amount;
    } else {
      map[ing.id] = { id: ing.id, name: ing.name, amount: di.amount, unit: ing.unit };
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

const SCOPE_TABS: { key: GroceryScope; label: string }[] = [
  { key: 'day', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: 'custom', label: 'Tất cả' },
];

const getScopeHeader = (scope: GroceryScope, selectedDate: string): string => {
  if (scope === 'day') return `🛒 Danh sách đi chợ — ${selectedDate}`;
  if (scope === 'week') return '🛒 Danh sách đi chợ — Tuần này';
  return '🛒 Danh sách đi chợ — Tất cả';
};

const EmptyState: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 sm:p-12 text-center">
    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
      <ShoppingCart className="w-10 h-10 text-emerald-300" />
    </div>
    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Chưa có gì cần mua</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
      Hãy lên kế hoạch ít nhất một bữa ăn để xem danh sách nguyên liệu cần chuẩn bị.
    </p>
    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
      <CalendarDays className="w-4 h-4" />
      <span className="text-sm font-bold">Mở tab Lịch trình để bắt đầu</span>
    </div>
  </div>
);

export const GroceryList: React.FC<GroceryListProps> = React.memo(({ currentPlan, dayPlans, selectedDate, allDishes, allIngredients }) => {
  const notify = useNotification();
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
    return buildGroceryList(dishIngredients, allIngredients);
  }, [allDishIds, allDishes, allIngredients]);

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
    const header = getScopeHeader(scope, selectedDate);
    navigator.clipboard.writeText(`${header}\n\n${text}`).then(() => {
      notify.success('Đã sao chép!', 'Danh sách đi chợ đã được sao chép vào clipboard.');
    }).catch(() => {
      notify.error('Sao chép thất bại', 'Không thể sao chép. Vui lòng thử lại.');
    });
  }, [groceryItems, checkedIds, scope, selectedDate, notify]);

  const handleShare = useCallback(async () => {
    const text = groceryItems
      .map(item => `• ${item.name} — ${Math.round(item.amount)} ${item.unit}`)
      .join('\n');
    const header = getScopeHeader(scope, selectedDate);

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Danh sách đi chợ', text: `${header}\n\n${text}` });
      } catch { /* User cancelled */ }
    } else {
      handleCopyList();
    }
  }, [groceryItems, scope, selectedDate, handleCopyList]);

  if (groceryItems.length === 0 && scope === 'day') {
    // Check if other scopes have data
    const weekDishIds = getDishIdsFromPlans(dayPlans);
    if (weekDishIds.length === 0) return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Scope Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide">
        {SCOPE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setScope(tab.key); setPersistedCheckedIds([]); }}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap min-h-11 ${
              scope === tab.key ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 active:bg-slate-200 dark:active:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {groceryItems.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Header with counter and actions */}
          <div className="bg-emerald-50 dark:bg-emerald-900/30 px-4 sm:px-6 py-3 sm:py-4 border-b border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  {groceryItems.length} nguyên liệu
                </h3>
                {checkedCount > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Đã mua {checkedCount}/{groceryItems.length}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyList}
                className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:bg-emerald-200 rounded-xl transition-all min-h-11 min-w-11 flex items-center justify-center"
                title="Sao chép danh sách"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleShare}
                className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:bg-emerald-200 rounded-xl transition-all min-h-11 min-w-11 flex items-center justify-center"
                title="Chia sẻ danh sách"
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
                <span>Đã mua đủ tất cả nguyên liệu! 🎉</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

GroceryList.displayName = 'GroceryList';
