import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CalendarDays } from 'lucide-react';
import { DayPlan } from '../../types';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { getWeekRange, isDateInRange, parseLocalDate } from '../../utils/helpers';

interface ClearPlanModalProps {
  dayPlans: DayPlan[];
  selectedDate: string;
  onClear: (scope: 'day' | 'week' | 'month') => void;
  onClose: () => void;
}

const hasPlan = (p: DayPlan): boolean =>
  p.breakfastDishIds.length > 0 || p.lunchDishIds.length > 0 || p.dinnerDishIds.length > 0;


export const ClearPlanModal: React.FC<ClearPlanModalProps> = ({ dayPlans, selectedDate, onClear, onClose }) => {
  const { t } = useTranslation();
  useModalBackHandler(true, onClose);

  const counts = useMemo(() => {
    const dayCount = dayPlans.filter(p => p.date === selectedDate && hasPlan(p)).length;

    const { start: wStart, end: wEnd } = getWeekRange(selectedDate);
    const weekCount = dayPlans.filter(p => isDateInRange(p.date, wStart, wEnd) && hasPlan(p)).length;

    const targetDate = parseLocalDate(selectedDate);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthCount = dayPlans.filter(p => {
      const pDate = parseLocalDate(p.date);
      return pDate.getFullYear() === year && pDate.getMonth() === month && hasPlan(p);
    }).length;

    return { day: dayCount, week: weekCount, month: monthCount };
  }, [dayPlans, selectedDate]);

  const SCOPE_OPTIONS: { scope: 'day' | 'week' | 'month'; label: string; desc: string; count: number }[] = [
    { scope: 'day', label: t('clearPlan.scopeDay'), desc: t('clearPlan.scopeDayDesc'), count: counts.day },
    { scope: 'week', label: t('clearPlan.scopeWeek'), desc: t('clearPlan.scopeWeekDesc'), count: counts.week },
    { scope: 'month', label: t('clearPlan.scopeMonth'), desc: t('clearPlan.scopeMonthDesc'), count: counts.month },
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
          {SCOPE_OPTIONS.map(({ scope, label, desc, count }) => (
            <button
              key={scope}
              data-testid={`btn-clear-scope-${scope}`}
              onClick={() => onClear(scope)}
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
              </div>
              {count > 0 && (
                <span className="text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full shrink-0">
                  {t('clearPlan.dayCount', { count })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </ModalBackdrop>
  );
};
