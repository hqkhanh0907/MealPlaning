import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit3, Plus } from 'lucide-react';
import { DayPlan, Dish, Ingredient, MealType, SupportedLang } from '../types';
import { getLocalizedField } from '../utils/localize';
import { calculateDishesNutrition } from '../utils/nutrition';

export interface QuickPreviewPanelProps {
  currentPlan: DayPlan;
  dishes: Dish[];
  ingredients: Ingredient[];
  onPlanMeal: (type: MealType) => void;
  onPlanAll: () => void;
}

const MEAL_SLOTS: { type: MealType; icon: string; key: string }[] = [
  { type: 'breakfast', icon: '☀️', key: 'meal.breakfast' },
  { type: 'lunch', icon: '🌤️', key: 'meal.lunch' },
  { type: 'dinner', icon: '🌙', key: 'meal.dinner' },
];

const DAILY_CALORIES = 2000;
const DAILY_PROTEIN = 60;
const CALORIES_PER_SLOT = DAILY_CALORIES / 3;
const PROTEIN_PER_SLOT = DAILY_PROTEIN / 3;
const MAX_VISIBLE_DISHES = 2;

const getDishIdsForSlot = (plan: DayPlan, type: MealType): string[] => {
  if (type === 'breakfast') return plan.breakfastDishIds;
  if (type === 'lunch') return plan.lunchDishIds;
  return plan.dinnerDishIds;
};

const TEST_ID_MAP: Record<MealType, string> = {
  breakfast: 'quick-preview-row-breakfast',
  lunch: 'quick-preview-row-lunch',
  dinner: 'quick-preview-row-dinner',
};

export const QuickPreviewPanel: React.FC<QuickPreviewPanelProps> = React.memo(({
  currentPlan,
  dishes,
  ingredients,
  onPlanMeal,
  onPlanAll,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;

  const hasEmptySlot = useMemo(() => {
    return MEAL_SLOTS.some(({ type }) => getDishIdsForSlot(currentPlan, type).length === 0);
  }, [currentPlan]);

  return (
    <section data-testid="quick-preview-panel" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 sm:p-6 space-y-3">
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
        {t('quickPreview.title')}
      </h3>

      <div className="space-y-2">
        {MEAL_SLOTS.map(({ type, icon, key }) => (
          <MealRow
            key={type}
            type={type}
            icon={icon}
            label={t(key)}
            dishIds={getDishIdsForSlot(currentPlan, type)}
            dishes={dishes}
            ingredients={ingredients}
            lang={lang}
            t={t}
            onPlanMeal={onPlanMeal}
          />
        ))}
      </div>

      {hasEmptySlot && (
        <button
          type="button"
          onClick={onPlanAll}
          className="w-full min-h-11 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium text-sm py-2.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          {t('quickPreview.planAll')}
        </button>
      )}
    </section>
  );
});

QuickPreviewPanel.displayName = 'QuickPreviewPanel';

interface MealRowProps {
  type: MealType;
  icon: string;
  label: string;
  dishIds: string[];
  dishes: Dish[];
  ingredients: Ingredient[];
  lang: SupportedLang;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onPlanMeal: (type: MealType) => void;
}

const MealRow: React.FC<MealRowProps> = React.memo(({
  type, icon, label, dishIds, dishes, ingredients, lang, t, onPlanMeal,
}) => {
  const hasDishes = dishIds.length > 0;

  const resolvedDishes = useMemo(() => {
    return dishIds
      .map((id) => dishes.find((d) => d.id === id))
      .filter((d): d is Dish => d !== undefined);
  }, [dishIds, dishes]);

  const nutrition = useMemo(() => {
    return calculateDishesNutrition(dishIds, dishes, ingredients);
  }, [dishIds, dishes, ingredients]);

  const calPercent = Math.min(100, Math.round((nutrition.calories / CALORIES_PER_SLOT) * 100));
  const proPercent = Math.min(100, Math.round((nutrition.protein / PROTEIN_PER_SLOT) * 100));

  const visibleDishes = resolvedDishes.slice(0, MAX_VISIBLE_DISHES);
  const extraCount = resolvedDishes.length - MAX_VISIBLE_DISHES;

  const dishSummary = useMemo(() => {
    const names = visibleDishes.map((d) => getLocalizedField(d.name, lang)).join(', ');
    if (extraCount > 0) return `${names}, ${t('quickPreview.more', { count: extraCount })}`;
    return names;
  }, [visibleDishes, extraCount, lang, t]);

  return (
    <div
      data-testid={TEST_ID_MAP[type]}
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <span className="text-lg shrink-0" aria-hidden="true">{icon}</span>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {hasDishes ? dishSummary : t('quickPreview.empty')}
          </span>
        </div>

        {hasDishes && (
          <div className="flex gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden" title={`${nutrition.calories.toFixed(0)} kcal`}>
              <div
                className="h-full rounded-full bg-orange-400 transition-all"
                style={{ width: `${calPercent}%` }}
                data-testid={`cal-bar-${type}`}
              />
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden" title={`${nutrition.protein.toFixed(1)}g protein`}>
              <div
                className="h-full rounded-full bg-blue-400 transition-all"
                style={{ width: `${proPercent}%` }}
                data-testid={`pro-bar-${type}`}
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onPlanMeal(type)}
        className="min-h-11 min-w-11 flex items-center justify-center gap-1 shrink-0 rounded-lg text-sm font-medium transition-colors active:scale-[0.98] px-2
          text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
        aria-label={hasDishes ? t('quickPreview.edit') : t('quickPreview.add')}
      >
        {hasDishes ? (
          <>
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('quickPreview.edit')}</span>
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('quickPreview.add')}</span>
          </>
        )}
      </button>
    </div>
  );
});

MealRow.displayName = 'MealRow';
