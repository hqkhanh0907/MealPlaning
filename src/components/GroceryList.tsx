import React, { useState, useMemo, useCallback } from 'react';
import { ShoppingCart, Check, Copy, Share2, CheckCircle2, CalendarDays } from 'lucide-react';
import { Ingredient, Dish, DishIngredient, DayPlan } from '../types';
import { useNotification } from '../contexts/NotificationContext';

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

const getWeekRange = (dateStr: string): { start: Date; end: Date } => {
  const targetDate = new Date(dateStr);
  const day = targetDate.getDay();
  const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(targetDate);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
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
  <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center">
    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
      <ShoppingCart className="w-10 h-10 text-emerald-300" />
    </div>
    <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có gì cần mua</h3>
    <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
      Hãy lên kế hoạch ít nhất một bữa ăn để xem danh sách nguyên liệu cần chuẩn bị.
    </p>
    <div className="flex items-center justify-center gap-2 text-emerald-600">
      <CalendarDays className="w-4 h-4" />
      <span className="text-sm font-bold">Mở tab Lịch trình để bắt đầu</span>
    </div>
  </div>
);

export const GroceryList: React.FC<GroceryListProps> = ({ currentPlan, dayPlans, selectedDate, allDishes, allIngredients }) => {
  const notify = useNotification();
  const [scope, setScope] = useState<GroceryScope>('day');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const filteredPlans = useMemo(() => {
    if (scope === 'day') return [currentPlan];
    if (scope === 'week') {
      const { start, end } = getWeekRange(selectedDate);
      return dayPlans.filter(p => {
        const d = new Date(p.date);
        return d >= start && d <= end;
      });
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
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
        {SCOPE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setScope(tab.key); setCheckedIds(new Set()); }}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap min-h-11 ${
              scope === tab.key ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 active:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {groceryItems.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header with counter and actions */}
          <div className="bg-emerald-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-emerald-900">
                  {groceryItems.length} nguyên liệu
                </h3>
                {checkedCount > 0 && (
                  <p className="text-xs text-emerald-600 font-medium">
                    Đã mua {checkedCount}/{groceryItems.length}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyList}
                className="p-2.5 text-emerald-600 hover:bg-emerald-100 active:bg-emerald-200 rounded-xl transition-all min-h-11 min-w-11 flex items-center justify-center"
                title="Sao chép danh sách"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleShare}
                className="p-2.5 text-emerald-600 hover:bg-emerald-100 active:bg-emerald-200 rounded-xl transition-all min-h-11 min-w-11 flex items-center justify-center"
                title="Chia sẻ danh sách"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {checkedCount > 0 && (
            <div className="h-1 bg-emerald-100">
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
                        isChecked ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                        isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`flex-1 text-left font-medium text-sm sm:text-base transition-all ${
                        isChecked ? 'text-slate-400 line-through' : 'text-slate-800'
                      }`}>
                        {item.name}
                      </span>
                      <span className={`text-sm font-medium shrink-0 transition-all ${
                        isChecked ? 'text-slate-300' : 'text-slate-500'
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
            <div className="px-4 sm:px-6 py-4 border-t border-emerald-100 bg-emerald-50 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Đã mua đủ tất cả nguyên liệu! 🎉</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
