import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Check, Copy, Share2, CheckCircle2, CalendarDays, ChevronDown, ChevronUp, Beef, GlassWater, Wheat, Leaf, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Ingredient, Dish, DayPlan, SupportedLang } from '../types';
import { getLocalizedField } from '../utils/localize';
import { useNotification } from '../contexts/NotificationContext';
import { getWeekRange, isDateInRange } from '../utils/helpers';
import { useDatabase } from '../contexts/DatabaseContext';
import { getSetting, setSetting } from '../services/appSettings';

type GroceryScope = 'day' | 'week' | 'custom';

interface GroceryListProps {
  currentPlan: DayPlan;
  dayPlans: DayPlan[];
  selectedDate: string;
  allDishes: Dish[];
  allIngredients: Ingredient[];
}

type DishSource = { dishId: string; dishName: string; amount: number };
type GroceryItem = { id: string; name: string; amount: number; unit: string; usedInDishes: DishSource[] };
type CheckedSnapshot = { id: string; amount: number };

type AisleCategory = 'protein' | 'dairy' | 'grains' | 'produce' | 'other';

const AISLE_ICON: Record<AisleCategory, LucideIcon> = {
  protein: Beef,
  dairy: GlassWater,
  grains: Wheat,
  produce: Leaf,
  other: Package,
};

const PROTEIN_KEYWORDS_VI = ['gà', 'bò', 'heo', 'lợn', 'cá', 'tôm', 'thịt', 'trứng'];
const PROTEIN_KEYWORDS_EN = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'egg', 'meat'];
const DAIRY_KEYWORDS_VI = ['sữa', 'phô mai', 'bơ'];
const DAIRY_KEYWORDS_EN = ['milk', 'yogurt', 'cheese', 'butter', 'cream'];
const GRAIN_KEYWORDS_VI = ['gạo', 'yến mạch', 'bột', 'bánh mì', 'hạt'];
const GRAIN_KEYWORDS_EN = ['rice', 'oat', 'flour', 'bread', 'seed', 'chia', 'quinoa'];
const PRODUCE_KEYWORDS_VI = ['rau', 'củ', 'cải', 'khoai', 'cam', 'chuối', 'bông', 'xà lách', 'bina'];
const PRODUCE_KEYWORDS_EN = ['spinach', 'broccoli', 'lettuce', 'tomato', 'carrot', 'onion', 'sweet potato', 'orange', 'banana', 'vegetable'];

function categorizeIngredient(name: string, ingredient: Ingredient | undefined): AisleCategory {
  const lower = name.toLowerCase();
  const viName = ingredient ? getLocalizedField(ingredient.name, 'vi').toLowerCase() : lower;
  const enName = ingredient ? getLocalizedField(ingredient.name, 'en').toLowerCase() : lower;

  if (PROTEIN_KEYWORDS_VI.some(k => viName.includes(k)) || PROTEIN_KEYWORDS_EN.some(k => enName.includes(k))) return 'protein';
  if (DAIRY_KEYWORDS_VI.some(k => viName.includes(k)) || DAIRY_KEYWORDS_EN.some(k => enName.includes(k))) return 'dairy';
  if (GRAIN_KEYWORDS_VI.some(k => viName.includes(k)) || GRAIN_KEYWORDS_EN.some(k => enName.includes(k))) return 'grains';
  if (PRODUCE_KEYWORDS_VI.some(k => viName.includes(k)) || PRODUCE_KEYWORDS_EN.some(k => enName.includes(k))) return 'produce';

  if (ingredient) {
    if (ingredient.proteinPer100 > 15 && ingredient.carbsPer100 < 5) return 'protein';
    if (ingredient.fiberPer100 > 2 && ingredient.carbsPer100 > 5) return 'produce';
  }

  return 'other';
}

type GroceryItemWithCategory = GroceryItem & { category: AisleCategory };

type IngredientWithSource = { ingredientId: string; amount: number; dishId: string; dishName: string };

const collectDishIngredients = (dishIds: string[], allDishes: Dish[], lang: SupportedLang): IngredientWithSource[] => {
  const result: IngredientWithSource[] = [];
  for (const dishId of dishIds) {
    const dish = allDishes.find(d => d.id === dishId);
    if (dish) {
      const dishName = getLocalizedField(dish.name, lang);
      for (const di of dish.ingredients) {
        result.push({ ingredientId: di.ingredientId, amount: di.amount, dishId: dish.id, dishName });
      }
    }
  }
  return result;
};

const buildGroceryList = (dishIngredients: IngredientWithSource[], allIngredients: Ingredient[], lang: SupportedLang): GroceryItemWithCategory[] => {
  const map: Record<string, GroceryItemWithCategory> = {};
  for (const di of dishIngredients) {
    const ing = allIngredients.find(i => i.id === di.ingredientId);
    if (!ing) continue;
    if (map[ing.id]) {
      map[ing.id].amount += di.amount;
      const existing = map[ing.id].usedInDishes.find(d => d.dishId === di.dishId);
      if (existing) {
        existing.amount += di.amount;
      } else {
        map[ing.id].usedInDishes.push({ dishId: di.dishId, dishName: di.dishName, amount: di.amount });
      }
    } else {
      const name = getLocalizedField(ing.name, lang);
      map[ing.id] = {
        id: ing.id, name, amount: di.amount, unit: getLocalizedField(ing.unit, lang),
        category: categorizeIngredient(name, ing),
        usedInDishes: [{ dishId: di.dishId, dishName: di.dishName, amount: di.amount }],
      };
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

const getScopeHeaderKey = (scope: GroceryScope): string =>
  scope === 'week' ? 'grocery.headerWeek' : 'grocery.headerAll';

const AISLE_LABEL_KEYS: Record<AisleCategory, string> = {
  protein: 'grocery.aisleProtein',
  dairy: 'grocery.aisleDairy',
  grains: 'grocery.aisleGrains',
  produce: 'grocery.aisleProduce',
  other: 'grocery.aisleOther',
};

const AISLE_ORDER: AisleCategory[] = ['produce', 'protein', 'dairy', 'grains', 'other'];

const GroceryEmptyState = ({ t }: { t: (key: string) => string }) => (
  <div data-testid="grocery-empty-state" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 sm:p-12 text-center">
    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
      <ShoppingCart className="w-10 h-10 text-emerald-300" aria-hidden="true" />
    </div>
    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">{t('grocery.emptyTitle')}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-2">
      {t('grocery.emptyDescription')}
    </p>
    <p className="text-xs text-slate-500 dark:text-slate-500 max-w-sm mx-auto mb-6">
      {t('grocery.emptyAutoHint')}
    </p>
    <button type="button" aria-label={t('grocery.emptyAction')} className="inline-flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-5 py-2.5 rounded-xl font-bold text-sm transition-all min-h-11">
      <CalendarDays className="w-4 h-4" aria-hidden="true" />
      {t('grocery.emptyAction')}
    </button>
  </div>
);

export const GroceryList = React.memo(function GroceryList({ currentPlan, dayPlans, selectedDate, allDishes, allIngredients }: GroceryListProps) {
  const notify = useNotification();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const db = useDatabase();
  const [scope, setScope] = useState<GroceryScope>('day');
  const [groupByAisle, setGroupByAisle] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [persistedCheckedSnapshots, setPersistedCheckedSnapshots] = useState<CheckedSnapshot[]>([]);

  // Load from SQLite on mount
  useEffect(() => {
    getSetting(db, 'grocery_checked').then((val) => {
      if (val) {
        try { setPersistedCheckedSnapshots(JSON.parse(val) as CheckedSnapshot[]); } catch { /* ignore corrupt */ }
      }
    }).catch(() => { /* db read error */ });
  }, [db]);

  // Save to SQLite when changed
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    setSetting(db, 'grocery_checked', JSON.stringify(persistedCheckedSnapshots)).catch(() => { /* db write error */ });
  }, [db, persistedCheckedSnapshots]);

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
    const dishIngredients = collectDishIngredients(allDishIds, allDishes, lang);
    return buildGroceryList(dishIngredients, allIngredients, lang);
  }, [allDishIds, allDishes, allIngredients, lang]);

  // Build a fast lookup: ingredientId → current rounded amount
  const currentAmountMap = useMemo(
    () => new Map(groceryItems.map(i => [i.id, Math.round(i.amount)])),
    [groceryItems]
  );

  // Only treat an item as checked if its stored amount still matches current amount
  const checkedIds = useMemo(
    () => new Set(
      persistedCheckedSnapshots
        .filter(s => currentAmountMap.get(s.id) === Math.round(s.amount))
        .map(s => s.id)
    ),
    [persistedCheckedSnapshots, currentAmountMap]
  );

  const checkedCount = useMemo(() =>
    groceryItems.filter(item => checkedIds.has(item.id)).length,
    [groceryItems, checkedIds]
  );

  const groupedItems = useMemo(() => {
    if (!groupByAisle) return null;
    const groups: Record<AisleCategory, GroceryItemWithCategory[]> = { produce: [], protein: [], dairy: [], grains: [], other: [] };
    for (const item of groceryItems) {
      groups[item.category].push(item);
    }
    return AISLE_ORDER.filter(cat => groups[cat].length > 0).map(cat => ({ category: cat, items: groups[cat] }));
  }, [groceryItems, groupByAisle]);

  const toggleCheck = useCallback((id: string) => {
    const item = groceryItems.find(i => i.id === id);
    if (!item) return;
    setPersistedCheckedSnapshots(prev => {
      if (prev.some(s => s.id === id)) return prev.filter(s => s.id !== id);
      return [...prev, { id, amount: item.amount }];
    });
  }, [groceryItems, setPersistedCheckedSnapshots]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedItemId(prev => prev === id ? null : id);
  }, []);

  const renderGroceryItem = useCallback((item: GroceryItemWithCategory) => {
    const isChecked = checkedIds.has(item.id);
    const isExpanded = expandedItemId === item.id;
    const hasDishes = item.usedInDishes.length > 0;
    return (
      <li key={item.id}>
        <div className={`rounded-xl transition-all ${
          isChecked ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}>
          <div className="flex items-center">
            <button
              data-testid={`grocery-item-${item.id}`}
              onClick={() => toggleCheck(item.id)}
              aria-label={`${isChecked ? t('common.deselect') : t('common.select')} ${item.name}`}
              className="flex-1 flex items-center gap-3 px-3 sm:px-4 py-3 min-h-12 active:scale-[0.99]"
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
            {hasDishes && (
              <button
                data-testid={`grocery-expand-${item.id}`}
                onClick={() => toggleExpand(item.id)}
                className="p-2.5 mr-1 min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                title={t('grocery.usedIn')}
                aria-label={`${t('grocery.usedIn')} ${item.name}`}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
          {isExpanded && hasDishes && (
            <div data-testid={`grocery-dishes-${item.id}`} className="px-12 pb-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{t('grocery.usedIn')}</span>
              {item.usedInDishes.map(d => (
                <div key={d.dishId} className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">{d.dishName}</span>
                  <span>{Math.round(d.amount)} {item.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </li>
    );
  }, [checkedIds, expandedItemId, toggleCheck, toggleExpand, t]);

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
            onClick={() => { setScope(key); setPersistedCheckedSnapshots([]); }}
            data-testid={`tab-grocery-${key}`}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap min-h-11 ${
              scope === key ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 active:bg-slate-200 dark:active:bg-slate-600'
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
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 dark:text-emerald-400" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  {groceryItems.length} {t('grocery.ingredientCount')}
                </h3>
                {checkedCount > 0 && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    {t('grocery.boughtCount', { count: checkedCount, total: groceryItems.length })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyList}
                data-testid="btn-grocery-copy"
                className="p-2.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:bg-emerald-200 rounded-xl transition-all min-h-11 min-w-11 flex items-center justify-center"
                title={t('common.copy')}
                aria-label={t('common.copy')}
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleShare}
                className="p-2.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:bg-emerald-200 rounded-xl transition-all min-h-11 min-w-11 flex items-center justify-center"
                title={t('common.share')}
                aria-label={t('common.share')}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Group by aisle toggle + Progress bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setGroupByAisle(g => !g)}
              data-testid="btn-group-aisle"
              className={`text-xs font-bold px-3 py-1.5 min-h-11 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                groupByAisle
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              {t('grocery.groupByAisle')}
            </button>
            {checkedCount > 0 && (
              <div className="flex-1 ml-3 h-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${(checkedCount / groceryItems.length) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Items */}
          <div className="p-3 sm:p-4">
            {groupByAisle && groupedItems ? (
              <div className="space-y-4">
                {groupedItems.map(group => (
                  <div key={group.category}>
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <span className="text-sm">{(() => { const Icon = AISLE_ICON[group.category]; return <Icon className="size-4" aria-hidden="true" />; })()}</span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t(AISLE_LABEL_KEYS[group.category])}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-500">({group.items.length})</span>
                    </div>
                    <ul className="space-y-1">
                      {group.items.map(item => renderGroceryItem(item))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
            <ul className="space-y-1">
              {groceryItems.map(item => renderGroceryItem(item))}
            </ul>
            )}
          </div>

          {/* All done state */}
          {checkedCount === groceryItems.length && groceryItems.length > 0 && (
            <div data-testid="grocery-all-bought" className="px-4 sm:px-6 py-4 border-t border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
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
