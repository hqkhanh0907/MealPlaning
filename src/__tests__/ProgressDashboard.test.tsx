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
        'fitness.personalRecords.title': 'Kỷ lục cá nhân',
        'fitness.personalRecords.empty': 'Chưa có kỷ lục',
        'fitness.personalRecords.emptyDescription': 'Hoàn thành buổi tập để thiết lập kỷ lục đầu tiên',
        'fitness.personalRecords.historyLabel': 'Lịch sử',
        'fitness.personalRecords.kgUnit': 'kg',
        'fitness.volumeTrend.noData': 'Chưa có dữ liệu',
        'fitness.volumeTrend.chartLabel': 'Biểu đồ xu hướng khối lượng tập luyện',
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
        return `Cân nặng thay đổi ${params.delta}kg (7 ngày qua)`;
      }
      if (key === 'fitness.volumeTrend.barLabel' && params) {
        return `Tuần ${params.week}: ${params.volume} kg`;
      }
      if (key === 'fitness.volumeTrend.tooltipLabel' && params) {
        return `${params.volume} kg`;
      }
      if (key === 'fitness.personalRecords.repsFormat' && params) {
        return `×${params.reps}`;
      }
      return translations[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../features/fitness/data/exerciseDatabase', () => ({
  EXERCISES: [
    {
      id: 'e1',
      nameVi: 'Bench Press',
      nameEn: 'Bench Press',
      muscleGroup: 'chest',
      category: 'compound',
      equipment: 'barbell',
    },
    { id: 'e2', nameVi: 'Squat', nameEn: 'Squat', muscleGroup: 'legs', category: 'compound', equipment: 'barbell' },
  ],
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
    // weight change insight shows timeframe context
    expect(screen.getByTestId('insight-weight-change')).toBeInTheDocument();
    expect(screen.getByText(/7 ngày qua/)).toBeInTheDocument();
  });

  it('dismiss button removes insight', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    expect(screen.getByTestId('insight-volume-up')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('dismiss-volume-up'));
    expect(screen.queryByTestId('insight-volume-up')).not.toBeInTheDocument();
  });

  it('handles zero division (no previous week data)', () => {
    // Only this week data → lastWeekVolume = 0 → no comparison data → show "—"
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
    expect(change.textContent).toContain('—');
    expect(change.textContent).not.toContain('%');
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
    expect(screen.getByTestId('volume-trend-chart')).toBeInTheDocument();
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

  it('time range filter changes volume chart data', () => {
    // Generate workouts across multiple weeks to produce volume bars
    const multiWeekWorkouts = [];
    const multiWeekSets = [];
    // Create workouts for 5 weeks back (Mon of each week)
    const weekDates = ['2024-01-08', '2024-01-01', '2023-12-25', '2023-12-18', '2023-12-11'];
    for (let i = 0; i < weekDates.length; i++) {
      multiWeekWorkouts.push({
        id: `mw${i}`,
        date: weekDates[i],
        name: `Week ${i}`,
        createdAt: `${weekDates[i]}T10:00:00Z`,
        updatedAt: `${weekDates[i]}T10:00:00Z`,
      });
      multiWeekSets.push({
        id: `ms${i}`,
        workoutId: `mw${i}`,
        exerciseId: 'e1',
        setNumber: 1,
        reps: 10,
        weightKg: 50 + i * 10,
        updatedAt: `${weekDates[i]}T10:00:00Z`,
      });
    }
    setupStore({
      ...fullState(),
      workouts: multiWeekWorkouts,
      workoutSets: multiWeekSets,
    });
    render(<ProgressDashboard />);
    fireEvent.click(screen.getByTestId('metric-card-weight'));

    // Default 1W → 1 volume bar (current week only)
    expect(screen.getAllByTestId(/^volume-bar-/).length).toBe(1);

    // Switch to 1M → 4 volume bars
    fireEvent.click(screen.getByTestId('time-range-1M'));
    expect(screen.getAllByTestId(/^volume-bar-/).length).toBe(4);

    // Switch to 3M → 13 bars (MAX_VOLUME_WEEKS, most with 0 volume)
    fireEvent.click(screen.getByTestId('time-range-3M'));
    expect(screen.getAllByTestId(/^volume-bar-/).length).toBe(13);
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

  it('shows +0% when both weeks have equal volume (actual 0% change)', () => {
    const sameSet = { ...lastWeekSet, weightKg: 100 };
    setupStore({
      workouts: [thisWeekWorkout, lastWeekWorkout],
      workoutSets: [thisWeekSet, sameSet],
      weightEntries: [],
      trainingProfile: null,
      getActivePlan: () => undefined,
    });
    render(<ProgressDashboard />);
    const change = screen.getByTestId('volume-change');
    expect(change.textContent).toContain('+0%');
  });

  // ── W4-04: PersonalRecords integration tests ──

  it('renders PersonalRecords between cycle-progress and insights', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    expect(screen.getByTestId('personal-records')).toBeInTheDocument();
    // Verify ordering: personal-records appears in DOM after cycle-progress
    const dashboard = screen.getByTestId('progress-dashboard');
    const html = dashboard.innerHTML;
    const prIdx = html.indexOf('personal-records');
    const insightsIdx = html.indexOf('insights-section');
    expect(prIdx).toBeGreaterThan(-1);
    expect(prIdx).toBeLessThan(insightsIdx);
  });

  it('PersonalRecords shows correct PR data from workout sets', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    // e1 has thisWeekSet (100kg×10) and lastWeekSet (80kg×10) → best=100kg
    expect(screen.getByTestId('pr-item-e1')).toBeInTheDocument();
    expect(screen.getByTestId('pr-weight-e1').textContent).toContain('100');
  });

  it('PersonalRecords shows empty state when no sets', () => {
    setupStore({
      workouts: [thisWeekWorkout],
      workoutSets: [],
      weightEntries: [],
      trainingProfile: null,
      getActivePlan: () => undefined,
    });
    render(<ProgressDashboard />);
    expect(screen.getByTestId('pr-empty-state')).toBeInTheDocument();
  });

  it('PersonalRecords uses exercise name from EXERCISES database', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    // e1 maps to 'Bench Press' from mocked EXERCISES
    const prItem = screen.getByTestId('pr-item-e1');
    expect(prItem.textContent).toContain('Bench Press');
  });

  it('PersonalRecords falls back to exerciseId for unknown exercises', () => {
    const unknownSet = {
      id: 's-unknown',
      workoutId: 'w1',
      exerciseId: 'unknown-exercise',
      setNumber: 1,
      reps: 5,
      weightKg: 60,
      updatedAt: '2024-01-10T10:00:00Z',
    };
    setupStore({
      ...fullState(),
      workoutSets: [thisWeekSet, lastWeekSet, unknownSet],
    });
    render(<ProgressDashboard />);
    const prItem = screen.getByTestId('pr-item-unknown-exercise');
    expect(prItem.textContent).toContain('unknown-exercise');
  });

  it('PersonalRecords skips sets with null exerciseId', () => {
    const nullExSet = {
      id: 's-null',
      workoutId: 'w1',
      exerciseId: null,
      setNumber: 1,
      reps: 5,
      weightKg: 200,
      updatedAt: '2024-01-10T10:00:00Z',
    };
    setupStore({
      ...fullState(),
      workoutSets: [thisWeekSet, nullExSet],
    });
    render(<ProgressDashboard />);
    // Only e1 PR should exist, not a null-exercise PR
    expect(screen.getByTestId('pr-item-e1')).toBeInTheDocument();
    expect(screen.queryByTestId('pr-item-null')).not.toBeInTheDocument();
  });

  it('VolumeTrendChart renders in bottom sheet for all metric cards', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);

    const cards: string[] = ['weight', '1rm', 'adherence', 'sessions'];
    for (const card of cards) {
      fireEvent.click(screen.getByTestId(`metric-card-${card}`));
      expect(screen.getByTestId('volume-trend-chart')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('close-bottom-sheet'));
    }
  });

  it('old SimpleBarChart testids no longer in DOM', () => {
    setupStore(fullState());
    render(<ProgressDashboard />);
    fireEvent.click(screen.getByTestId('metric-card-weight'));
    expect(screen.queryByTestId('bottom-sheet-chart')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('chart-bar')).toHaveLength(0);
  });

  it('PersonalRecords sorted by bestWeight descending', () => {
    const heavySet = {
      id: 's-heavy',
      workoutId: 'w1',
      exerciseId: 'e2',
      setNumber: 1,
      reps: 5,
      weightKg: 150,
      updatedAt: '2024-01-10T10:00:00Z',
    };
    setupStore({
      ...fullState(),
      workoutSets: [thisWeekSet, lastWeekSet, heavySet],
    });
    render(<ProgressDashboard />);
    // e2 (150kg) should appear before e1 (100kg)
    const items = screen.getAllByTestId(/^pr-item-/);
    expect(items[0].getAttribute('data-testid')).toBe('pr-item-e2');
    expect(items[1].getAttribute('data-testid')).toBe('pr-item-e1');
  });

  it('PersonalRecords tie-break by most recent workout date', () => {
    // Two sets with same weight for e1 — newer workout should win
    const olderSameWeight = {
      id: 's-older',
      workoutId: 'w2',
      exerciseId: 'e1',
      setNumber: 1,
      reps: 8,
      weightKg: 100,
      updatedAt: '2024-01-03T10:00:00Z',
    };
    setupStore({
      ...fullState(),
      workoutSets: [thisWeekSet, olderSameWeight],
    });
    render(<ProgressDashboard />);
    // Best set should be thisWeekSet (w1, 2024-01-10) due to more recent date
    expect(screen.getByTestId('pr-reps-e1').textContent).toContain('10');
  });

  it('PersonalRecords history limited to 5 entries', () => {
    // Create 7 sets for same exercise — history should show max 5 (excluding best)
    const sets = Array.from({ length: 7 }, (_, i) => ({
      id: `sh${i}`,
      workoutId: i < 4 ? 'w1' : 'w2',
      exerciseId: 'e1',
      setNumber: i + 1,
      reps: 10,
      weightKg: 50 + i * 5,
      updatedAt: `2024-01-${String(10 - i).padStart(2, '0')}T10:00:00Z`,
    }));
    setupStore({
      ...fullState(),
      workoutSets: sets,
    });
    render(<ProgressDashboard />);
    // Toggle history
    fireEvent.click(screen.getByTestId('pr-toggle-e1'));
    // Each history entry has data-testid="pr-history-entry-{i}"
    const entries = screen.getAllByTestId(/^pr-history-entry-/);
    expect(entries.length).toBeLessThanOrEqual(5);
  });
});
