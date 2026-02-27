import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react';
import { DayPlan } from '../types';

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPlanClick?: () => void;
  dayPlans?: DayPlan[];
}

// Helper to get meal indicator dot class without nested ternary
const getMealDotClass = (hasMeal: boolean, isSelected: boolean, activeColor: string): string => {
  if (!hasMeal) return 'bg-transparent';
  return isSelected ? 'bg-white' : activeColor;
};

// Helper to get day button style class without nested ternary
const getDayButtonClass = (isSelected: boolean, isToday: boolean, variant: 'week' | 'calendar'): string => {
  if (isSelected) {
    return variant === 'week'
      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200 scale-105'
      : 'bg-emerald-500 text-white shadow-sm shadow-emerald-200 scale-105 ring-4 ring-emerald-500/20';
  }
  if (isToday) {
    return variant === 'week'
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
      : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100';
  }
  return variant === 'week'
    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200'
    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200';
};

// Get Monday of the week containing the given date
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get 7 dates (Mon–Sun) for a given week offset from selectedDate
const getCurrentWeekDates = (selectedDate: string, weekOffset: number): Date[] => {
  const base = new Date(selectedDate);
  const monday = getMonday(base);
  monday.setDate(monday.getDate() + weekOffset * 7);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
};

// Format week label e.g. "24/02 - 02/03"
const formatWeekLabel = (dates: Date[]): string => {
  if (dates.length < 7) return '';
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${fmt(dates[0])} - ${fmt(dates[6])}`;
};

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate, onPlanClick, dayPlans = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(selectedDate);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'week'>(() =>
    typeof globalThis !== 'undefined' && globalThis.window && globalThis.window.innerWidth < 640 ? 'week' : 'calendar'
  );
  const [weekOffset, setWeekOffset] = useState(0);
  const weekContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const formatDate = (d: number) => {
    const m = String(month + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    return `${year}-${m}-${day}`;
  };

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setWeekOffset(0);
    onSelectDate(today.toISOString().split('T')[0]);
  };

  const weekDates = getCurrentWeekDates(selectedDate, weekOffset);
  const weekLabel = formatWeekLabel(weekDates);

  const prevWeek = useCallback(() => setWeekOffset(prev => prev - 1), []);
  const nextWeek = useCallback(() => setWeekOffset(prev => prev + 1), []);

  // Touch swipe handlers for week view
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    // Only swipe horizontally if X distance > Y distance and > 50px threshold
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX < 0) {
        nextWeek(); // swipe left → next week
      } else {
        prevWeek(); // swipe right → previous week
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [nextWeek, prevWeek]);

  // Generate stable keys for empty cells
  const emptyCellKeys = Array.from({ length: firstDay }, (_, i) => `empty-start-${year}-${month}-${i}`);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
          <CalendarIcon className="w-5 h-5 text-emerald-500" />
          <span>{viewMode === 'calendar' ? `Tháng ${month + 1}, ${year}` : weekLabel}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'week' : 'calendar')}
            className="p-1.5 sm:p-2 hover:bg-slate-100 active:bg-slate-200 rounded-xl text-slate-500 transition-all min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 flex items-center justify-center"
            title={viewMode === 'calendar' ? 'Chế độ tuần' : 'Chế độ lịch'}
          >
            {viewMode === 'calendar' ? <List className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 rounded-xl transition-all mr-1 sm:mr-2 min-h-11 sm:min-h-9 flex items-center"
          >
            Hôm nay
          </button>
          <button
            onClick={viewMode === 'calendar' ? prevMonth : prevWeek}
            className="p-1.5 sm:p-2 hover:bg-slate-100 active:bg-slate-200 rounded-xl text-slate-500 transition-all min-h-9 min-w-9 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={viewMode === 'calendar' ? nextMonth : nextWeek}
            className="p-1.5 sm:p-2 hover:bg-slate-100 active:bg-slate-200 rounded-xl text-slate-500 transition-all min-h-9 min-w-9 flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week View — 7 days (Mon–Sun) */}
      {viewMode === 'week' && (
        <div
          ref={weekContainerRef}
          className="grid grid-cols-7 gap-1.5 sm:gap-2"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {weekDates.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            const dayLabel = weekDays[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

            const plan = dayPlans.find(p => p.date === dateStr);
            const hasBreakfast = (plan?.breakfastDishIds?.length ?? 0) > 0;
            const hasLunch = (plan?.lunchDishIds?.length ?? 0) > 0;
            const hasDinner = (plan?.dinnerDishIds?.length ?? 0) > 0;

            return (
              <button
                key={dateStr}
                data-selected={isSelected}
                onClick={() => {
                  if (isSelected && onPlanClick) {
                    onPlanClick();
                  } else {
                    onSelectDate(dateStr);
                  }
                }}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all min-h-18 ${getDayButtonClass(isSelected, isToday, 'week')}`}
              >
                <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{dayLabel}</span>
                <span className="text-lg font-bold">{date.getDate()}</span>
                <div className="flex gap-0.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${getMealDotClass(hasBreakfast, isSelected, 'bg-amber-400')}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${getMealDotClass(hasLunch, isSelected, 'bg-blue-400')}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${getMealDotClass(hasDinner, isSelected, 'bg-indigo-400')}`} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Calendar Grid View */}
      {viewMode === 'calendar' && (
        <>
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {emptyCellKeys.map(key => (
              <div key={key} className="p-1 sm:p-2" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDate(day);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              const plan = dayPlans.find(p => p.date === dateStr);
              const hasBreakfast = (plan?.breakfastDishIds?.length ?? 0) > 0;
              const hasLunch = (plan?.lunchDishIds?.length ?? 0) > 0;
              const hasDinner = (plan?.dinnerDishIds?.length ?? 0) > 0;

              return (
                <button
                  key={day}
                  onClick={() => {
                    if (isSelected && onPlanClick) {
                      onPlanClick();
                    } else {
                      onSelectDate(dateStr);
                    }
                  }}
                  onDoubleClick={() => {
                    onSelectDate(dateStr);
                    if (onPlanClick) onPlanClick();
                  }}
                  title={isSelected ? "Nhấn lần nữa để lên kế hoạch" : "Chọn ngày"}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${getDayButtonClass(isSelected, isToday, 'calendar')}`}
                >
                  <span className="text-sm font-bold">{day}</span>

                  <div className="absolute bottom-1 sm:bottom-2 flex gap-0.5">
                    <div className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${getMealDotClass(hasBreakfast, isSelected, 'bg-amber-400')}`} />
                    <div className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${getMealDotClass(hasLunch, isSelected, 'bg-blue-400')}`} />
                    <div className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${getMealDotClass(hasDinner, isSelected, 'bg-indigo-400')}`} />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 font-medium gap-2 sm:gap-0">
            {(() => {
              const selectedPlan = dayPlans.find(p => p.date === selectedDate);
              const hasAnyPlan = Boolean(selectedPlan && (
                (selectedPlan.breakfastDishIds?.length ?? 0) > 0 ||
                (selectedPlan.lunchDishIds?.length ?? 0) > 0 ||
                (selectedPlan.dinnerDishIds?.length ?? 0) > 0
              ));
              if (hasAnyPlan) return <span />;
              return (
                <>
                  <span className="hidden sm:inline">Mẹo: Nhấn đúp hoặc nhấn vào ngày đang chọn để lên kế hoạch</span>
                  <span className="sm:hidden">Nhấn vào ngày đang chọn để lên kế hoạch</span>
                </>
              );
            })()}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Sáng</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Trưa</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> Tối</div>
            </div>
          </div>
        </>
      )}

      {viewMode === 'week' && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Vuốt ngang hoặc dùng mũi tên để chuyển tuần</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Sáng</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Trưa</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> Tối</div>
          </div>
        </div>
      )}
    </div>
  );
};
