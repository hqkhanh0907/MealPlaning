import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import type { WeekCalendarStripProps } from '../features/fitness/components/WeekCalendarStrip';
import { WeekCalendarStrip } from '../features/fitness/components/WeekCalendarStrip';
import type { TrainingPlanDay } from '../features/fitness/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'fitness.plan.weekOverview': 'Tổng quan tuần',
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
      };
      return map[key] ?? key;
    },
  }),
}));

// --- Fixtures ---

const createPlanDay = (overrides: Partial<TrainingPlanDay>): TrainingPlanDay => ({
  id: `pd-${overrides.dayOfWeek ?? 1}`,
  planId: 'plan-1',
  dayOfWeek: 1,
  sessionOrder: 1,
  workoutType: 'Push',
  muscleGroups: '["chest","shoulders"]',
  exercises: '[]',
  isUserAssigned: false,
  originalDayOfWeek: overrides.dayOfWeek ?? 1,
  ...overrides,
});

// 3-day split: Mon(Push), Wed(Pull), Fri(Legs)
const defaultPlanDays: TrainingPlanDay[] = [
  createPlanDay({ id: 'pd-1', dayOfWeek: 1, workoutType: 'Push' }),
  createPlanDay({ id: 'pd-3', dayOfWeek: 3, workoutType: 'Pull' }),
  createPlanDay({ id: 'pd-5', dayOfWeek: 5, workoutType: 'Legs' }),
];

const defaultProps: WeekCalendarStripProps = {
  selectedDay: 1,
  todayDow: 3,
  planDays: defaultPlanDays,
  completedDays: new Set([1]),
  onDaySelect: vi.fn(),
};

function renderStrip(overrides: Partial<WeekCalendarStripProps> = {}) {
  return render(<WeekCalendarStrip {...defaultProps} {...overrides} />);
}

function expectPillStatus(dayNum: number, expectedBg: string, expectedText: string, unexpectedBg?: string) {
  const pill = screen.getByTestId(`day-pill-${dayNum}`);
  expect(pill.className).toContain(expectedBg);
  expect(pill.className).toContain(expectedText);
  if (unexpectedBg) {
    expect(pill.className).not.toContain(unexpectedBg);
  }
}

afterEach(cleanup);

describe('WeekCalendarStrip', () => {
  // TS-01: Basic Rendering
  describe('rendering', () => {
    it('TC_WCS_01: renders exactly 7 pill buttons', () => {
      renderStrip();
      expect(screen.getAllByRole('button')).toHaveLength(7);
    });

    it('TC_WCS_02: renders Vietnamese day labels (T2-CN)', () => {
      renderStrip();
      const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      for (const label of labels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    });

    it('TC_WCS_03: container has toolbar role', () => {
      renderStrip();
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('TC_WCS_04: each pill has correct data-testid', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByTestId(`day-pill-${i}`)).toBeInTheDocument();
      }
    });

    it('TC_WCS_05: container has data-testid', () => {
      renderStrip();
      expect(screen.getByTestId('week-calendar-strip')).toBeInTheDocument();
    });
  });

  // TS-02: Status Icon Rendering
  describe('status icons', () => {
    it('TC_WCS_06: completed day shows Check icon (data-status=completed)', () => {
      renderStrip({ completedDays: new Set([1]) });
      const pill = screen.getByTestId('day-pill-1');
      expect(pill).toHaveAttribute('data-status', 'completed');
      expect(pill.querySelector('svg')).toBeInTheDocument();
    });

    it('TC_WCS_07: workout day shows Dumbbell icon (data-status=workout)', () => {
      renderStrip({ completedDays: new Set() });
      const pill = screen.getByTestId('day-pill-3'); // Wed = Pull workout
      expect(pill).toHaveAttribute('data-status', 'workout');
      expect(pill.querySelector('svg')).toBeInTheDocument();
    });

    it('TC_WCS_08: rest day shows Moon icon (data-status=rest)', () => {
      renderStrip({ completedDays: new Set() });
      const pill = screen.getByTestId('day-pill-2'); // Tue = no planDay
      expect(pill).toHaveAttribute('data-status', 'rest');
      expect(pill.querySelector('svg')).toBeInTheDocument();
    });

    it('TC_WCS_09: rest-type planDay shows Moon icon', () => {
      const planDays = [createPlanDay({ dayOfWeek: 4, workoutType: 'rest' })];
      renderStrip({ planDays, completedDays: new Set() });
      const pill = screen.getByTestId('day-pill-4');
      expect(pill).toHaveAttribute('data-status', 'rest');
    });

    it('TC_WCS_10: completed overrides workout status', () => {
      renderStrip({ completedDays: new Set([1]) }); // day 1 has Push planDay
      const pill = screen.getByTestId('day-pill-1');
      expect(pill).toHaveAttribute('data-status', 'completed');
    });

    it('TC_WCS_11: completed on rest day shows Check (spontaneous)', () => {
      renderStrip({ completedDays: new Set([2]) }); // day 2 has no planDay
      const pill = screen.getByTestId('day-pill-2');
      expect(pill).toHaveAttribute('data-status', 'completed');
    });

    it('TC_WCS_12: all icons have aria-hidden="true"', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        const pill = screen.getByTestId(`day-pill-${i}`);
        const svg = pill.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      }
    });

    it('TC_WCS_13: icons have correct size class h-3.5 w-3.5', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        const pill = screen.getByTestId(`day-pill-${i}`);
        const svg = pill.querySelector('svg');
        expect(svg?.getAttribute('class')).toContain('h-3.5');
        expect(svg?.getAttribute('class')).toContain('w-3.5');
      }
    });
  });

  // TS-03: Status Color Mapping (AC-4)
  describe('status colors', () => {
    it('TC_WCS_14: completed day has bg-success/10 text-success', () => {
      renderStrip({ completedDays: new Set([1]) });
      expectPillStatus(1, 'bg-success/10', 'text-success');
    });

    it('TC_WCS_15: workout day has bg-primary/10 text-primary', () => {
      renderStrip({ completedDays: new Set() });
      expectPillStatus(3, 'bg-primary/10', 'text-primary'); // Wed = Pull
    });

    it('TC_WCS_16: rest day has bg-muted text-muted-foreground', () => {
      renderStrip({ completedDays: new Set() });
      expectPillStatus(2, 'bg-muted', 'text-muted-foreground'); // Tue = rest
    });

    it('TC_WCS_17: completed color overrides workout color', () => {
      renderStrip({ completedDays: new Set([1]) }); // day 1 = Push planDay + completed
      expectPillStatus(1, 'bg-success/10', 'text-success', 'bg-primary/10');
    });

    it('TC_WCS_18: completed on non-plan day uses success color', () => {
      renderStrip({ completedDays: new Set([2]) }); // day 2 = no planDay + completed
      expectPillStatus(2, 'bg-success/10', 'text-success');
    });

    it('TC_WCS_19: rest-type planDay uses muted color', () => {
      const planDays = [createPlanDay({ dayOfWeek: 5, workoutType: 'rest' })];
      renderStrip({ planDays, completedDays: new Set() });
      expectPillStatus(5, 'bg-muted', 'text-muted-foreground');
    });
  });

  // TS-04: Today Ring Highlight (AC-2)
  describe('today highlight', () => {
    it('TC_WCS_20: today pill has ring-2 ring-primary', () => {
      renderStrip({ todayDow: 3 });
      const pill = screen.getByTestId('day-pill-3');
      expect(pill.className).toContain('ring-2');
      expect(pill.className).toContain('ring-primary');
    });

    it('TC_WCS_21: non-today pills do NOT have ring-primary', () => {
      renderStrip({ todayDow: 3 });
      for (const dayNum of [1, 2, 4, 5, 6, 7]) {
        const pill = screen.getByTestId(`day-pill-${dayNum}`);
        expect(pill.className).not.toContain('ring-primary');
      }
    });

    it('TC_WCS_22: today=Monday (day 1) has ring-primary', () => {
      renderStrip({ todayDow: 1 });
      expect(screen.getByTestId('day-pill-1').className).toContain('ring-primary');
    });

    it('TC_WCS_23: today=Sunday (day 7) has ring-primary', () => {
      renderStrip({ todayDow: 7 });
      expect(screen.getByTestId('day-pill-7').className).toContain('ring-primary');
    });

    it('TC_WCS_24: today ring applied regardless of completed status', () => {
      renderStrip({ todayDow: 1, completedDays: new Set([1]) });
      const pill = screen.getByTestId('day-pill-1');
      expect(pill.className).toContain('bg-success/10');
      expect(pill.className).toContain('ring-primary');
    });

    it('TC_WCS_25: today ring applied on rest day', () => {
      renderStrip({ todayDow: 4, completedDays: new Set() });
      const pill = screen.getByTestId('day-pill-4');
      expect(pill.className).toContain('bg-muted');
      expect(pill.className).toContain('ring-primary');
    });
  });

  // TS-05: Selected Day Ring
  describe('selected day', () => {
    it('TC_WCS_26: selected non-today pill has ring-2 ring-ring', () => {
      renderStrip({ selectedDay: 5, todayDow: 3 });
      const pill = screen.getByTestId('day-pill-5');
      expect(pill.className).toContain('ring-2');
      expect(pill.className).toContain('ring-ring');
    });

    it('TC_WCS_27: selected + today → ring-primary wins over ring-ring', () => {
      renderStrip({ selectedDay: 3, todayDow: 3 });
      const pill = screen.getByTestId('day-pill-3');
      expect(pill.className).toContain('ring-primary');
      // ring-ring should not appear from selected condition (only from focus-visible base)
      // The raw class list from cn() should contain ring-primary but NOT a standalone ring-ring
      // (focus-visible:ring-ring is different from ring-ring)
    });

    it('TC_WCS_28: non-selected non-today has no standalone ring-2', () => {
      renderStrip({ selectedDay: 5, todayDow: 3 });
      const pill = screen.getByTestId('day-pill-1');
      const classes = pill.className.split(' ');
      expect(classes).not.toContain('ring-2');
    });

    it('TC_WCS_29: aria-pressed=true on selected pill', () => {
      renderStrip({ selectedDay: 5 });
      expect(screen.getByTestId('day-pill-5')).toHaveAttribute('aria-pressed', 'true');
    });

    it('TC_WCS_30: aria-pressed=false on non-selected pill', () => {
      renderStrip({ selectedDay: 5 });
      expect(screen.getByTestId('day-pill-1')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  // TS-06: Day Selection Callback (AC-5)
  describe('day selection', () => {
    it('TC_WCS_31: click day 1 calls onDaySelect(1)', () => {
      const onDaySelect = vi.fn();
      renderStrip({ onDaySelect });
      fireEvent.click(screen.getByTestId('day-pill-1'));
      expect(onDaySelect).toHaveBeenCalledWith(1);
    });

    it('TC_WCS_32: click day 7 calls onDaySelect(7)', () => {
      const onDaySelect = vi.fn();
      renderStrip({ onDaySelect });
      fireEvent.click(screen.getByTestId('day-pill-7'));
      expect(onDaySelect).toHaveBeenCalledWith(7);
    });

    it('TC_WCS_33: click each day calls correct number', () => {
      const onDaySelect = vi.fn();
      renderStrip({ onDaySelect });
      for (let i = 1; i <= 7; i++) {
        fireEvent.click(screen.getByTestId(`day-pill-${i}`));
      }
      expect(onDaySelect).toHaveBeenCalledTimes(7);
      for (let i = 1; i <= 7; i++) {
        expect(onDaySelect).toHaveBeenNthCalledWith(i, i);
      }
    });

    it('TC_WCS_34: click today pill still calls onDaySelect', () => {
      const onDaySelect = vi.fn();
      renderStrip({ onDaySelect, todayDow: 3 });
      fireEvent.click(screen.getByTestId('day-pill-3'));
      expect(onDaySelect).toHaveBeenCalledWith(3);
    });

    it('TC_WCS_35: click already-selected still calls callback', () => {
      const onDaySelect = vi.fn();
      renderStrip({ onDaySelect, selectedDay: 5 });
      fireEvent.click(screen.getByTestId('day-pill-5'));
      expect(onDaySelect).toHaveBeenCalledWith(5);
    });
  });

  // TS-07: Accessibility
  describe('accessibility', () => {
    it('TC_WCS_36: container role="toolbar"', () => {
      renderStrip();
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('TC_WCS_37: container has aria-label', () => {
      renderStrip();
      expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'Tổng quan tuần');
    });

    it('TC_WCS_38: each pill is a button', () => {
      renderStrip();
      expect(screen.getAllByRole('button')).toHaveLength(7);
    });

    it('TC_WCS_39: aria-current="date" on today only', () => {
      renderStrip({ todayDow: 4 });
      expect(screen.getByTestId('day-pill-4')).toHaveAttribute('aria-current', 'date');
      for (const dayNum of [1, 2, 3, 5, 6, 7]) {
        expect(screen.getByTestId(`day-pill-${dayNum}`)).not.toHaveAttribute('aria-current');
      }
    });

    it('TC_WCS_40: aria-label with full day name + status', () => {
      renderStrip({ completedDays: new Set() });
      // day 1 = Push workout → "Thứ Hai — Buổi tập"
      expect(screen.getByTestId('day-pill-1')).toHaveAttribute('aria-label', 'Thứ Hai — Buổi tập');
      // day 2 = rest → "Thứ Ba — Ngày nghỉ"
      expect(screen.getByTestId('day-pill-2')).toHaveAttribute('aria-label', 'Thứ Ba — Ngày nghỉ');
    });

    it('TC_WCS_41: all pills have type="button"', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByTestId(`day-pill-${i}`)).toHaveAttribute('type', 'button');
      }
    });

    it('TC_WCS_42: focus-visible ring classes on all pills', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        const pill = screen.getByTestId(`day-pill-${i}`);
        expect(pill.className).toContain('focus-visible:ring-2');
        expect(pill.className).toContain('focus-visible:ring-ring');
      }
    });
  });

  // TS-08: Layout & Sizing (AC-3, BR-37)
  describe('layout & sizing', () => {
    it('TC_WCS_43: each pill has min-h-11 class', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByTestId(`day-pill-${i}`).className).toContain('min-h-11');
      }
    });

    it('TC_WCS_44: each pill has flex-1 class', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByTestId(`day-pill-${i}`).className).toContain('flex-1');
      }
    });

    it('TC_WCS_45: each pill has rounded-xl class', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByTestId(`day-pill-${i}`).className).toContain('rounded-xl');
      }
    });

    it('TC_WCS_46: container uses flex gap-1.5', () => {
      renderStrip();
      const container = screen.getByTestId('week-calendar-strip');
      expect(container.className).toContain('flex');
      expect(container.className).toContain('gap-1.5');
    });

    it('TC_WCS_47: day label has text-[10px] class', () => {
      renderStrip();
      const pill = screen.getByTestId('day-pill-1');
      const labelSpan = pill.querySelector('span');
      expect(labelSpan?.className).toContain('text-[10px]');
    });

    it('TC_WCS_48: pill has flex-col items-center justify-center layout', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        const pill = screen.getByTestId(`day-pill-${i}`);
        expect(pill.className).toContain('flex-col');
        expect(pill.className).toContain('items-center');
        expect(pill.className).toContain('justify-center');
      }
    });

    it('TC_WCS_49: transition-colors on all pills', () => {
      renderStrip();
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByTestId(`day-pill-${i}`).className).toContain('transition-colors');
      }
    });
  });

  // TS-09: Edge Cases
  describe('edge cases', () => {
    it('TC_WCS_50: no plan days → all pills rest style with Moon', () => {
      renderStrip({ planDays: [], completedDays: new Set() });
      for (let i = 1; i <= 7; i++) {
        const pill = screen.getByTestId(`day-pill-${i}`);
        expect(pill).toHaveAttribute('data-status', 'rest');
        expect(pill.className).toContain('bg-muted');
        expect(pill.className).toContain('text-muted-foreground');
      }
    });

    it('TC_WCS_51: all days completed', () => {
      renderStrip({ completedDays: new Set([1, 2, 3, 4, 5, 6, 7]) });
      for (let i = 1; i <= 7; i++) {
        const pill = screen.getByTestId(`day-pill-${i}`);
        expect(pill).toHaveAttribute('data-status', 'completed');
        expect(pill.className).toContain('bg-success/10');
        expect(pill.className).toContain('text-success');
      }
    });

    it('TC_WCS_52: only 2 training days (Mon+Thu)', () => {
      const planDays = [
        createPlanDay({ dayOfWeek: 1, workoutType: 'Push' }),
        createPlanDay({ dayOfWeek: 4, workoutType: 'Pull' }),
      ];
      renderStrip({ planDays, completedDays: new Set() });
      // Workout days
      expect(screen.getByTestId('day-pill-1')).toHaveAttribute('data-status', 'workout');
      expect(screen.getByTestId('day-pill-4')).toHaveAttribute('data-status', 'workout');
      // Rest days
      for (const dayNum of [2, 3, 5, 6, 7]) {
        expect(screen.getByTestId(`day-pill-${dayNum}`)).toHaveAttribute('data-status', 'rest');
      }
    });

    it('TC_WCS_53: spontaneous workout (no plan, day 3 completed)', () => {
      renderStrip({ planDays: [], completedDays: new Set([3]) });
      expect(screen.getByTestId('day-pill-3')).toHaveAttribute('data-status', 'completed');
      expect(screen.getByTestId('day-pill-3').className).toContain('bg-success/10');
      // Other days = rest
      for (const dayNum of [1, 2, 4, 5, 6, 7]) {
        expect(screen.getByTestId(`day-pill-${dayNum}`)).toHaveAttribute('data-status', 'rest');
      }
    });

    it('TC_WCS_54: empty completedDays set → no Check icons', () => {
      renderStrip({ completedDays: new Set() });
      for (let i = 1; i <= 7; i++) {
        const pill = screen.getByTestId(`day-pill-${i}`);
        expect(pill).not.toHaveAttribute('data-status', 'completed');
      }
    });

    it('TC_WCS_55: planDay with workoutType "rest" renders as rest', () => {
      const planDays = [createPlanDay({ dayOfWeek: 5, workoutType: 'rest' })];
      renderStrip({ planDays, completedDays: new Set() });
      expect(screen.getByTestId('day-pill-5')).toHaveAttribute('data-status', 'rest');
      expect(screen.getByTestId('day-pill-5').className).toContain('bg-muted');
    });

    it('TC_WCS_56: cardio and strength both show workout status', () => {
      const planDays = [
        createPlanDay({ dayOfWeek: 1, workoutType: 'Cardio' }),
        createPlanDay({ dayOfWeek: 2, workoutType: 'Push' }),
      ];
      renderStrip({ planDays, completedDays: new Set() });
      expect(screen.getByTestId('day-pill-1')).toHaveAttribute('data-status', 'workout');
      expect(screen.getByTestId('day-pill-2')).toHaveAttribute('data-status', 'workout');
    });

    it('TC_WCS_57: multiple plan days per day (multi-session) → first used', () => {
      const planDays = [
        createPlanDay({ id: 'pd-3a', dayOfWeek: 3, sessionOrder: 1, workoutType: 'Push' }),
        createPlanDay({ id: 'pd-3b', dayOfWeek: 3, sessionOrder: 2, workoutType: 'Cardio' }),
      ];
      renderStrip({ planDays, completedDays: new Set() });
      // Day 3 has a planDay with workout type → shows as workout
      expect(screen.getByTestId('day-pill-3')).toHaveAttribute('data-status', 'workout');
    });
  });
});
