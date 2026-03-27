import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { TrainingPlanView } from '../features/fitness/components/TrainingPlanView';
import { useFitnessStore } from '../store/fitnessStore';
import { useNavigationStore } from '../store/navigationStore';
import type { Mock } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fitness.plan.todayWorkout': 'Buổi tập hôm nay',
        'fitness.plan.startWorkout': 'Bắt đầu',
        'fitness.plan.restDay': 'Ngày nghỉ',
        'fitness.plan.restDayTip1': '🚶 Đi bộ 20 phút',
        'fitness.plan.restDayTip2': '💧 Uống đủ 2L nước',
        'fitness.plan.restDayTip3': '🥩 Đạt đủ protein',
        'fitness.plan.noPlan': 'Chưa có kế hoạch tập luyện',
        'fitness.plan.createPlan': 'Tạo kế hoạch',
        'fitness.plan.exercises': 'bài tập',
        'fitness.plan.minutes': 'phút',
        'fitness.plan.tomorrow': 'Ngày mai',
        'fitness.plan.logWeight': '📝 Log cân nặng',
        'fitness.plan.logLightCardio': '🏃 Log cardio nhẹ',
      };
      return translations[key] ?? key;
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

const mockUseFitnessStore = useFitnessStore as unknown as Mock;
const mockUseNavigationStore = useNavigationStore as unknown as Mock;

let mockPushPage: Mock;

function mockStore(state: Record<string, unknown>) {
  mockUseFitnessStore.mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) => selector(state),
  );
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
    workoutType: 'Push',
    muscleGroups: 'chest,shoulders',
    exercises: mockExercises,
  },
  {
    id: 'd2',
    planId: 'plan1',
    dayOfWeek: 3,
    workoutType: 'Pull',
    muscleGroups: 'back,arms',
    exercises: mockExercises,
  },
  {
    id: 'd3',
    planId: 'plan1',
    dayOfWeek: 5,
    workoutType: 'Legs',
    muscleGroups: 'legs,glutes,core',
    exercises: mockExercises,
  },
  {
    id: 'd4',
    planId: 'plan1',
    dayOfWeek: 6,
    workoutType: 'Cardio',
  },
];

const defaultOnGeneratePlan = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  // Monday Jan 6, 2025 — dayOfWeek = 1
  vi.setSystemTime(new Date('2025-01-06T12:00:00'));
  mockPushPage = vi.fn();
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
    expect(screen.getByText('chest,shoulders')).toBeInTheDocument();
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

  it('"Bắt đầu" button calls pushPage with workout plan day', () => {
    mockStore({ trainingPlans: [activePlan], trainingPlanDays: planDays });
    render(<TrainingPlanView onGeneratePlan={defaultOnGeneratePlan} />);
    fireEvent.click(screen.getByTestId('start-workout-btn'));
    expect(mockPushPage).toHaveBeenCalledWith({
      id: 'workout-logger',
      component: 'WorkoutLogger',
      props: { workoutPlanDay: planDays[0] },
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
      props: { workoutPlanDay: dayWithoutExercises },
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
});
