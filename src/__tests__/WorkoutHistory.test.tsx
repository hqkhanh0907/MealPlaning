import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { WorkoutHistory } from '../features/fitness/components/WorkoutHistory';
import { useFitnessStore } from '../store/fitnessStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'fitness.history.title': 'Lịch sử',
        'fitness.history.all': 'Tất cả',
        'fitness.history.strength': 'Sức mạnh',
        'fitness.history.cardio': 'Cardio',
        'fitness.history.noHistory': 'Chưa có lịch sử tập luyện',
        'fitness.history.emptySubtitle': 'Bắt đầu buổi tập đầu tiên để ghi nhận tại đây',
        'fitness.history.startTraining': 'Bắt đầu tập ngay',
        'fitness.history.volume': 'Volume',
        'fitness.history.sets': 'set',
        'fitness.history.minutes': 'phút',
        'fitness.history.today': 'Hôm nay',
        'fitness.history.yesterday': 'Hôm qua',
        'fitness.history.daysAgo': '{{count}} ngày trước',
        'fitness.history.exerciseCount': '{{count}} bài tập',
        'fitness.history.weekOf': 'Tuần từ {{date}}',
        'fitness.history.notes': 'Ghi chú',
        'fitness.history.completedAt': 'Hoàn thành lúc',
        'fitness.emptyState.historyTitle': 'Chưa có lịch sử tập luyện',
        'fitness.emptyState.historyDescription': 'Bắt đầu buổi tập đầu tiên để xem lịch sử tại đây',
      };
      let result = translations[key] ?? key;
      if (opts) {
        for (const [k, v] of Object.entries(opts)) {
          result = result.replace(`{{${k}}}`, String(v));
        }
      }
      return result;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

const mockUseFitnessStore = useFitnessStore as unknown as Mock;

const mockWorkouts = [
  {
    id: 'w1',
    date: '2026-03-23',
    name: 'Chest Day',
    durationMin: 60,
    notes: 'Felt strong today',
    createdAt: '2026-03-23T10:00:00Z',
    updatedAt: '2026-03-23T11:00:00Z',
  },
  {
    id: 'w2',
    date: '2026-03-21',
    name: 'Morning Run',
    durationMin: 30,
    createdAt: '2026-03-21T06:00:00Z',
    updatedAt: '2026-03-21T06:30:00Z',
  },
  {
    id: 'w3',
    date: '2026-03-25',
    name: 'Leg Day',
    createdAt: '2026-03-25T10:00:00Z',
    updatedAt: '2026-03-25T10:45:00Z',
  },
  {
    id: 'w4',
    date: '2026-03-10',
    name: 'Back Day',
    durationMin: 45,
    createdAt: '2026-03-10T09:00:00Z',
    updatedAt: '2026-03-10T09:45:00Z',
  },
];

const mockWorkoutSets = [
  {
    id: 's1',
    workoutId: 'w1',
    exerciseId: 'bench-press',
    setNumber: 1,
    reps: 10,
    weightKg: 60,
    rpe: 7,
    updatedAt: '2026-03-23T10:10:00Z',
  },
  {
    id: 's2',
    workoutId: 'w1',
    exerciseId: 'bench-press',
    setNumber: 2,
    reps: 8,
    weightKg: 70,
    rpe: 8,
    updatedAt: '2026-03-23T10:15:00Z',
  },
  {
    id: 's3',
    workoutId: 'w2',
    exerciseId: 'running',
    setNumber: 1,
    weightKg: 0,
    durationMin: 30,
    updatedAt: '2026-03-21T06:10:00Z',
  },
  {
    id: 's4',
    workoutId: 'w3',
    exerciseId: 'squat',
    setNumber: 1,
    reps: 8,
    weightKg: 80,
    rpe: 8,
    updatedAt: '2026-03-25T10:10:00Z',
  },
  {
    id: 's5',
    workoutId: 'w3',
    exerciseId: 'squat',
    setNumber: 2,
    reps: 10,
    weightKg: 70,
    updatedAt: '2026-03-25T10:15:00Z',
  },
  {
    id: 's6',
    workoutId: 'w1',
    exerciseId: 'chest-fly',
    setNumber: 1,
    weightKg: 20,
    updatedAt: '2026-03-23T10:20:00Z',
  },
  {
    id: 's7',
    workoutId: 'w4',
    exerciseId: 'deadlift',
    setNumber: 1,
    reps: 5,
    weightKg: 100,
    rpe: 9,
    updatedAt: '2026-03-10T09:10:00Z',
  },
];

afterEach(cleanup);

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 2, 25, 12, 0, 0));
});

afterAll(() => {
  vi.useRealTimers();
});

describe('WorkoutHistory', () => {
  describe('empty state', () => {
    beforeEach(() => {
      mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
        selector({ workouts: [], workoutSets: [] }),
      );
    });

    it('renders empty state when no workouts', () => {
      render(<WorkoutHistory />);
      expect(screen.getByTestId('workout-history-empty')).toBeInTheDocument();
      expect(screen.getByText('Chưa có lịch sử tập luyện')).toBeInTheDocument();
    });

    it('shows correct subtitle in empty state', () => {
      render(<WorkoutHistory />);
      expect(screen.getByTestId('empty-subtitle')).toHaveTextContent(
        'Bắt đầu buổi tập đầu tiên để xem lịch sử tại đây',
      );
    });

    it('renders skeleton preview with 3 placeholder cards', () => {
      render(<WorkoutHistory />);
      expect(screen.getByTestId('skeleton-preview')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-card-3')).toBeInTheDocument();
    });

    it('skeleton preview is not interactive', () => {
      render(<WorkoutHistory />);
      const skeleton = screen.getByTestId('skeleton-preview');
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('with workouts', () => {
    const mockDeleteWorkout = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      mockDeleteWorkout.mockClear();
      mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          workouts: mockWorkouts,
          workoutSets: mockWorkoutSets,
          deleteWorkout: mockDeleteWorkout,
        }),
      );
    });

    it('renders workout list in reverse chronological order', () => {
      render(<WorkoutHistory />);
      const cards = screen.getAllByTestId(/^workout-card-/);
      expect(cards).toHaveLength(4);
      expect(cards[0]).toHaveAttribute('data-testid', 'workout-card-w3');
      expect(cards[1]).toHaveAttribute('data-testid', 'workout-card-w1');
      expect(cards[2]).toHaveAttribute('data-testid', 'workout-card-w2');
      expect(cards[3]).toHaveAttribute('data-testid', 'workout-card-w4');
    });

    it('shows workout name', () => {
      render(<WorkoutHistory />);
      expect(screen.getByTestId('workout-name-w1')).toHaveTextContent('Chest Day');
      expect(screen.getByTestId('workout-name-w2')).toHaveTextContent('Morning Run');
      expect(screen.getByTestId('workout-name-w3')).toHaveTextContent('Leg Day');
      expect(screen.getByTestId('workout-name-w4')).toHaveTextContent('Back Day');
    });

    it('displays relative dates for recent workouts', () => {
      render(<WorkoutHistory />);
      expect(screen.getByTestId('workout-date-w3')).toHaveTextContent('Hôm nay');
      expect(screen.getByTestId('workout-date-w1')).toHaveTextContent('2 ngày trước');
      expect(screen.getByTestId('workout-date-w2')).toHaveTextContent('4 ngày trước');
    });

    it('displays full date for older workouts (>6 days)', () => {
      render(<WorkoutHistory />);
      expect(screen.getByTestId('workout-date-w4')).toHaveTextContent('T3, 10/03/2026');
    });

    it('groups workouts by week with headers', () => {
      render(<WorkoutHistory />);
      const weekHeader1 = screen.getByTestId('week-header-2026-03-23');
      expect(weekHeader1).toHaveTextContent('Tuần từ 23/03');

      const weekHeader2 = screen.getByTestId('week-header-2026-03-16');
      expect(weekHeader2).toHaveTextContent('Tuần từ 16/03');

      const weekHeader3 = screen.getByTestId('week-header-2026-03-09');
      expect(weekHeader3).toHaveTextContent('Tuần từ 09/03');
    });

    it('shows exercise count per workout', () => {
      render(<WorkoutHistory />);
      expect(screen.getByTestId('workout-exercises-w1')).toHaveTextContent('2 bài tập');
      expect(screen.getByTestId('workout-exercises-w2')).toHaveTextContent('1 bài tập');
      expect(screen.getByTestId('workout-exercises-w3')).toHaveTextContent('1 bài tập');
      expect(screen.getByTestId('workout-exercises-w4')).toHaveTextContent('1 bài tập');
    });

    it('renders filter chips (All, Strength, Cardio)', () => {
      render(<WorkoutHistory />);
      expect(screen.getByTestId('filter-chips')).toBeInTheDocument();
      expect(screen.getByTestId('filter-all')).toHaveTextContent('Tất cả');
      expect(screen.getByTestId('filter-strength')).toHaveTextContent('Sức mạnh');
      expect(screen.getByTestId('filter-cardio')).toHaveTextContent('Cardio');
    });

    it('"All" filter is selected by default', () => {
      render(<WorkoutHistory />);
      expect(screen.getByTestId('filter-all')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('filter-strength')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('filter-cardio')).toHaveAttribute('aria-pressed', 'false');
    });

    it('filter chips have aria-label', () => {
      render(<WorkoutHistory />);
      expect(screen.getByTestId('filter-all')).toHaveAttribute('aria-label', 'Tất cả');
      expect(screen.getByTestId('filter-strength')).toHaveAttribute('aria-label', 'Sức mạnh');
      expect(screen.getByTestId('filter-cardio')).toHaveAttribute('aria-label', 'Cardio');
    });

    it('strength filter shows only strength workouts', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('filter-strength'));

      expect(screen.getByTestId('filter-strength')).toHaveAttribute('aria-pressed', 'true');
      const cards = screen.getAllByTestId(/^workout-card-/);
      expect(cards).toHaveLength(3);
      expect(screen.getByTestId('workout-card-w1')).toBeInTheDocument();
      expect(screen.getByTestId('workout-card-w3')).toBeInTheDocument();
      expect(screen.getByTestId('workout-card-w4')).toBeInTheDocument();
      expect(screen.queryByTestId('workout-card-w2')).not.toBeInTheDocument();
    });

    it('cardio filter shows only cardio workouts', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('filter-cardio'));

      expect(screen.getByTestId('filter-cardio')).toHaveAttribute('aria-pressed', 'true');
      const cards = screen.getAllByTestId(/^workout-card-/);
      expect(cards).toHaveLength(1);
      expect(screen.getByTestId('workout-card-w2')).toBeInTheDocument();
      expect(screen.queryByTestId('workout-card-w1')).not.toBeInTheDocument();
    });

    it('tap workout expands to show sets', () => {
      render(<WorkoutHistory />);
      expect(screen.queryByTestId('workout-detail-w3')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('workout-toggle-w3'));
      expect(screen.getByTestId('workout-detail-w3')).toBeInTheDocument();
      expect(screen.getByTestId('exercise-group-squat')).toBeInTheDocument();
    });

    it('toggle button has aria-expanded attribute', () => {
      render(<WorkoutHistory />);
      const toggle = screen.getByTestId('workout-toggle-w3');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    it('toggle button has aria-label with workout name', () => {
      render(<WorkoutHistory />);
      const toggle = screen.getByTestId('workout-toggle-w3');
      expect(toggle.getAttribute('aria-label')).toContain('Leg Day');
    });

    it('expanded view shows exercise details (weight × reps)', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('workout-toggle-w3'));

      const s4Detail = screen.getByTestId('set-detail-s4');
      expect(s4Detail.textContent).toContain('80kg × 8');
      expect(s4Detail.textContent).toContain('RPE 8');

      const s5Detail = screen.getByTestId('set-detail-s5');
      expect(s5Detail.textContent).toContain('70kg × 10');
      expect(s5Detail.textContent).not.toContain('RPE');
    });

    it('tap again collapses the workout', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('workout-toggle-w3'));
      expect(screen.getByTestId('workout-detail-w3')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('workout-toggle-w3'));
      expect(screen.queryByTestId('workout-detail-w3')).not.toBeInTheDocument();
    });

    it('only one workout expanded at a time', () => {
      render(<WorkoutHistory />);

      fireEvent.click(screen.getByTestId('workout-toggle-w3'));
      expect(screen.getByTestId('workout-detail-w3')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('workout-toggle-w2'));
      expect(screen.queryByTestId('workout-detail-w3')).not.toBeInTheDocument();
      expect(screen.getByTestId('workout-detail-w2')).toBeInTheDocument();

      const s3Detail = screen.getByTestId('set-detail-s3');
      expect(s3Detail.textContent).toContain('30');
      expect(s3Detail.textContent).toContain('phút');
    });

    it('shows zero reps when reps is undefined', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('workout-toggle-w1'));
      const s6Detail = screen.getByTestId('set-detail-s6');
      expect(s6Detail.textContent).toContain('20kg × 0');
    });

    it('total volume shown per workout', () => {
      render(<WorkoutHistory />);

      expect(screen.getByTestId('workout-volume-w1')).toHaveTextContent('1160 kg');

      expect(screen.getByTestId('workout-volume-w3')).toHaveTextContent('1340 kg');

      expect(screen.getByTestId('workout-volume-w4')).toHaveTextContent('500 kg');

      expect(screen.queryByTestId('workout-volume-w2')).not.toBeInTheDocument();
    });

    it('expanded view shows completion time', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('workout-toggle-w3'));

      const meta = screen.getByTestId('workout-meta-w3');
      expect(meta).toBeInTheDocument();

      const completed = screen.getByTestId('workout-completed-w3');
      expect(completed.textContent).toContain('Hoàn thành lúc');
      expect(completed.textContent).toMatch(/\d{2}:\d{2}/);
    });

    it('expanded view shows duration in detail', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('workout-toggle-w1'));

      expect(screen.getByTestId('workout-duration-detail-w1')).toHaveTextContent('60 phút');
    });

    it('expanded view shows notes when present', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('workout-toggle-w1'));

      const notes = screen.getByTestId('workout-notes-w1');
      expect(notes).toBeInTheDocument();
      expect(notes).toHaveTextContent('Felt strong today');
    });

    it('expanded view does not show notes when absent', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('workout-toggle-w3'));

      expect(screen.queryByTestId('workout-notes-w3')).not.toBeInTheDocument();
    });

    it('shows delete button when workout is expanded', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('workout-toggle-w3'));

      expect(screen.getByTestId('delete-workout-w3')).toBeInTheDocument();
    });

    it('delete button opens confirmation dialog', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('workout-toggle-w3'));
      fireEvent.click(screen.getByTestId('delete-workout-w3'));

      // ConfirmationModal renders — btn-confirm-action and btn-cancel-action should be present
      expect(screen.getByTestId('btn-confirm-action')).toBeInTheDocument();
      expect(screen.getByTestId('btn-cancel-action')).toBeInTheDocument();
    });

    it('cancel delete closes dialog without removing workout', () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('workout-toggle-w3'));
      fireEvent.click(screen.getByTestId('delete-workout-w3'));
      fireEvent.click(screen.getByTestId('btn-cancel-action'));

      expect(screen.getByTestId('workout-card-w3')).toBeInTheDocument();
      expect(screen.queryByTestId('btn-confirm-action')).not.toBeInTheDocument();
    });

    it('confirm delete calls deleteWorkout with correct id', async () => {
      render(<WorkoutHistory />);
      fireEvent.click(screen.getByTestId('workout-toggle-w3'));
      fireEvent.click(screen.getByTestId('delete-workout-w3'));

      // Must wrap in act since the handler is async
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-confirm-action'));
      });

      expect(mockDeleteWorkout).toHaveBeenCalledWith('w3');
    });
  });
});
