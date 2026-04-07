import { ChefHat, Edit3, Minus, Plus } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MEAL_TYPE_ICON_COLORS, MEAL_TYPE_ICONS } from '../../data/constants';
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
  const MealIcon = MEAL_TYPE_ICONS[type];
  const label = t(`meal.${type}`);

  const resolvedDishes = useMemo(() => {
    const map = new Map(dishes.map(d => [d.id, d]));
    return slot.dishIds.map(id => map.get(id)).filter((d): d is Dish => d !== undefined);
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
        className="bg-muted hover:bg-accent flex items-center gap-3 rounded-xl p-3 transition-colors"
      >
        <MealIcon className={`size-5 shrink-0 ${MEAL_TYPE_ICON_COLORS[type]}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-sm font-medium">{label}</span>
            <span className="text-muted-foreground text-xs">{t('quickPreview.empty')}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('quickPreview.add')}
          className="hover:bg-primary-subtle text-primary flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-sm font-medium transition-colors active:scale-[0.98]"
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
          <MealIcon className={`size-5 shrink-0 ${MEAL_TYPE_ICON_COLORS[type]}`} aria-hidden="true" />
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{label}</span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${t('common.edit')} ${label}`}
          className="hover:text-primary hover:bg-primary-subtle text-muted-foreground flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-all sm:min-h-9 sm:min-w-9"
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
              <span className="text-foreground flex-1 truncate text-sm font-medium">
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
                    className="hover:text-primary text-muted-foreground hover:bg-primary-subtle flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span
                    data-testid={`serving-count-${d.id}`}
                    className="text-muted-foreground min-w-[18px] text-center text-xs font-semibold"
                  >
                    {s}x
                  </span>
                  <button
                    type="button"
                    data-testid={`btn-serving-plus-${d.id}`}
                    onClick={() => handleServingChange(d.id, 1)}
                    disabled={s >= 10}
                    aria-label={`${t('common.increase')} ${getLocalizedField(d.name, lang)}`}
                    className="hover:text-primary text-muted-foreground hover:bg-primary-subtle flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
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

      <div className="border-border flex flex-wrap gap-2 border-t pt-2">
        <span className="bg-primary-subtle text-primary rounded px-2 py-0.5 text-xs font-semibold uppercase tabular-nums">
          {Math.round(slot.calories)} kcal
        </span>
        <span className="bg-info/10 text-info rounded px-2 py-0.5 text-xs font-semibold uppercase tabular-nums">
          {Math.round(slot.protein)}g Pro
        </span>
      </div>
    </div>
  );
});

MealSlot.displayName = 'MealSlot';
