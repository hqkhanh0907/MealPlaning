import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { ProgressDashboard } from '../features/fitness/components/ProgressDashboard';
import { useFitnessStore } from '../store/fitnessStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        'fitness.progress.title': 'Tiến trình',
        'fitness.progress.volumeThisWeek': 'Volume tuần này',
        'fitness.progress.weight': 'Cân nặng',
        'fitness.progress.estimated1rm': '1RM ước tính',
        'fitness.progress.adherence': 'Tuân thủ',
        'fitness.progress.sessions': 'Buổi tập',
        'fitness.progress.cycleProgress': 'Tiến trình chu kỳ',
        'fitness.progress.insights': 'Phân tích',
        'fitness.progress.noData': 'Chưa có dữ liệu',
        'fitness.progress.startTraining': 'Bắt đầu tập ngay',
        'fitness.progress.dismiss': 'Bỏ qua',
        'fitness.emptyState.progressTitle': 'Chưa có dữ liệu tiến trình',
        'fitness.emptyState.progressDescription': 'Hoàn thành buổi tập đầu tiên để bắt đầu theo dõi tiến trình của bạn',
        'fitness.emptyState.startWorkout': 'Bắt đầu tập ngay',
        'fitness.coaching.plateau.strength': 'Tạ đang chững lại — thử thay đổi số rep hoặc tăng volume nhé!',
        'fitness.coaching.plateau.volume': 'Volume chưa tăng so với tuần trước — thử thêm 1 set phụ nhé!',
        'fitness.coaching.plateau.both': 'Cả tạ và volume đều chững — đổi bài tập hoặc deload 1 tuần nhé!',
      };
      if (key === 'fitness.progress.weekOf' && params) {
        return `Tuần ${params.current} / ${params.total}`;
      }
      if (key === 'fitness.progress.volumeUp' && params) {
        return `Volume tăng ${params.percent}% so với tuần trước`;
      }
      if (key === 'fitness.progress.volumeDown' && params) {
        return `Volume giảm ${params.percent}% so với tuần trước`;
      }
      if (key === 'fitness.progress.missedSessions' && params) {
        return `Bạn bỏ lỡ ${params.count} buổi tập tuần này`;
      }
      if (key === 'fitness.progress.weightChange' && params) {
        return `Cân nặng thay đổi ${params.delta}kg trong 7 ngày`;
      }
      return translations[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

const mockUseFitnessStore = useFitnessStore as unknown as Mock;

// Fixed date: Wednesday 2024-01-10 12:00 UTC
// This week: Mon 2024-01-08 → Sun 2024-01-14
// Last week: Mon 2024-01-01 → Sun 2024-01-07
const FIXED_DATE = new Date('2024-01-10T12:00:00.000Z');

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
});

afterAll(() => {
  vi.useRealTimers();
});

afterEach(cleanup);

function setupStore(overrides: Record<string, unknown> = {}) {
  const state = {
    workouts: [],
    workoutSets: [],
    weightEntries: [],
    trainingProfile: null,
    trainingPlans: [],
    getActivePlan: () => undefined,
    getLatestWeight: () => undefined,
    ...overrides,
  };
  mockUseFitnessStore.mockImplementation((selector: (s: typeof state) => unknown) => selector(state));
}

// ── Shared test data ──

const thisWeekWorkout = {
  id: 'w1',
  date: '2024-01-10',
  name: 'Push Day',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z',
};

const lastWeekWorkout = {
  id: 'w2',
  date: '2024-01-03',
  name: 'Pull Day',
  createdAt: '2024-01-03T10:00:00Z',
  updatedAt: '2024-01-03T10:00:00Z',
};

// 10 reps × 100 kg = 1000 volume
const thisWeekSet = {
  id: 's1',
  workoutId: 'w1',
  exerciseId: 'e1',
  setNumber: 1,
  reps: 10,
  weightKg: 100,
  updatedAt: '2024-01-10T10:00:00Z',
};

// 10 reps × 80 kg = 800 volume
const lastWeekSet = {
  id: 's2',
  workoutId: 'w2',
  exerciseId: 'e1',
  setNumber: 1,
  reps: 10,
  weightKg: 80,
  updatedAt: '2024-01-03T10:00:00Z',
};

const recentWeight = {
  id: 'we1',
  date: '2024-01-10',
  weightKg: 75,
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z',
};

const oldWeight = {
  id: 'we2',
  date: '2024-01-02',
  weightKg: 74,
  createdAt: '2024-01-02T10:00:00Z',
  updatedAt: '2024-01-02T10:00:00Z',
};

const profile = {
  id: 'tp1',
  trainingExperience: 'intermediate' as const,
  daysPerWeek: 4,
  sessionDurationMin: 60,
  trainingGoal: 'hypertrophy' as const,
  availableEquipment: ['barbell' as const],
  injuryRestrictions: [],
  periodizationModel: 'linear' as const,
  planCycleWeeks: 8,
  priorityMuscles: ['chest' as const],
  cardioSessionsWeek: 0,
  cardioTypePref: 'liss' as const,
  cardioDurationMin: 0,
  updatedAt: '2024-01-01T00:00:00Z',
};

const plan = {
  id: 'plan1',
  name: 'Test Plan',
  status: 'active' as const,
  splitType: 'push_pull',
  durationWeeks: 8,
  startDate: '2024-01-01',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function fullState() {
  return {
    workouts: [thisWeekWorkout, lastWeekWorkout],
    workoutSets: [thisWeekSet, lastWeekSet],
    weightEntries: [recentWeight, oldWeight],
    trainingProfile: profile,
    trainingPlans: [plan],
    getActivePlan: () => plan,
  };
}

describe('ProgressDashboard', () => {
  // ── Required test cases 1-10 ──

  it('renders empty state when no workouts', () => {
    setupStore();
    render(<ProgressDashboard />);
    expect(screen.getByTestId('progress-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('progress-dashboard')).not.toBeInTheDocument();
  });

  it('empty state has CTA button', () => {
    setupStore();
    render(<ProgressDashboard />);
    const cta = screen.getByTestId('start-training-cta');
    expect(cta).toBeInTheDocument();
    expect(cta.textContent).toContain('Bắt đầu tập ngay');
  });

  it('empty state shows title and description', () => {
    setupStore();
    render(<ProgressDashboard />);
    expect(screen.getByText('Chưa có dữ liệu tiến trình')).toBeInTheDocument();
    expect(screen.getByText(/Hoàn thành buổi tập đầu tiên/)).toBeInTheDocument();
  });

  it('hero card shows volume change percentage', () => {
    // thisWeek=1000, lastWeek=800 → +25%
    setupStore(fullState());
    render(<ProgressDashboard />);
    expect(screen.getByTestId('hero-metric-card')).toBeInTheDocument();
    const change = screen.getByTestId('volume-change');
    expect(change.textContent).toContain('+');
    expect(change.textContent).toContain('25%');
  });

  it('metric cards render (weight, 1RM, adherence, sessions)', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    expect(screen.getByTestId('metric-card-weight')).toBeInTheDocument();
    expect(screen.getByTestId('metric-card-1rm')).toBeInTheDocument();
    expect(screen.getByTestId('metric-card-adherence')).toBeInTheDocument();
    expect(screen.getByTestId('metric-card-sessions')).toBeInTheDocument();
  });

  it('weight card shows latest weight and delta', () => {
    // latest=75kg, 7dAgo=74kg → ↑ 1kg
    setupStore(fullState());
    render(<ProgressDashboard />);
    const card = screen.getByTestId('metric-card-weight');
    expect(card.textContent).toContain('75kg');
    const delta = screen.getByTestId('weight-delta');
    expect(delta.textContent).toContain('↑');
    expect(delta.textContent).toContain('1kg');
  });

  it('cycle progress bar shown when active plan exists', () => {
    // plan started 2024-01-01, now 2024-01-10 → week 2 / 8
    setupStore(fullState());
    render(<ProgressDashboard />);
    const cp = screen.getByTestId('cycle-progress');
    expect(cp).toBeInTheDocument();
    expect(cp.textContent).toContain('Tuần 2 / 8');
  });

  it('cycle progress hidden when no plan', () => {
    setupStore({
      ...fullState(),
      trainingPlans: [],
      getActivePlan: () => undefined,
    });
    render(<ProgressDashboard />);
    expect(screen.queryByTestId('cycle-progress')).not.toBeInTheDocument();
  });

  it('insights section renders when data available', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    expect(screen.getByTestId('insights-section')).toBeInTheDocument();
    // volume up insight
    expect(screen.getByTestId('insight-volume-up')).toBeInTheDocument();
    expect(screen.getByText('Volume tăng 25% so với tuần trước')).toBeInTheDocument();
    // missed sessions insight (planned 4, completed 1 → missed 3)
    expect(screen.getByTestId('insight-missed-sessions')).toBeInTheDocument();
    // weight change insight
    expect(screen.getByTestId('insight-weight-change')).toBeInTheDocument();
  });

  it('dismiss button removes insight', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    expect(screen.getByTestId('insight-volume-up')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('dismiss-volume-up'));
    expect(screen.queryByTestId('insight-volume-up')).not.toBeInTheDocument();
  });

  it('handles zero division (no previous week data)', () => {
    // Only this week data → lastWeekVolume = 0 → volumeChange = 0
    // Include a set with undefined reps to cover the ?? 0 branch
    const setNoReps = {
      id: 's3',
      workoutId: 'w1',
      exerciseId: 'e2',
      setNumber: 1,
      weightKg: 50,
      updatedAt: '2024-01-10T10:00:00Z',
    };
    setupStore({
      workouts: [thisWeekWorkout],
      workoutSets: [thisWeekSet, setNoReps],
      weightEntries: [],
      trainingProfile: null,
      getActivePlan: () => undefined,
    });
    render(<ProgressDashboard />);
    const change = screen.getByTestId('volume-change');
    expect(change.textContent).toContain('+0%');
  });

  // ── Additional branch-coverage tests ──

  it('shows trending down icon when volume decreases', () => {
    // Swap volumes: thisWeek=300, lastWeek=1000 → −70%
    const lowSet = {
      ...thisWeekSet,
      reps: 5,
      weightKg: 60,
    };
    const highSet = {
      ...lastWeekSet,
      reps: 10,
      weightKg: 100,
    };
    setupStore({
      workouts: [thisWeekWorkout, lastWeekWorkout],
      workoutSets: [lowSet, highSet],
      weightEntries: [
        { ...recentWeight, weightKg: 73 },
        { ...oldWeight, weightKg: 75 },
      ],
      trainingProfile: null,
      getActivePlan: () => undefined,
    });
    render(<ProgressDashboard />);
    const change = screen.getByTestId('volume-change');
    expect(change.textContent).toContain('-70%');
    // weight delta negative: ↓
    const delta = screen.getByTestId('weight-delta');
    expect(delta.textContent).toContain('↓');
  });

  it('shows dash when no weight entries and no sets', () => {
    setupStore({
      workouts: [thisWeekWorkout],
      workoutSets: [],
      weightEntries: [],
      trainingProfile: null,
      getActivePlan: () => undefined,
    });
    render(<ProgressDashboard />);
    const weightCard = screen.getByTestId('metric-card-weight');
    expect(weightCard.textContent).toContain('—');
    const rmCard = screen.getByTestId('metric-card-1rm');
    expect(rmCard.textContent).toContain('—');
  });

  it('shows stable arrow when weight unchanged', () => {
    setupStore({
      workouts: [thisWeekWorkout],
      workoutSets: [thisWeekSet],
      weightEntries: [recentWeight, { ...oldWeight, weightKg: 75 }],
      trainingProfile: null,
      getActivePlan: () => undefined,
    });
    render(<ProgressDashboard />);
    expect(screen.getByTestId('weight-stable')).toBeInTheDocument();
    expect(screen.queryByTestId('weight-delta')).not.toBeInTheDocument();
  });

  it('hides insights section when no insights generated', () => {
    // 0 volume change, no missed sessions, no weight change → no insights
    setupStore({
      workouts: [thisWeekWorkout],
      workoutSets: [thisWeekSet],
      weightEntries: [],
      trainingProfile: null,
      getActivePlan: () => undefined,
    });
    render(<ProgressDashboard />);
    expect(screen.queryByTestId('insights-section')).not.toBeInTheDocument();
  });

  it('dismissing all insights hides the section', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    expect(screen.getByTestId('insights-section')).toBeInTheDocument();
    // Dismiss all three insights
    fireEvent.click(screen.getByTestId('dismiss-volume-up'));
    fireEvent.click(screen.getByTestId('dismiss-missed-sessions'));
    fireEvent.click(screen.getByTestId('dismiss-weight-change'));
    expect(screen.queryByTestId('insights-section')).not.toBeInTheDocument();
  });

  it('shows volume down insight when volume decreases', () => {
    const lowSet = { ...thisWeekSet, reps: 5, weightKg: 60 };
    const highSet = { ...lastWeekSet, reps: 10, weightKg: 100 };
    setupStore({
      workouts: [thisWeekWorkout, lastWeekWorkout],
      workoutSets: [lowSet, highSet],
      weightEntries: [],
      trainingProfile: null,
      getActivePlan: () => undefined,
    });
    render(<ProgressDashboard />);
    expect(screen.getByTestId('insight-volume-down')).toBeInTheDocument();
    expect(screen.getByText('Volume giảm 70% so với tuần trước')).toBeInTheDocument();
  });

  // ── Bottom sheet tests ──

  it('bottom sheet opens on card tap', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    expect(screen.queryByTestId('metric-bottom-sheet')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('metric-card-weight'));
    expect(screen.getByTestId('metric-bottom-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-sheet-chart')).toBeInTheDocument();
    expect(screen.getByTestId('time-range-filter')).toBeInTheDocument();
    // Shows card title in sheet header
    expect(screen.getByTestId('metric-bottom-sheet').textContent).toContain('Cân nặng');
  });

  it('bottom sheet closes on backdrop click', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    fireEvent.click(screen.getByTestId('metric-card-weight'));
    expect(screen.getByTestId('metric-bottom-sheet')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('bottom-sheet-backdrop'));
    expect(screen.queryByTestId('metric-bottom-sheet')).not.toBeInTheDocument();
  });

  it('bottom sheet closes on X button click', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    fireEvent.click(screen.getByTestId('metric-card-1rm'));
    expect(screen.getByTestId('metric-bottom-sheet')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('close-bottom-sheet'));
    expect(screen.queryByTestId('metric-bottom-sheet')).not.toBeInTheDocument();
  });

  it('time range filter changes chart data', () => {
    // Extra weight entries to span different time ranges
    const extraWeight1 = {
      id: 'we3',
      date: '2024-01-09',
      weightKg: 74.5,
      createdAt: '2024-01-09T10:00:00Z',
      updatedAt: '2024-01-09T10:00:00Z',
    };
    const extraWeight2 = {
      id: 'we4',
      date: '2023-12-20',
      weightKg: 73,
      createdAt: '2023-12-20T10:00:00Z',
      updatedAt: '2023-12-20T10:00:00Z',
    };
    setupStore({
      ...fullState(),
      weightEntries: [recentWeight, oldWeight, extraWeight1, extraWeight2],
    });
    render(<ProgressDashboard />);
    fireEvent.click(screen.getByTestId('metric-card-weight'));

    // 1W: cutoff=2024-01-03, entries: we1(01-10), we3(01-09) → 2 bars
    const barsIn1W = screen.getAllByTestId('chart-bar').length;
    expect(barsIn1W).toBe(2);

    // Switch to 1M: cutoff=2023-12-11, entries: we4(12-20), we2(01-02), we3(01-09), we1(01-10) → 4 bars
    fireEvent.click(screen.getByTestId('time-range-1M'));
    const barsIn1M = screen.getAllByTestId('chart-bar').length;
    expect(barsIn1M).toBe(4);
    expect(barsIn1M).toBeGreaterThan(barsIn1W);
  });

  it('each metric card opens bottom sheet with correct title', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);

    // Test sessions card
    fireEvent.click(screen.getByTestId('metric-card-sessions'));
    expect(screen.getByTestId('metric-bottom-sheet').textContent).toContain('Buổi tập');
    fireEvent.click(screen.getByTestId('close-bottom-sheet'));

    // Test adherence card
    fireEvent.click(screen.getByTestId('metric-card-adherence'));
    expect(screen.getByTestId('metric-bottom-sheet').textContent).toContain('Tuân thủ');
    fireEvent.click(screen.getByTestId('close-bottom-sheet'));

    // Test 1RM card
    fireEvent.click(screen.getByTestId('metric-card-1rm'));
    expect(screen.getByTestId('metric-bottom-sheet').textContent).toContain('1RM ước tính');
  });

  it('shows plateau insight when exercise shows no strength improvement', () => {
    // analyzePlateau requires 6+ sets for an exercise with no max-weight increase
    // across the most recent 9 sets (sorted by updatedAt desc):
    // maxRecent = max(topWeights[0:3]), maxPrevious = max(topWeights[3:9])
    // strengthPlateau = maxRecent <= maxPrevious
    const plateauSets = Array.from({ length: 9 }, (_, i) => ({
      id: `ps${i}`,
      workoutId: 'w1',
      exerciseId: 'e2',
      setNumber: i + 1,
      reps: 10,
      weightKg: 80,
      updatedAt: `2024-01-${String(10 - i).padStart(2, '0')}T10:00:00Z`,
    }));

    setupStore({
      ...fullState(),
      workoutSets: [thisWeekSet, lastWeekSet, ...plateauSets],
    });
    render(<ProgressDashboard />);

    expect(screen.getByTestId('insight-plateau-e2')).toBeInTheDocument();
    expect(screen.getByTestId('insight-plateau-e2').textContent).toContain('Tạ đang chững');
  });
});
