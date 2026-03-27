import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import type { Mock } from 'vitest';
import { WorkoutLogger } from '../features/fitness/components/WorkoutLogger';
import { useFitnessStore } from '../store/fitnessStore';

vi.mock('../features/fitness/data/exerciseDatabase', () => ({
  EXERCISES: [
    {
      id: 'bench-press',
      nameVi: 'Đẩy tạ nằm',
      nameEn: 'Bench Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders', 'arms'],
      category: 'compound' as const,
      equipment: ['barbell'],
      contraindicated: [],
      exerciseType: 'strength' as const,
      defaultRepsMin: 8,
      defaultRepsMax: 12,
      isCustom: false as const,
    },
    {
      id: 'squat',
      nameVi: 'Gánh tạ',
      nameEn: 'Squat',
      muscleGroup: 'legs',
      secondaryMuscles: ['core', 'glutes'],
      category: 'compound' as const,
      equipment: ['barbell'],
      contraindicated: [],
      exerciseType: 'strength' as const,
      defaultRepsMin: 6,
      defaultRepsMax: 10,
      isCustom: false as const,
    },
  ],
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../features/fitness/components/RestTimer', () => ({
  RestTimer: vi.fn(
    (props: { onComplete: () => void; onSkip: () => void }) => (
      <div data-testid="rest-timer">
        <button type="button" onClick={props.onSkip}>
          Skip
        </button>
        <button type="button" onClick={props.onComplete}>
          Done
        </button>
      </div>
    ),
  ),
}));

vi.mock('../features/fitness/components/ExerciseSelector', () => ({
  ExerciseSelector: vi.fn(
    (props: {
      isOpen: boolean;
      onSelect: (exercise: {
        id: string;
        nameVi: string;
        muscleGroup: string;
        secondaryMuscles: string[];
        category: string;
        equipment: string[];
        contraindicated: string[];
        exerciseType: string;
        defaultRepsMin: number;
        defaultRepsMax: number;
        isCustom: boolean;
        updatedAt: string;
      }) => void;
      onClose: () => void;
    }) =>
      props.isOpen ? (
        <div data-testid="exercise-selector">
          <button
            type="button"
            onClick={() =>
              props.onSelect({
                id: 'test-ex',
                nameVi: 'Test Exercise',
                muscleGroup: 'chest',
                secondaryMuscles: [],
                category: 'compound',
                equipment: ['barbell'],
                contraindicated: [],
                exerciseType: 'strength',
                defaultRepsMin: 8,
                defaultRepsMax: 12,
                isCustom: false,
                updatedAt: '',
              })
            }
          >
            Select
          </button>
          <button type="button" onClick={props.onClose}>
            Close
          </button>
        </div>
      ) : null,
  ),
}));

const mockAddWorkout = vi.fn();
const mockAddWorkoutSet = vi.fn();
const mockSetWorkoutDraft = vi.fn();
const mockClearWorkoutDraft = vi.fn();

afterEach(cleanup);

describe('WorkoutLogger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useFitnessStore as unknown as Mock).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({
          addWorkout: mockAddWorkout,
          addWorkoutSet: mockAddWorkoutSet,
          setWorkoutDraft: mockSetWorkoutDraft,
          clearWorkoutDraft: mockClearWorkoutDraft,
        }),
    );
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(
      () => ({ workoutDraft: null }),
    );
    mockAddWorkout.mockReset();
    mockAddWorkoutSet.mockReset();
    mockSetWorkoutDraft.mockReset();
    mockClearWorkoutDraft.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    onComplete: vi.fn(),
    onBack: vi.fn(),
  };

  const planDayWithExercises = {
    dayOfWeek: 1,
    workoutType: 'Push Day',
    exercises: JSON.stringify(['bench-press']),
  };

  it('renders header with back button and timer', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(screen.getByTestId('workout-header')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('00:00');
    expect(screen.getByTestId('finish-button')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<WorkoutLogger {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('increments elapsed timer each second', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('00:00');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('00:01');

    act(() => {
      vi.advanceTimersByTime(59000);
    });
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('01:00');
  });

  it('shows planned exercises when planDay provided', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
  });

  it('shows empty state when no exercises', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('Chưa có bài tập. Thêm bài tập để bắt đầu.'),
    ).toBeInTheDocument();
  });

  it('shows empty state for invalid exercises JSON', () => {
    const invalidPlan = {
      dayOfWeek: 1,
      workoutType: 'Test',
      exercises: 'not-valid-json',
    };
    render(<WorkoutLogger {...defaultProps} planDay={invalidPlan} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('can log a set with weight and reps', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));

    expect(screen.getByText(/60kg × 10/)).toBeInTheDocument();
  });

  it('shows rest timer after logging a set', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();
  });

  it('hides rest timer on skip', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Skip'));
    expect(screen.queryByTestId('rest-timer')).not.toBeInTheDocument();
  });

  it('hides rest timer on complete', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByTestId('rest-timer')).not.toBeInTheDocument();
  });

  it('opens exercise selector on add exercise click', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-exercise-button'));
    expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();
  });

  it('adds selected exercise from selector to list', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-exercise-button'));
    fireEvent.click(screen.getByText('Select'));

    expect(
      screen.getByTestId('exercise-section-test-ex'),
    ).toBeInTheDocument();
    expect(screen.getByText('Test Exercise')).toBeInTheDocument();
    expect(
      screen.queryByTestId('exercise-selector'),
    ).not.toBeInTheDocument();
  });

  it('closes exercise selector without selecting', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-exercise-button'));
    expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(
      screen.queryByTestId('exercise-selector'),
    ).not.toBeInTheDocument();
  });

  it('shows summary on finish', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('finish-button'));
    expect(screen.getByTestId('workout-summary')).toBeInTheDocument();
    expect(screen.getByText('Tổng kết buổi tập')).toBeInTheDocument();
  });

  it('shows correct duration and volume in summary', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

    // Log a second set to exercise the filter callback on non-empty prev
    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

    act(() => {
      vi.advanceTimersByTime(65000);
    });

    fireEvent.click(screen.getByTestId('finish-button'));

    expect(screen.getByTestId('summary-volume')).toHaveTextContent('1000');
    expect(screen.getByTestId('summary-sets')).toHaveTextContent('2');
    expect(screen.getByTestId('summary-duration')).toHaveTextContent(
      '01:05',
    );
  });

  it('calls onComplete and stores workout on save', () => {
    const onComplete = vi.fn();
    render(
      <WorkoutLogger
        {...defaultProps}
        onComplete={onComplete}
        planDay={planDayWithExercises}
      />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '80' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));
    fireEvent.click(screen.getByTestId('finish-button'));
    fireEvent.click(screen.getByTestId('save-workout-button'));

    expect(mockAddWorkout).toHaveBeenCalledTimes(1);
    expect(mockAddWorkoutSet).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Push Day',
        date: expect.any(String),
      }),
    );
  });

  it('allows RPE selection and toggle', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    const rpe8 = screen.getByTestId('rpe-8-bench-press');
    fireEvent.click(rpe8);
    expect(rpe8).toHaveClass('bg-emerald-500');

    fireEvent.click(rpe8);
    expect(rpe8).not.toHaveClass('bg-emerald-500');
  });

  it('adjusts weight with ±2.5kg buttons', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    const weightInput = screen.getByTestId(
      'weight-input-bench-press',
    ) as HTMLInputElement;

    expect(weightInput.value).toBe('0');

    fireEvent.click(screen.getByTestId('weight-plus-bench-press'));
    expect(weightInput.value).toBe('2.5');

    fireEvent.click(screen.getByTestId('weight-plus-bench-press'));
    expect(weightInput.value).toBe('5');

    fireEvent.click(screen.getByTestId('weight-minus-bench-press'));
    expect(weightInput.value).toBe('2.5');

    fireEvent.click(screen.getByTestId('weight-minus-bench-press'));
    fireEvent.click(screen.getByTestId('weight-minus-bench-press'));
    expect(weightInput.value).toBe('0');
  });

  it('logs set with RPE and displays it', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '70' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByTestId('rpe-9-bench-press'));
    fireEvent.click(screen.getByTestId('log-set-bench-press'));

    expect(screen.getByText(/70kg × 8/)).toBeInTheDocument();
    expect(screen.getByText('RPE 9')).toBeInTheDocument();
  });

  it('uses fallback workout name when no planDay', () => {
    const onComplete = vi.fn();
    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId('finish-button'));
    fireEvent.click(screen.getByTestId('save-workout-button'));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ghi nhận buổi tập',
      }),
    );
  });

  it('resolves multiple planned exercises', () => {
    const multiPlan = {
      dayOfWeek: 1,
      workoutType: 'Full Body',
      exercises: JSON.stringify(['bench-press', 'squat']),
    };
    render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('exercise-section-squat'),
    ).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
    expect(screen.getByText('Gánh tạ')).toBeInTheDocument();
  });

  /* ---------- workout draft persistence ---------- */
  it('restores draft on mount', () => {
    const draft = {
      exercises: [
        {
          id: 'bench-press',
          nameVi: 'Đẩy tạ nằm',
          nameEn: 'Bench Press',
          muscleGroup: 'chest',
          secondaryMuscles: ['shoulders', 'arms'],
          category: 'compound',
          equipment: ['barbell'],
          contraindicated: [],
          exerciseType: 'strength',
          defaultRepsMin: 8,
          defaultRepsMax: 12,
          isCustom: false,
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      sets: [
        {
          id: 'set-draft-1',
          workoutId: '',
          exerciseId: 'bench-press',
          setNumber: 1,
          reps: 10,
          weightKg: 60,
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      elapsedSeconds: 120,
    };
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(
      () => ({ workoutDraft: draft }),
    );

    render(<WorkoutLogger {...defaultProps} />);

    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    expect(screen.getByText(/60kg × 10/)).toBeInTheDocument();
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('02:00');
  });

  it('does not restore when draft is null', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('00:00');
  });

  it('saves draft after debounce when exercises change', () => {
    render(<WorkoutLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-exercise-button'));
    fireEvent.click(screen.getByText('Select'));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockSetWorkoutDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        exercises: expect.arrayContaining([
          expect.objectContaining({ id: 'test-ex' }),
        ]),
      }),
    );
  });

  it('saves draft after debounce when sets change', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockSetWorkoutDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        sets: expect.arrayContaining([
          expect.objectContaining({
            exerciseId: 'bench-press',
            weightKg: 50,
            reps: 8,
          }),
        ]),
      }),
    );
  });

  it('does not save draft before debounce period', () => {
    render(<WorkoutLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-exercise-button'));
    fireEvent.click(screen.getByText('Select'));

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockSetWorkoutDraft).not.toHaveBeenCalled();
  });

  it('clears draft on save', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));
    fireEvent.click(screen.getByTestId('finish-button'));
    fireEvent.click(screen.getByTestId('save-workout-button'));

    expect(mockClearWorkoutDraft).toHaveBeenCalledTimes(1);
  });

  it('clears draft on back', () => {
    render(<WorkoutLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('back-button'));

    expect(mockClearWorkoutDraft).toHaveBeenCalledTimes(1);
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('does not save draft when no exercises or sets exist', () => {
    render(<WorkoutLogger {...defaultProps} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSetWorkoutDraft).not.toHaveBeenCalled();
  });
});
