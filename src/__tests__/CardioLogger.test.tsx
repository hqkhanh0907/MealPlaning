import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CardioLogger } from '../features/fitness/components/CardioLogger';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import { useFitnessStore } from '../store/fitnessStore';

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: vi.fn(),
}));

vi.mock('../features/fitness/utils/cardioEstimator', () => ({
  estimateCardioBurn: vi.fn((_type: string, durationMin: number, _intensity: string, weightKg: number) =>
    Math.round((durationMin * 8 * weightKg) / 60),
  ),
}));

const mockNotifyError = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    success: vi.fn(),
    error: mockNotifyError,
    info: vi.fn(),
  }),
}));

const mockSaveWorkoutAtomic = vi.fn().mockResolvedValue(undefined);

afterEach(cleanup);

describe('CardioLogger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useFitnessStore as unknown as Mock).mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        saveWorkoutAtomic: mockSaveWorkoutAtomic,
      }),
    );
    (useHealthProfileStore as unknown as Mock).mockImplementation(
      (selector: (s: { profile: { weightKg: number } }) => unknown) => selector({ profile: { weightKg: 70 } }),
    );
    mockSaveWorkoutAtomic.mockReset();
    mockSaveWorkoutAtomic.mockResolvedValue(undefined);
    mockNotifyError.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    onComplete: vi.fn(),
    onBack: vi.fn(),
  };

  it('renders header with back button and timer', () => {
    render(<CardioLogger {...defaultProps} />);
    expect(screen.getByTestId('cardio-header')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('00:00');
    expect(screen.getByTestId('finish-button')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<CardioLogger {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders all 7 cardio type pills', () => {
    render(<CardioLogger {...defaultProps} />);
    expect(screen.getByTestId('cardio-type-running')).toBeInTheDocument();
    expect(screen.getByTestId('cardio-type-cycling')).toBeInTheDocument();
    expect(screen.getByTestId('cardio-type-swimming')).toBeInTheDocument();
    expect(screen.getByTestId('cardio-type-hiit')).toBeInTheDocument();
    expect(screen.getByTestId('cardio-type-walking')).toBeInTheDocument();
    expect(screen.getByTestId('cardio-type-elliptical')).toBeInTheDocument();
    expect(screen.getByTestId('cardio-type-rowing')).toBeInTheDocument();
  });

  it('highlights selected cardio type', () => {
    render(<CardioLogger {...defaultProps} />);
    // Running is default selected
    expect(screen.getByTestId('cardio-type-running')).toHaveClass('bg-primary');
    expect(screen.getByTestId('cardio-type-cycling')).not.toHaveClass('bg-primary');

    fireEvent.click(screen.getByTestId('cardio-type-cycling'));
    expect(screen.getByTestId('cardio-type-cycling')).toHaveClass('bg-primary');
    expect(screen.getByTestId('cardio-type-running')).not.toHaveClass('bg-primary');
  });

  it('stopwatch mode: start/pause/stop buttons work', () => {
    render(<CardioLogger {...defaultProps} />);
    expect(screen.getByTestId('stopwatch-display')).toHaveTextContent('00:00');

    // Start stopwatch
    fireEvent.click(screen.getByTestId('start-button'));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('stopwatch-display')).toHaveTextContent('00:05');

    // Pause
    fireEvent.click(screen.getByTestId('pause-button'));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('stopwatch-display')).toHaveTextContent('00:05');

    // Resume then stop
    fireEvent.click(screen.getByTestId('start-button'));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('stopwatch-display')).toHaveTextContent('00:07');

    fireEvent.click(screen.getByTestId('stop-button'));
    expect(screen.getByTestId('stopwatch-display')).toHaveTextContent('00:00');
  });

  it('manual mode: shows number input for duration', () => {
    render(<CardioLogger {...defaultProps} />);
    // Switch to manual mode
    fireEvent.click(screen.getByTestId('manual-mode-button'));
    expect(screen.getByTestId('manual-panel')).toBeInTheDocument();
    expect(screen.getByTestId('manual-duration-input')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('manual-duration-input'), {
      target: { value: '30' },
    });
    expect(screen.getByTestId('manual-duration-input')).toHaveValue('30');
  });

  it('distance field shown for running/cycling/swimming', () => {
    render(<CardioLogger {...defaultProps} />);
    // Running is default — distance should be visible
    expect(screen.getByTestId('distance-section')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cardio-type-cycling'));
    expect(screen.getByTestId('distance-section')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cardio-type-swimming'));
    expect(screen.getByTestId('distance-section')).toBeInTheDocument();
  });

  it('distance field hidden for HIIT and walking', () => {
    render(<CardioLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('cardio-type-hiit'));
    expect(screen.queryByTestId('distance-section')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cardio-type-walking'));
    expect(screen.queryByTestId('distance-section')).not.toBeInTheDocument();
  });

  it('intensity pills are selectable (low/moderate/high)', () => {
    render(<CardioLogger {...defaultProps} />);
    // Default is moderate
    expect(screen.getByTestId('intensity-moderate')).toHaveClass('bg-primary');

    fireEvent.click(screen.getByTestId('intensity-low'));
    expect(screen.getByTestId('intensity-low')).toHaveClass('bg-primary');
    expect(screen.getByTestId('intensity-moderate')).not.toHaveClass('bg-primary');

    fireEvent.click(screen.getByTestId('intensity-high'));
    expect(screen.getByTestId('intensity-high')).toHaveClass('bg-primary');
    expect(screen.getByTestId('intensity-low')).not.toHaveClass('bg-primary');
  });

  it('calorie preview updates based on type and duration', () => {
    render(<CardioLogger {...defaultProps} />);
    // Initially 0 because duration is 0
    expect(screen.getByTestId('calorie-value')).toHaveTextContent('0');

    // Switch to manual mode and set duration
    fireEvent.click(screen.getByTestId('manual-mode-button'));
    fireEvent.change(screen.getByTestId('manual-duration-input'), {
      target: { value: '30' },
    });
    // Mock: Math.round(30 * 8 * 70 / 60) = 280
    expect(screen.getByTestId('calorie-value')).toHaveTextContent('280');
  });

  it('save creates workout and calls onComplete', async () => {
    const onComplete = vi.fn();
    render(<CardioLogger {...defaultProps} onComplete={onComplete} />);

    // Set manual duration
    fireEvent.click(screen.getByTestId('manual-mode-button'));
    fireEvent.change(screen.getByTestId('manual-duration-input'), {
      target: { value: '20' },
    });

    fireEvent.click(screen.getByTestId('save-button'));
    await vi.waitFor(() => {
      expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    });

    const [workout, sets] = mockSaveWorkoutAtomic.mock.calls[0];
    expect(workout).toEqual(
      expect.objectContaining({
        name: 'Cardio',
        date: expect.any(String),
        durationMin: 20,
      }),
    );
    expect(sets).toHaveLength(1);
    expect(sets[0]).toEqual(
      expect.objectContaining({
        exerciseId: 'running',
        durationMin: 20,
        intensity: 'moderate',
      }),
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith();
  });

  it('elapsed timer increments in stopwatch mode', () => {
    render(<CardioLogger {...defaultProps} />);
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

  it('heart rate input accepts numbers', () => {
    render(<CardioLogger {...defaultProps} />);
    const hrInput = screen.getByTestId('heart-rate-input');

    fireEvent.change(hrInput, { target: { value: '145' } });
    expect(hrInput).toHaveValue('145');

    fireEvent.change(hrInput, { target: { value: '' } });
    expect(hrInput).toHaveValue('');
  });

  it('save via finish button in header also works', async () => {
    const onComplete = vi.fn();
    render(<CardioLogger {...defaultProps} onComplete={onComplete} />);
    fireEvent.click(screen.getByTestId('finish-button'));
    await vi.waitFor(() => {
      expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('distance input accepts values', () => {
    render(<CardioLogger {...defaultProps} />);
    const distInput = screen.getByTestId('distance-input');
    fireEvent.change(distInput, { target: { value: '5.2' } });
    expect(distInput).toHaveValue('5.2');

    fireEvent.change(distInput, { target: { value: '' } });
    expect(distInput).toHaveValue('');
  });

  it('stopwatch mode button toggles correctly', () => {
    render(<CardioLogger {...defaultProps} />);
    expect(screen.getByTestId('stopwatch-mode-button')).toHaveClass('bg-primary');

    fireEvent.click(screen.getByTestId('manual-mode-button'));
    expect(screen.getByTestId('manual-mode-button')).toHaveClass('bg-primary');
    expect(screen.getByTestId('stopwatch-mode-button')).not.toHaveClass('bg-primary');

    fireEvent.click(screen.getByTestId('stopwatch-mode-button'));
    expect(screen.getByTestId('stopwatch-mode-button')).toHaveClass('bg-primary');
  });

  it('saves with distance and heart rate when provided', async () => {
    render(<CardioLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('manual-mode-button'));
    fireEvent.change(screen.getByTestId('manual-duration-input'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByTestId('distance-input'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByTestId('heart-rate-input'), {
      target: { value: '150' },
    });
    fireEvent.click(screen.getByTestId('intensity-high'));

    fireEvent.click(screen.getByTestId('save-button'));
    await vi.waitFor(() => {
      expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    });

    const [, sets] = mockSaveWorkoutAtomic.mock.calls[0];
    expect(sets[0]).toEqual(
      expect.objectContaining({
        distanceKm: 5,
        avgHeartRate: 150,
        intensity: 'high',
        durationMin: 30,
      }),
    );
  });

  it('manual duration does not go below 0', () => {
    render(<CardioLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('manual-mode-button'));
    fireEvent.change(screen.getByTestId('manual-duration-input'), {
      target: { value: '-5' },
    });
    expect(screen.getByTestId('manual-duration-input')).toHaveValue('0');
  });

  it('clearing manual duration shows empty not zero', () => {
    render(<CardioLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('manual-mode-button'));
    fireEvent.change(screen.getByTestId('manual-duration-input'), {
      target: { value: '30' },
    });
    expect(screen.getByTestId('manual-duration-input')).toHaveValue('30');

    fireEvent.change(screen.getByTestId('manual-duration-input'), {
      target: { value: '' },
    });
    expect(screen.getByTestId('manual-duration-input')).toHaveValue('');
  });

  it('distance hidden for elliptical and rowing', () => {
    render(<CardioLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('cardio-type-elliptical'));
    expect(screen.queryByTestId('distance-section')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cardio-type-rowing'));
    expect(screen.queryByTestId('distance-section')).not.toBeInTheDocument();
  });

  it('calorie preview is 0 when duration is 0', () => {
    render(<CardioLogger {...defaultProps} />);
    expect(screen.getByTestId('calorie-value')).toHaveTextContent('0');
  });

  it('save with zero duration sends undefined durationMin', async () => {
    const onComplete = vi.fn();
    render(<CardioLogger {...defaultProps} onComplete={onComplete} />);
    fireEvent.click(screen.getByTestId('save-button'));

    await vi.waitFor(() => {
      expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    });

    const [workout, sets] = mockSaveWorkoutAtomic.mock.calls[0];
    expect(workout).toEqual(
      expect.objectContaining({
        durationMin: undefined,
      }),
    );
    expect(sets[0]).toEqual(
      expect.objectContaining({
        durationMin: undefined,
        estimatedCalories: undefined,
      }),
    );
  });

  it('shows error notification and does not call onComplete when save fails', async () => {
    mockSaveWorkoutAtomic.mockRejectedValueOnce(new Error('FK constraint'));
    const onComplete = vi.fn();
    render(<CardioLogger {...defaultProps} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId('manual-mode-button'));
    fireEvent.change(screen.getByTestId('manual-duration-input'), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByTestId('save-button'));

    await vi.waitFor(() => {
      expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    });

    await vi.waitFor(() => {
      expect(mockNotifyError).toHaveBeenCalledTimes(1);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('save passes correct exerciseId for HIIT (should be hiit-training)', async () => {
    render(<CardioLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('cardio-type-hiit'));
    fireEvent.click(screen.getByTestId('manual-mode-button'));
    fireEvent.change(screen.getByTestId('manual-duration-input'), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByTestId('save-button'));

    await vi.waitFor(() => {
      expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    });

    const [, sets] = mockSaveWorkoutAtomic.mock.calls[0];
    expect(sets[0].exerciseId).toBe('hiit-training');
  });

  it('save passes correct exerciseId for rowing (should be rowing-machine)', async () => {
    render(<CardioLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('cardio-type-rowing'));
    fireEvent.click(screen.getByTestId('manual-mode-button'));
    fireEvent.change(screen.getByTestId('manual-duration-input'), {
      target: { value: '15' },
    });
    fireEvent.click(screen.getByTestId('save-button'));

    await vi.waitFor(() => {
      expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    });

    const [, sets] = mockSaveWorkoutAtomic.mock.calls[0];
    expect(sets[0].exerciseId).toBe('rowing-machine');
  });

  it('TODO-18: mode toggle has segmented control container', () => {
    render(<CardioLogger {...defaultProps} />);
    const container = screen.getByTestId('mode-toggle-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('bg-muted', 'rounded-lg', 'p-1', 'gap-1');
  });

  it('TODO-18: inactive toggle button has bg-transparent', () => {
    render(<CardioLogger {...defaultProps} />);
    // Stopwatch is active by default → manual is inactive
    expect(screen.getByTestId('manual-mode-button')).toHaveClass('bg-transparent');
    expect(screen.getByTestId('stopwatch-mode-button')).not.toHaveClass('bg-transparent');

    fireEvent.click(screen.getByTestId('manual-mode-button'));
    expect(screen.getByTestId('stopwatch-mode-button')).toHaveClass('bg-transparent');
    expect(screen.getByTestId('manual-mode-button')).not.toHaveClass('bg-transparent');
  });

  it('TODO-05: stop button is narrower (w-1/3) than start/pause (flex-1)', () => {
    render(<CardioLogger {...defaultProps} />);
    expect(screen.getByTestId('stop-button')).toHaveClass('w-1/3');
    expect(screen.getByTestId('stop-button')).not.toHaveClass('flex-1');
    expect(screen.getByTestId('start-button')).toHaveClass('flex-1');
    expect(screen.getByTestId('start-button')).not.toHaveClass('w-1/3');
  });

  it('TODO-05: timer buttons have gap-4 spacing', () => {
    render(<CardioLogger {...defaultProps} />);
    const startBtn = screen.getByTestId('start-button');
    const buttonContainer = startBtn.parentElement;
    expect(buttonContainer).toHaveClass('gap-4');
  });

  it('TODO-07: inputs use type="text" instead of type="number"', () => {
    render(<CardioLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('manual-mode-button'));

    expect(screen.getByTestId('manual-duration-input')).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('distance-input')).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('heart-rate-input')).toHaveAttribute('type', 'text');
  });

  it('TODO-07: inputs have correct inputMode attributes', () => {
    render(<CardioLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('manual-mode-button'));

    expect(screen.getByTestId('manual-duration-input')).toHaveAttribute('inputMode', 'numeric');
    expect(screen.getByTestId('distance-input')).toHaveAttribute('inputMode', 'decimal');
    expect(screen.getByTestId('heart-rate-input')).toHaveAttribute('inputMode', 'numeric');
  });

  it('TODO-17: inputs have placeholder text', () => {
    render(<CardioLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('manual-mode-button'));

    expect(screen.getByTestId('manual-duration-input')).toHaveAttribute('placeholder', '0');
    expect(screen.getByTestId('distance-input')).toHaveAttribute('placeholder', '0.0');
    expect(screen.getByTestId('heart-rate-input')).toHaveAttribute('placeholder', '0');
  });
});
