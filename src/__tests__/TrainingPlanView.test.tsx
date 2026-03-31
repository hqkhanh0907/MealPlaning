import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { TrainingPlanView } from '../features/fitness/components/TrainingPlanView';
import { useFitnessStore } from '../store/fitnessStore';
import { useNavigationStore } from '../store/navigationStore';
import type { Mock } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, optionsOrFallback?: string | Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'fitness.plan.todayWorkout': 'Buổi tập hôm nay',
        'fitness.plan.startWorkout': 'Bắt đầu',
        'fitness.plan.restDay': 'Ngày nghỉ',
        'fitness.plan.restDayTip1': '🚶 Đi bộ 20 phút',
        'fitness.plan.restDayTip2': '💧 Uống đủ 2L nước',
        'fitness.plan.restDayTip3': '🥩 Đạt đủ protein',
        'fitness.plan.noPlan': 'Chưa có kế hoạch tập luyện',
        'fitness.plan.createPlan': 'Tạo kế hoạch',
        'fitness.plan.manualEmpty': 'Bạn đã chọn tự lên kế hoạch',
        'fitness.plan.manualEmptyDesc': 'Hãy bắt đầu bằng cách tạo buổi tập đầu tiên cho tuần này.',
        'fitness.plan.createFirstWorkout': 'Tạo buổi tập đầu tiên',
        'fitness.plan.exercises': 'bài tập',
        'fitness.plan.minutes': 'phút',
        'fitness.plan.tomorrow': 'Ngày mai',
        'fitness.plan.logWeight': '📝 Log cân nặng',
        'fitness.plan.logLightCardio': '🏃 Log cardio nhẹ',
        'fitness.onboarding.muscle_chest': 'Ngực',
        'fitness.onboarding.muscle_back': 'Lưng',
        'fitness.onboarding.muscle_shoulders': 'Vai',
        'fitness.onboarding.muscle_legs': 'Chân',
        'fitness.onboarding.muscle_arms': 'Tay',
        'fitness.onboarding.muscle_core': 'Cơ trung tâm',
        'fitness.onboarding.muscle_glutes': 'Mông',
        'fitness.plan.regenerateConfirm': 'Bạn có chắc muốn tạo lại kế hoạch? Kế hoạch hiện tại sẽ bị thay thế.',
        'fitness.plan.regenerate': 'Tạo lại kế hoạch',
        'fitness.plan.addWorkout': 'Thêm buổi tập',
        'fitness.plan.convertToRest': 'Chuyển thành ngày nghỉ',
        'fitness.plan.convertToRestConfirm': 'Xóa tất cả buổi tập trong ngày này?',
        'fitness.plan.dayContextMenu': 'Tùy chọn ngày',
        'fitness.plan.planExpired': 'Kế hoạch đã hết hạn',
        'fitness.plan.planExpiredMessage': 'Kế hoạch tập luyện của bạn đã hết hạn.',
        'fitness.plan.createNewCycle': 'Tạo chu kỳ mới',
        'fitness.plan.generating': 'Đang tạo...',
        'fitness.plan.modified': 'Đã chỉnh sửa',
        'fitness.plan.editExercises': 'Chỉnh sửa bài tập',
        'fitness.plan.restore': 'Khôi phục',
        'fitness.plan.setsLabel': 'hiệp',
        'fitness.plan.repsLabel': 'lần',
        'fitness.plan.coachingHint': 'Nhấn giữ hoặc nhấp chuột phải vào ngày để xem tùy chọn',
        'fitness.plan.moreExercises': '+{{remaining}} bài tập nữa',
        'fitness.plan.showLess': 'Thu gọn',
        'common.dismiss': 'Bỏ qua',
      };
      const template = translations[key];
      if (template && typeof optionsOrFallback === 'object' && optionsOrFallback !== null) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String((optionsOrFallback as Record<string, unknown>)[k] ?? ''));
      }
      if (template) return template;
      if (typeof optionsOrFallback === 'string') return optionsOrFallback;
      return key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../store/navigationStore', () => ({
  useNavigationStore: vi.fn(),
}));

vi.mock('../features/fitness/components/DailyWeightInput', () => ({
  DailyWeightInput: () => <div data-testid="daily-weight-input" />,
}));

vi.mock('../features/fitness/components/StreakCounter', () => ({
  StreakCounter: () => <div data-testid="streak-counter" />,
}));

vi.mock('../features/fitness/components/SessionTabs', () => ({
  SessionTabs: (props: { sessions: Array<{ id: string }>; activeSessionId: string; onSelectSession: (id: string) => void; onAddSession: () => void; onDeleteSession?: (dayId: string) => void }) => (
    <div data-testid="session-tabs" role="tablist">
      {props.sessions.map((s: { id: string }, i: number) => (
        <button key={i} role="tab" data-testid={`session-tab-${i}`} type="button" onClick={() => props.onSelectSession(s.id)} />
      ))}
      <button data-testid="add-session-tab" type="button" onClick={props.onAddSession}>+</button>
      {props.onDeleteSession && props.sessions.length > 0 && (
        <button data-testid="delete-session-btn" type="button" onClick={() => props.onDeleteSession!(props.sessions[0].id)}>Delete</button>
      )}
      <button data-testid="select-stale-session" type="button" onClick={() => props.onSelectSession('stale-nonexistent-id')}>Stale</button>
    </div>
  ),
}));

vi.mock('../features/fitness/components/AddSessionModal', () => ({
  AddSessionModal: (props: { isOpen: boolean; onClose: () => void; onSelectCardio: () => void; onSelectFreestyle: () => void; onSelectStrength: (g: string[]) => void }) => {
    if (!props.isOpen) return null;
    return (
      <div data-testid="add-session-modal">
        <button data-testid="modal-close-btn" type="button" onClick={props.onClose}>Close</button>
        <button data-testid="modal-cardio-btn" type="button" onClick={props.onSelectCardio}>Cardio</button>
        <button data-testid="modal-freestyle-btn" type="button" onClick={props.onSelectFreestyle}>Freestyle</button>
        <button data-testid="modal-strength-btn" type="button" onClick={() => props.onSelectStrength(['chest', 'back'])}>Strength</button>
      </div>
    );
  },
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../components/modals/ConfirmationModal', () => ({
  ConfirmationModal: (props: { isOpen: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void; variant?: string }) => {
    const slug = props.title.replace(/\s+/g, '-').toLowerCase();
    if (!props.isOpen) {
      return (
        <div data-testid={`closed-modal-${slug}`} style={{ display: 'none' }}>
          <button data-testid={`closed-confirm-${slug}`} type="button" onClick={props.onConfirm}>
            {props.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      );
    }
    return (
      <div data-testid="confirmation-modal">
        <span data-testid="confirmation-title">{props.title}</span>
        <span data-testid="confirmation-message">{props.message}</span>
        <button data-testid="confirmation-confirm-btn" type="button" onClick={props.onConfirm}>
          {props.confirmLabel ?? 'Confirm'}
        </button>
        <button data-testid="confirmation-cancel-btn" type="button" onClick={props.onCancel}>Cancel</button>
      </div>
    );
  },
}));

const mockUseFitnessStore = useFitnessStore as unknown as Mock & { getState: () => Record<string, unknown> };
const mockUseNavigationStore = useNavigationStore as unknown as Mock;

let mockPushPage: Mock;
let mockRestorePlanDayOriginal: Mock;
let mockAddPlanDaySession: Mock;
let mockGetActivePlan: Mock;
let mockRemovePlanDaySession: Mock;

function mockStore(state: Record<string, unknown>) {
  const stateWithDefaults = {
    workouts: [],
    workoutSets: [],
    ...state,
  };
  mockUseFitnessStore.mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) => selector(stateWithDefaults),
  );
  const storeState = {
    ...state,
    restorePlanDayOriginal: mockRestorePlanDayOriginal,
    addPlanDaySession: mockAddPlanDaySession,
    getActivePlan: mockGetActivePlan,
    removePlanDaySession: mockRemovePlanDaySession,
  };
  mockUseFitnessStore.getState = () => storeState;
}

const mockExercisesData = [
  {
    exercise: { id: 'e1', nameVi: 'Bench Press' },
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 90,
  },
  {
    exercise: { id: 'e2', nameVi: 'Shoulder Press' },
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 90,
  },
  {
    exercise: { id: 'e3', nameVi: 'Fly' },
    sets: 2,
    repsMin: 10,
    repsMax: 15,
    restSeconds: 60,
  },
];

const mockExercises = JSON.stringify(mockExercisesData);

const activePlan = {
  id: 'plan1',
  name: 'Push/Pull/Legs - hypertrophy',
  status: 'active' as const,
  splitType: 'Push/Pull/Legs',
  durationWeeks: 8,
  startDate: '2025-01-06T00:00:00.000Z',
  createdAt: '2025-01-06T00:00:00.000Z',
  updatedAt: '2025-01-06T00:00:00.000Z',
};

const planDays = [
  {
    id: 'd1',
    planId: 'plan1',
    dayOfWeek: 1,
    sessionOrder: 1,
    workoutType: 'Push',
    muscleGroups: 'chest,shoulders',
    exercises: mockExercises,
  },
  {
    id: 'd2',
    planId: 'plan1',
    dayOfWeek: 3,
    sessionOrder: 1,
    workoutType: 'Pull',
    muscleGroups: 'back,arms',
    exercises: mockExercises,
  },
  {
    id: 'd3',
    planId: 'plan1',
    dayOfWeek: 5,
    sessionOrder: 1,
    workoutType: 'Legs',
    muscleGroups: 'legs,glutes,core',
    exercises: mockExercises,
  },
  {
    id: 'd4',
    planId: 'plan1',
    dayOfWeek: 6,
    sessionOrder: 1,
    workoutType: 'Cardio',
  },
];

const defaultOnGeneratePlan = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  // Monday Jan 6, 2025 — dayOfWeek = 1
  vi.setSystemTime(new Date('2025-01-06T12:00:00'));
  mockPushPage = vi.fn();
  mockRestorePlanDayOriginal = vi.fn();
  mockAddPlanDaySession = vi.fn();
  mockGetActivePlan = vi.fn();
  mockRemovePlanDaySession = vi.fn();
  defaultOnGeneratePlan.mockReset();
  mockUseNavigationStore.mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ pushPage: mockPushPage }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('TrainingPlanView', () => {
  // --- No Plan State ---
  it('renders "no plan" state with CTA when no active plan', () => {
    mockStore({ trainingPlans: [], trainingPlanDays: [] });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.getByTestId('no-plan-cta')).toBeInTheDocument();
    expect(
      screen.getByText('Chưa có kế hoạch tập luyện'),
    ).toBeInTheDocument();
  });

  it('"Tạo kế hoạch" button calls onGeneratePlan', () => {
    mockStore({ trainingPlans: [], trainingPlanDays: [] });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    fireEvent.click(screen.getByTestId('create-plan-btn'));
    expect(defaultOnGeneratePlan).toHaveBeenCalledOnce();
  });

  it('no plan state does not render streak counter or calendar', () => {
    mockStore({ trainingPlans: [], trainingPlanDays: [] });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.queryByTestId('streak-counter')).not.toBeInTheDocument();
    expect(screen.queryByTestId('calendar-strip')).not.toBeInTheDocument();
  });

  // --- Manual Plan Empty State ---
  it('renders manual plan CTA when planStrategy is manual and no active plan', () => {
    mockStore({ trainingPlans: [], trainingPlanDays: [] });
    const mockCreateManual = vi.fn();
    render(
      <TrainingPlanView
        onGeneratePlan={defaultOnGeneratePlan}
        onCreateManualPlan={mockCreateManual}
        planStrategy="manual"
      />,
    );
    expect(screen.getByTestId('manual-plan-cta')).toBeInTheDocument();
    expect(screen.getByText('Bạn đã chọn tự lên kế hoạch')).toBeInTheDocument();
    expect(screen.getByText('Hãy bắt đầu bằng cách tạo buổi tập đầu tiên cho tuần này.')).toBeInTheDocument();
    expect(screen.getByTestId('create-manual-plan-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('no-plan-cta')).not.toBeInTheDocument();
  });

  it('"Tạo buổi tập đầu tiên" button calls onCreateManualPlan', () => {
    mockStore({ trainingPlans: [], trainingPlanDays: [] });
    const mockCreateManual = vi.fn();
    render(
      <TrainingPlanView
        onGeneratePlan={defaultOnGeneratePlan}
        onCreateManualPlan={mockCreateManual}
        planStrategy="manual"
      />,
    );
    fireEvent.click(screen.getByTestId('create-manual-plan-btn'));
    expect(mockCreateManual).toHaveBeenCalledOnce();
  });

  it('renders auto plan CTA when planStrategy is auto and no active plan', () => {
    mockStore({ trainingPlans: [], trainingPlanDays: [] });
    render(
      <TrainingPlanView
        onGeneratePlan={defaultOnGeneratePlan}
        planStrategy="auto"
      />,
    );
    expect(screen.getByTestId('no-plan-cta')).toBeInTheDocument();
    expect(screen.queryByTestId('manual-plan-cta')).not.toBeInTheDocument();
  });

  it('renders auto plan CTA when planStrategy is null', () => {
    mockStore({ trainingPlans: [], trainingPlanDays: [] });
    render(
      <TrainingPlanView
        onGeneratePlan={defaultOnGeneratePlan}
        planStrategy={null}
      />,
    );
    expect(screen.getByTestId('no-plan-cta')).toBeInTheDocument();
    expect(screen.queryByTestId('manual-plan-cta')).not.toBeInTheDocument();
  });

  it('manual plan CTA button has min-h-[44px] and focus-visible ring', () => {
    mockStore({ trainingPlans: [], trainingPlanDays: [] });
    render(
      <TrainingPlanView
        onGeneratePlan={defaultOnGeneratePlan}
        onCreateManualPlan={vi.fn()}
        planStrategy="manual"
      />,
    );
    const btn = screen.getByTestId('create-manual-plan-btn');
    expect(btn.className).toContain('min-h-[44px]');
    expect(btn.className).toContain('focus-visible:ring-2');
    expect(btn.className).toContain('focus-visible:ring-emerald-400');
  });

  // --- Calendar Strip ---
  it('renders weekly calendar strip with 7 day buttons', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.getByTestId('calendar-strip')).toBeInTheDocument();
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByTestId(`day-pill-${i}`)).toBeInTheDocument();
    }
  });

  it('today is highlighted in the strip', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    const todayPill = screen.getByTestId('day-pill-1');
    expect(todayPill).toHaveAttribute('aria-current', 'date');
    expect(todayPill.className).toContain('ring-emerald-500');
  });

  it('strength days show emerald color and cardio days show blue', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    const pushDay = screen.getByTestId('day-pill-1');
    expect(pushDay.className).toContain('bg-emerald-100');
    const cardioDay = screen.getByTestId('day-pill-6');
    expect(cardioDay.className).toContain('bg-blue-100');
  });

  it('rest days show gray color', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    const restDay = screen.getByTestId('day-pill-2');
    expect(restDay.className).toContain('bg-slate-100');
  });

  it('selected non-today day shows slate ring', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    fireEvent.click(screen.getByTestId('day-pill-3'));
    expect(screen.getByTestId('day-pill-3').className).toContain(
      'ring-slate-400',
    );
  });

  // --- Workout Card ---
  it('today workout card shows when plan exists for today', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.getByTestId('today-workout-card')).toBeInTheDocument();
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByText('Ngực, Vai')).toBeInTheDocument();
  });

  it('workout card shows exercise count and estimated duration', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    const stats = screen.getByTestId('workout-stats');
    expect(stats).toHaveTextContent('3 bài tập');
    // 3*(40+90)+30 + 3*(40+90)+30 + 2*(40+60)+30 = 1070s ≈ 18min + 5 warmup = 23
    expect(stats).toHaveTextContent('~23 phút');
  });

  it('workout card shows exercise names list', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    const exerciseList = screen.getByTestId('exercise-list');
    expect(exerciseList).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Shoulder Press')).toBeInTheDocument();
    expect(screen.getByText('Fly')).toBeInTheDocument();
  });

  it('no exercise list shown when exercises field is undefined', () => {
    mockStore({
      trainingPlans: [activePlan],
      trainingPlanDays: [
        { id: 'd1', planId: 'plan1', dayOfWeek: 1, workoutType: 'Push' },
      ],
    });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.queryByTestId('exercise-list')).not.toBeInTheDocument();
  });

  it('shows all exercises without collapse button when ≤ 3 exercises', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.getByTestId('exercise-list').children).toHaveLength(3);
    expect(screen.queryByTestId('exercise-collapse-toggle')).not.toBeInTheDocument();
  });

  it('collapses exercises to 3 with "+N bài tập nữa" when > 3 exercises', () => {
    const sixExercises = JSON.stringify([
      ...mockExercisesData,
      { exercise: { id: 'e4', nameVi: 'Dips' }, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
      { exercise: { id: 'e5', nameVi: 'Cable Fly' }, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
      { exercise: { id: 'e6', nameVi: 'Tricep Push' }, sets: 2, repsMin: 12, repsMax: 15, restSeconds: 60 },
    ]);
    mockStore({
      trainingPlans: [activePlan],
      trainingPlanDays: [{ ...planDays[0], exercises: sixExercises }],
    });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.getByTestId('exercise-list').children).toHaveLength(3);
    const toggle = screen.getByTestId('exercise-collapse-toggle');
    expect(toggle).toHaveTextContent('+3 bài tập nữa');
  });

  it('expands all exercises on toggle click and collapses back', () => {
    const sixExercises = JSON.stringify([
      ...mockExercisesData,
      { exercise: { id: 'e4', nameVi: 'Dips' }, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
      { exercise: { id: 'e5', nameVi: 'Cable Fly' }, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
      { exercise: { id: 'e6', nameVi: 'Tricep Push' }, sets: 2, repsMin: 12, repsMax: 15, restSeconds: 60 },
    ]);
    mockStore({
      trainingPlans: [activePlan],
      trainingPlanDays: [{ ...planDays[0], exercises: sixExercises }],
    });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);

    fireEvent.click(screen.getByTestId('exercise-collapse-toggle'));
    expect(screen.getByTestId('exercise-list').children).toHaveLength(6);
    expect(screen.getByTestId('exercise-collapse-toggle')).toHaveTextContent('Thu gọn');

    fireEvent.click(screen.getByTestId('exercise-collapse-toggle'));
    expect(screen.getByTestId('exercise-list').children).toHaveLength(3);
  });

  it('does not show exercise list or collapse button when exercises is empty', () => {
    mockStore({
      trainingPlans: [activePlan],
      trainingPlanDays: [{ ...planDays[0], exercises: '[]' }],
    });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.queryByTestId('exercise-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exercise-collapse-toggle')).not.toBeInTheDocument();
  });

  it('"Bắt đầu" button calls pushPage with workout plan day', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    fireEvent.click(screen.getByTestId('start-workout-btn'));
    expect(mockPushPage).toHaveBeenCalledWith({
      id: 'workout-logger',
      component: 'WorkoutLogger',
      props: { planDay: planDays[0] },
    });
  });

  it('start workout passes plan day even when exercises is undefined', () => {
    const dayWithoutExercises = {
      id: 'd1',
      planId: 'plan1',
      dayOfWeek: 1,
      workoutType: 'Push',
    };
    mockStore({
      trainingPlans: [activePlan],
      trainingPlanDays: [dayWithoutExercises],
    });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    fireEvent.click(screen.getByTestId('start-workout-btn'));
    expect(mockPushPage).toHaveBeenCalledWith({
      id: 'workout-logger',
      component: 'WorkoutLogger',
      props: { planDay: dayWithoutExercises },
    });
  });

  // --- Rest Day Card ---
  it('rest day card shows recovery tips', () => {
    // Tuesday Jan 7, 2025 — dayOfWeek = 2, a rest day
    vi.setSystemTime(new Date('2025-01-07T12:00:00'));
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.getByTestId('rest-day-card')).toBeInTheDocument();
    expect(screen.getByText('Ngày nghỉ')).toBeInTheDocument();
    expect(screen.getByText(/Đi bộ 20 phút/)).toBeInTheDocument();
    expect(screen.getByText(/Uống đủ 2L nước/)).toBeInTheDocument();
    expect(screen.getByText(/Đạt đủ protein/)).toBeInTheDocument();
  });

  it('rest day shows tomorrow preview when tomorrow has a workout', () => {
    // Tuesday → tomorrow is Wednesday (day 3) which has "Pull"
    vi.setSystemTime(new Date('2025-01-07T12:00:00'));
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    const preview = screen.getByTestId('tomorrow-preview');
    expect(preview).toHaveTextContent('Ngày mai');
    expect(preview).toHaveTextContent('Pull');
    expect(preview).toHaveTextContent('3 bài tập');
  });

  it('rest day hides tomorrow preview when tomorrow has no workout', () => {
    // Tuesday → tomorrow is Wednesday (day 3), but we exclude day 3 from plan
    vi.setSystemTime(new Date('2025-01-07T12:00:00'));
    mockStore({
      trainingPlans: [activePlan],
      trainingPlanDays: [
        {
          id: 'd1',
          planId: 'plan1',
          dayOfWeek: 1,
          workoutType: 'Push',
          exercises: mockExercises,
        },
        {
          id: 'd5',
          planId: 'plan1',
          dayOfWeek: 5,
          workoutType: 'Legs',
          exercises: mockExercises,
        },
      ],
    });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.getByTestId('rest-day-card')).toBeInTheDocument();
    expect(screen.queryByTestId('tomorrow-preview')).not.toBeInTheDocument();
  });

  it('rest day shows quick action chips', () => {
    vi.setSystemTime(new Date('2025-01-07T12:00:00'));
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    expect(screen.getByTestId('quick-log-weight')).toBeInTheDocument();
    expect(screen.getByTestId('quick-log-cardio')).toBeInTheDocument();
  });

  // --- Day Selection ---
  it('tapping a day shows that day workout info', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    // Initially Monday (today) — shows "Push"
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByTestId('start-workout-btn')).toBeInTheDocument();
    // Click Wednesday (day 3) — shows "Pull" without CTA
    fireEvent.click(screen.getByTestId('day-pill-3'));
    expect(screen.getByText('Pull')).toBeInTheDocument();
    expect(screen.queryByTestId('start-workout-btn')).not.toBeInTheDocument();
  });

  it('tapping selected day deselects and returns to today', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    fireEvent.click(screen.getByTestId('day-pill-3'));
    expect(screen.getByText('Pull')).toBeInTheDocument();
    // Click again to deselect — back to today (Monday, Push)
    fireEvent.click(screen.getByTestId('day-pill-3'));
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByTestId('start-workout-btn')).toBeInTheDocument();
  });

  it('tapping a rest day shows rest day card without quick actions', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    // Click Tuesday (day 2) — a rest day, not today
    fireEvent.click(screen.getByTestId('day-pill-2'));
    expect(screen.getByTestId('rest-day-card')).toBeInTheDocument();
    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tomorrow-preview')).not.toBeInTheDocument();
  });

  it('shows day label in header when viewing another day', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    // Initially shows "Buổi tập hôm nay"
    expect(screen.getByTestId('workout-card-header')).toHaveTextContent(
      'Buổi tập hôm nay',
    );
    // Select Wednesday (day 3) — header shows "T4"
    fireEvent.click(screen.getByTestId('day-pill-3'));
    expect(screen.getByTestId('workout-card-header')).toHaveTextContent('T4');
  });

  // --- Edge Cases ---
  it('handles workout day without muscle groups', () => {
    // Saturday Jan 11, 2025 — dayOfWeek = 6, Cardio day (no muscleGroups)
    vi.setSystemTime(new Date('2025-01-11T12:00:00'));
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.getByTestId('today-workout-card')).toBeInTheDocument();
    expect(screen.getByText('Cardio')).toBeInTheDocument();
  });

  it('handles invalid exercises JSON gracefully', () => {
    mockStore({
      trainingPlans: [activePlan],
      trainingPlanDays: [
        {
          id: 'd1',
          planId: 'plan1',
          dayOfWeek: 1,
          workoutType: 'Push',
          exercises: 'invalid-json',
        },
      ],
    });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    const stats = screen.getByTestId('workout-stats');
    expect(stats).toHaveTextContent('0 bài tập');
    expect(stats).toHaveTextContent('~0 phút');
  });

  it('renders correctly on Sunday (dayOfWeek = 7)', () => {
    // Sunday Jan 12, 2025 — JS getDay() = 0, mapped to dayOfWeek = 7
    vi.setSystemTime(new Date('2025-01-12T12:00:00'));
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    // Sunday is dayOfWeek 7, no plan day → rest day card
    expect(screen.getByTestId('rest-day-card')).toBeInTheDocument();
    const sundayPill = screen.getByTestId('day-pill-7');
    expect(sundayPill).toHaveAttribute('aria-current', 'date');
  });

  it('Sunday rest day shows Monday as tomorrow preview', () => {
    // getTomorrowDow(7) → 1 (Monday), which has "Push"
    vi.setSystemTime(new Date('2025-01-12T12:00:00'));
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    const preview = screen.getByTestId('tomorrow-preview');
    expect(preview).toHaveTextContent('Push');
  });

  // --- Sub-components ---
  it('StreakCounter is rendered when plan exists', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.getByTestId('streak-counter')).toBeInTheDocument();
  });

  it('DailyWeightInput is rendered at bottom', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    expect(screen.getByTestId('daily-weight-input')).toBeInTheDocument();
  });

  // --- Multi-session & Edit ---
  describe('multi-session', () => {
    const multiSessionDays = [
      {
        id: 'ms1',
        planId: 'plan1',
        dayOfWeek: 1,
        sessionOrder: 1,
        workoutType: 'Push',
        muscleGroups: 'chest,shoulders',
        exercises: mockExercises,
        originalExercises: mockExercises,
      },
      {
        id: 'ms2',
        planId: 'plan1',
        dayOfWeek: 1,
        sessionOrder: 2,
        workoutType: 'Cardio',
        muscleGroups: '',
        exercises: '[]',
        originalExercises: '[]',
      },
      {
        id: 'ms3',
        planId: 'plan1',
        dayOfWeek: 3,
        sessionOrder: 1,
        workoutType: 'Pull',
        muscleGroups: 'back,arms',
        exercises: mockExercises,
        originalExercises: mockExercises,
      },
    ];

    it('renders SessionTabs when a day has 2+ sessions', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: multiSessionDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('session-tabs')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders SessionTabs with add button even for single-session day', () => {
      // Wednesday has only 1 session - should still show SessionTabs with "+" button
      vi.setSystemTime(new Date('2025-01-08T12:00:00'));
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: multiSessionDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('session-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('add-session-tab')).toBeInTheDocument();
    });
  });

  describe('edit button', () => {
    it('click edit button calls pushPage with PlanDayEditor', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.click(screen.getByTestId('edit-exercises-btn'));
      expect(mockPushPage).toHaveBeenCalledWith({
        id: 'plan-day-editor',
        component: 'PlanDayEditor',
        props: { planDay: planDays[0] },
      });
    });
  });

  describe('modified badge & restore', () => {
    const modifiedExercises = JSON.stringify([
      {
        exercise: { id: 'e1', nameVi: 'Bench Press' },
        sets: 4,
        repsMin: 6,
        repsMax: 8,
        restSeconds: 120,
      },
    ]);

    it('shows "Đã chỉnh sửa" badge when exercises differ from originalExercises', () => {
      mockStore({
        trainingPlans: [activePlan],
        trainingPlanDays: [
          {
            id: 'd1',
            planId: 'plan1',
            dayOfWeek: 1,
            sessionOrder: 1,
            workoutType: 'Push',
            muscleGroups: 'chest',
            exercises: modifiedExercises,
            originalExercises: mockExercises,
          },
        ],
      });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('modified-badge')).toBeInTheDocument();
    });

    it('does not show modified badge when exercises equal originalExercises', () => {
      mockStore({
        trainingPlans: [activePlan],
        trainingPlanDays: [
          {
            id: 'd1',
            planId: 'plan1',
            dayOfWeek: 1,
            sessionOrder: 1,
            workoutType: 'Push',
            muscleGroups: 'chest',
            exercises: mockExercises,
            originalExercises: mockExercises,
          },
        ],
      });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.queryByTestId('modified-badge')).not.toBeInTheDocument();
    });

    it('does not show modified badge when originalExercises is undefined', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.queryByTestId('modified-badge')).not.toBeInTheDocument();
    });

    it('clicking restore button calls restorePlanDayOriginal', () => {
      mockStore({
        trainingPlans: [activePlan],
        trainingPlanDays: [
          {
            id: 'd1',
            planId: 'plan1',
            dayOfWeek: 1,
            sessionOrder: 1,
            workoutType: 'Push',
            muscleGroups: 'chest',
            exercises: modifiedExercises,
            originalExercises: mockExercises,
          },
        ],
      });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.click(screen.getByTestId('restore-original-btn'));
      expect(mockRestorePlanDayOriginal).toHaveBeenCalledWith('d1');
    });
  });

  describe('AddSessionModal integration', () => {
    it('does not render modal by default', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.queryByTestId('add-session-modal')).not.toBeInTheDocument();
    });
  });

  // --- Regenerate Plan Button ---
  describe('regenerate plan', () => {
    it('shows regenerate button when plan is active', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('regenerate-plan-btn')).toBeInTheDocument();
      expect(screen.getByTestId('regenerate-plan-btn')).toHaveTextContent('Tạo lại kế hoạch');
    });

    it('clicking regenerate shows confirmation modal', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('regenerate-plan-btn'));
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(screen.getByTestId('confirmation-message')).toHaveTextContent(
        'Bạn có chắc muốn tạo lại kế hoạch?',
      );
    });

    it('confirming regenerate calls onGeneratePlan', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.click(screen.getByTestId('regenerate-plan-btn'));
      fireEvent.click(screen.getByTestId('confirmation-confirm-btn'));
      expect(defaultOnGeneratePlan).toHaveBeenCalledOnce();
      expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
    });

    it('cancelling regenerate does not call onGeneratePlan', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.click(screen.getByTestId('regenerate-plan-btn'));
      fireEvent.click(screen.getByTestId('confirmation-cancel-btn'));
      expect(defaultOnGeneratePlan).not.toHaveBeenCalled();
      expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
    });
  });

  // --- Day Context Menu ---
  describe('day context menu', () => {
    it('right-click on workout day shows "convert to rest" option', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-1'));
      expect(screen.getByTestId('day-context-menu')).toBeInTheDocument();
      expect(screen.getByTestId('ctx-convert-rest')).toBeInTheDocument();
    });

    it('right-click on rest day shows "add workout" option', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      // Day 2 is a rest day (no plan day)
      fireEvent.contextMenu(screen.getByTestId('day-pill-2'));
      expect(screen.getByTestId('day-context-menu')).toBeInTheDocument();
      expect(screen.getByTestId('ctx-add-workout')).toBeInTheDocument();
    });

    it('clicking "add workout" on rest day opens AddSessionModal', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-2'));
      fireEvent.click(screen.getByTestId('ctx-add-workout'));
      expect(screen.queryByTestId('day-context-menu')).not.toBeInTheDocument();
      expect(screen.getByTestId('add-session-modal')).toBeInTheDocument();
    });

    it('clicking "convert to rest" shows confirmation then removes sessions', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-1'));
      fireEvent.click(screen.getByTestId('ctx-convert-rest'));
      // Context menu closes, confirmation modal opens
      expect(screen.queryByTestId('day-context-menu')).not.toBeInTheDocument();
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(screen.getByTestId('confirmation-title')).toHaveTextContent('Chuyển thành ngày nghỉ');
      // Confirm removal
      fireEvent.click(screen.getByTestId('confirmation-confirm-btn'));
      expect(mockRemovePlanDaySession).toHaveBeenCalledWith('d1');
    });

    it('cancelling "convert to rest" does not remove sessions', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-1'));
      fireEvent.click(screen.getByTestId('ctx-convert-rest'));
      fireEvent.click(screen.getByTestId('confirmation-cancel-btn'));
      expect(mockRemovePlanDaySession).not.toHaveBeenCalled();
    });
  });

  // --- Touch Target Compliance ---
  describe('touch targets', () => {
    it('day pill buttons have min-h-[44px] class', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      const pill = screen.getByTestId('day-pill-1');
      expect(pill.className).toContain('min-h-[44px]');
    });

    it('edit button has min-h-[44px] and min-w-[44px]', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      const btn = screen.getByTestId('edit-exercises-btn');
      expect(btn.className).toContain('min-h-[44px]');
      expect(btn.className).toContain('min-w-[44px]');
    });

    it('quick action buttons have min-h-[44px]', () => {
      vi.setSystemTime(new Date('2025-01-07T12:00:00'));
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('quick-log-weight').className).toContain('min-h-[44px]');
      expect(screen.getByTestId('quick-log-cardio').className).toContain('min-h-[44px]');
    });

    it('regenerate button has min-h-[44px]', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('regenerate-plan-btn').className).toContain('min-h-[44px]');
    });

    it('context menu convert-to-rest button has min-h-[44px]', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-1'));
      expect(screen.getByTestId('ctx-convert-rest').className).toContain('min-h-[44px]');
    });

    it('context menu add-workout button has min-h-[44px]', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-2'));
      expect(screen.getByTestId('ctx-add-workout').className).toContain('min-h-[44px]');
    });

    it('restore button has min-h-[44px] and min-w-[44px]', () => {
      const modifiedExercises = JSON.stringify([
        { exercise: { id: 'e1', nameVi: 'Bench Press' }, sets: 4, repsMin: 6, repsMax: 8, restSeconds: 120 },
      ]);
      mockStore({
        trainingPlans: [activePlan],
        trainingPlanDays: [{
          id: 'd1', planId: 'plan1', dayOfWeek: 1, sessionOrder: 1,
          workoutType: 'Push', muscleGroups: 'chest',
          exercises: modifiedExercises, originalExercises: mockExercises,
        }],
      });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      const btn = screen.getByTestId('restore-original-btn');
      expect(btn.className).toContain('min-h-[44px]');
      expect(btn.className).toContain('min-w-[44px]');
    });
  });

  // --- Plan Expired State ---
  describe('plan expired state', () => {
    const expiredPlan = {
      ...activePlan,
      endDate: '2025-01-05T00:00:00.000Z',
    };

    it('renders expired CTA when plan endDate is in the past', () => {
      mockStore({ trainingPlans: [expiredPlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('plan-expired-cta')).toBeInTheDocument();
      expect(screen.getByTestId('create-new-cycle-btn')).toBeInTheDocument();
      expect(screen.queryByTestId('today-workout-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('calendar-strip')).not.toBeInTheDocument();
    });

    it('create-new-cycle button calls onGeneratePlan', () => {
      mockStore({ trainingPlans: [expiredPlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.click(screen.getByTestId('create-new-cycle-btn'));
      expect(defaultOnGeneratePlan).toHaveBeenCalledOnce();
    });

    it('does not show expired CTA when endDate is in the future', () => {
      const futurePlan = { ...activePlan, endDate: '2025-12-31T00:00:00.000Z' };
      mockStore({ trainingPlans: [futurePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.queryByTestId('plan-expired-cta')).not.toBeInTheDocument();
      expect(screen.getByTestId('today-workout-card')).toBeInTheDocument();
    });
  });

  // --- isGenerating State ---
  describe('isGenerating state', () => {
    it('no plan + isGenerating shows spinner and disables button', () => {
      mockStore({ trainingPlans: [], trainingPlanDays: [] });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} isGenerating />);
      const btn = screen.getByTestId('create-plan-btn');
      expect(btn).toBeDisabled();
      expect(btn).toHaveTextContent('Đang tạo...');
    });

    it('active plan + isGenerating disables regenerate button', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} isGenerating />);
      const btn = screen.getByTestId('regenerate-plan-btn');
      expect(btn).toBeDisabled();
    });
  });

  // --- Today Calories Out ---
  describe('today calories out', () => {
    it('calculates cardio and strength calories from today workouts', () => {
      mockStore({
        trainingPlans: [activePlan],
        trainingPlanDays: planDays,
        workouts: [{ id: 'w1', date: '2025-01-06' }],
        workoutSets: [
          { workoutId: 'w1', estimatedCalories: 200, weightKg: 0 },
          { workoutId: 'w1', estimatedCalories: undefined, weightKg: 50 },
          { workoutId: 'w1', estimatedCalories: undefined, weightKg: 60 },
        ],
      });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('training-plan-view')).toBeInTheDocument();
    });

    it('ignores workouts from other dates', () => {
      mockStore({
        trainingPlans: [activePlan],
        trainingPlanDays: planDays,
        workouts: [{ id: 'w1', date: '2025-01-05' }],
        workoutSets: [
          { workoutId: 'w1', estimatedCalories: 500, weightKg: 0 },
        ],
      });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('training-plan-view')).toBeInTheDocument();
    });

    it('handles workout sets with zero weightKg (excluded from strength)', () => {
      mockStore({
        trainingPlans: [activePlan],
        trainingPlanDays: planDays,
        workouts: [{ id: 'w1', date: '2025-01-06' }],
        workoutSets: [
          { workoutId: 'w1', estimatedCalories: undefined, weightKg: 0 },
        ],
      });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('training-plan-view')).toBeInTheDocument();
    });
  });

  // --- Quick Action Buttons ---
  describe('quick action buttons behavior', () => {
    it('quick-log-cardio calls pushPage with CardioLogger', () => {
      vi.setSystemTime(new Date('2025-01-07T12:00:00'));
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.click(screen.getByTestId('quick-log-cardio'));
      expect(mockPushPage).toHaveBeenCalledWith({
        id: 'cardio-logger',
        component: 'CardioLogger',
        props: {},
      });
    });

    it('quick-log-weight scrolls to weight input', () => {
      vi.setSystemTime(new Date('2025-01-07T12:00:00'));
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      const weightInput = screen.getByTestId('daily-weight-input');
      weightInput.scrollIntoView = vi.fn();
      fireEvent.click(screen.getByTestId('quick-log-weight'));
      expect(weightInput.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });

    it('quick-log-weight handles missing weight input element', () => {
      vi.setSystemTime(new Date('2025-01-07T12:00:00'));
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      const originalQS = document.querySelector.bind(document);
      const spy = vi.spyOn(document, 'querySelector').mockImplementation((sel: string) => {
        if (sel === '[data-testid="daily-weight-input"]') return null;
        return originalQS(sel);
      });
      fireEvent.click(screen.getByTestId('quick-log-weight'));
      spy.mockRestore();
    });
  });

  // --- Click Outside Context Menu ---
  describe('click outside context menu', () => {
    it('clicking outside closes context menu', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-1'));
      expect(screen.getByTestId('day-context-menu')).toBeInTheDocument();
      fireEvent.mouseDown(document.body);
      expect(screen.queryByTestId('day-context-menu')).not.toBeInTheDocument();
    });

    it('clicking inside context menu does not close it', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-1'));
      const menu = screen.getByTestId('day-context-menu');
      fireEvent.mouseDown(menu);
      expect(screen.getByTestId('day-context-menu')).toBeInTheDocument();
    });
  });

  // --- SessionTabs Callbacks ---
  describe('SessionTabs callbacks', () => {
    const multiSessionDays = [
      {
        id: 'ms1',
        planId: 'plan1',
        dayOfWeek: 1,
        sessionOrder: 1,
        workoutType: 'Push',
        muscleGroups: 'chest',
        exercises: mockExercises,
      },
      {
        id: 'ms2',
        planId: 'plan1',
        dayOfWeek: 1,
        sessionOrder: 2,
        workoutType: 'Cardio',
        muscleGroups: '',
        exercises: '[]',
      },
    ];

    it('onSelectSession switches displayed workout type', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: multiSessionDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByText('Push')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('session-tab-1'));
      expect(screen.getByText('Cardio')).toBeInTheDocument();
    });

    it('onAddSession opens AddSessionModal', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: multiSessionDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.click(screen.getByTestId('add-session-tab'));
      expect(screen.getByTestId('add-session-modal')).toBeInTheDocument();
    });

    it('onDeleteSession calls removePlanDaySession', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: multiSessionDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.click(screen.getByTestId('delete-session-btn'));
      expect(mockRemovePlanDaySession).toHaveBeenCalledWith('ms1');
    });

    it('selecting stale session id falls back to first session', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: multiSessionDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.click(screen.getByTestId('select-stale-session'));
      expect(screen.getByText('Push')).toBeInTheDocument();
    });
  });

  // --- AddSessionModal Callbacks ---
  describe('AddSessionModal callbacks', () => {
    it('onSelectStrength calls addPlanDaySession for rest day', () => {
      mockGetActivePlan.mockReturnValue(activePlan);
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-2'));
      fireEvent.click(screen.getByTestId('ctx-add-workout'));
      fireEvent.click(screen.getByTestId('modal-strength-btn'));
      expect(mockAddPlanDaySession).toHaveBeenCalledWith('plan1', 2, expect.objectContaining({
        planId: 'plan1',
        dayOfWeek: 2,
        sessionOrder: 1,
        workoutType: 'Strength',
        muscleGroups: 'chest,back',
        exercises: '[]',
        originalExercises: '[]',
      }));
      expect(screen.queryByTestId('add-session-modal')).not.toBeInTheDocument();
    });

    it('onSelectStrength with existing sessions uses correct sessionOrder', () => {
      mockGetActivePlan.mockReturnValue(activePlan);
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.click(screen.getByTestId('add-session-tab'));
      fireEvent.click(screen.getByTestId('modal-strength-btn'));
      expect(mockAddPlanDaySession).toHaveBeenCalledWith('plan1', 1, expect.objectContaining({
        sessionOrder: 2,
      }));
    });

    it('onSelectCardio calls addPlanDaySession for rest day', () => {
      mockGetActivePlan.mockReturnValue(activePlan);
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-2'));
      fireEvent.click(screen.getByTestId('ctx-add-workout'));
      fireEvent.click(screen.getByTestId('modal-cardio-btn'));
      expect(mockAddPlanDaySession).toHaveBeenCalledWith('plan1', 2, expect.objectContaining({
        planId: 'plan1',
        dayOfWeek: 2,
        sessionOrder: 1,
        workoutType: 'Cardio',
        muscleGroups: '',
        exercises: '[]',
        originalExercises: '[]',
      }));
      expect(screen.queryByTestId('add-session-modal')).not.toBeInTheDocument();
    });

    it('onSelectCardio with existing sessions uses correct sessionOrder', () => {
      mockGetActivePlan.mockReturnValue(activePlan);
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.click(screen.getByTestId('add-session-tab'));
      fireEvent.click(screen.getByTestId('modal-cardio-btn'));
      expect(mockAddPlanDaySession).toHaveBeenCalledWith('plan1', 1, expect.objectContaining({
        sessionOrder: 2,
      }));
    });

    it('onSelectFreestyle calls pushPage with WorkoutLogger', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-2'));
      fireEvent.click(screen.getByTestId('ctx-add-workout'));
      fireEvent.click(screen.getByTestId('modal-freestyle-btn'));
      expect(mockPushPage).toHaveBeenCalledWith({
        id: 'workout-logger',
        component: 'WorkoutLogger',
        props: {},
      });
      expect(screen.queryByTestId('add-session-modal')).not.toBeInTheDocument();
    });

    it('onSelectStrength does not call addPlanDaySession when no active plan', () => {
      mockGetActivePlan.mockReturnValue(null);
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-2'));
      fireEvent.click(screen.getByTestId('ctx-add-workout'));
      fireEvent.click(screen.getByTestId('modal-strength-btn'));
      expect(mockAddPlanDaySession).not.toHaveBeenCalled();
    });

    it('onSelectCardio does not call addPlanDaySession when no active plan', () => {
      mockGetActivePlan.mockReturnValue(null);
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-2'));
      fireEvent.click(screen.getByTestId('ctx-add-workout'));
      fireEvent.click(screen.getByTestId('modal-cardio-btn'));
      expect(mockAddPlanDaySession).not.toHaveBeenCalled();
    });

    it('onClose closes the modal', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-2'));
      fireEvent.click(screen.getByTestId('ctx-add-workout'));
      expect(screen.getByTestId('add-session-modal')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('modal-close-btn'));
      expect(screen.queryByTestId('add-session-modal')).not.toBeInTheDocument();
    });
  });

  // --- Convert to Rest with Multiple Sessions ---
  describe('convert to rest with multiple sessions', () => {
    it('removes all sessions for a multi-session day', () => {
      const multiSessionDays = [
        { id: 'ms1', planId: 'plan1', dayOfWeek: 1, sessionOrder: 1, workoutType: 'Push', exercises: mockExercises },
        { id: 'ms2', planId: 'plan1', dayOfWeek: 1, sessionOrder: 2, workoutType: 'Cardio', exercises: '[]' },
      ];
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: multiSessionDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-1'));
      fireEvent.click(screen.getByTestId('ctx-convert-rest'));
      fireEvent.click(screen.getByTestId('confirmation-confirm-btn'));
      expect(mockRemovePlanDaySession).toHaveBeenCalledTimes(2);
      expect(mockRemovePlanDaySession).toHaveBeenCalledWith('ms1');
      expect(mockRemovePlanDaySession).toHaveBeenCalledWith('ms2');
    });
  });

  // --- Sessions Without sessionOrder (sort fallback) ---
  describe('sessions without sessionOrder', () => {
    it('handles sessions with undefined sessionOrder using fallback', () => {
      mockStore({
        trainingPlans: [activePlan],
        trainingPlanDays: [
          { id: 'no-order-1', planId: 'plan1', dayOfWeek: 1, workoutType: 'Push', exercises: mockExercises },
          { id: 'no-order-2', planId: 'plan1', dayOfWeek: 1, workoutType: 'Pull', exercises: '[]' },
        ],
      });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('today-workout-card')).toBeInTheDocument();
      expect(screen.getByText('Push')).toBeInTheDocument();
    });
  });

  // --- Edge-case branch coverage ---
  describe('edge-case branch coverage', () => {
    it('estimatedCalories nullish coalesce fallback in reduce (branch 94)', () => {
      let accessCount = 0;
      const trickSet = {
        workoutId: 'w1',
        weightKg: 0,
        get estimatedCalories() {
          accessCount++;
          return accessCount <= 1 ? 100 : null;
        },
      };
      mockStore({
        trainingPlans: [activePlan],
        trainingPlanDays: planDays,
        workouts: [{ id: 'w1', date: '2025-01-06' }],
        workoutSets: [trickSet],
      });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('training-plan-view')).toBeInTheDocument();
    });

    it('confirmConvertToRest handles empty daySessionsMap after rerender (branch 210)', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      const { rerender } = render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-1'));
      fireEvent.click(screen.getByTestId('ctx-convert-rest'));
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      mockStore({
        trainingPlans: [activePlan],
        trainingPlanDays: planDays.filter((d) => d.dayOfWeek !== 1),
      });
      const newOnGenerate = vi.fn();
      rerender(<TrainingPlanView onGeneratePlan={newOnGenerate} />);
      fireEvent.click(screen.getByTestId('confirmation-confirm-btn'));
      expect(mockRemovePlanDaySession).not.toHaveBeenCalled();
    });

    it('onConfirm guard when showConvertToRestConfirm is null (branch 667)', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      const slug = 'chuyển-thành-ngày-nghỉ';
      const closedConfirmBtn = screen.getByTestId(`closed-confirm-${slug}`);
      fireEvent.click(closedConfirmBtn);
      expect(mockRemovePlanDaySession).not.toHaveBeenCalled();
    });
  });

  // --- Visible convert-to-rest button ---
  describe('visible convert-to-rest button', () => {
    it('shows visible "convert to rest" button on workout day', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.getByTestId('day-convert-rest-btn')).toBeInTheDocument();
    });
  });

  // --- Coaching Hint ---
  describe('coaching hint', () => {
    it('shows coaching hint on first render and dismisses it', () => {
      localStorage.removeItem('planCoachingDismissed');
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      const hint = screen.getByTestId('plan-coaching-hint');
      expect(hint).toBeInTheDocument();
      const dismissBtn = hint.querySelector('button');
      expect(dismissBtn).not.toBeNull();
      fireEvent.click(dismissBtn!);
      expect(screen.queryByTestId('plan-coaching-hint')).not.toBeInTheDocument();
    });

    it('does not show coaching hint when already dismissed', () => {
      localStorage.setItem('planCoachingDismissed', 'true');
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      expect(screen.queryByTestId('plan-coaching-hint')).not.toBeInTheDocument();
    });
  });

  // --- Context Menu Escape ---
  describe('context menu keyboard', () => {
    it('context menu stays within viewport bounds', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-1'));
      const ctxMenu = screen.getByTestId('day-context-menu');
      expect(ctxMenu).toBeInTheDocument();
      const style = ctxMenu.style;
      const left = parseFloat(style.left);
      const top = parseFloat(style.top);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(top).toBeGreaterThanOrEqual(0);
    });

    it('dismisses context menu with Escape key', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
      fireEvent.contextMenu(screen.getByTestId('day-pill-1'));
      expect(screen.getByTestId('day-context-menu')).toBeInTheDocument();
      fireEvent.keyDown(screen.getByTestId('day-context-menu'), { key: 'Escape' });
      expect(screen.queryByTestId('day-context-menu')).not.toBeInTheDocument();
    });
  });

  // --- localStorage error handling ---
  describe('localStorage error handling', () => {
    it('defaults coachingDismissed to false when localStorage.getItem throws', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = () => { throw new Error('blocked'); };

      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);

      expect(screen.getByTestId('plan-coaching-hint')).toBeInTheDocument();

      Storage.prototype.getItem = originalGetItem;
    });
  });

  // --- Inline day action buttons ---
  describe('inline day action buttons', () => {
    it('clicking day-convert-rest-btn opens convert-to-rest confirmation', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);

      fireEvent.click(screen.getByTestId('day-convert-rest-btn'));

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(screen.getByTestId('confirmation-title')).toHaveTextContent('Chuyển thành ngày nghỉ');
    });

    it('clicking rest-add-workout-btn on rest day opens add session modal', () => {
      mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
      render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);

      // Navigate to Tuesday (day 2) which is a rest day
      fireEvent.click(screen.getByTestId('day-pill-2'));
      expect(screen.getByTestId('rest-day-card')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('rest-add-workout-btn'));

      expect(screen.getByTestId('add-session-modal')).toBeInTheDocument();
    });
  });
});