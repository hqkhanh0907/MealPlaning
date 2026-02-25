import React, { useMemo } from 'react';
import { X, CalendarDays } from 'lucide-react';
import { DayPlan } from '../../types';

interface ClearPlanModalProps {
  dayPlans: DayPlan[];
  selectedDate: string;
  onClear: (scope: 'day' | 'week' | 'month') => void;
  onClose: () => void;
}

const ModalBackdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
    <button type="button" aria-label="Close modal" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} tabIndex={-1} />
    {children}
  </div>
);

const hasPlan = (p: DayPlan): boolean =>
  p.breakfastDishIds.length > 0 || p.lunchDishIds.length > 0 || p.dinnerDishIds.length > 0;

const getWeekRange = (dateStr: string): { start: Date; end: Date } => {
  const targetDate = new Date(dateStr);
  const day = targetDate.getDay();
  const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(targetDate);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const ClearPlanModal: React.FC<ClearPlanModalProps> = ({ dayPlans, selectedDate, onClear, onClose }) => {
  const counts = useMemo(() => {
    const dayCount = dayPlans.filter(p => p.date === selectedDate && hasPlan(p)).length;

    const { start: wStart, end: wEnd } = getWeekRange(selectedDate);
    const weekCount = dayPlans.filter(p => {
      const d = new Date(p.date);
      return d >= wStart && d <= wEnd && hasPlan(p);
    }).length;

    const targetDate = new Date(selectedDate);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthCount = dayPlans.filter(p => {
      const pDate = new Date(p.date);
      return pDate.getFullYear() === year && pDate.getMonth() === month && hasPlan(p);
    }).length;

    return { day: dayCount, week: weekCount, month: monthCount };
  }, [dayPlans, selectedDate]);

  const SCOPE_OPTIONS: { scope: 'day' | 'week' | 'month'; label: string; desc: string; count: number }[] = [
    { scope: 'day', label: 'Ngày này', desc: 'Xóa kế hoạch của ngày đang chọn', count: counts.day },
    { scope: 'week', label: 'Tuần này', desc: 'Xóa kế hoạch của tuần hiện tại', count: counts.week },
    { scope: 'month', label: 'Tháng này', desc: 'Xóa kế hoạch của tháng hiện tại', count: counts.month },
  ];

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden flex flex-col sm:mx-4">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Xóa kế hoạch</h3>
            <p className="text-sm text-slate-500">Chọn phạm vi thời gian muốn xóa</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-4">
          {SCOPE_OPTIONS.map(({ scope, label, desc, count }) => (
            <button
              key={scope}
              onClick={() => onClear(scope)}
              disabled={count === 0}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group min-h-16 ${
                count === 0
                  ? 'border-slate-50 bg-slate-50 opacity-50 cursor-not-allowed'
                  : 'border-slate-100 hover:border-rose-500 hover:bg-rose-50 active:scale-[0.98]'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform ${
                count > 0 ? 'bg-rose-100 text-rose-600 group-hover:scale-110' : 'bg-slate-100 text-slate-400'
              }`}>
                <CalendarDays className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <p className={`font-bold text-lg ${count > 0 ? 'text-slate-800 group-hover:text-rose-700' : 'text-slate-400'}`}>{label}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
              {count > 0 && (
                <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2.5 py-1 rounded-full shrink-0">
                  {count} ngày
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </ModalBackdrop>
  );
};

