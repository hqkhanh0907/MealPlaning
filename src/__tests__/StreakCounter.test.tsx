import { render, screen, cleanup } from '@testing-library/react';
import { StreakCounter } from '../features/fitness/components/StreakCounter';
import { useFitnessStore } from '../store/fitnessStore';
import type { Mock } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fitness.gamification.streak': 'ngày liên tiếp',
        'fitness.gamification.longestStreak': 'Kỷ lục',
        'fitness.gamification.streakAtRisk': 'Streak sắp mất!',
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

function setupStore(overrides: Record<string, unknown> = {}) {
  const state = {
    workouts: [],
    trainingPlanDays: [],
    trainingPlans: [],
    ...overrides,
  };
  mockStore.mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
}

describe('StreakCounter', () => {
  it('renders streak count', () => {
    setupStore({
      workouts: [
        {
          id: 'w1',
          date: '2024-01-08',
          name: 'W',
          createdAt: '2024-01-08',
          updatedAt: '2024-01-08',
        },
        {
          id: 'w2',
          date: '2024-01-09',
          name: 'W',
          createdAt: '2024-01-09',
          updatedAt: '2024-01-09',
        },
        {
          id: 'w3',
          date: '2024-01-10',
          name: 'W',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-10',
        },
      ],
    });
    render(<StreakCounter />);
    expect(screen.getByTestId('streak-count')).toHaveTextContent('3');
    expect(screen.getByText('ngày liên tiếp')).toBeInTheDocument();
  });

  it('renders weekly dots', () => {
    setupStore();
    render(<StreakCounter />);
    const dots = screen.getByTestId('week-dots');
    expect(dots.children).toHaveLength(7);
  });

  it('shows personal record', () => {
    setupStore({
      workouts: [
        {
          id: 'w1',
          date: '2024-01-10',
          name: 'W',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-10',
        },
      ],
    });
    render(<StreakCounter />);
    expect(screen.getByTestId('streak-record')).toHaveTextContent('Kỷ lục');
  });

  it('renders rest-day dot when plan excludes a day', () => {
    // Plan Mon, Wed, Fri (1,3,5) → Tue is rest
    setupStore({
      workouts: [
        {
          id: 'w1',
          date: '2024-01-08',
          name: 'W',
          createdAt: '2024-01-08',
          updatedAt: '2024-01-08',
        },
      ],
      trainingPlans: [{ id: 'p1', status: 'active' }],
      trainingPlanDays: [
        { id: 'd1', planId: 'p1', dayOfWeek: 1 },
        { id: 'd3', planId: 'p1', dayOfWeek: 3 },
        { id: 'd5', planId: 'p1', dayOfWeek: 5 },
      ],
    });
    render(<StreakCounter />);
    // Tue (day 2) is not in plan → rest dot
    expect(screen.getByTestId('dot-rest')).toBeInTheDocument();
    // Wed is today
    expect(screen.getByTestId('dot-today')).toBeInTheDocument();
  });

  it('renders missed dot when planned day has no workout', () => {
    // Plan Mon-Fri, workout only Mon. Tue is planned but missed.
    setupStore({
      workouts: [
        {
          id: 'w1',
          date: '2024-01-08',
          name: 'W',
          createdAt: '2024-01-08',
          updatedAt: '2024-01-08',
        },
      ],
      trainingPlans: [{ id: 'p1', status: 'active' }],
      trainingPlanDays: [
        { id: 'd1', planId: 'p1', dayOfWeek: 1 },
        { id: 'd2', planId: 'p1', dayOfWeek: 2 },
        { id: 'd3', planId: 'p1', dayOfWeek: 3 },
        { id: 'd4', planId: 'p1', dayOfWeek: 4 },
        { id: 'd5', planId: 'p1', dayOfWeek: 5 },
      ],
    });
    render(<StreakCounter />);
    // Tue is in plan, no workout → missed
    expect(screen.getByTestId('dot-missed')).toBeInTheDocument();
  });

  it('shows streak at risk warning', () => {
    // Plan Mon-Wed (1,2,3), workout Mon & Wed only → Tue missed = grace
    setupStore({
      workouts: [
        {
          id: 'w1',
          date: '2024-01-08',
          name: 'W',
          createdAt: '2024-01-08',
          updatedAt: '2024-01-08',
        },
        {
          id: 'w2',
          date: '2024-01-10',
          name: 'W',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-10',
        },
      ],
      trainingPlans: [{ id: 'p1', status: 'active' }],
      trainingPlanDays: [
        { id: 'd1', planId: 'p1', dayOfWeek: 1 },
        { id: 'd2', planId: 'p1', dayOfWeek: 2 },
        { id: 'd3', planId: 'p1', dayOfWeek: 3 },
      ],
    });
    render(<StreakCounter />);
    expect(screen.getByTestId('streak-warning')).toHaveTextContent(
      'Streak sắp mất!',
    );
  });
});
