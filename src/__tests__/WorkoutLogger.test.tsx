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

const mockSaveWorkoutAtomic = vi.fn().mockResolvedValue(undefined);
const mockSetWorkoutDraft = vi.fn();
const mockClearWorkoutDraft = vi.fn();
const mockLoadWorkoutDraft = vi.fn().mockResolvedValue(undefined);
const mockSuggestNextSet = vi.fn();

vi.mock('../features/fitness/hooks/useProgressiveOverload', () => ({
  useProgressiveOverload: () => ({
    suggestNextSet: mockSuggestNextSet,
    getLastSets: vi.fn().mockReturnValue([]),
    checkPlateau: vi.fn().mockReturnValue({ isPlateaued: false, weeks: 0 }),
    analyzeExercisePlateau: vi.fn(),
    checkAcuteFatigue: vi.fn().mockReturnValue({ level: 'none', message: '' }),
    checkChronicOvertraining: vi.fn().mockReturnValue({ level: 'none', message: '' }),
    acuteFatigue: { level: 'none', message: '' },
    chronicOvertraining: { level: 'none', message: '' },
  }),
}));

afterEach(cleanup);

describe('WorkoutLogger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useFitnessStore as unknown as Mock).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({
          saveWorkoutAtomic: mockSaveWorkoutAtomic,
          setWorkoutDraft: mockSetWorkoutDraft,
          clearWorkoutDraft: mockClearWorkoutDraft,
          loadWorkoutDraft: mockLoadWorkoutDraft,
        }),
    );
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(
      () => ({ workoutDraft: null }),
    );
    mockSaveWorkoutAtomic.mockReset().mockResolvedValue(undefined);
    mockSetWorkoutDraft.mockReset();
    mockClearWorkoutDraft.mockReset();
    mockLoadWorkoutDraft.mockReset().mockResolvedValue(undefined);
    mockSuggestNextSet.mockReset().mockReturnValue({ weight: 0, reps: 8, source: 'manual' });
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
    exercises: ['bench-press'],
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

  it('shows empty state for empty exercises array', () => {
    const emptyPlan = {
      dayOfWeek: 1,
      workoutType: 'Test',
      exercises: [] as string[],
    };
    render(<WorkoutLogger {...defaultProps} planDay={emptyPlan} />);
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
    expect(screen.getByTestId('workout-summary-card')).toBeInTheDocument();
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

    const summary = screen.getByTestId('workout-summary-card');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('1,000 kg');
    expect(summary).toHaveTextContent('2');
    expect(summary).toHaveTextContent('01:05');
  });

  it('calls onComplete and stores workout on save', async () => {
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
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    expect(mockSaveWorkoutAtomic).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Push Day',
        date: expect.any(String),
      }),
      expect.arrayContaining([
        expect.objectContaining({
          exerciseId: 'bench-press',
          weightKg: 80,
          reps: 5,
        }),
      ]),
    );
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

  it('uses fallback workout name when no planDay (freestyle default)', async () => {
    const onComplete = vi.fn();
    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Buổi tập tự do',
      }),
    );
  });

  it('resolves multiple planned exercises', () => {
    const multiPlan = {
      dayOfWeek: 1,
      workoutType: 'Full Body',
      exercises: ['bench-press', 'squat'],
    };
    render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('exercise-section-squat'),
    ).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
    expect(
      screen.getByTestId('exercise-section-squat'),
    ).toHaveTextContent('Gánh tạ');
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

  it('assigns the same workoutId to all sets on batch save', async () => {
    const multiPlan = {
      dayOfWeek: 1,
      workoutType: 'Full Body',
      exercises: ['bench-press', 'squat'],
    };
    render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '80' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

    fireEvent.change(screen.getByTestId('weight-input-squat'), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByTestId('reps-input-squat'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByTestId('log-set-squat'));
    fireEvent.click(screen.getByText('Skip'));

    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);

    const savedWorkout = mockSaveWorkoutAtomic.mock.calls[0][0] as { id: string };
    const savedSets = mockSaveWorkoutAtomic.mock.calls[0][1] as { workoutId: string }[];
    expect(savedSets).toHaveLength(2);
    expect(savedSets[0].workoutId).toBe(savedWorkout.id);
    expect(savedSets[1].workoutId).toBe(savedWorkout.id);
  });

  it('clears draft on save', async () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));
    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockClearWorkoutDraft).toHaveBeenCalledTimes(1);
  });

  it('does not clear draft on save failure (transaction rollback)', async () => {
    const onComplete = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSaveWorkoutAtomic.mockRejectedValueOnce(new Error('Simulated DB failure'));

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
      target: { value: '8' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '80' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    expect(mockClearWorkoutDraft).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[WorkoutLogger] Save failed, draft preserved:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
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

  it('resolves exercises from string[] without JSON.parse', () => {
    const planDay = {
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: ['bench-press', 'squat'],
    };
    render(<WorkoutLogger {...defaultProps} planDay={planDay} />);

    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('exercise-section-squat'),
    ).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
    expect(
      screen.getByTestId('exercise-section-squat'),
    ).toHaveTextContent('Gánh tạ');
  });

  it('ignores unknown exercise IDs gracefully', () => {
    const planDay = {
      dayOfWeek: 1,
      workoutType: 'Test',
      exercises: ['bench-press', 'nonexistent-exercise'],
    };
    render(<WorkoutLogger {...defaultProps} planDay={planDay} />);

    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('exercise-section-nonexistent-exercise'),
    ).not.toBeInTheDocument();
  });

  it('calls loadWorkoutDraft on mount', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(mockLoadWorkoutDraft).toHaveBeenCalledTimes(1);
  });

  /* ---------- progressive overload chip ---------- */
  it('shows progressive overload suggestion chip', () => {
    mockSuggestNextSet.mockReturnValue({
      weight: 62.5,
      reps: 5,
      source: 'progressive_overload',
    });
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    expect(screen.getByTestId('overload-chip')).toHaveTextContent(
      '62.5kg × 5',
    );
  });

  it('applies suggestion to inputs on chip click', () => {
    mockSuggestNextSet.mockReturnValue({
      weight: 62.5,
      reps: 5,
      source: 'progressive_overload',
    });
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    fireEvent.click(screen.getByTestId('overload-chip'));
    expect(
      (screen.getByTestId('weight-input-bench-press') as HTMLInputElement)
        .value,
    ).toBe('62.5');
    expect(
      (screen.getByTestId('reps-input-bench-press') as HTMLInputElement)
        .value,
    ).toBe('5');
  });

  it('shows plateau warning when plateaued', () => {
    mockSuggestNextSet.mockReturnValue({
      weight: 60,
      reps: 5,
      source: 'progressive_overload',
      isPlateaued: true,
      plateauWeeks: 3,
    });
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    const chip = screen.getByTestId('overload-chip');
    expect(chip).toHaveTextContent('60kg × 5');
    expect(chip).toHaveTextContent('plateau 3w');
  });

  it('does not show overload chip when no suggestion data', () => {
    mockSuggestNextSet.mockReturnValue({
      weight: 0,
      reps: 8,
      source: 'manual',
    });
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    expect(screen.queryByTestId('overload-chip')).not.toBeInTheDocument();
  });

  /* ---------- planDayId and freestyle ---------- */
  it('includes planDayId in saved workout when planDay has id', async () => {
    const onComplete = vi.fn();
    const planDayWithId = {
      id: 'pd-1',
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: ['bench-press'],
    };
    render(
      <WorkoutLogger {...defaultProps} onComplete={onComplete} planDay={planDayWithId} />,
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
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockSaveWorkoutAtomic).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Push Day',
        planDayId: 'pd-1',
      }),
      expect.any(Array),
    );
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ planDayId: 'pd-1' }),
    );
  });

  it('saves workout with undefined planDayId when no planDay (freestyle)', async () => {
    const onComplete = vi.fn();
    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    const savedWorkout = mockSaveWorkoutAtomic.mock.calls[0][0] as Record<string, unknown>;
    expect(savedWorkout.planDayId).toBeUndefined();
  });

  it('shows freestyle name input after finishing a freestyle workout', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('finish-button'));

    expect(screen.getByTestId('freestyle-name-input')).toBeInTheDocument();
    expect(screen.getByText('Đặt tên buổi tập')).toBeInTheDocument();
  });

  it('does not show freestyle name input when planDay is provided', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    fireEvent.click(screen.getByTestId('finish-button'));

    expect(screen.queryByTestId('freestyle-name-input')).not.toBeInTheDocument();
  });

  it('uses custom freestyle name when provided', async () => {
    const onComplete = vi.fn();
    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId('finish-button'));
    fireEvent.change(screen.getByTestId('freestyle-name-input'), {
      target: { value: 'Leg Day Custom' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Leg Day Custom' }),
    );
  });

  it('add exercise button has sticky positioning', () => {
    render(<WorkoutLogger {...defaultProps} />);
    const container = screen.getByTestId('add-exercise-container');
    expect(container).toHaveClass('sticky');
    expect(container).toHaveClass('bottom-0');
    expect(container).toHaveClass('backdrop-blur-sm');
  });
});
