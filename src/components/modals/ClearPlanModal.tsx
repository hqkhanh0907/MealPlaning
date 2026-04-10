import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { DayPlan, MealType } from '../../types';
import { getWeekRange, isDateInRange, parseLocalDate } from '../../utils/helpers';
import { CloseButton } from '../shared/CloseButton';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface ClearPlanModalProps {
  dayPlans: DayPlan[];
  selectedDate: string;
  onClear: (scope: 'day' | 'week' | 'month', meals?: MealType[]) => void;
  onClose: () => void;
}

const hasPlan = (p: DayPlan): boolean =>
  p.breakfastDishIds.length > 0 || p.lunchDishIds.length > 0 || p.dinnerDishIds.length > 0;

export const ClearPlanModal = ({ dayPlans, selectedDate, onClear, onClose }: Readonly<ClearPlanModalProps>) => {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
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
    <ModalBackdrop
      onClose={onClose}
      role="alertdialog"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      closeOnBackdropClick={true}
      closeOnEscape={true}
      allowSwipeToDismiss={true}
    >
      <section className="bg-card relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-md sm:rounded-2xl">
        <div className="border-border-subtle flex items-center justify-between border-b px-6 py-5 sm:px-8 sm:py-6">
          <div>
            <h3 id={titleId} className="text-foreground text-xl font-semibold break-words">
              {t('clearPlan.title')}
            </h3>
            <p id={descriptionId} className="text-muted-foreground text-sm break-words">
              {t('clearPlan.subtitle')}
            </p>
          </div>
          <CloseButton onClick={onClose} data-testid="btn-close-clear-plan" />
        </div>
        <div className="space-y-4 overflow-y-auto p-6 sm:p-8">
          <div className="flex gap-2" data-testid="meal-filter">
            {MEAL_LABELS.map(({ type, labelKey }) => (
              <button
                key={type}
                type="button"
                data-testid={`meal-toggle-${type}`}
                onClick={() => toggleMeal(type)}
                className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold break-words whitespace-normal transition-all ${
                  selectedMeals.has(type)
                    ? 'border-rose bg-rose-subtle text-rose-emphasis'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          {SCOPE_OPTIONS.map(({ scope, label, desc, count, mealCount, dates }) => (
            <div key={scope}>
              <button
                type="button"
                data-testid={`btn-clear-scope-${scope}`}
                onClick={() => onClear(scope, selectedMeals.size === 3 ? undefined : Array.from(selectedMeals))}
                disabled={count === 0}
                aria-disabled={count === 0}
                className={`group flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                  count === 0
                    ? 'border-border bg-muted cursor-not-allowed opacity-50'
                    : 'border-border-subtle hover:border-rose hover:bg-rose-subtle active:scale-[0.98]'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform ${
                    count > 0 ? 'bg-rose/15 text-rose group-hover:scale-110' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <p
                    className={`text-lg font-semibold break-words ${count > 0 ? 'text-foreground group-hover:text-rose-emphasis' : 'text-muted-foreground'}`}
                  >
                    {label}
                  </p>
                  <p className="text-muted-foreground text-sm break-words">{desc}</p>
                  {count > 0 && mealCount > 0 && (
                    <p className="text-rose mt-0.5 text-xs break-words">
                      {t('clearPlan.totalMeals', { count: mealCount })}
                    </p>
                  )}
                </div>
                {count > 0 && (
                  <span className="bg-rose/10 text-rose shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold break-words whitespace-normal">
                    {t('clearPlan.dayCount', { count })}
                  </span>
                )}
              </button>
              {count > 1 && (
                <button
                  type="button"
                  data-testid={`btn-expand-${scope}`}
                  onClick={() => setExpandedScope(prev => (prev === scope ? null : scope))}
                  className="hover:text-foreground-secondary text-muted-foreground mt-1.5 ml-4 flex items-center gap-1 text-left text-xs break-words whitespace-normal transition-colors"
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
                      <span key={d} className="bg-rose/10 text-rose rounded-full px-2 py-0.5 text-xs break-words">
                        {formatShortDate(d)}
                      </span>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </ModalBackdrop>
  );
};
