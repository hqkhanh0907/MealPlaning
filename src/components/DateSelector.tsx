import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDatabase } from '../contexts/DatabaseContext';
import { getSetting, setSetting } from '../services/appSettings';
import { DayPlan } from '../types';
import { parseLocalDate } from '../utils/helpers';

/** Format a Date to local YYYY-MM-DD (avoids UTC shift from toISOString) */
const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPlanClick?: () => void;
  dayPlans?: DayPlan[];
}

// Helper to get meal indicator dot class without nested ternary
const getMealDotClass = (hasMeal: boolean, isSelected: boolean, activeColor: string): string => {
  if (!hasMeal) return 'bg-transparent';
  return isSelected ? 'bg-card' : activeColor;
};

// Helper to get day button style class without nested ternary
const getDayButtonClass = (
  isSelected: boolean,
  isToday: boolean,
  variant: 'week' | 'calendar',
  isSunday = false,
): string => {
  if (isSelected) {
    return variant === 'week'
      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-105'
      : 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-105 ring-4 ring-ring/20';
  }
  if (isToday) {
    return variant === 'week'
      ? 'bg-primary-subtle text-primary border border-primary/20'
      : 'bg-primary-subtle text-primary border border-primary/20 hover:bg-primary/10';
  }
  if (isSunday) {
    return variant === 'week'
      ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 active:bg-rose-200'
      : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-700';
  }
  return variant === 'week'
    ? 'bg-muted text-foreground hover:bg-accent active:bg-muted'
    : 'bg-muted text-foreground hover:bg-accent border border-transparent hover:border-border dark:hover:border-border';
};

// Helper to get week day label color class
const getWeekDayLabelClass = (isSelected: boolean, isSunday: boolean): string => {
  if (isSelected) return 'text-white/80';
  if (isSunday) return 'text-rose-400';
  return 'text-muted-foreground';
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
  const base = parseLocalDate(selectedDate);
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
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${fmt(dates[0])} - ${fmt(dates[6])}`;
};

export const DateSelector = ({ selectedDate, onSelectDate, onPlanClick, dayPlans = [] }: DateSelectorProps) => {
  const { t } = useTranslation();
  const db = useDatabase();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = parseLocalDate(selectedDate);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'week'>(() =>
    typeof globalThis !== 'undefined' && globalThis.window && globalThis.window.innerWidth < 640 ? 'week' : 'calendar',
  );
  const [weekOffset, setWeekOffset] = useState(0);
  const [hintDismissed, setHintDismissed] = useState(false);
  const weekContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    getSetting(db, 'date_hint_dismissed')
      .then(val => {
        if (val === '1') setHintDismissed(true);
      })
      .catch(() => {
        /* db read error – keep default */
      });
  }, [db]);

  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

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

  const weekDays = [
    t('calendar.weekdays.mon'),
    t('calendar.weekdays.tue'),
    t('calendar.weekdays.wed'),
    t('calendar.weekdays.thu'),
    t('calendar.weekdays.fri'),
    t('calendar.weekdays.sat'),
    t('calendar.weekdays.sun'),
  ];

  const dismissHint = useCallback(() => {
    setHintDismissed(true);
    setSetting(db, 'date_hint_dismissed', '1').catch(() => {
      /* db write error */
    });
  }, [db]);

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setWeekOffset(0);
    onSelectDate(formatLocalDate(today));
  };

  const weekDates = getCurrentWeekDates(selectedDate, weekOffset);
  const weekLabel = formatWeekLabel(weekDates);

  const prevWeek = useCallback(() => setWeekOffset(prev => prev - 1), []);
  const nextWeek = useCallback(() => setWeekOffset(prev => prev + 1), []);

  // Touch swipe handlers for week view
  // Swipe gesture handlers via native DOM listeners to avoid non-interactive element warnings
  useEffect(() => {
    const el = weekContainerRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
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
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [nextWeek, prevWeek]);

  // Generate stable keys for empty cells
  const emptyCellKeys = Array.from({ length: firstDay }, (_, i) => `empty-start-${year}-${month}-${i}`);

  return (
    <div className="bg-card border-border-subtle rounded-2xl border p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="text-foreground flex items-center gap-2 text-lg font-bold">
          <CalendarIcon className="text-primary h-5 w-5" />
          <span>{viewMode === 'calendar' ? t('calendar.monthYear', { month: month + 1, year }) : weekLabel}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'week' : 'calendar')}
            className="text-muted-foreground hover:bg-accent active:bg-muted flex min-h-11 min-w-11 items-center justify-center rounded-xl p-1.5 transition-all sm:min-h-9 sm:min-w-9 sm:p-2"
            title={viewMode === 'calendar' ? t('calendar.weekMode') : t('calendar.calendarMode')}
            aria-label={viewMode === 'calendar' ? t('calendar.weekMode') : t('calendar.calendarMode')}
          >
            {viewMode === 'calendar' ? <List className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
          </button>
          <button
            onClick={goToToday}
            data-testid="btn-today"
            className="bg-primary-subtle text-primary hover:bg-primary/10 active:bg-primary/20 mr-1 flex min-h-11 items-center rounded-xl px-3 py-1.5 text-sm font-bold transition-all sm:mr-2 sm:min-h-9"
          >
            {t('calendar.today')}
          </button>
          <button
            onClick={viewMode === 'calendar' ? prevMonth : prevWeek}
            data-testid="btn-prev-date"
            aria-label={viewMode === 'calendar' ? t('calendar.prevMonth') : t('calendar.prevWeek')}
            className="text-muted-foreground hover:bg-accent active:bg-muted flex min-h-11 min-w-11 items-center justify-center rounded-xl p-1.5 transition-all sm:p-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={viewMode === 'calendar' ? nextMonth : nextWeek}
            data-testid="btn-next-date"
            aria-label={viewMode === 'calendar' ? t('calendar.nextMonth') : t('calendar.nextWeek')}
            className="text-muted-foreground hover:bg-accent active:bg-muted flex min-h-11 min-w-11 items-center justify-center rounded-xl p-1.5 transition-all sm:p-2"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Week View — 7 days (Mon–Sun) */}
      {viewMode === 'week' && (
        <div ref={weekContainerRef} className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDates.map(date => {
            const dateStr = formatLocalDate(date);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const dayOfWeek = date.getDay();
            const isSunday = dayOfWeek === 0;
            const dayLabel = weekDays[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

            const plan = dayPlans.find(p => p.date === dateStr);
            const hasBreakfast = (plan?.breakfastDishIds?.length ?? 0) > 0;
            const hasLunch = (plan?.lunchDishIds?.length ?? 0) > 0;
            const hasDinner = (plan?.dinnerDishIds?.length ?? 0) > 0;

            return (
              <button
                key={dateStr}
                data-selected={isSelected}
                aria-label={`${dayLabel} ${date.getDate()}`}
                onClick={() => {
                  if (isSelected && onPlanClick) {
                    onPlanClick();
                  } else {
                    onSelectDate(dateStr);
                    if (!hintDismissed) dismissHint();
                  }
                }}
                className={`flex min-h-18 flex-col items-center justify-center rounded-2xl px-1 py-2.5 transition-all ${getDayButtonClass(isSelected, isToday, 'week', isSunday)} ${isToday && !isSelected ? 'animate-pulse-subtle' : ''}`}
              >
                <span className={`text-xs font-bold uppercase ${getWeekDayLabelClass(isSelected, isSunday)}`}>
                  {dayLabel}
                </span>
                <span className="text-lg font-bold">{date.getDate()}</span>
                <div className="mt-0.5 flex gap-0.5">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${getMealDotClass(hasBreakfast, isSelected, 'bg-amber-400')}`}
                  />
                  <div className={`h-1.5 w-1.5 rounded-full ${getMealDotClass(hasLunch, isSelected, 'bg-blue-400')}`} />
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${getMealDotClass(hasDinner, isSelected, 'bg-indigo-400')}`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Calendar Grid View */}
      {viewMode === 'calendar' && (
        <>
          <div className="mb-1 grid grid-cols-7 gap-1 sm:mb-2 sm:gap-2">
            {weekDays.map((day, idx) => (
              <div
                key={day}
                className={`py-2 text-center text-xs font-bold uppercase ${idx === 6 ? 'text-rose-400' : 'text-muted-foreground'}`}
              >
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
              const isToday = dateStr === todayStr;

              const plan = dayPlans.find(p => p.date === dateStr);
              const hasBreakfast = (plan?.breakfastDishIds?.length ?? 0) > 0;
              const hasLunch = (plan?.lunchDishIds?.length ?? 0) > 0;
              const hasDinner = (plan?.dinnerDishIds?.length ?? 0) > 0;
              const isSunday = parseLocalDate(dateStr).getDay() === 0;

              return (
                <button
                  key={day}
                  onClick={() => {
                    if (isSelected && onPlanClick) {
                      onPlanClick();
                    } else {
                      onSelectDate(dateStr);
                      if (!hintDismissed) dismissHint();
                    }
                  }}
                  onDoubleClick={() => {
                    onSelectDate(dateStr);
                    if (onPlanClick) onPlanClick();
                  }}
                  title={isSelected ? t('calendar.tapToPlan') : t('calendar.selectDay')}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl transition-all ${getDayButtonClass(isSelected, isToday, 'calendar', isSunday)} ${isToday && !isSelected ? 'animate-pulse-subtle' : ''}`}
                >
                  <span className="text-sm font-bold">{day}</span>

                  <div className="absolute bottom-1 flex gap-0.5 sm:bottom-2">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${getMealDotClass(hasBreakfast, isSelected, 'bg-amber-400')}`}
                    />
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${getMealDotClass(hasLunch, isSelected, 'bg-blue-400')}`}
                    />
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${getMealDotClass(hasDinner, isSelected, 'bg-indigo-400')}`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="text-muted-foreground mt-4 flex flex-col items-start justify-between gap-2 text-xs font-medium sm:flex-row sm:items-center sm:gap-0">
            {(() => {
              if (hintDismissed) return <span />;
              const selectedPlan = dayPlans.find(p => p.date === selectedDate);
              const hasAnyPlan = Boolean(
                selectedPlan &&
                ((selectedPlan.breakfastDishIds?.length ?? 0) > 0 ||
                  (selectedPlan.lunchDishIds?.length ?? 0) > 0 ||
                  (selectedPlan.dinnerDishIds?.length ?? 0) > 0),
              );
              if (hasAnyPlan) return <span />;
              return (
                <>
                  <span className="hidden sm:inline">{t('calendar.tipDoubleClick')}</span>
                  <span className="sm:hidden">{t('calendar.tipTap')}</span>
                </>
              );
            })()}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-400"></div> {t('calendar.morning')}
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-400"></div> {t('calendar.afternoon')}
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-indigo-400"></div> {t('calendar.evening')}
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === 'week' && (
        <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs font-medium">
          {!hintDismissed && <span>{t('calendar.swipeHint')}</span>}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-amber-400"></div> {t('calendar.morning')}
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-400"></div> {t('calendar.afternoon')}
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-indigo-400"></div> {t('calendar.evening')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
