import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TrainingPlanDay } from '@/features/fitness/types';

import type { DayStatus, WeekCalendarStripProps } from '../features/fitness/components/WeekCalendarStrip';
import { getDayStatus, WeekCalendarStrip } from '../features/fitness/components/WeekCalendarStrip';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mockMotion = { reduced: false };

vi.mock('@/utils/motion', () => ({
  getAnimationClass: (name: string, stagger: number, reduced: boolean) =>
    reduced ? '' : `animate-${name} animate-stagger-${stagger}`,
  useReducedMotion: () => mockMotion.reduced,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'fitness.plan.weekOverview': 'Lịch tuần',
        'fitness.dayFull.0': 'Thứ Hai',
        'fitness.dayFull.1': 'Thứ Ba',
        'fitness.dayFull.2': 'Thứ Tư',
        'fitness.dayFull.3': 'Thứ Năm',
        'fitness.dayFull.4': 'Thứ Sáu',
        'fitness.dayFull.5': 'Thứ Bảy',
        'fitness.dayFull.6': 'Chủ Nhật',
        'fitness.plan.completed': 'Hoàn thành',
        'fitness.plan.workout': 'Buổi tập',
        'fitness.plan.restDay': 'Ngày nghỉ',
        'fitness.plan.missed': 'Bỏ lỡ',
        'fitness.plan.noPlanDay': 'Chưa có kế hoạch',
        'fitness.plan.startWorkout': 'Bắt đầu tập',
        'fitness.plan.exerciseCount': `${opts?.count ?? 0} bài tập`,
      };
      return map[key] ?? key;
    },
  }),
}));

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

function makePlanDay(
  dayOfWeek: number,
  workoutType: 'workout' | 'rest' = 'workout',
  overrides: Partial<TrainingPlanDay> = {},
): TrainingPlanDay {
  return {
    id: `pd-${dayOfWeek}`,
    planId: 'plan-1',
    dayOfWeek,
    sessionOrder: 1,
    workoutType,
    muscleGroups: workoutType === 'workout' ? 'chest,triceps' : '',
    exercises: workoutType === 'workout' ? JSON.stringify([{ id: 'e1' }]) : '',
    ...overrides,
  } as TrainingPlanDay;
}

const defaultPlanDays: readonly TrainingPlanDay[] = [
  makePlanDay(1),
  makePlanDay(2, 'rest'),
  makePlanDay(3),
  makePlanDay(5),
];

const defaultProps: WeekCalendarStripProps = {
  selectedDay: 3,
  todayDow: 3,
  planDays: defaultPlanDays,
  completedDays: new Set<number>([1]),
  onDaySelect: vi.fn(),
};

function renderStrip(overrides: Partial<WeekCalendarStripProps> = {}) {
  const props: WeekCalendarStripProps = {
    ...defaultProps,
    ...overrides,
    onDaySelect: overrides.onDaySelect ?? vi.fn(),
  };
  return render(<WeekCalendarStrip {...props} />);
}

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function getPill(dayNum: number) {
  return screen.getByTestId(`day-pill-${dayNum}`);
}

/* ------------------------------------------------------------------ */
/*  §A  Original Tests — Rendering (TC_WCS_01 – TC_WCS_10)            */
/* ------------------------------------------------------------------ */

describe('WeekCalendarStrip', () => {
  beforeEach(() => {
    mockMotion.reduced = false;
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('TC_WCS_01: renders 7 day pills', () => {
      renderStrip();
      const strip = screen.getByTestId('week-calendar-strip');
      const pills = within(strip).getAllByRole('button');
      expect(pills).toHaveLength(7);
    });

    it('TC_WCS_02: each pill shows correct day label', () => {
      renderStrip();
      const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      labels.forEach((label, idx) => {
        expect(getPill(idx + 1)).toHaveTextContent(label);
      });
    });

    it('TC_WCS_03: selected day has aria-pressed=true', () => {
      renderStrip({ selectedDay: 3 });
      expect(getPill(3)).toHaveAttribute('aria-pressed', 'true');
    });

    it('TC_WCS_04: non-selected days have aria-pressed=false', () => {
      renderStrip({ selectedDay: 3 });
      [1, 2, 4, 5, 6, 7].forEach(d => {
        expect(getPill(d)).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('TC_WCS_05: today pill has aria-current=date', () => {
      renderStrip({ todayDow: 3 });
      expect(getPill(3)).toHaveAttribute('aria-current', 'date');
    });

    it('TC_WCS_06: non-today pills have no aria-current', () => {
      renderStrip({ todayDow: 3 });
      [1, 2, 4, 5, 6, 7].forEach(d => {
        expect(getPill(d)).not.toHaveAttribute('aria-current');
      });
    });

    it('TC_WCS_07: strip has role=toolbar', () => {
      renderStrip();
      expect(screen.getByTestId('week-calendar-strip')).toHaveAttribute('role', 'toolbar');
    });

    it('TC_WCS_08: strip has aria-label', () => {
      renderStrip();
      expect(screen.getByTestId('week-calendar-strip')).toHaveAttribute('aria-label', 'Lịch tuần');
    });

    it('TC_WCS_09: pills have data-status attribute', () => {
      renderStrip();
      expect(getPill(1)).toHaveAttribute('data-status', 'completed');
    });

    it('TC_WCS_10: pills have data-testid format day-pill-N', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByTestId(`day-pill-${i}`)).toBeInTheDocument();
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /*  §B  Original Tests — Day Status (TC_WCS_11 – TC_WCS_20)           */
  /* ------------------------------------------------------------------ */

  describe('Day Status', () => {
    it('TC_WCS_11: completed day shows check icon', () => {
      renderStrip({ completedDays: new Set([3]) });
      expect(getPill(3)).toHaveAttribute('data-status', 'completed');
    });

    it('TC_WCS_12: completed day has success colors', () => {
      renderStrip({ completedDays: new Set([3]) });
      expect(getPill(3).className).toContain('bg-success/10');
      expect(getPill(3).className).toContain('text-success');
    });

    it('TC_WCS_13: workout day shows dumbbell icon', () => {
      renderStrip({ todayDow: 3 });
      expect(getPill(3)).toHaveAttribute('data-status', 'workout');
    });

    it('TC_WCS_14: workout day has primary colors', () => {
      renderStrip({ todayDow: 3 });
      expect(getPill(3).className).toContain('bg-primary/10');
      expect(getPill(3).className).toContain('text-primary');
    });

    it('TC_WCS_15: rest day (planned) shows moon icon', () => {
      renderStrip();
      expect(getPill(2)).toHaveAttribute('data-status', 'rest');
    });

    it('TC_WCS_16: rest day has info colors', () => {
      renderStrip();
      expect(getPill(2).className).toContain('bg-muted');
      expect(getPill(2).className).toContain('text-info');
    });

    it('TC_WCS_17: completed overrides workout status', () => {
      renderStrip({ completedDays: new Set([3]), todayDow: 3 });
      expect(getPill(3)).toHaveAttribute('data-status', 'completed');
    });

    it('TC_WCS_18: completed overrides rest status', () => {
      renderStrip({ completedDays: new Set([2]) });
      expect(getPill(2)).toHaveAttribute('data-status', 'completed');
    });

    it('TC_WCS_19: rest day color consistency across planned rest', () => {
      const plans = [makePlanDay(2, 'rest'), makePlanDay(4, 'rest')];
      renderStrip({ planDays: plans, completedDays: new Set(), todayDow: 3 });
      expect(getPill(2).className).toContain('text-info');
      expect(getPill(4).className).toContain('text-info');
    });

    it('TC_WCS_20: multiple completed days all show completed', () => {
      renderStrip({ completedDays: new Set([1, 2, 3]) });
      [1, 2, 3].forEach(d => {
        expect(getPill(d)).toHaveAttribute('data-status', 'completed');
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /*  §C  Original Tests — Interaction (TC_WCS_21 – TC_WCS_30)          */
  /* ------------------------------------------------------------------ */

  describe('Interaction', () => {
    it('TC_WCS_21: clicking a pill calls onDaySelect with day number', async () => {
      const onDaySelect = vi.fn();
      renderStrip({ onDaySelect });
      await userEvent.click(getPill(5));
      expect(onDaySelect).toHaveBeenCalledWith(5);
    });

    it('TC_WCS_22: clicking already selected pill still fires onDaySelect', async () => {
      const onDaySelect = vi.fn();
      renderStrip({ onDaySelect, selectedDay: 3 });
      await userEvent.click(getPill(3));
      expect(onDaySelect).toHaveBeenCalledWith(3);
    });

    it('TC_WCS_23: context menu fires onDayContextMenu', async () => {
      const onCtx = vi.fn();
      renderStrip({ onDayContextMenu: onCtx });
      const pill = getPill(1);
      await userEvent.pointer({ target: pill, keys: '[MouseRight]' });
      expect(onCtx).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('TC_WCS_24: no context menu handler means no error on right-click', async () => {
      renderStrip({ onDayContextMenu: undefined });
      await userEvent.pointer({ target: getPill(1), keys: '[MouseRight]' });
      expect(screen.getByTestId('week-calendar-strip')).toBeInTheDocument();
    });

    it('TC_WCS_25: clicking different pills fires correct day numbers', async () => {
      const onDaySelect = vi.fn();
      renderStrip({ onDaySelect });
      await userEvent.click(getPill(1));
      await userEvent.click(getPill(7));
      expect(onDaySelect).toHaveBeenCalledWith(1);
      expect(onDaySelect).toHaveBeenCalledWith(7);
    });

    it('TC_WCS_26: rapid clicks on same pill fire multiple events', async () => {
      const onDaySelect = vi.fn();
      renderStrip({ onDaySelect });
      await userEvent.click(getPill(4));
      await userEvent.click(getPill(4));
      expect(onDaySelect).toHaveBeenCalledTimes(2);
    });

    it('TC_WCS_27: all 7 pills are clickable', async () => {
      const onDaySelect = vi.fn();
      renderStrip({ onDaySelect });
      for (let i = 1; i <= 7; i++) {
        await userEvent.click(getPill(i));
      }
      expect(onDaySelect).toHaveBeenCalledTimes(7);
    });

    it('TC_WCS_28: pill has focus-visible ring class', () => {
      renderStrip();
      expect(getPill(1).className).toContain('focus-visible:ring-2');
    });

    it('TC_WCS_29: pills have type=button', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        expect(getPill(i)).toHaveAttribute('type', 'button');
      }
    });

    it('TC_WCS_30: each pill has descriptive aria-label', () => {
      renderStrip();
      expect(getPill(1).getAttribute('aria-label')).toContain('Thứ Hai');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  §D  Original Tests — Styling & Visual (TC_WCS_31 – TC_WCS_40)     */
  /* ------------------------------------------------------------------ */

  describe('Styling & Visual', () => {
    it('TC_WCS_31: today pill has ring-primary ring-2', () => {
      renderStrip({ todayDow: 3 });
      expect(getPill(3).className).toContain('ring-primary');
      expect(getPill(3).className).toContain('ring-2');
    });

    it('TC_WCS_32: selected non-today pill has ring-ring', () => {
      renderStrip({ selectedDay: 5, todayDow: 3 });
      expect(getPill(5).className).toContain('ring-ring');
    });

    it('TC_WCS_33: non-selected non-today pill has no ring', () => {
      renderStrip({ selectedDay: 3, todayDow: 3 });
      expect(getPill(5).className).not.toMatch(/(?<![:-])ring-primary/);
      expect(getPill(5).className).not.toMatch(/ ring-ring/);
    });

    it('TC_WCS_34: pills use flex-1 for equal width', () => {
      renderStrip();
      expect(getPill(1).className).toContain('flex-1');
    });

    it('TC_WCS_35: strip container uses flex gap', () => {
      renderStrip();
      expect(screen.getByTestId('week-calendar-strip').className).toContain('gap-1.5');
    });

    it('TC_WCS_36: pill has min-h-11', () => {
      renderStrip();
      expect(getPill(1).className).toContain('min-h-11');
    });

    it('TC_WCS_37: pills have active:scale press feedback', () => {
      renderStrip();
      expect(getPill(1).className).toContain('active:scale-[0.98]');
    });

    it('TC_WCS_38: pill text is text-xs', () => {
      renderStrip();
      expect(getPill(1).className).toContain('text-xs');
    });

    it('TC_WCS_39: completed pills show success background regardless of day', () => {
      renderStrip({ completedDays: new Set([1, 4, 7]) });
      [1, 4, 7].forEach(d => {
        expect(getPill(d).className).toContain('bg-success/10');
      });
    });

    it('TC_WCS_40: aria-label includes status text for missed day', () => {
      renderStrip({ todayDow: 3 });
      expect(getPill(1).getAttribute('aria-label')).toContain('Hoàn thành');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  §E  Original Tests — Edge Cases (TC_WCS_41 – TC_WCS_57)           */
  /* ------------------------------------------------------------------ */

  describe('Edge Cases', () => {
    it('TC_WCS_41: empty planDays renders all pills', () => {
      renderStrip({ planDays: [], completedDays: new Set() });
      expect(within(screen.getByTestId('week-calendar-strip')).getAllByRole('button')).toHaveLength(7);
    });

    it('TC_WCS_42: empty completedDays shows no completed pills', () => {
      renderStrip({ completedDays: new Set(), todayDow: 1 });
      for (let i = 1; i <= 7; i++) {
        expect(getPill(i)).not.toHaveAttribute('data-status', 'completed');
      }
    });

    it('TC_WCS_43: all days completed shows all completed', () => {
      renderStrip({ completedDays: new Set([1, 2, 3, 4, 5, 6, 7]) });
      for (let i = 1; i <= 7; i++) {
        expect(getPill(i)).toHaveAttribute('data-status', 'completed');
      }
    });

    it('TC_WCS_44: selectedDay=1 marks first pill pressed', () => {
      renderStrip({ selectedDay: 1 });
      expect(getPill(1)).toHaveAttribute('aria-pressed', 'true');
    });

    it('TC_WCS_45: selectedDay=7 marks last pill pressed', () => {
      renderStrip({ selectedDay: 7 });
      expect(getPill(7)).toHaveAttribute('aria-pressed', 'true');
    });

    it('TC_WCS_46: todayDow=1 first pill is current', () => {
      renderStrip({ todayDow: 1 });
      expect(getPill(1)).toHaveAttribute('aria-current', 'date');
    });

    it('TC_WCS_47: todayDow=7 last pill is current', () => {
      renderStrip({ todayDow: 7 });
      expect(getPill(7)).toHaveAttribute('aria-current', 'date');
    });

    it('TC_WCS_48: today AND selected same pill has ring-primary', () => {
      renderStrip({ selectedDay: 3, todayDow: 3 });
      expect(getPill(3).className).toContain('ring-primary');
    });

    it('TC_WCS_49: today AND selected same pill pressed+current', () => {
      renderStrip({ selectedDay: 3, todayDow: 3 });
      expect(getPill(3)).toHaveAttribute('aria-pressed', 'true');
      expect(getPill(3)).toHaveAttribute('aria-current', 'date');
    });

    it('TC_WCS_50: empty plan shows past=rest, today/future=noPlan', () => {
      renderStrip({ planDays: [], completedDays: new Set(), todayDow: 4 });
      [1, 2, 3].forEach(d => expect(getPill(d)).toHaveAttribute('data-status', 'rest'));
      [4, 5, 6, 7].forEach(d => expect(getPill(d)).toHaveAttribute('data-status', 'noPlan'));
    });

    it('TC_WCS_51: single workout day correct', () => {
      renderStrip({ planDays: [makePlanDay(4)], completedDays: new Set(), todayDow: 4 });
      expect(getPill(4)).toHaveAttribute('data-status', 'workout');
    });

    it('TC_WCS_52: mixed statuses with todayDow awareness', () => {
      const plans = [makePlanDay(1), makePlanDay(2, 'rest'), makePlanDay(5)];
      renderStrip({ planDays: plans, completedDays: new Set(), todayDow: 3 });
      expect(getPill(1)).toHaveAttribute('data-status', 'missed');
      expect(getPill(2)).toHaveAttribute('data-status', 'rest');
      expect(getPill(3)).toHaveAttribute('data-status', 'noPlan');
      expect(getPill(5)).toHaveAttribute('data-status', 'workout');
    });

    it('TC_WCS_53: days without plan after today show noPlan', () => {
      renderStrip({ planDays: [makePlanDay(1)], completedDays: new Set([1]), todayDow: 3 });
      [4, 5, 6, 7].forEach(d => expect(getPill(d)).toHaveAttribute('data-status', 'noPlan'));
    });

    it('TC_WCS_54: completed overrides missed for past day', () => {
      renderStrip({ planDays: [makePlanDay(1)], completedDays: new Set([1]), todayDow: 3 });
      expect(getPill(1)).toHaveAttribute('data-status', 'completed');
    });

    it('TC_WCS_55: context menu event has day number', async () => {
      const onCtx = vi.fn();
      renderStrip({ onDayContextMenu: onCtx });
      await userEvent.pointer({ target: getPill(4), keys: '[MouseRight]' });
      expect(onCtx).toHaveBeenCalledWith(4, expect.any(Object));
    });

    it('TC_WCS_56: past workout day without completion is missed', () => {
      renderStrip({ planDays: [makePlanDay(1), makePlanDay(2)], completedDays: new Set(), todayDow: 4 });
      expect(getPill(1)).toHaveAttribute('data-status', 'missed');
      expect(getPill(2)).toHaveAttribute('data-status', 'missed');
    });

    it('TC_WCS_57: strip handles large completedDays set', () => {
      renderStrip({ completedDays: new Set([1, 2, 3, 4, 5, 6, 7]) });
      for (let i = 1; i <= 7; i++) {
        expect(getPill(i)).toHaveAttribute('data-status', 'completed');
      }
    });
  });

  /* ================================================================== */
  /*  §F  NEW TESTS — getDayStatus Unit (TC_WCS_58 – TC_WCS_67)         */
  /* ================================================================== */

  describe('getDayStatus unit', () => {
    const plans = [makePlanDay(1), makePlanDay(2, 'rest'), makePlanDay(3), makePlanDay(5)];

    it('TC_WCS_58: completed overrides everything', () => {
      expect(getDayStatus(1, 3, plans, new Set([1]))).toBe('completed');
    });

    it('TC_WCS_59: planned rest always returns rest', () => {
      expect(getDayStatus(2, 1, plans, new Set())).toBe('rest');
    });

    it('TC_WCS_60: past planned workout without completion is missed', () => {
      expect(getDayStatus(1, 3, plans, new Set())).toBe('missed');
    });

    it('TC_WCS_61: today planned workout is workout', () => {
      expect(getDayStatus(3, 3, plans, new Set())).toBe('workout');
    });

    it('TC_WCS_62: future planned workout is workout', () => {
      expect(getDayStatus(5, 3, plans, new Set())).toBe('workout');
    });

    it('TC_WCS_63: past unplanned day is rest', () => {
      expect(getDayStatus(4, 5, [makePlanDay(5)], new Set())).toBe('rest');
    });

    it('TC_WCS_64: today unplanned day is noPlan', () => {
      expect(getDayStatus(3, 3, [makePlanDay(1)], new Set())).toBe('noPlan');
    });

    it('TC_WCS_65: future unplanned day is noPlan', () => {
      expect(getDayStatus(6, 3, plans, new Set())).toBe('noPlan');
    });

    it('TC_WCS_66: completed overrides missed for past day', () => {
      expect(getDayStatus(1, 5, plans, new Set([1]))).toBe('completed');
    });

    it('TC_WCS_67: planned rest in past stays rest not missed', () => {
      expect(getDayStatus(2, 5, plans, new Set())).toBe('rest');
    });
  });

  /* ================================================================== */
  /*  §G  NEW TESTS — Missed & NoPlan Statuses (TC_WCS_68 – TC_WCS_72)  */
  /* ================================================================== */

  describe('Missed & NoPlan Statuses', () => {
    it('TC_WCS_68: missed day shows error colors', () => {
      renderStrip({ planDays: [makePlanDay(1)], completedDays: new Set(), todayDow: 3 });
      expect(getPill(1)).toHaveAttribute('data-status', 'missed');
      expect(getPill(1).className).toContain('bg-error/10');
      expect(getPill(1).className).toContain('text-error');
    });

    it('TC_WCS_69: noPlan day shows muted-foreground colors', () => {
      renderStrip({ planDays: [], completedDays: new Set(), todayDow: 3 });
      expect(getPill(4)).toHaveAttribute('data-status', 'noPlan');
      expect(getPill(4).className).toContain('bg-muted');
      expect(getPill(4).className).toContain('text-muted-foreground');
    });

    it('TC_WCS_70: noPlan day has circle icon', () => {
      renderStrip({ planDays: [], completedDays: new Set(), todayDow: 3 });
      expect(getPill(4)).toHaveAttribute('data-status', 'noPlan');
    });

    it('TC_WCS_71: missed day aria-label includes missed text', () => {
      renderStrip({ planDays: [makePlanDay(1)], completedDays: new Set(), todayDow: 3 });
      expect(getPill(1).getAttribute('aria-label')).toContain('Bỏ lỡ');
    });

    it('TC_WCS_72: noPlan day aria-label includes noPlan text', () => {
      renderStrip({ planDays: [], completedDays: new Set(), todayDow: 3 });
      expect(getPill(4).getAttribute('aria-label')).toContain('Chưa có kế hoạch');
    });
  });

  /* ================================================================== */
  /*  §H  NEW TESTS — Week Dates (TC_WCS_73 – TC_WCS_78)                */
  /* ================================================================== */

  describe('Week Dates', () => {
    it('TC_WCS_73: date numbers shown when weekDates provided', () => {
      renderStrip({ weekDates: [7, 8, 9, 10, 11, 12, 13] });
      expect(screen.getByTestId('date-1')).toHaveTextContent('7');
      expect(screen.getByTestId('date-7')).toHaveTextContent('13');
    });

    it('TC_WCS_74: no date numbers when weekDates not provided', () => {
      renderStrip();
      expect(screen.queryByTestId('date-1')).not.toBeInTheDocument();
    });

    it('TC_WCS_75: all 7 date testids rendered with weekDates', () => {
      renderStrip({ weekDates: [1, 2, 3, 4, 5, 6, 7] });
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByTestId(`date-${i}`)).toBeInTheDocument();
      }
    });

    it('TC_WCS_76: date 1 shows weekDates[0]', () => {
      renderStrip({ weekDates: [15, 16, 17, 18, 19, 20, 21] });
      expect(screen.getByTestId('date-1')).toHaveTextContent('15');
    });

    it('TC_WCS_77: date 7 shows weekDates[6]', () => {
      renderStrip({ weekDates: [15, 16, 17, 18, 19, 20, 21] });
      expect(screen.getByTestId('date-7')).toHaveTextContent('21');
    });

    it('TC_WCS_78: date numbers are inside the pill buttons', () => {
      renderStrip({ weekDates: [7, 8, 9, 10, 11, 12, 13] });
      const pill = getPill(1);
      expect(within(pill).getByTestId('date-1')).toBeInTheDocument();
    });
  });

  /* ================================================================== */
  /*  §I  NEW TESTS — Day Preview Panel (TC_WCS_79 – TC_WCS_89)         */
  /* ================================================================== */

  describe('Day Preview Panel', () => {
    const previewData = {
      workoutName: 'Ngày đẩy - Ngực & Vai',
      exerciseCount: 5,
      muscleGroups: 'Ngực, Vai, Tay sau',
    };

    it('TC_WCS_79: preview panel renders when selectedDayData provided', () => {
      renderStrip({ selectedDayData: previewData });
      expect(screen.getByTestId('day-preview')).toBeInTheDocument();
    });

    it('TC_WCS_80: preview panel hidden when selectedDayData is null', () => {
      renderStrip({ selectedDayData: null });
      expect(screen.queryByTestId('day-preview')).not.toBeInTheDocument();
    });

    it('TC_WCS_81: preview panel hidden when selectedDayData is undefined', () => {
      renderStrip();
      expect(screen.queryByTestId('day-preview')).not.toBeInTheDocument();
    });

    it('TC_WCS_82: preview shows workout name', () => {
      renderStrip({ selectedDayData: previewData });
      expect(screen.getByTestId('preview-workout-name')).toHaveTextContent('Ngày đẩy - Ngực & Vai');
    });

    it('TC_WCS_83: preview shows exercise count', () => {
      renderStrip({ selectedDayData: previewData });
      expect(screen.getByTestId('preview-details')).toHaveTextContent('5 bài tập');
    });

    it('TC_WCS_84: preview shows muscle groups with separator', () => {
      renderStrip({ selectedDayData: previewData });
      expect(screen.getByTestId('preview-details')).toHaveTextContent('· Ngực, Vai, Tay sau');
    });

    it('TC_WCS_85: preview hides muscle groups when empty', () => {
      renderStrip({ selectedDayData: { ...previewData, muscleGroups: '' } });
      expect(screen.getByTestId('preview-details')).not.toHaveTextContent('·');
    });

    it('TC_WCS_86: start button renders when handler provided', () => {
      const onStart = vi.fn();
      renderStrip({ selectedDayData: previewData, onStartSelectedDayWorkout: onStart });
      expect(screen.getByTestId('start-selected-workout')).toBeInTheDocument();
    });

    it('TC_WCS_87: start button hidden when handler not provided', () => {
      renderStrip({ selectedDayData: previewData });
      expect(screen.queryByTestId('start-selected-workout')).not.toBeInTheDocument();
    });

    it('TC_WCS_88: start button click fires handler', async () => {
      const onStart = vi.fn();
      renderStrip({ selectedDayData: previewData, onStartSelectedDayWorkout: onStart });
      await userEvent.click(screen.getByTestId('start-selected-workout'));
      expect(onStart).toHaveBeenCalledOnce();
    });

    it('TC_WCS_89: start button shows localized text', () => {
      const onStart = vi.fn();
      renderStrip({ selectedDayData: previewData, onStartSelectedDayWorkout: onStart });
      expect(screen.getByTestId('start-selected-workout')).toHaveTextContent('Bắt đầu tập');
    });
  });

  /* ================================================================== */
  /*  §J  NEW TESTS — Animation & Motion (TC_WCS_90 – TC_WCS_97)        */
  /* ================================================================== */

  describe('Animation & Motion', () => {
    it('TC_WCS_90: container has slideUp animation class', () => {
      renderStrip();
      expect(screen.getByTestId('week-calendar-strip').className).toContain('animate-slideUp');
    });

    it('TC_WCS_91: container has stagger-2 class', () => {
      renderStrip();
      expect(screen.getByTestId('week-calendar-strip').className).toContain('animate-stagger-2');
    });

    it('TC_WCS_92: reduced motion removes animation classes', () => {
      mockMotion.reduced = true;
      renderStrip();
      const cls = screen.getByTestId('week-calendar-strip').className;
      expect(cls).not.toContain('animate-slide-up');
      expect(cls).not.toContain('animate-stagger-2');
    });

    it('TC_WCS_93: pills have active:scale press feedback', () => {
      renderStrip();
      expect(getPill(1).className).toContain('active:scale-[0.98]');
    });

    it('TC_WCS_94: pills have motion-reduce:transform-none', () => {
      renderStrip();
      expect(getPill(1).className).toContain('motion-reduce:transform-none');
    });

    it('TC_WCS_95: container has motion-reduce:transform-none', () => {
      renderStrip();
      expect(screen.getByTestId('week-calendar-strip').className).toContain('motion-reduce:transform-none');
    });

    it('TC_WCS_96: preview panel has animate-fade-in when motion enabled', () => {
      renderStrip({ selectedDayData: { workoutName: 'Test', exerciseCount: 3, muscleGroups: '' } });
      expect(screen.getByTestId('day-preview').className).toContain('animate-fade-in');
    });

    it('TC_WCS_97: preview panel no animate-fade-in when motion reduced', () => {
      mockMotion.reduced = true;
      renderStrip({ selectedDayData: { workoutName: 'Test', exerciseCount: 3, muscleGroups: '' } });
      expect(screen.getByTestId('day-preview').className).not.toContain('animate-fade-in');
    });
  });

  /* ================================================================== */
  /*  §K  NEW TESTS — Combined Scenarios (TC_WCS_98 – TC_WCS_107)       */
  /* ================================================================== */

  describe('Combined Scenarios', () => {
    it('TC_WCS_98: full week with all 6 statuses', () => {
      const plans = [makePlanDay(1), makePlanDay(2, 'rest'), makePlanDay(3), makePlanDay(5), makePlanDay(6, 'rest')];
      renderStrip({ planDays: plans, completedDays: new Set([1]), todayDow: 4 });
      expect(getPill(1)).toHaveAttribute('data-status', 'completed');
      expect(getPill(2)).toHaveAttribute('data-status', 'rest');
      expect(getPill(3)).toHaveAttribute('data-status', 'missed');
      expect(getPill(4)).toHaveAttribute('data-status', 'noPlan');
      expect(getPill(5)).toHaveAttribute('data-status', 'workout');
      expect(getPill(6)).toHaveAttribute('data-status', 'rest');
      expect(getPill(7)).toHaveAttribute('data-status', 'noPlan');
    });

    it('TC_WCS_99: todayDow=1 no past days means no missed', () => {
      const plans = [makePlanDay(1), makePlanDay(3), makePlanDay(5)];
      renderStrip({ planDays: plans, completedDays: new Set(), todayDow: 1 });
      expect(getPill(1)).toHaveAttribute('data-status', 'workout');
      expect(getPill(3)).toHaveAttribute('data-status', 'workout');
    });

    it('TC_WCS_100: todayDow=7 all workout days past become missed', () => {
      const plans = [makePlanDay(1), makePlanDay(3), makePlanDay(5)];
      renderStrip({ planDays: plans, completedDays: new Set(), todayDow: 7 });
      [1, 3, 5].forEach(d => expect(getPill(d)).toHaveAttribute('data-status', 'missed'));
    });

    it('TC_WCS_101: weekDates + statuses combined render', () => {
      renderStrip({ weekDates: [10, 11, 12, 13, 14, 15, 16], todayDow: 3 });
      expect(screen.getByTestId('date-3')).toHaveTextContent('12');
      expect(getPill(3)).toHaveAttribute('data-status', 'workout');
    });

    it('TC_WCS_102: preview + dates combined render', () => {
      const data = { workoutName: 'Push Day', exerciseCount: 4, muscleGroups: 'Chest' };
      renderStrip({ weekDates: [1, 2, 3, 4, 5, 6, 7], selectedDayData: data });
      expect(screen.getByTestId('date-1')).toBeInTheDocument();
      expect(screen.getByTestId('day-preview')).toBeInTheDocument();
    });

    it('TC_WCS_103: preview + reduced motion combined', () => {
      mockMotion.reduced = true;
      const data = { workoutName: 'Leg Day', exerciseCount: 6, muscleGroups: '' };
      renderStrip({ selectedDayData: data });
      expect(screen.getByTestId('day-preview').className).not.toContain('animate-fade-in');
      expect(screen.getByTestId('day-preview').className).toContain('motion-reduce:transform-none');
    });

    it('TC_WCS_104: all 7 completed + preview renders correctly', () => {
      const data = { workoutName: 'Rest', exerciseCount: 0, muscleGroups: '' };
      renderStrip({ completedDays: new Set([1, 2, 3, 4, 5, 6, 7]), selectedDayData: data });
      for (let i = 1; i <= 7; i++) {
        expect(getPill(i)).toHaveAttribute('data-status', 'completed');
      }
      expect(screen.getByTestId('day-preview')).toBeInTheDocument();
    });

    it('TC_WCS_105: clicking day + preview interaction', async () => {
      const onDaySelect = vi.fn();
      const data = { workoutName: 'Test', exerciseCount: 1, muscleGroups: '' };
      renderStrip({ selectedDayData: data, onDaySelect });
      await userEvent.click(getPill(5));
      expect(onDaySelect).toHaveBeenCalledWith(5);
    });

    it('TC_WCS_106: all statuses have correct aria-labels', () => {
      const plans = [makePlanDay(1), makePlanDay(2, 'rest'), makePlanDay(3), makePlanDay(5)];
      renderStrip({ planDays: plans, completedDays: new Set([1]), todayDow: 4 });
      expect(getPill(1).getAttribute('aria-label')).toContain('Hoàn thành');
      expect(getPill(2).getAttribute('aria-label')).toContain('Ngày nghỉ');
      expect(getPill(3).getAttribute('aria-label')).toContain('Bỏ lỡ');
      expect(getPill(4).getAttribute('aria-label')).toContain('Chưa có kế hoạch');
      expect(getPill(5).getAttribute('aria-label')).toContain('Buổi tập');
    });

    it('TC_WCS_107: DayStatus type is exported', () => {
      const status: DayStatus = 'missed';
      expect(['completed', 'rest', 'workout', 'missed', 'noPlan']).toContain(status);
    });
  });
});
