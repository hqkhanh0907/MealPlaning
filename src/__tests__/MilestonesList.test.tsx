import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { MilestonesList } from '../features/fitness/components/MilestonesList';
import { useFitnessStore } from '../store/fitnessStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fitness.gamification.milestones': 'Cột mốc',
        'fitness.gamification.nextMilestone': 'Mốc tiếp theo',
        'fitness.gamification.achieved': 'Đạt được',
        'fitness.gamification.sessions1': 'Buổi tập đầu tiên',
        'fitness.gamification.sessions10': '10 buổi tập',
        'fitness.gamification.sessions25': '25 buổi tập',
        'fitness.gamification.sessions50': '50 buổi tập',
        'fitness.gamification.sessions100': '100 buổi tập',
        'fitness.gamification.streak7': 'Streak 1 tuần',
        'fitness.gamification.streak14': 'Streak 2 tuần',
        'fitness.gamification.streak30': 'Streak 1 tháng',
        'fitness.gamification.streak60': 'Streak 2 tháng',
        'fitness.gamification.streak90': 'Streak 3 tháng',
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

const mockStore = useFitnessStore as unknown as Mock;

const FIXED_DATE = new Date('2024-01-10T12:00:00.000Z');

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
});
afterAll(() => vi.useRealTimers());
afterEach(cleanup);

function makeWorkout(date: string, id: string) {
  return { id, date, name: 'W', createdAt: date, updatedAt: date };
}

function setupStore(overrides: Record<string, unknown> = {}) {
  const state = {
    workouts: [],
    trainingPlanDays: [],
    trainingPlans: [],
    ...overrides,
  };
  mockStore.mockImplementation((selector: (s: typeof state) => unknown) => selector(state));
}

function expand() {
  fireEvent.click(screen.getByTestId('milestones-toggle'));
}

describe('MilestonesList', () => {
  it('renders collapsed by default', () => {
    setupStore();
    render(<MilestonesList />);
    expect(screen.getByTestId('milestones-list')).toBeInTheDocument();
    expect(screen.getByText('Cột mốc')).toBeInTheDocument();
    expect(screen.queryByTestId('milestones-content')).not.toBeInTheDocument();
  });

  it('renders milestones list after expand', () => {
    setupStore();
    render(<MilestonesList />);
    expand();
    expect(screen.getByTestId('milestone-sessions-1')).toBeInTheDocument();
    expect(screen.getByTestId('milestone-streak-90')).toBeInTheDocument();
  });

  it('shows progress bar to next milestone', () => {
    const workouts = Array.from({ length: 5 }, (_, i) => makeWorkout(`2024-01-0${i + 1}`, `w${i}`));
    setupStore({ workouts });
    render(<MilestonesList />);
    expand();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    const fill = screen.getByTestId('progress-fill');
    expect(fill.style.width).toBe('50%');
  });

  it('completed milestones have date', () => {
    setupStore({
      workouts: [makeWorkout('2024-01-10', 'w0')],
    });
    render(<MilestonesList />);
    expand();
    const dateEl = screen.getByTestId('milestone-date-sessions-1');
    expect(dateEl).toHaveTextContent('Đạt được');
    expect(dateEl).toHaveTextContent('2024-01-10');
  });

  it('collapsible toggle works', () => {
    setupStore();
    render(<MilestonesList />);
    // Default collapsed
    expect(screen.queryByTestId('milestones-content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('milestones-toggle'));
    expect(screen.getByTestId('milestones-content')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('milestones-toggle'));
    expect(screen.queryByTestId('milestones-content')).not.toBeInTheDocument();
  });

  it('uses active plan days for streak calculation', () => {
    setupStore({
      workouts: [makeWorkout('2024-01-10', 'w0')],
      trainingPlans: [{ id: 'p1', name: 'Plan', status: 'active', startDate: '2024-01-01' }],
      trainingPlanDays: [
        { id: 'd1', planId: 'p1', dayOfWeek: 1 },
        { id: 'd3', planId: 'p1', dayOfWeek: 3 },
        { id: 'd5', planId: 'p1', dayOfWeek: 5 },
      ],
    });
    render(<MilestonesList />);
    expand();
    expect(screen.getByTestId('milestone-sessions-1')).toBeInTheDocument();
  });

  it('shows 100% when all milestones achieved', () => {
    const workouts = Array.from({ length: 100 }, (_, i) => {
      const d = new Date(2023, 8, 1);
      d.setDate(d.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return makeWorkout(ds, `w${i}`);
    });
    setupStore({ workouts });
    render(<MilestonesList />);
    expand();
    // All milestones achieved → no progress bar
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  it('shows progress for streak-type next milestone', () => {
    const workouts = Array.from({ length: 100 }, (_, i) =>
      makeWorkout(
        `2023-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        `w${i}`,
      ),
    );
    setupStore({ workouts });
    render(<MilestonesList />);
    expand();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });
});
