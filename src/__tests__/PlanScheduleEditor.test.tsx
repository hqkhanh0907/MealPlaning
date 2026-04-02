import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanScheduleEditor } from '../features/fitness/components/PlanScheduleEditor';
import type { TrainingPlan, TrainingPlanDay } from '../features/fitness/types';
import { useFitnessStore } from '../store/fitnessStore';

/* ---------- i18n mock ---------- */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'fitness.scheduleEditor.title': 'Chỉnh sửa lịch tập',
        'fitness.scheduleEditor.stepDays': 'Chọn ngày tập',
        'fitness.scheduleEditor.stepAssignment': 'Phân công bài tập',
        'fitness.scheduleEditor.autoAssign': 'Tự động sắp xếp',
        'fitness.scheduleEditor.restoreOriginal': 'Khôi phục gốc',
        'fitness.scheduleEditor.save': 'Lưu thay đổi',
        'fitness.scheduleEditor.saved': 'Đã lưu lịch tập',
        'fitness.scheduleEditor.unsavedWarning': 'Bạn có thay đổi chưa lưu. Bạn có muốn thoát không?',
        'fitness.scheduleEditor.minDaysError': 'Cần ít nhất 2 ngày tập',
        'fitness.scheduleEditor.maxDaysError': 'Tối đa 6 ngày tập',
        'fitness.scheduleEditor.unassignedWarning': 'Còn bài tập chưa được phân công',
        'fitness.scheduleEditor.emptyPlan': 'Chưa có kế hoạch tập',
        'fitness.scheduleEditor.emptyPlanCta': 'Tạo kế hoạch tập mới',
        'fitness.scheduleEditor.weeklyCalendar': 'Lịch tuần',
        'fitness.scheduleEditor.monday': 'T2',
        'fitness.scheduleEditor.tuesday': 'T3',
        'fitness.scheduleEditor.wednesday': 'T4',
        'fitness.scheduleEditor.thursday': 'T5',
        'fitness.scheduleEditor.friday': 'T6',
        'fitness.scheduleEditor.saturday': 'T7',
        'fitness.scheduleEditor.sunday': 'CN',
        'fitness.scheduleEditor.mondayFull': 'Thứ Hai',
        'fitness.scheduleEditor.tuesdayFull': 'Thứ Ba',
        'fitness.scheduleEditor.wednesdayFull': 'Thứ Tư',
        'fitness.scheduleEditor.thursdayFull': 'Thứ Năm',
        'fitness.scheduleEditor.fridayFull': 'Thứ Sáu',
        'fitness.scheduleEditor.saturdayFull': 'Thứ Bảy',
        'fitness.scheduleEditor.sundayFull': 'Chủ Nhật',
        'fitness.scheduleEditor.trainingDay': 'Ngày tập',
        'fitness.scheduleEditor.restDay': 'Ngày nghỉ',
        'fitness.scheduleEditor.noWorkouts': 'Không có bài tập nào',
        'fitness.scheduleEditor.moveUp': 'Di chuyển lên',
        'fitness.scheduleEditor.moveDown': 'Di chuyển xuống',
        'fitness.scheduleEditor.reassignDay': 'Đổi ngày',
        'fitness.scheduleEditor.selectDay': 'Chọn ngày tập',
        'fitness.scheduleEditor.sessionsCount': '{{count}} buổi',
        'fitness.scheduleEditor.maxSessions': 'Đã đầy (tối đa 3 buổi)',
        'common.back': 'Quay lại',
        'common.confirm': 'Xác nhận',
        'common.cancel': 'Hủy',
      };
      return map[key] ?? key;
    },
  }),
}));

/* ---------- navigation store mock ---------- */
const mockPopPage = vi.fn();
vi.mock('../store/navigationStore', () => ({
  useNavigationStore: () => ({ popPage: mockPopPage }),
}));

/* ---------- notification mock ---------- */
const mockNotify = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  dismiss: vi.fn(),
  dismissAll: vi.fn(),
};
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

/* ---------- fitness store mock ---------- */
const mockUpdateTrainingDays = vi.fn();
const mockAutoAssignWorkouts = vi.fn();
const mockRestoreOriginalSchedule = vi.fn();
const mockReassignWorkoutToDay = vi.fn();

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

/* ---------- child component mocks ---------- */
vi.mock('../features/fitness/components/WeeklyCalendarStrip', () => ({
  WeeklyCalendarStrip: ({
    trainingDays,
    onDayToggle,
    interactive,
  }: {
    trainingDays: number[];
    onDayToggle?: (day: number) => void;
    interactive?: boolean;
  }) => (
    <div data-testid="weekly-calendar-strip" data-interactive={String(interactive)}>
      <span data-testid="training-days-display">{JSON.stringify(trainingDays)}</span>
      {onDayToggle && (
        <>
          <button data-testid="toggle-day-1" onClick={() => onDayToggle(1)}>
            Toggle 1
          </button>
          <button data-testid="toggle-day-5" onClick={() => onDayToggle(5)}>
            Toggle 5
          </button>
          <button data-testid="toggle-day-7" onClick={() => onDayToggle(7)}>
            Toggle 7
          </button>
        </>
      )}
    </div>
  ),
}));

vi.mock('../features/fitness/components/WorkoutAssignmentList', () => ({
  WorkoutAssignmentList: ({
    planDays,
    onReassign,
  }: {
    planDays: { id: string }[];
    trainingDays: number[];
    onReorder?: (from: number, to: number) => void;
    onReassign?: (dayId: string) => void;
  }) => (
    <div data-testid="workout-assignment-list">
      <span data-testid="plan-days-count">{planDays.length}</span>
      {onReassign &&
        planDays.map(d => (
          <button key={d.id} data-testid={`reassign-${d.id}`} onClick={() => onReassign(d.id)}>
            Reassign {d.id}
          </button>
        ))}
    </div>
  ),
}));

vi.mock('../features/fitness/components/DayAssignmentSheet', () => ({
  DayAssignmentSheet: ({
    open,
    onSelectDay,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
    trainingDays: number[];
    currentDay: number;
    onSelectDay: (day: number) => void;
    existingDayCounts?: Record<number, number>;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="day-assignment-sheet">
        <button data-testid="sheet-select-day-3" onClick={() => onSelectDay(3)}>
          Select Day 3
        </button>
        <button data-testid="sheet-close" onClick={onClose}>
          Close
        </button>
      </div>
    );
  },
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="modal-backdrop" onClick={onClose}>
      {children}
    </div>
  ),
}));

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

/* ---------- helpers ---------- */
const PLAN_ID = 'plan-1';

const makePlan = (overrides?: Partial<TrainingPlan>): TrainingPlan => ({
  id: PLAN_ID,
  name: 'Test Plan',
  status: 'active',
  splitType: 'ppl',
  durationWeeks: 8,
  currentWeek: 1,
  startDate: '2025-01-01',
  trainingDays: [1, 3, 5],
  restDays: [2, 4, 6, 7],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const makePlanDay = (id: string, dow: number): TrainingPlanDay => ({
  id,
  planId: PLAN_ID,
  dayOfWeek: dow,
  sessionOrder: 1,
  workoutType: `Workout ${id}`,
  muscleGroups: 'chest',
  isUserAssigned: false,
  originalDayOfWeek: dow,
});

function setupStoreMock(plan: TrainingPlan | undefined, planDays: TrainingPlanDay[]) {
  (useFitnessStore as unknown as Mock).mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      trainingPlans: plan ? [plan] : [],
      trainingPlanDays: planDays,
    }),
  );

  (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(() => ({
    trainingPlans: plan ? [plan] : [],
    trainingPlanDays: planDays,
    updateTrainingDays: mockUpdateTrainingDays,
    autoAssignWorkouts: mockAutoAssignWorkouts,
    restoreOriginalSchedule: mockRestoreOriginalSchedule,
    reassignWorkoutToDay: mockReassignWorkoutToDay,
  }));
}

/* ---------- lifecycle ---------- */
beforeEach(() => {
  mockPopPage.mockReset();
  mockNotify.success.mockReset();
  mockNotify.warning.mockReset();
  mockNotify.error.mockReset();
  mockUpdateTrainingDays.mockReset();
  mockAutoAssignWorkouts.mockReset();
  mockRestoreOriginalSchedule.mockReset();
  mockReassignWorkoutToDay.mockReset();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/* ================================================================ */
/*                        TEST SUITES                               */
/* ================================================================ */

describe('PlanScheduleEditor', () => {
  describe('Header', () => {
    it('renders header with back button and title', () => {
      setupStoreMock(makePlan(), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      expect(screen.getByText('Chỉnh sửa lịch tập')).toBeInTheDocument();

      const backBtn = screen.getByTestId('back-button');
      expect(backBtn).toBeInTheDocument();
      expect(backBtn).toHaveAttribute('aria-label', 'Quay lại');
    });

    it('back button calls popPage when no changes', () => {
      setupStoreMock(makePlan(), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      fireEvent.click(screen.getByTestId('back-button'));
      expect(mockPopPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('WeeklyCalendarStrip (Step 1)', () => {
    it('renders WeeklyCalendarStrip in interactive mode', () => {
      setupStoreMock(makePlan(), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      const strip = screen.getByTestId('weekly-calendar-strip');
      expect(strip).toBeInTheDocument();
      expect(strip).toHaveAttribute('data-interactive', 'true');
    });

    it('passes current training days to calendar strip', () => {
      setupStoreMock(makePlan({ trainingDays: [1, 3, 5] }), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      expect(screen.getByTestId('training-days-display')).toHaveTextContent('[1,3,5]');
    });
  });

  describe('WorkoutAssignmentList (Step 2)', () => {
    it('renders WorkoutAssignmentList with plan days', () => {
      const days = [makePlanDay('d1', 1), makePlanDay('d2', 3)];
      setupStoreMock(makePlan(), days);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      expect(screen.getByTestId('workout-assignment-list')).toBeInTheDocument();
      expect(screen.getByTestId('plan-days-count')).toHaveTextContent('2');
    });
  });

  describe('Auto-assign button', () => {
    it('calls store autoAssignWorkouts on click', () => {
      setupStoreMock(makePlan(), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      fireEvent.click(screen.getByTestId('auto-assign-button'));
      expect(mockAutoAssignWorkouts).toHaveBeenCalledWith(PLAN_ID);
    });

    it('displays auto-assign label', () => {
      setupStoreMock(makePlan(), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      expect(screen.getByText('Tự động sắp xếp')).toBeInTheDocument();
    });
  });

  describe('Restore button', () => {
    it('calls store restoreOriginalSchedule on click', () => {
      setupStoreMock(makePlan(), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      fireEvent.click(screen.getByTestId('restore-button'));
      expect(mockRestoreOriginalSchedule).toHaveBeenCalledWith(PLAN_ID);
    });

    it('displays restore label', () => {
      setupStoreMock(makePlan(), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      expect(screen.getByText('Khôi phục gốc')).toBeInTheDocument();
    });
  });

  describe('Save button', () => {
    it('is disabled when no changes made', () => {
      setupStoreMock(makePlan(), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      expect(screen.getByTestId('save-button')).toBeDisabled();
    });

    it('is enabled after toggling a day', () => {
      setupStoreMock(makePlan({ trainingDays: [1, 3, 5] }), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      // Toggle day 7 to add it (currently 3 days, below max)
      fireEvent.click(screen.getByTestId('toggle-day-7'));
      expect(screen.getByTestId('save-button')).not.toBeDisabled();
    });

    it('is enabled after auto-assign', () => {
      setupStoreMock(makePlan(), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      fireEvent.click(screen.getByTestId('auto-assign-button'));
      expect(screen.getByTestId('save-button')).not.toBeDisabled();
    });

    it('calls updateTrainingDays and shows success toast on save', () => {
      const days = [makePlanDay('d1', 1), makePlanDay('d2', 3)];
      setupStoreMock(makePlan({ trainingDays: [1, 3, 5] }), days);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      // Make a change first: toggle day 7
      fireEvent.click(screen.getByTestId('toggle-day-7'));
      fireEvent.click(screen.getByTestId('save-button'));

      expect(mockUpdateTrainingDays).toHaveBeenCalledWith(PLAN_ID, [1, 3, 5, 7]);
      expect(mockNotify.success).toHaveBeenCalledWith('Đã lưu lịch tập');
      expect(mockPopPage).toHaveBeenCalledTimes(1);
    });

    it('displays save label', () => {
      setupStoreMock(makePlan(), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      expect(screen.getByText('Lưu thay đổi')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state when plan not found', () => {
      setupStoreMock(undefined, []);
      render(<PlanScheduleEditor planId="nonexistent" />);

      expect(screen.getByTestId('empty-plan-state')).toBeInTheDocument();
      expect(screen.getByText('Chưa có kế hoạch tập')).toBeInTheDocument();
      expect(screen.getByText('Tạo kế hoạch tập mới')).toBeInTheDocument();
    });

    it('shows back button in empty state', () => {
      setupStoreMock(undefined, []);
      render(<PlanScheduleEditor planId="nonexistent" />);

      const backBtn = screen.getByTestId('back-button');
      expect(backBtn).toBeInTheDocument();
      fireEvent.click(backBtn);
      expect(mockPopPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation: unassigned workouts', () => {
    it('shows warning when workouts are on non-training days', () => {
      // Plan has training days [1, 3], but day d3 is assigned to dow 5 (not a training day)
      const days = [makePlanDay('d1', 1), makePlanDay('d2', 3), makePlanDay('d3', 5)];
      setupStoreMock(makePlan({ trainingDays: [1, 3] }), days);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      expect(screen.getByTestId('unassigned-warning')).toBeInTheDocument();
      expect(screen.getByText('Còn bài tập chưa được phân công')).toBeInTheDocument();
    });

    it('does not show warning when all workouts are on training days', () => {
      const days = [makePlanDay('d1', 1), makePlanDay('d2', 3)];
      setupStoreMock(makePlan({ trainingDays: [1, 3, 5] }), days);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      expect(screen.queryByTestId('unassigned-warning')).not.toBeInTheDocument();
    });

    it('prevents save and warns when unassigned workouts exist', () => {
      const days = [makePlanDay('d1', 1), makePlanDay('d3', 5)];
      setupStoreMock(makePlan({ trainingDays: [1, 3] }), days);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      // Make dirty, then attempt save
      fireEvent.click(screen.getByTestId('auto-assign-button'));
      fireEvent.click(screen.getByTestId('save-button'));

      expect(mockNotify.warning).toHaveBeenCalledWith('Còn bài tập chưa được phân công');
      expect(mockUpdateTrainingDays).not.toHaveBeenCalled();
      expect(mockPopPage).not.toHaveBeenCalled();
    });
  });

  describe('Dirty state / unsaved changes warning', () => {
    it('shows confirmation dialog on back when dirty', () => {
      setupStoreMock(makePlan({ trainingDays: [1, 3, 5] }), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      // Make a change
      fireEvent.click(screen.getByTestId('toggle-day-7'));
      fireEvent.click(screen.getByTestId('back-button'));

      // Confirm dialog should appear
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByText('Bạn có thay đổi chưa lưu. Bạn có muốn thoát không?')).toBeInTheDocument();
    });

    it('confirm discard navigates back', () => {
      setupStoreMock(makePlan({ trainingDays: [1, 3, 5] }), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      fireEvent.click(screen.getByTestId('toggle-day-7'));
      fireEvent.click(screen.getByTestId('back-button'));
      fireEvent.click(screen.getByTestId('confirm-discard'));

      expect(mockPopPage).toHaveBeenCalledTimes(1);
    });

    it('cancel discard stays on page', () => {
      setupStoreMock(makePlan({ trainingDays: [1, 3, 5] }), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      fireEvent.click(screen.getByTestId('toggle-day-7'));
      fireEvent.click(screen.getByTestId('back-button'));
      fireEvent.click(screen.getByTestId('cancel-discard'));

      expect(mockPopPage).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Day reassignment', () => {
    it('opens DayAssignmentSheet when reassign is clicked', () => {
      const days = [makePlanDay('d1', 1)];
      setupStoreMock(makePlan(), days);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      expect(screen.queryByTestId('day-assignment-sheet')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('reassign-d1'));
      expect(screen.getByTestId('day-assignment-sheet')).toBeInTheDocument();
    });

    it('calls reassignWorkoutToDay when day is selected in sheet', () => {
      const days = [makePlanDay('d1', 1)];
      setupStoreMock(makePlan(), days);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      fireEvent.click(screen.getByTestId('reassign-d1'));
      fireEvent.click(screen.getByTestId('sheet-select-day-3'));

      expect(mockReassignWorkoutToDay).toHaveBeenCalledWith('d1', 3);
    });

    it('closes sheet when close is clicked', () => {
      const days = [makePlanDay('d1', 1)];
      setupStoreMock(makePlan(), days);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      fireEvent.click(screen.getByTestId('reassign-d1'));
      expect(screen.getByTestId('day-assignment-sheet')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('sheet-close'));
      expect(screen.queryByTestId('day-assignment-sheet')).not.toBeInTheDocument();
    });
  });

  describe('Min/Max day enforcement', () => {
    it('shows warning when trying to remove below min days', () => {
      // Only 2 training days — toggling one off should trigger min warning
      setupStoreMock(makePlan({ trainingDays: [1, 3] }), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      fireEvent.click(screen.getByTestId('toggle-day-1'));
      expect(mockNotify.warning).toHaveBeenCalledWith('Cần ít nhất 2 ngày tập');
    });

    it('shows warning when trying to add beyond max days', () => {
      setupStoreMock(makePlan({ trainingDays: [1, 2, 3, 4, 5, 6] }), []);
      render(<PlanScheduleEditor planId={PLAN_ID} />);

      fireEvent.click(screen.getByTestId('toggle-day-7'));
      expect(mockNotify.warning).toHaveBeenCalledWith('Tối đa 6 ngày tập');
    });
  });

  describe('Restore resets dirty state', () => {
    it('restore resets isDirty and syncs local training days', () => {
      const plan = makePlan({ trainingDays: [1, 3, 5] });
      setupStoreMock(plan, []);

      // After restore, getState returns same plan
      (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(() => ({
        trainingPlans: [plan],
        trainingPlanDays: [],
        updateTrainingDays: mockUpdateTrainingDays,
        autoAssignWorkouts: mockAutoAssignWorkouts,
        restoreOriginalSchedule: mockRestoreOriginalSchedule,
        reassignWorkoutToDay: mockReassignWorkoutToDay,
      }));

      render(<PlanScheduleEditor planId={PLAN_ID} />);

      // Dirty via auto-assign
      fireEvent.click(screen.getByTestId('auto-assign-button'));
      expect(screen.getByTestId('save-button')).not.toBeDisabled();

      // Restore
      fireEvent.click(screen.getByTestId('restore-button'));
      expect(mockRestoreOriginalSchedule).toHaveBeenCalledWith(PLAN_ID);
      expect(screen.getByTestId('save-button')).toBeDisabled();
    });
  });
});
