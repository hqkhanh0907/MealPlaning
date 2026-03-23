import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { DayPlan, MealType } from '../../types';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { getWeekRange, isDateInRange, parseLocalDate } from '../../utils/helpers';

interface ClearPlanModalProps {
  dayPlans: DayPlan[];
  selectedDate: string;
  onClear: (scope: 'day' | 'week' | 'month', meals?: MealType[]) => void;
  onClose: () => void;
}

const hasPlan = (p: DayPlan): boolean =>
  p.breakfastDishIds.length > 0 || p.lunchDishIds.length > 0 || p.dinnerDishIds.length > 0;


export const ClearPlanModal: React.FC<ClearPlanModalProps> = ({ dayPlans, selectedDate, onClear, onClose }) => {
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

    const countMeals = (plans: DayPlan[]) => plans.reduce((sum, p) =>
      sum + p.breakfastDishIds.length + p.lunchDishIds.length + p.dinnerDishIds.length, 0);

    return {
      day: { plans: dayItems, mealCount: countMeals(dayItems) },
      week: { plans: weekItems, mealCount: countMeals(weekItems) },
      month: { plans: monthItems, mealCount: countMeals(monthItems) },
    };
  }, [dayPlans, selectedDate]);

  const formatShortDate = (dateStr: string) =>
    parseLocalDate(dateStr).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' });

  const SCOPE_OPTIONS: { scope: 'day' | 'week' | 'month'; label: string; desc: string; count: number; mealCount: number; dates: string[] }[] = [
    { scope: 'day', label: t('clearPlan.scopeDay'), desc: t('clearPlan.scopeDayDesc'), count: scopeData.day.plans.length, mealCount: scopeData.day.mealCount, dates: scopeData.day.plans.map(p => p.date) },
    { scope: 'week', label: t('clearPlan.scopeWeek'), desc: t('clearPlan.scopeWeekDesc'), count: scopeData.week.plans.length, mealCount: scopeData.week.mealCount, dates: scopeData.week.plans.map(p => p.date) },
    { scope: 'month', label: t('clearPlan.scopeMonth'), desc: t('clearPlan.scopeMonthDesc'), count: scopeData.month.plans.length, mealCount: scopeData.month.mealCount, dates: scopeData.month.plans.map(p => p.date) },
  ];

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden flex flex-col max-h-[90dvh] sm:mx-4">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('clearPlan.title')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('clearPlan.subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-4">
          {/* Meal selection */}
          <div className="flex gap-2" data-testid="meal-filter">
            {MEAL_LABELS.map(({ type, labelKey }) => (
              <button
                key={type}
                type="button"
                data-testid={`meal-toggle-${type}`}
                onClick={() => toggleMeal(type)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all border-2 ${
                  selectedMeals.has(type)
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500'
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
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group min-h-16 ${
                  count === 0
                    ? 'border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-50 cursor-not-allowed'
                    : 'border-slate-100 dark:border-slate-700 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-[0.98]'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform ${
                  count > 0 ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 group-hover:scale-110' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}>
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <p className={`font-bold text-lg ${count > 0 ? 'text-slate-800 dark:text-slate-100 group-hover:text-rose-700 dark:group-hover:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>{label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
                  {count > 0 && mealCount > 0 && (
                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-0.5">{t('clearPlan.totalMeals', { count: mealCount })}</p>
                  )}
                </div>
                {count > 0 && (
                  <span className="text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full shrink-0">
                    {t('clearPlan.dayCount', { count })}
                  </span>
                )}
              </button>
              {count > 1 && (
                <button
                  data-testid={`btn-expand-${scope}`}
                  onClick={() => setExpandedScope(prev => prev === scope ? null : scope)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-1.5 ml-4 transition-colors"
                >
                  {expandedScope === scope ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {t('clearPlan.affectedDates')}
                </button>
              )}
              {expandedScope === scope && dates.length > 0 && (
                <div className="ml-4 mt-1.5 flex flex-wrap gap-1.5">
                  {[...dates].sort((a, b) => a.localeCompare(b)).map(d => (
                    <span key={d} className="text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
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
