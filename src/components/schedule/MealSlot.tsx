import type { LucideIcon } from 'lucide-react';
import { ChefHat, Edit3, Minus, Moon, Plus, Sun, Sunrise } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Dish, MealType, SlotInfo, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';

export interface MealSlotProps {
  type: MealType;
  slot: SlotInfo;
  dishes: Dish[];
  servings?: Record<string, number>;
  onEdit: () => void;
  onUpdateServings?: (dishId: string, servings: number) => void;
}

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
};

const MAX_VISIBLE_DISHES = 2;

const TEST_ID_MAP: Record<MealType, string> = {
  breakfast: 'meal-slot-breakfast',
  lunch: 'meal-slot-lunch',
  dinner: 'meal-slot-dinner',
};

export const MealSlot = React.memo(function MealSlot({
  type,
  slot,
  dishes,
  servings,
  onEdit,
  onUpdateServings,
}: MealSlotProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const hasDishes = slot.dishIds.length > 0;
  const MealIcon = MEAL_ICONS[type];
  const label = t(`meal.${type}`);

  const resolvedDishes = useMemo(() => {
    return slot.dishIds.map(id => dishes.find(d => d.id === id)).filter((d): d is Dish => d !== undefined);
  }, [slot.dishIds, dishes]);

  const handleServingChange = useCallback(
    (dishId: string, delta: number) => {
      const current = servings?.[dishId] ?? 1;
      const next = Math.max(1, Math.min(10, current + delta));
      onUpdateServings?.(dishId, next);
    },
    [servings, onUpdateServings],
  );

  const visibleDishes = resolvedDishes.slice(0, MAX_VISIBLE_DISHES);
  const extraCount = resolvedDishes.length - MAX_VISIBLE_DISHES;

  if (!hasDishes) {
    return (
      <div
        data-testid={TEST_ID_MAP[type]}
        className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700"
      >
        <MealIcon className="size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
            <span className="text-muted-foreground text-xs">{t('quickPreview.empty')}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('quickPreview.add')}
          className="hover:bg-primary-subtle flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-sm font-medium text-emerald-600 transition-colors active:scale-[0.98] dark:text-emerald-400 dark:hover:bg-emerald-900/30"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('quickPreview.add')}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid={TEST_ID_MAP[type]}
      className="bg-card border-border-subtle rounded-xl border p-4 shadow-sm transition-all hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MealIcon className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{label}</span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${t('common.edit')} ${label}`}
          className="hover:text-primary hover:bg-primary-subtle flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-slate-400 transition-all sm:min-h-9 sm:min-w-9 dark:text-slate-500 dark:hover:bg-emerald-900/30"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-2 space-y-1">
        {visibleDishes.map(d => {
          const s = servings?.[d.id] ?? 1;
          return (
            <div key={d.id} className="flex items-center gap-2">
              <ChefHat className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                {getLocalizedField(d.name, lang)}
              </span>
              {onUpdateServings && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    data-testid={`btn-serving-minus-${d.id}`}
                    onClick={() => handleServingChange(d.id, -1)}
                    disabled={s <= 1}
                    aria-label={`${t('common.decrease')} ${getLocalizedField(d.name, lang)}`}
                    className="hover:text-primary text-muted-foreground hover:bg-primary-subtle flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 dark:hover:bg-emerald-900/30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span
                    data-testid={`serving-count-${d.id}`}
                    className="text-muted-foreground min-w-[18px] text-center text-xs font-bold"
                  >
                    {s}x
                  </span>
                  <button
                    type="button"
                    data-testid={`btn-serving-plus-${d.id}`}
                    onClick={() => handleServingChange(d.id, 1)}
                    disabled={s >= 10}
                    aria-label={`${t('common.increase')} ${getLocalizedField(d.name, lang)}`}
                    className="hover:text-primary text-muted-foreground hover:bg-primary-subtle flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 dark:hover:bg-emerald-900/30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {extraCount > 0 && (
          <span className="text-muted-foreground ml-5.5 text-xs">{t('quickPreview.more', { count: extraCount })}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-50 pt-2 dark:border-slate-700">
        <span className="bg-primary-subtle rounded px-2 py-0.5 text-[10px] font-bold text-emerald-600 uppercase dark:text-emerald-400">
          {Math.round(slot.calories)} kcal
        </span>
        <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase dark:bg-blue-900/30 dark:text-blue-400">
          {Math.round(slot.protein)}g Pro
        </span>
      </div>
    </div>
  );
});

MealSlot.displayName = 'MealSlot';
