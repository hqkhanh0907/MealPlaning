import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit3, Plus, ChefHat } from 'lucide-react';
import { Dish, MealType, SlotInfo, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';

export interface MealSlotProps {
  type: MealType;
  slot: SlotInfo;
  dishes: Dish[];
  targetCalories: number;
  targetProtein: number;
  onEdit: () => void;
}

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '☀️',
  lunch: '🌤️',
  dinner: '🌙',
};

const MAX_VISIBLE_DISHES = 2;

const TEST_ID_MAP: Record<MealType, string> = {
  breakfast: 'meal-slot-breakfast',
  lunch: 'meal-slot-lunch',
  dinner: 'meal-slot-dinner',
};

export const MealSlot: React.FC<MealSlotProps> = React.memo(({
  type, slot, dishes, targetCalories, targetProtein, onEdit,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const hasDishes = slot.dishIds.length > 0;
  const icon = MEAL_ICONS[type];
  const label = t(`meal.${type}`);

  const caloriesPerSlot = targetCalories / 3;
  const proteinPerSlot = targetProtein / 3;
  const calPercent = Math.min(100, Math.round((slot.calories / caloriesPerSlot) * 100));
  const proPercent = Math.min(100, Math.round((slot.protein / proteinPerSlot) * 100));

  const resolvedDishes = useMemo(() => {
    return slot.dishIds
      .map((id) => dishes.find((d) => d.id === id))
      .filter((d): d is Dish => d !== undefined);
  }, [slot.dishIds, dishes]);

  const visibleDishes = resolvedDishes.slice(0, MAX_VISIBLE_DISHES);
  const extraCount = resolvedDishes.length - MAX_VISIBLE_DISHES;

  if (!hasDishes) {
    return (
      <div
        data-testid={TEST_ID_MAP[type]}
        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <span className="text-lg shrink-0" aria-hidden="true">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{t('quickPreview.empty')}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('quickPreview.add')}
          className="min-h-11 min-w-11 flex items-center justify-center gap-1 shrink-0 rounded-lg text-sm font-medium transition-colors active:scale-[0.98] px-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('quickPreview.add')}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid={TEST_ID_MAP[type]}
      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg shrink-0" aria-hidden="true">{icon}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${t('common.edit')} ${label}`}
          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 flex items-center justify-center"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1 mb-2">
        {visibleDishes.map((d) => (
          <div key={d.id} className="flex items-center gap-2">
            <ChefHat className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">
              {getLocalizedField(d.name, lang)}
            </span>
          </div>
        ))}
        {extraCount > 0 && (
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-5.5">
            {t('quickPreview.more', { count: extraCount })}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50 dark:border-slate-700">
        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded uppercase">
          {Math.round(slot.calories)} kcal
        </span>
        <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase">
          {Math.round(slot.protein)}g Pro
        </span>
      </div>

      <div className="flex gap-2 mt-2">
        <div
          className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden"
          title={`${slot.calories.toFixed(0)} kcal`}
        >
          <div
            className="h-full rounded-full bg-orange-400 transition-all"
            style={{ width: `${calPercent}%` }}
            data-testid={`cal-bar-${type}`}
          />
        </div>
        <div
          className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden"
          title={`${slot.protein.toFixed(1)}g protein`}
        >
          <div
            className="h-full rounded-full bg-blue-400 transition-all"
            style={{ width: `${proPercent}%` }}
            data-testid={`pro-bar-${type}`}
          />
        </div>
      </div>
    </div>
  );
});

MealSlot.displayName = 'MealSlot';
