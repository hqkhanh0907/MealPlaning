import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import { RestTimer } from '../features/fitness/components/RestTimer';

afterEach(cleanup);

const CIRCUMFERENCE = 2 * Math.PI * 54; // 339.29200658769764

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

  // ===== SC_W303_01: Timer Display & Initialization =====

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

  it('TC_W303_02: timer display has text-4xl font-bold tabular-nums classes', () => {
    renderTimer();
    const display = screen.getByTestId('timer-display');
    expect(display.className).toContain('text-4xl');
    expect(display.className).toContain('font-bold');
    expect(display.className).toContain('tabular-nums');
  });

  it('TC_W303_03: displays 120s as "2:00"', () => {
    renderTimer({ durationSeconds: 120 });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('2:00');
  });

  // ===== SC_W303_02: Countdown Tick Accuracy =====

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

  it('stops counting after reaching 0', () => {
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 2, onComplete });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:00');
  });

  it('TC_W303_12: no ticks when isVisible flips to false mid-countdown', () => {
    const onComplete = vi.fn();
    const { rerender, props } = renderTimer({ durationSeconds: 10, onComplete });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:07');

    rerender(<RestTimer {...props} isVisible={false} />);
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onComplete).not.toHaveBeenCalled();

    rerender(<RestTimer {...props} isVisible={true} />);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:07');
  });

  // ===== SC_W303_03: SVG Ring Animation =====

  it('shows circular progress ring (SVG element exists)', () => {
    renderTimer();
    const ring = screen.getByTestId('progress-ring');
    expect(ring).toBeInTheDocument();
    expect(ring.tagName.toLowerCase()).toBe('progress');
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

  it('progress ring has full circumference at start', () => {
    renderTimer({ durationSeconds: 10 });
    const circle = screen.getByTestId('progress-circle');
    const offset = Number(circle.getAttribute('stroke-dashoffset'));
    expect(offset).toBeCloseTo(0, 0);
  });

  it('TC_W303_15: ring nearly depleted at d-1 seconds', () => {
    renderTimer({ durationSeconds: 10 });

    act(() => {
      vi.advanceTimersByTime(9000);
    });

    const circle = screen.getByTestId('progress-circle');
    const offset = Number(circle.getAttribute('stroke-dashoffset'));
    // remaining=1, progress=1/10=0.1, offset=CIRCUMFERENCE*0.9
    expect(offset).toBeCloseTo(CIRCUMFERENCE * 0.9, 0);
  });

  it('TC_W303_16: strokeDasharray equals CIRCUMFERENCE', () => {
    renderTimer({ durationSeconds: 10 });
    const circle = screen.getByTestId('progress-circle');
    expect(Number(circle.getAttribute('stroke-dasharray'))).toBeCloseTo(CIRCUMFERENCE, 2);
  });

  it('TC_W303_17: transition is stroke-dashoffset 1s linear', () => {
    renderTimer();
    const circle = screen.getByTestId('progress-circle');
    const transition = circle.style.transition;
    expect(transition).toContain('stroke-dashoffset');
    expect(transition).toContain('1s');
    expect(transition).toContain('linear');
  });

  it('TC_W303_18: circle has motion-reduce:[transition:none] class', () => {
    renderTimer();
    const circle = screen.getByTestId('progress-circle');
    expect(circle.getAttribute('class')).toContain('motion-reduce:[transition:none]');
  });

  it('TC_W303_19: SVG element has aria-hidden="true"', () => {
    renderTimer();
    const circle = screen.getByTestId('progress-circle');
    const svg = circle.closest('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  // ===== SC_W303_04: +30s Extension =====

  it('+30s button adds 30 seconds to remaining time', () => {
    renderTimer({ durationSeconds: 60 });

    fireEvent.click(screen.getByTestId('add-time-button'));
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:30');
  });

  it('onAddTime callback called when +30s pressed', () => {
    const onAddTime = vi.fn();
    renderTimer({ onAddTime });

    fireEvent.click(screen.getByTestId('add-time-button'));
    expect(onAddTime).toHaveBeenCalledWith(30);
  });

  it('works without onAddTime prop', () => {
    render(<RestTimer durationSeconds={60} onComplete={vi.fn()} onSkip={vi.fn()} />);

    expect(() => {
      fireEvent.click(screen.getByTestId('add-time-button'));
    }).not.toThrow();
  });

  it('TC_W303_23: multiple +30s presses accumulate', () => {
    const onAddTime = vi.fn();
    renderTimer({ durationSeconds: 60, onAddTime });

    fireEvent.click(screen.getByTestId('add-time-button'));
    fireEvent.click(screen.getByTestId('add-time-button'));
    fireEvent.click(screen.getByTestId('add-time-button'));

    expect(screen.getByTestId('timer-display')).toHaveTextContent('2:30');
    expect(onAddTime).toHaveBeenCalledTimes(3);
  });

  it('TC_W303_24: +30s in last 5 seconds extends and completes normally', () => {
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 10, onComplete });

    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:02');

    fireEvent.click(screen.getByTestId('add-time-button'));
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:32');

    act(() => {
      vi.advanceTimersByTime(32000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('TC_W303_25: +30s recalculates ring progress', () => {
    renderTimer({ durationSeconds: 10 });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const circle = screen.getByTestId('progress-circle');
    const offsetBefore = Number(circle.getAttribute('stroke-dashoffset'));
    expect(offsetBefore).toBeCloseTo(CIRCUMFERENCE * 0.5, 0);

    fireEvent.click(screen.getByTestId('add-time-button'));

    const offsetAfter = Number(circle.getAttribute('stroke-dashoffset'));
    // remaining=35, total=40, progress=35/40=0.875, offset=CIRCUMFERENCE*0.125
    expect(offsetAfter).toBeCloseTo(CIRCUMFERENCE * 0.125, 0);
    expect(offsetAfter).toBeLessThan(offsetBefore);
  });

  it('TC_W303_26: +30s while paused adds time but stays frozen', () => {
    renderTimer({ durationSeconds: 60 });

    fireEvent.click(screen.getByTestId('pause-button'));
    fireEvent.click(screen.getByTestId('add-time-button'));
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:30');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:30');

    fireEvent.click(screen.getByTestId('pause-button'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:29');
  });

  // ===== SC_W303_05: Skip Button =====

  it('skip button calls onSkip', () => {
    const onSkip = vi.fn();
    renderTimer({ onSkip });

    fireEvent.click(screen.getByTestId('skip-button'));
    expect(onSkip).toHaveBeenCalledTimes(1);
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

  it('TC_W303_29: skip does NOT call onComplete', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    renderTimer({ durationSeconds: 10, onComplete, onSkip });

    fireEvent.click(screen.getByTestId('skip-button'));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('TC_W303_30: skip while paused still calls onSkip', () => {
    const onSkip = vi.fn();
    renderTimer({ durationSeconds: 60, onSkip });

    fireEvent.click(screen.getByTestId('pause-button'));
    fireEvent.click(screen.getByTestId('skip-button'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  // ===== SC_W303_06: Pause/Resume Toggle =====

  it('TC_W303_31: pause button rendered with correct label', () => {
    renderTimer();
    const pauseBtn = screen.getByTestId('pause-button');
    expect(pauseBtn).toBeInTheDocument();
    expect(pauseBtn).toHaveTextContent('Tạm dừng');
  });

  it('TC_W303_32: click pause freezes countdown', () => {
    renderTimer({ durationSeconds: 90 });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:27');

    fireEvent.click(screen.getByTestId('pause-button'));

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:27');
  });

  it('TC_W303_33: pause button label changes to resume text', () => {
    renderTimer();
    const btn = screen.getByTestId('pause-button');
    expect(btn).toHaveTextContent('Tạm dừng');

    fireEvent.click(btn);
    expect(btn).toHaveTextContent('Tiếp tục');
  });

  it('TC_W303_34: resume restarts countdown from paused value', () => {
    renderTimer({ durationSeconds: 90 });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:27');

    fireEvent.click(screen.getByTestId('pause-button'));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:27');

    fireEvent.click(screen.getByTestId('pause-button'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1:26');
  });

  it('TC_W303_35: pause preserves exact value with no drift', () => {
    renderTimer({ durationSeconds: 10 });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:07');

    fireEvent.click(screen.getByTestId('pause-button'));

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:07');
  });

  it('TC_W303_36: multiple pause/resume cycles work correctly', () => {
    renderTimer({ durationSeconds: 20 });

    // Advance 3s → "0:17"
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:17');

    // Pause → advance 5s → still "0:17"
    fireEvent.click(screen.getByTestId('pause-button'));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:17');

    // Resume → advance 2s → "0:15"
    fireEvent.click(screen.getByTestId('pause-button'));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:15');

    // Pause → advance 10s → still "0:15"
    fireEvent.click(screen.getByTestId('pause-button'));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:15');

    // Resume → advance 5s → "0:10"
    fireEvent.click(screen.getByTestId('pause-button'));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:10');
  });

  it('TC_W303_37: timer cannot complete while paused', () => {
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 3, onComplete });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:01');

    fireEvent.click(screen.getByTestId('pause-button'));

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:01');
    expect(onComplete).not.toHaveBeenCalled();
  });

  // ===== SC_W303_07: Visual States & Ring Color =====

  it('TC_W303_38: running state has text-primary class on ring', () => {
    renderTimer();
    const circle = screen.getByTestId('progress-circle');
    expect(circle.getAttribute('class')).toContain('text-primary');
    expect(circle.getAttribute('class')).not.toContain('text-muted ');
  });

  it('TC_W303_39: paused state changes ring to text-muted class', () => {
    renderTimer();
    fireEvent.click(screen.getByTestId('pause-button'));
    const circle = screen.getByTestId('progress-circle');
    expect(circle.getAttribute('class')).toContain('text-muted');
    expect(circle.getAttribute('class')).not.toContain('text-primary');
  });

  it('TC_W303_40: resume restores ring to text-primary class', () => {
    renderTimer();
    fireEvent.click(screen.getByTestId('pause-button'));
    fireEvent.click(screen.getByTestId('pause-button'));
    const circle = screen.getByTestId('progress-circle');
    expect(circle.getAttribute('class')).toContain('text-primary');
    expect(circle.getAttribute('class')).not.toContain('text-muted ');
  });

  // ===== SC_W303_08: Auto-Complete & Auto-Advance =====

  it('TC_W303_43: interval cleared after reaching 0 — no further ticks', () => {
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 3, onComplete });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('TC_W303_44: onComplete fires after +30s extension expires', () => {
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 5, onComplete });

    fireEvent.click(screen.getByTestId('add-time-button'));
    // remaining=35, total=35

    act(() => {
      vi.advanceTimersByTime(35000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:00');
  });

  it('does not call onComplete before timer finishes', () => {
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 10, onComplete });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  // ===== SC_W303_09: Cleanup & Lifecycle =====

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderTimer({ durationSeconds: 60 });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('TC_W303_46: timer stops when isVisible changes to false', () => {
    const onComplete = vi.fn();
    const { rerender, props } = renderTimer({ durationSeconds: 5, onComplete });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    rerender(<RestTimer {...props} isVisible={false} />);

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('renders nothing when isVisible is false', () => {
    renderTimer({ isVisible: false });
    expect(screen.queryByTestId('rest-timer-overlay')).not.toBeInTheDocument();
  });

  it('handles zero duration gracefully', () => {
    const onComplete = vi.fn();
    renderTimer({ durationSeconds: 0, onComplete });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0:00');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  // ===== SC_W303_10: Accessibility =====

  it('has aria-label for accessibility', () => {
    renderTimer();
    const overlay = screen.getByTestId('rest-timer-overlay');
    expect(overlay).toHaveAttribute('aria-label', 'Nghỉ giữa set');
    expect(overlay).toHaveAttribute('aria-modal', 'true');
  });

  it('renders overlay backdrop', () => {
    renderTimer();
    expect(screen.getByTestId('rest-timer-overlay')).toBeInTheDocument();
  });

  it('renders rest label', () => {
    renderTimer();
    expect(screen.getByText('Nghỉ giữa set')).toBeInTheDocument();
  });

  it('renders skip button with correct label', () => {
    renderTimer();
    expect(screen.getByText('Bỏ qua')).toBeInTheDocument();
  });

  it('renders add time button with correct label', () => {
    renderTimer();
    expect(screen.getByText('Thêm thời gian')).toBeInTheDocument();
  });

  it('uses tabular-nums class on timer display', () => {
    renderTimer();
    const display = screen.getByTestId('timer-display');
    expect(display.className).toContain('tabular-nums');
  });

  it('TC_W303_49: progress element has valuenow, valuemin, valuemax', () => {
    renderTimer({ durationSeconds: 10 });
    const progress = screen.getByTestId('progress-ring');
    expect(progress).toHaveAttribute('aria-valuenow', '100');
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
  });

  it('TC_W303_50: progress aria-valuenow updates as timer ticks', () => {
    renderTimer({ durationSeconds: 10 });
    const progress = screen.getByTestId('progress-ring');
    expect(progress).toHaveAttribute('aria-valuenow', '100');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(progress).toHaveAttribute('aria-valuenow', '50');
  });

  it('TC_W303_51: all interactive buttons have aria-label', () => {
    renderTimer();
    expect(screen.getByTestId('add-time-button')).toHaveAttribute('aria-label');
    expect(screen.getByTestId('pause-button')).toHaveAttribute('aria-label');
    expect(screen.getByTestId('skip-button')).toHaveAttribute('aria-label');
  });

  it('TC_W303_52: SVG element has aria-hidden="true"', () => {
    renderTimer();
    const circle = screen.getByTestId('progress-circle');
    const svg = circle.closest('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
