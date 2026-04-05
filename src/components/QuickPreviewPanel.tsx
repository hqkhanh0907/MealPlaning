import type { LucideIcon } from 'lucide-react';
import { Edit3, Moon, Plus, Sun, Sunrise } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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

const MEAL_SLOTS: { type: MealType; icon: LucideIcon; key: string; color: string }[] = [
  { type: 'breakfast', icon: Sunrise, key: 'meal.breakfast', color: 'text-color-energy' },
  { type: 'lunch', icon: Sun, key: 'meal.lunch', color: 'text-color-energy' },
  { type: 'dinner', icon: Moon, key: 'meal.dinner', color: 'text-status-info' },
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

export const QuickPreviewPanel = React.memo(function QuickPreviewPanel({
  currentPlan,
  dishes,
  ingredients,
  onPlanMeal,
  onPlanAll,
}: QuickPreviewPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;

  const hasEmptySlot = useMemo(() => {
    return MEAL_SLOTS.some(({ type }) => getDishIdsForSlot(currentPlan, type).length === 0);
  }, [currentPlan]);

  return (
    <section
      data-testid="quick-preview-panel"
      className="bg-card border-border-subtle space-y-3 rounded-2xl border p-4 shadow-sm sm:p-6"
    >
      <h3 className="text-foreground text-base font-semibold">{t('quickPreview.title')}</h3>

      <div className="space-y-2">
        {MEAL_SLOTS.map(({ type, icon, key, color }) => (
          <MealRow
            key={type}
            type={type}
            icon={icon}
            color={color}
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
          className="bg-primary-subtle text-primary-emphasis hover:bg-primary/10 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          {t('quickPreview.planAll')}
        </button>
      )}
    </section>
  );
});

QuickPreviewPanel.displayName = 'QuickPreviewPanel';

interface MealRowProps {
  type: MealType;
  icon: LucideIcon;
  color: string;
  label: string;
  dishIds: string[];
  dishes: Dish[];
  ingredients: Ingredient[];
  lang: SupportedLang;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onPlanMeal: (type: MealType) => void;
}

const MealRow = React.memo(function MealRow({
  type,
  icon: MealIcon,
  color,
  label,
  dishIds,
  dishes,
  ingredients,
  lang,
  t,
  onPlanMeal,
}: MealRowProps) {
  const hasDishes = dishIds.length > 0;

  const resolvedDishes = useMemo(() => {
    const map = new Map(dishes.map(d => [d.id, d]));
    return dishIds.map(id => map.get(id)).filter((d): d is Dish => d !== undefined);
  }, [dishIds, dishes]);

  const nutrition = useMemo(() => {
    return calculateDishesNutrition(dishIds, dishes, ingredients);
  }, [dishIds, dishes, ingredients]);

  const calPercent = Math.min(100, Math.round((nutrition.calories / CALORIES_PER_SLOT) * 100));
  const proPercent = Math.min(100, Math.round((nutrition.protein / PROTEIN_PER_SLOT) * 100));

  const visibleDishes = resolvedDishes.slice(0, MAX_VISIBLE_DISHES);
  const extraCount = resolvedDishes.length - MAX_VISIBLE_DISHES;

  const dishSummary = useMemo(() => {
    const names = visibleDishes.map(d => getLocalizedField(d.name, lang)).join(', ');
    if (extraCount > 0) return `${names}, ${t('quickPreview.more', { count: extraCount })}`;
    return names;
  }, [visibleDishes, extraCount, lang, t]);

  return (
    <div
      data-testid={TEST_ID_MAP[type]}
      className="bg-muted hover:bg-accent flex items-center gap-3 rounded-xl p-3 transition-colors"
    >
      <MealIcon className={`size-5 shrink-0 ${color}`} aria-hidden="true" />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-foreground text-sm font-medium">{label}</span>
          <span className="text-muted-foreground truncate text-xs">
            {hasDishes ? dishSummary : t('quickPreview.empty')}
          </span>
        </div>

        {hasDishes && (
          <div className="flex gap-2">
            <div
              className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
              title={`${nutrition.calories.toFixed(0)} kcal`}
            >
              <div
                className="bg-color-energy h-full rounded-full transition-all"
                style={{ width: `${calPercent}%` }}
                data-testid={`cal-bar-${type}`}
              />
            </div>
            <div
              className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
              title={`${nutrition.protein.toFixed(1)}g protein`}
            >
              <div
                className="bg-macro-protein h-full rounded-full transition-all"
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
        className="hover:bg-primary-subtle text-primary flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-sm font-medium transition-colors active:scale-[0.98]"
        aria-label={hasDishes ? t('quickPreview.edit') : t('quickPreview.add')}
      >
        {hasDishes ? (
          <>
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('quickPreview.edit')}</span>
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('quickPreview.add')}</span>
          </>
        )}
      </button>
    </div>
  );
});

MealRow.displayName = 'MealRow';
