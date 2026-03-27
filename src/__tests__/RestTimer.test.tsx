import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { RestTimer } from '../features/fitness/components/RestTimer';

afterEach(cleanup);

describe('RestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderTimer(overrides = {}) {
    const defaultProps = {
      durationSeconds: 90,
      onComplete: vi.fn(),
      onSkip: vi.fn(),
      onAddTime: vi.fn(),
    };
    const props = { ...defaultProps, ...overrides };
    const result = render(<RestTimer {...props} />);
    return { ...result, props };
  }

  it('renders timer with correct initial time display', () => {
    renderTimer({ durationSeconds: 90 });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:30');
  });

  it('displays time in mm:ss format (90s → "1:30")', () => {
    renderTimer({ durationSeconds: 90 });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:30');
  });

  it('displays time in mm:ss format for exact minutes (60s → "1:00")', () => {
    renderTimer({ durationSeconds: 60 });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:00');
  });

  it('displays time in mm:ss format for seconds only (45s → "0:45")', () => {
    renderTimer({ durationSeconds: 45 });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:45');
  });

  it('countdown decrements every second', () => {
    renderTimer({ durationSeconds: 90 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:29');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:28');
  });

  it('calls onComplete when timer reaches 0', () => {
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 3, onComplete });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('+30s button adds 30 seconds to remaining time', () => {
    renderTimer({ durationSeconds: 60 });

    fireEvent.click(screen.getByTestId('add-time-button'));
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:30');
  });

  it('skip button calls onSkip', () => {
    const onSkip = vi.fn();
    renderTimer({ onSkip });

    fireEvent.click(screen.getByTestId('skip-button'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('shows circular progress ring (SVG element exists)', () => {
    renderTimer();
    const ring = screen.getByTestId('progress-ring');
    expect(ring).toBeInTheDocument();
    expect(ring.tagName).toBe('svg');
  });

  it('progress ring depletes over time', () => {
    renderTimer({ durationSeconds: 10 });

    const circleBefore = screen.getByTestId('progress-circle');
    const offsetBefore = circleBefore.getAttribute('stroke-dashoffset');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const circleAfter = screen.getByTestId('progress-circle');
    const offsetAfter = circleAfter.getAttribute('stroke-dashoffset');

    expect(Number(offsetAfter)).toBeGreaterThan(Number(offsetBefore));
  });

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderTimer({ durationSeconds: 60 });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('onAddTime callback called when +30s pressed', () => {
    const onAddTime = vi.fn();
    renderTimer({ onAddTime });

    fireEvent.click(screen.getByTestId('add-time-button'));
    expect(onAddTime).toHaveBeenCalledWith(30);
  });

  it('renders overlay backdrop', () => {
    renderTimer();
    expect(screen.getByTestId('rest-timer-overlay')).toBeInTheDocument();
  });

  it('renders rest label', () => {
    renderTimer();
    expect(screen.getByText('Nghỉ')).toBeInTheDocument();
  });

  it('renders skip button with correct label', () => {
    renderTimer();
    expect(screen.getByText('Bỏ qua')).toBeInTheDocument();
  });

  it('renders add time button with correct label', () => {
    renderTimer();
    expect(screen.getByText('+30s')).toBeInTheDocument();
  });

  it('renders nothing when isVisible is false', () => {
    renderTimer({ isVisible: false });
    expect(screen.queryByTestId('rest-timer-overlay')).not.toBeInTheDocument();
  });

  it('has aria-label for accessibility', () => {
    renderTimer();
    const overlay = screen.getByTestId('rest-timer-overlay');
    expect(overlay).toHaveAttribute('aria-label', 'Nghỉ');
    expect(overlay).toHaveAttribute('role', 'dialog');
    expect(overlay).toHaveAttribute('aria-modal', 'true');
  });

  it('uses tabular-nums class on timer display', () => {
    renderTimer();
    const display = screen.getByTestId('timer-display');
    expect(display.className).toContain('tabular-nums');
  });

  it('does not call onComplete before timer finishes', () => {
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 10, onComplete });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('stops counting after reaching 0', () => {
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 2, onComplete });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:00');
  });

  it('works without onAddTime prop', () => {
    render(
      <RestTimer durationSeconds={60} onComplete={vi.fn()} onSkip={vi.fn()} />
    );

    expect(() => {
      fireEvent.click(screen.getByTestId('add-time-button'));
    }).not.toThrow();
  });

  it('skip clears the interval so timer stops', () => {
    const onSkip = vi.fn();
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 5, onSkip, onComplete });

    fireEvent.click(screen.getByTestId('skip-button'));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('progress ring has full circumference at start', () => {
    renderTimer({ durationSeconds: 10 });
    const circle = screen.getByTestId('progress-circle');
    const offset = Number(circle.getAttribute('stroke-dashoffset'));
    expect(offset).toBeCloseTo(0, 0);
  });

  it('handles zero duration gracefully', () => {
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 0, onComplete });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:00');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
