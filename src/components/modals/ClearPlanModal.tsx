import { CalendarDays, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { DayPlan, MealType } from '../../types';
import { getWeekRange, isDateInRange, parseLocalDate } from '../../utils/helpers';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface ClearPlanModalProps {
  dayPlans: DayPlan[];
  selectedDate: string;
  onClear: (scope: 'day' | 'week' | 'month', meals?: MealType[]) => void;
  onClose: () => void;
}

const hasPlan = (p: DayPlan): boolean =>
  p.breakfastDishIds.length > 0 || p.lunchDishIds.length > 0 || p.dinnerDishIds.length > 0;

export const ClearPlanModal = ({ dayPlans, selectedDate, onClear, onClose }: ClearPlanModalProps) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  useModalBackHandler(true, onClose);
  const [expandedScope, setExpandedScope] = useState<string | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<Set<MealType>>(new Set(['breakfast', 'lunch', 'dinner']));

  const toggleMeal = (meal: MealType) => {
    setSelectedMeals(prev => {
      const next = new Set(prev);
      if (next.has(meal)) {
        if (next.size > 1) next.delete(meal);
      } else {
        next.add(meal);
      }
      return next;
    });
  };

  const MEAL_LABELS: { type: MealType; labelKey: string }[] = [
    { type: 'breakfast', labelKey: 'meal.breakfast' },
    { type: 'lunch', labelKey: 'meal.lunch' },
    { type: 'dinner', labelKey: 'meal.dinner' },
  ];

  const scopeData = useMemo(() => {
    const dayPlansWithMeals = dayPlans.filter(hasPlan);

    const dayItems = dayPlansWithMeals.filter(p => p.date === selectedDate);

    const { start: wStart, end: wEnd } = getWeekRange(selectedDate);
    const weekItems = dayPlansWithMeals.filter(p => isDateInRange(p.date, wStart, wEnd));

    const targetDate = parseLocalDate(selectedDate);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthItems = dayPlansWithMeals.filter(p => {
      const pDate = parseLocalDate(p.date);
      return pDate.getFullYear() === year && pDate.getMonth() === month;
    });

    const countMeals = (plans: DayPlan[]) =>
      plans.reduce((sum, p) => sum + p.breakfastDishIds.length + p.lunchDishIds.length + p.dinnerDishIds.length, 0);

    return {
      day: { plans: dayItems, mealCount: countMeals(dayItems) },
      week: { plans: weekItems, mealCount: countMeals(weekItems) },
      month: { plans: monthItems, mealCount: countMeals(monthItems) },
    };
  }, [dayPlans, selectedDate]);

  const formatShortDate = (dateStr: string) =>
    parseLocalDate(dateStr).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' });

  const SCOPE_OPTIONS: {
    scope: 'day' | 'week' | 'month';
    label: string;
    desc: string;
    count: number;
    mealCount: number;
    dates: string[];
  }[] = [
    {
      scope: 'day',
      label: t('clearPlan.scopeDay'),
      desc: t('clearPlan.scopeDayDesc'),
      count: scopeData.day.plans.length,
      mealCount: scopeData.day.mealCount,
      dates: scopeData.day.plans.map(p => p.date),
    },
    {
      scope: 'week',
      label: t('clearPlan.scopeWeek'),
      desc: t('clearPlan.scopeWeekDesc'),
      count: scopeData.week.plans.length,
      mealCount: scopeData.week.mealCount,
      dates: scopeData.week.plans.map(p => p.date),
    },
    {
      scope: 'month',
      label: t('clearPlan.scopeMonth'),
      desc: t('clearPlan.scopeMonthDesc'),
      count: scopeData.month.plans.length,
      mealCount: scopeData.month.mealCount,
      dates: scopeData.month.plans.map(p => p.date),
    },
  ];

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-md sm:rounded-2xl">
        <div className="border-border-subtle flex items-center justify-between border-b px-6 py-5 sm:px-8 sm:py-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('clearPlan.title')}</h3>
            <p className="text-muted-foreground text-sm">{t('clearPlan.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-4 p-6 sm:p-8">
          {/* Meal selection */}
          <div className="flex gap-2" data-testid="meal-filter">
            {MEAL_LABELS.map(({ type, labelKey }) => (
              <button
                key={type}
                type="button"
                data-testid={`meal-toggle-${type}`}
                onClick={() => toggleMeal(type)}
                className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all ${
                  selectedMeals.has(type)
                    ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                    : 'border-border text-slate-400 dark:text-slate-500'
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          {SCOPE_OPTIONS.map(({ scope, label, desc, count, mealCount, dates }) => (
            <div key={scope}>
              <button
                data-testid={`btn-clear-scope-${scope}`}
                onClick={() => onClear(scope, selectedMeals.size === 3 ? undefined : Array.from(selectedMeals))}
                disabled={count === 0}
                className={`group flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                  count === 0
                    ? 'cursor-not-allowed border-slate-50 bg-slate-50 opacity-50 dark:border-slate-700 dark:bg-slate-800'
                    : 'border-border-subtle hover:border-rose-500 hover:bg-rose-50 active:scale-[0.98] dark:hover:bg-rose-900/20'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform ${
                    count > 0
                      ? 'bg-rose-100 text-rose-600 group-hover:scale-110 dark:bg-rose-900/30 dark:text-rose-400'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                  }`}
                >
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <p
                    className={`text-lg font-bold ${count > 0 ? 'text-slate-800 group-hover:text-rose-700 dark:text-slate-100 dark:group-hover:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    {label}
                  </p>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                  {count > 0 && mealCount > 0 && (
                    <p className="mt-0.5 text-xs text-rose-500 dark:text-rose-400">
                      {t('clearPlan.totalMeals', { count: mealCount })}
                    </p>
                  )}
                </div>
                {count > 0 && (
                  <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    {t('clearPlan.dayCount', { count })}
                  </span>
                )}
              </button>
              {count > 1 && (
                <button
                  data-testid={`btn-expand-${scope}`}
                  onClick={() => setExpandedScope(prev => (prev === scope ? null : scope))}
                  className="hover:text-foreground-secondary mt-1.5 ml-4 flex items-center gap-1 text-xs text-slate-400 transition-colors dark:hover:text-slate-300"
                >
                  {expandedScope === scope ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {t('clearPlan.affectedDates')}
                </button>
              )}
              {expandedScope === scope && dates.length > 0 && (
                <div className="mt-1.5 ml-4 flex flex-wrap gap-1.5">
                  {[...dates]
                    .sort((a, b) => a.localeCompare(b))
                    .map(d => (
                      <span
                        key={d}
                        className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                      >
                        {formatShortDate(d)}
                      </span>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ModalBackdrop>
  );
};
