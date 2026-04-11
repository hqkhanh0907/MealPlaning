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
        'fitness.history.weekRange': 'Tuần {{week}}: {{start}} - {{end}}',
        'fitness.history.notes': 'Ghi chú',
        'fitness.history.completedAt': 'Hoàn thành lúc',
        'fitness.history.deletedExercise': 'Bài tập đã xóa',
        'fitness.history.prBadge': 'Kỷ lục mới',
        'fitness.history.prBadgeAria': 'Kỷ lục cá nhân mới cho {{exercise}}',
        'fitness.history.cloneWorkout': 'Sao chép buổi tập',
        'fitness.history.cloneWorkoutAria': 'Sao chép buổi tập {{name}}',
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

const mockNavigateTab = vi.fn();

vi.mock('../store/navigationStore', () => ({
  useNavigationStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({ navigateTab: mockNavigateTab }),
  ),
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
        selector({ workouts: [], workoutSets: [], setWorkoutDraft: vi.fn() }),
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
    const mockSetWorkoutDraft = vi.fn();

    beforeEach(() => {
      mockDeleteWorkout.mockClear();
      mockSetWorkoutDraft.mockClear();
      mockNavigateTab.mockClear();
      mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
        selector({
          workouts: mockWorkouts,
          workoutSets: mockWorkoutSets,
          deleteWorkout: mockDeleteWorkout,
          setWorkoutDraft: mockSetWorkoutDraft,
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

    it('groups workouts by week with headers showing ISO week + date range', () => {
      render(<WorkoutHistory />);
      const weekHeader1 = screen.getByTestId('week-header-2026-03-23');
      expect(weekHeader1).toHaveTextContent('Tuần 13: 23/03 - 29/03');

      const weekHeader2 = screen.getByTestId('week-header-2026-03-16');
      expect(weekHeader2).toHaveTextContent('Tuần 12: 16/03 - 22/03');

      const weekHeader3 = screen.getByTestId('week-header-2026-03-09');
      expect(weekHeader3).toHaveTextContent('Tuần 11: 09/03 - 15/03');
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

    describe('sticky week headers', () => {
      it('week headers have sticky positioning classes', () => {
        render(<WorkoutHistory />);
        const header = screen.getByTestId('week-header-2026-03-23');
        expect(header.className).toContain('sticky');
        expect(header.className).toContain('top-0');
        expect(header.className).toContain('z-10');
      });

      it('week headers are h3 elements', () => {
        render(<WorkoutHistory />);
        const header = screen.getByTestId('week-header-2026-03-23');
        expect(header.tagName).toBe('H3');
      });

      it('week header has bg-background for overlap visibility', () => {
        render(<WorkoutHistory />);
        const header = screen.getByTestId('week-header-2026-03-23');
        expect(header.className).toContain('bg-background');
      });
    });

    describe('week label format', () => {
      it('shows ISO week number in header', () => {
        render(<WorkoutHistory />);
        expect(screen.getByTestId('week-header-2026-03-23')).toHaveTextContent('Tuần 13');
        expect(screen.getByTestId('week-header-2026-03-16')).toHaveTextContent('Tuần 12');
        expect(screen.getByTestId('week-header-2026-03-09')).toHaveTextContent('Tuần 11');
      });

      it('shows start and end dates in dd/mm format', () => {
        render(<WorkoutHistory />);
        expect(screen.getByTestId('week-header-2026-03-23')).toHaveTextContent('23/03 - 29/03');
        expect(screen.getByTestId('week-header-2026-03-16')).toHaveTextContent('16/03 - 22/03');
        expect(screen.getByTestId('week-header-2026-03-09')).toHaveTextContent('09/03 - 15/03');
      });

      it('filtered view preserves correct week headers', () => {
        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('filter-cardio'));
        // w2 (2026-03-21) is the only cardio workout → week starting 2026-03-16
        expect(screen.getByTestId('week-header-2026-03-16')).toHaveTextContent('Tuần 12: 16/03 - 22/03');
        expect(screen.queryByTestId('week-header-2026-03-23')).not.toBeInTheDocument();
        expect(screen.queryByTestId('week-header-2026-03-09')).not.toBeInTheDocument();
      });
    });

    describe('clone workout button', () => {
      it('renders clone button for each workout card', () => {
        render(<WorkoutHistory />);
        expect(screen.getByTestId('clone-workout-w1')).toBeInTheDocument();
        expect(screen.getByTestId('clone-workout-w2')).toBeInTheDocument();
        expect(screen.getByTestId('clone-workout-w3')).toBeInTheDocument();
        expect(screen.getByTestId('clone-workout-w4')).toBeInTheDocument();
      });

      it('clone button has aria-label with workout name', () => {
        render(<WorkoutHistory />);
        expect(screen.getByTestId('clone-workout-w1')).toHaveAttribute('aria-label', 'Sao chép buổi tập Chest Day');
        expect(screen.getByTestId('clone-workout-w3')).toHaveAttribute('aria-label', 'Sao chép buổi tập Leg Day');
      });

      it('clone button is visible alongside toggle button', () => {
        render(<WorkoutHistory />);
        const card = screen.getByTestId('workout-card-w1');
        const toggle = screen.getByTestId('workout-toggle-w1');
        const clone = screen.getByTestId('clone-workout-w1');
        expect(card).toContainElement(toggle);
        expect(card).toContainElement(clone);
      });
    });

    describe('clone workout action', () => {
      // Use a real exerciseId from EXERCISES so handleClone finds it
      const realWorkouts = [
        {
          id: 'rw1',
          date: '2026-03-25',
          name: 'Bench Day',
          durationMin: 45,
          createdAt: '2026-03-25T09:00:00Z',
          updatedAt: '2026-03-25T09:45:00Z',
        },
      ];

      const realWorkoutSets = [
        {
          id: 'rs1',
          workoutId: 'rw1',
          exerciseId: 'barbell-bench-press',
          setNumber: 1,
          reps: 10,
          weightKg: 60,
          rpe: 7,
          updatedAt: '2026-03-25T09:10:00Z',
        },
        {
          id: 'rs2',
          workoutId: 'rw1',
          exerciseId: 'barbell-bench-press',
          setNumber: 2,
          reps: 8,
          weightKg: 70,
          rpe: 8,
          updatedAt: '2026-03-25T09:15:00Z',
        },
      ];

      it('calls setWorkoutDraft with exercises and cloned sets', () => {
        const localMockSetDraft = vi.fn();
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: realWorkouts,
            workoutSets: realWorkoutSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: localMockSetDraft,
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('clone-workout-rw1'));

        expect(localMockSetDraft).toHaveBeenCalledTimes(1);
        const draftArg = localMockSetDraft.mock.calls[0][0];
        expect(draftArg.exercises).toHaveLength(1);
        expect(draftArg.exercises[0].id).toBe('barbell-bench-press');
        expect(draftArg.sets).toHaveLength(2);
        expect(draftArg.elapsedSeconds).toBe(0);
        // Cloned sets have new IDs and empty workoutId
        expect(draftArg.sets[0].id).not.toBe('rs1');
        expect(draftArg.sets[0].workoutId).toBe('');
        expect(draftArg.sets[1].id).not.toBe('rs2');
        expect(draftArg.sets[1].workoutId).toBe('');
      });

      it('cloned sets preserve original weight and reps', () => {
        const localMockSetDraft = vi.fn();
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: realWorkouts,
            workoutSets: realWorkoutSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: localMockSetDraft,
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('clone-workout-rw1'));

        const draftArg = localMockSetDraft.mock.calls[0][0];
        expect(draftArg.sets[0].weightKg).toBe(60);
        expect(draftArg.sets[0].reps).toBe(10);
        expect(draftArg.sets[1].weightKg).toBe(70);
        expect(draftArg.sets[1].reps).toBe(8);
      });

      it('includes exerciseMetas in draft', () => {
        const localMockSetDraft = vi.fn();
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: realWorkouts,
            workoutSets: realWorkoutSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: localMockSetDraft,
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('clone-workout-rw1'));

        const draftArg = localMockSetDraft.mock.calls[0][0];
        expect(draftArg.exerciseMetas).toBeDefined();
        expect(draftArg.exerciseMetas).toHaveLength(1);
        expect(draftArg.exerciseMetas[0].exercise.id).toBe('barbell-bench-press');
        expect(draftArg.exerciseMetas[0].plannedSets).toBe(2);
        expect(draftArg.exerciseMetas[0].restSeconds).toBe(90);
      });

      it('navigates to fitness tab after cloning', () => {
        const localMockSetDraft = vi.fn();
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: realWorkouts,
            workoutSets: realWorkoutSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: localMockSetDraft,
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('clone-workout-rw1'));

        expect(mockNavigateTab).toHaveBeenCalledWith('fitness');
      });

      it('skips exercises not found in EXERCISES database', () => {
        const localMockSetDraft = vi.fn();
        const unknownSets = [
          {
            id: 'us1',
            workoutId: 'rw1',
            exerciseId: 'nonexistent-exercise-xyz',
            setNumber: 1,
            reps: 10,
            weightKg: 50,
            updatedAt: '2026-03-25T09:10:00Z',
          },
        ];
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: realWorkouts,
            workoutSets: unknownSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: localMockSetDraft,
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('clone-workout-rw1'));

        const draftArg = localMockSetDraft.mock.calls[0][0];
        expect(draftArg.exercises).toHaveLength(0);
        expect(draftArg.exerciseMetas).toBeUndefined();
      });

      it('handles cardio-only workout clone (exerciseId: null)', () => {
        const localMockSetDraft = vi.fn();
        const cardioSets = [
          {
            id: 'cs1',
            workoutId: 'rw1',
            exerciseId: null,
            setNumber: 1,
            weightKg: 0,
            durationMin: 30,
            updatedAt: '2026-03-25T09:10:00Z',
          },
        ];
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: realWorkouts,
            workoutSets: cardioSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: localMockSetDraft,
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('clone-workout-rw1'));

        const draftArg = localMockSetDraft.mock.calls[0][0];
        expect(draftArg.exercises).toHaveLength(0);
        expect(draftArg.sets).toHaveLength(1);
        expect(draftArg.sets[0].workoutId).toBe('');
      });
    });

    describe('PR badges', () => {
      // PR requires: same exerciseId + same reps + higher weightKg in current vs previous
      const prWorkouts = [
        {
          id: 'pw-old',
          date: '2026-03-10',
          name: 'Old Bench',
          createdAt: '2026-03-10T09:00:00Z',
          updatedAt: '2026-03-10T09:45:00Z',
        },
        {
          id: 'pw-new',
          date: '2026-03-25',
          name: 'PR Bench',
          createdAt: '2026-03-25T09:00:00Z',
          updatedAt: '2026-03-25T09:45:00Z',
        },
      ];

      const prWorkoutSets = [
        // Old workout: 60kg × 10
        {
          id: 'ps-old1',
          workoutId: 'pw-old',
          exerciseId: 'barbell-bench-press',
          setNumber: 1,
          reps: 10,
          weightKg: 60,
          updatedAt: '2026-03-10T09:10:00Z',
        },
        // New workout: 70kg × 10 (PR! — same reps, higher weight)
        {
          id: 'ps-new1',
          workoutId: 'pw-new',
          exerciseId: 'barbell-bench-press',
          setNumber: 1,
          reps: 10,
          weightKg: 70,
          updatedAt: '2026-03-25T09:10:00Z',
        },
      ];

      it('shows PR badge when expanded workout has a personal record', () => {
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: prWorkouts,
            workoutSets: prWorkoutSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: vi.fn(),
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('workout-toggle-pw-new'));

        expect(screen.getByTestId('pr-badge-barbell-bench-press')).toBeInTheDocument();
        expect(screen.getByTestId('pr-badge-barbell-bench-press')).toHaveTextContent('Kỷ lục mới');
      });

      it('PR badge has accessible aria-label', () => {
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: prWorkouts,
            workoutSets: prWorkoutSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: vi.fn(),
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('workout-toggle-pw-new'));

        const badge = screen.getByTestId('pr-badge-barbell-bench-press');
        expect(badge).toHaveAttribute('aria-label', 'Kỷ lục cá nhân mới cho Đẩy tạ đòn nằm ngang');
      });

      it('does not show PR badge when there is no improvement', () => {
        const noImprovementSets = [
          {
            id: 'ni-old1',
            workoutId: 'pw-old',
            exerciseId: 'barbell-bench-press',
            setNumber: 1,
            reps: 10,
            weightKg: 60,
            updatedAt: '2026-03-10T09:10:00Z',
          },
          // Same weight as before — no PR
          {
            id: 'ni-new1',
            workoutId: 'pw-new',
            exerciseId: 'barbell-bench-press',
            setNumber: 1,
            reps: 10,
            weightKg: 60,
            updatedAt: '2026-03-25T09:10:00Z',
          },
        ];

        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: prWorkouts,
            workoutSets: noImprovementSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: vi.fn(),
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('workout-toggle-pw-new'));

        expect(screen.queryByTestId('pr-badge-barbell-bench-press')).not.toBeInTheDocument();
      });

      it('does not show PR badge for first-ever workout (no history)', () => {
        const firstWorkoutSets = [
          {
            id: 'fw1',
            workoutId: 'pw-new',
            exerciseId: 'barbell-bench-press',
            setNumber: 1,
            reps: 10,
            weightKg: 70,
            updatedAt: '2026-03-25T09:10:00Z',
          },
        ];

        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: [prWorkouts[1]],
            workoutSets: firstWorkoutSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: vi.fn(),
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('workout-toggle-pw-new'));

        expect(screen.queryByTestId('pr-badge-barbell-bench-press')).not.toBeInTheDocument();
      });

      it('does not show PR badge for collapsed workout', () => {
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: prWorkouts,
            workoutSets: prWorkoutSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: vi.fn(),
          }),
        );

        render(<WorkoutHistory />);
        // Do NOT expand — PR badges only appear in expanded detail
        expect(screen.queryByTestId('pr-badge-barbell-bench-press')).not.toBeInTheDocument();
      });

      it('PR badge disappears when workout is collapsed', () => {
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: prWorkouts,
            workoutSets: prWorkoutSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: vi.fn(),
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('workout-toggle-pw-new'));
        expect(screen.getByTestId('pr-badge-barbell-bench-press')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('workout-toggle-pw-new'));
        expect(screen.queryByTestId('pr-badge-barbell-bench-press')).not.toBeInTheDocument();
      });

      it('old workout does not show PR badge when expanded', () => {
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: prWorkouts,
            workoutSets: prWorkoutSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: vi.fn(),
          }),
        );

        render(<WorkoutHistory />);
        // Expand the OLD workout (pw-old) — no previous sets before it
        fireEvent.click(screen.getByTestId('workout-toggle-pw-old'));
        expect(screen.queryByTestId('pr-badge-barbell-bench-press')).not.toBeInTheDocument();
      });
    });

    describe('deleted exercise display', () => {
      it('shows deleted exercise label for sets with null exerciseId', () => {
        const deletedSets = [
          {
            id: 'ds1',
            workoutId: 'w3',
            exerciseId: null,
            setNumber: 1,
            weightKg: 50,
            reps: 10,
            updatedAt: '2026-03-25T10:10:00Z',
          },
        ];
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: mockWorkouts,
            workoutSets: deletedSets,
            deleteWorkout: vi.fn(),
            setWorkoutDraft: vi.fn(),
          }),
        );

        render(<WorkoutHistory />);
        fireEvent.click(screen.getByTestId('workout-toggle-w3'));
        expect(screen.getByTestId('exercise-group-_deleted')).toBeInTheDocument();
        expect(screen.getByTestId('exercise-group-_deleted')).toHaveTextContent('Bài tập đã xóa');
      });
    });

    describe('ISO week number edge cases', () => {
      it('handles year boundary — Jan 1 2026 is Thursday (ISO week 1)', () => {
        const jan1Workouts = [
          {
            id: 'jan1',
            date: '2026-01-01',
            name: 'New Year',
            createdAt: '2026-01-01T09:00:00Z',
            updatedAt: '2026-01-01T09:45:00Z',
          },
        ];
        mockUseFitnessStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            workouts: jan1Workouts,
            workoutSets: [],
            deleteWorkout: vi.fn(),
            setWorkoutDraft: vi.fn(),
          }),
        );

        render(<WorkoutHistory />);
        // Jan 1, 2026 = Thursday → Monday of that week = Dec 29, 2025 → weekKey = 2025-12-29
        const header = screen.getByTestId('week-header-2025-12-29');
        expect(header).toHaveTextContent('Tuần 1');
        expect(header).toHaveTextContent('29/12 - 04/01');
      });
    });
  });
});
