import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { DayPlan } from '../types';

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPlanClick?: () => void;
  dayPlans?: DayPlan[];
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate, onPlanClick, dayPlans = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0
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
    onSelectDate(today.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
          <CalendarIcon className="w-5 h-5 text-emerald-500" />
          <span>Tháng {month + 1}, {year}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all mr-1 sm:mr-2"
          >
            Hôm nay
          </button>
          <button 
            onClick={prevMonth}
            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="p-1 sm:p-2" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = formatDate(day);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          
          const plan = dayPlans.find(p => p.date === dateStr);
          const hasBreakfast = !!plan?.breakfastId;
          const hasLunch = !!plan?.lunchId;
          const hasDinner = !!plan?.dinnerId;

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
              className={`
                relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all
                ${isSelected 
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200 scale-105 ring-4 ring-emerald-500/20' 
                  : isToday
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                }
              `}
            >
              <span className="text-sm font-bold">{day}</span>
              
              {/* Meal Indicators */}
              <div className="absolute bottom-1 sm:bottom-2 flex gap-0.5">
                <div className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${hasBreakfast ? (isSelected ? 'bg-white' : 'bg-amber-400') : 'bg-transparent'}`} />
                <div className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${hasLunch ? (isSelected ? 'bg-white' : 'bg-blue-400') : 'bg-transparent'}`} />
                <div className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${hasDinner ? (isSelected ? 'bg-white' : 'bg-indigo-400') : 'bg-transparent'}`} />
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 font-medium gap-2 sm:gap-0">
        <span>Mẹo: Nhấn đúp hoặc nhấn vào ngày đang chọn để lên kế hoạch</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Sáng</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Trưa</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> Tối</div>
        </div>
      </div>
    </div>
  );
};
