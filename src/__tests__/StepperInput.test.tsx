import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StepperInput } from '../features/fitness/components/StepperInput';

const defaultProps = {
  value: 50,
  step: 1,
  onChange: vi.fn(),
  testId: 'stepper-weight',
};

function renderStepper(overrides: Partial<Parameters<typeof StepperInput>[0]> = {}) {
  const onChange = vi.fn();
  const props = { ...defaultProps, ...overrides, onChange };
  const result = render(<StepperInput {...props} />);
  return { ...result, onChange };
}

/* ================================================================== */
/* SC_W301_01: Basic Rendering                                         */
/* ================================================================== */

describe('SC_W301_01: Basic Rendering', () => {
  it('TC_01: renders with default testId', () => {
    renderStepper();
    expect(screen.getByTestId('stepper-weight')).toBeInTheDocument();
    expect(screen.getByTestId('stepper-weight-decrement')).toBeInTheDocument();
    expect(screen.getByTestId('stepper-weight-increment')).toBeInTheDocument();
    const input = screen.getByTestId('stepper-weight-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('50');
  });

  it('TC_02: renders unit label when provided', () => {
    renderStepper({ unit: 'kg' });
    expect(screen.getByTestId('stepper-weight-unit')).toHaveTextContent('kg');
  });

  it('TC_03: renders label as accessible name', () => {
    renderStepper({ label: 'Cân nặng' });
    const input = screen.getByTestId('stepper-weight-input');
    expect(input).toHaveAttribute('aria-label', 'Cân nặng');
    const dec = screen.getByTestId('stepper-weight-decrement');
    expect(dec.getAttribute('aria-label')).toContain('Giảm');
    const inc = screen.getByTestId('stepper-weight-increment');
    expect(inc.getAttribute('aria-label')).toContain('Tăng');
  });

  it('TC_04: buttons have minimum touch target classes (BR-37)', () => {
    renderStepper();
    const dec = screen.getByTestId('stepper-weight-decrement');
    const inc = screen.getByTestId('stepper-weight-increment');
    for (const btn of [dec, inc]) {
      expect(btn.className).toContain('min-h-12');
      expect(btn.className).toContain('min-w-12');
      expect(btn.className).toContain('rounded-xl');
    }
  });

  it('TC_05: input field styling matches spec (AC-8)', () => {
    renderStepper();
    const input = screen.getByTestId('stepper-weight-input');
    const cls = input.className;
    expect(cls).toContain('h-12');
    expect(cls).toContain('w-20');
    expect(cls).toContain('rounded-lg');
    expect(cls).toContain('bg-muted');
    expect(cls).toContain('text-center');
    expect(cls).toContain('text-lg');
    expect(cls).toContain('font-semibold');
    expect(cls).toContain('tabular-nums');
  });

  it('TC_06: active scale animation class present (BR-42, AC-9)', () => {
    renderStepper();
    const dec = screen.getByTestId('stepper-weight-decrement');
    const inc = screen.getByTestId('stepper-weight-increment');
    for (const btn of [dec, inc]) {
      expect(btn.className).toContain('active:scale-[0.95]');
      expect(btn.className).toContain('motion-reduce:transform-none');
    }
  });
});

/* ================================================================== */
/* SC_W301_02: Single Tap Increment/Decrement                          */
/* ================================================================== */

describe('SC_W301_02: Single Tap Increment/Decrement', () => {
  it('TC_07: tap + increments by step=1 (reps)', () => {
    const { onChange } = renderStepper({ value: 5, step: 1 });
    fireEvent.pointerDown(screen.getByTestId('stepper-weight-increment'));
    fireEvent.pointerUp(screen.getByTestId('stepper-weight-increment'));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('TC_08: tap − decrements by step=1 (reps)', () => {
    const { onChange } = renderStepper({ value: 5, step: 1 });
    fireEvent.pointerDown(screen.getByTestId('stepper-weight-decrement'));
    fireEvent.pointerUp(screen.getByTestId('stepper-weight-decrement'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('TC_09: tap + increments by step=0.5 (weight)', () => {
    const { onChange } = renderStepper({ value: 75.0, step: 0.5 });
    fireEvent.pointerDown(screen.getByTestId('stepper-weight-increment'));
    fireEvent.pointerUp(screen.getByTestId('stepper-weight-increment'));
    expect(onChange).toHaveBeenCalledWith(75.5);
  });

  it('TC_10: tap − decrements by step=0.5 (weight)', () => {
    const { onChange } = renderStepper({ value: 75.0, step: 0.5 });
    fireEvent.pointerDown(screen.getByTestId('stepper-weight-decrement'));
    fireEvent.pointerUp(screen.getByTestId('stepper-weight-decrement'));
    expect(onChange).toHaveBeenCalledWith(74.5);
  });

  it('TC_11: multiple taps accumulate correctly', () => {
    const onChange = vi.fn();
    const { rerender } = render(<StepperInput value={10} step={1} onChange={onChange} testId="stepper-weight" />);
    const inc = screen.getByTestId('stepper-weight-increment');

    fireEvent.pointerDown(inc);
    fireEvent.pointerUp(inc);
    expect(onChange).toHaveBeenLastCalledWith(11);

    rerender(<StepperInput value={11} step={1} onChange={onChange} testId="stepper-weight" />);
    fireEvent.pointerDown(inc);
    fireEvent.pointerUp(inc);
    expect(onChange).toHaveBeenLastCalledWith(12);

    rerender(<StepperInput value={12} step={1} onChange={onChange} testId="stepper-weight" />);
    fireEvent.pointerDown(inc);
    fireEvent.pointerUp(inc);
    expect(onChange).toHaveBeenLastCalledWith(13);

    expect(onChange).toHaveBeenCalledTimes(3);
  });
});

/* ================================================================== */
/* SC_W301_03: Long-Press Rapid Increment                              */
/* ================================================================== */

describe('SC_W301_03: Long-Press Rapid Increment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('TC_12: hold ≥500ms triggers first rapid tick', () => {
    const { onChange } = renderStepper({ value: 50, step: 1 });
    const inc = screen.getByTestId('stepper-weight-increment');

    fireEvent.pointerDown(inc);
    // Initial click fires immediately → 51
    act(() => vi.advanceTimersByTime(500));
    // After 500ms timeout → 52
    fireEvent.pointerUp(inc);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, 51);
    expect(onChange).toHaveBeenNthCalledWith(2, 52);
  });

  it('TC_13: continued hold triggers repeated ticks at 150ms intervals', () => {
    const { onChange } = renderStepper({ value: 50, step: 1 });
    const inc = screen.getByTestId('stepper-weight-increment');

    fireEvent.pointerDown(inc); // immediate → 51
    act(() => vi.advanceTimersByTime(500)); // timeout tick → 52
    act(() => vi.advanceTimersByTime(450)); // 3 intervals → 53, 54, 55
    fireEvent.pointerUp(inc);

    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it('TC_14: long-press on decrement works identically', () => {
    const { onChange } = renderStepper({ value: 50, step: 0.5 });
    const dec = screen.getByTestId('stepper-weight-decrement');

    fireEvent.pointerDown(dec); // immediate → 49.5
    act(() => vi.advanceTimersByTime(500)); // timeout → 49.0
    act(() => vi.advanceTimersByTime(300)); // 2 intervals → 48.5, 48.0
    fireEvent.pointerUp(dec);

    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onChange).toHaveBeenNthCalledWith(1, 49.5);
    expect(onChange).toHaveBeenNthCalledWith(2, 49);
    expect(onChange).toHaveBeenNthCalledWith(3, 48.5);
    expect(onChange).toHaveBeenNthCalledWith(4, 48);
  });

  it('TC_15: pointerUp stops long-press immediately', () => {
    const { onChange } = renderStepper({ value: 50, step: 1 });
    const inc = screen.getByTestId('stepper-weight-increment');

    fireEvent.pointerDown(inc); // immediate → 51
    act(() => vi.advanceTimersByTime(500)); // timeout → 52
    fireEvent.pointerUp(inc);
    const countAfterUp = onChange.mock.calls.length;
    act(() => vi.advanceTimersByTime(1000));

    expect(onChange).toHaveBeenCalledTimes(countAfterUp);
  });

  it('TC_16: pointerLeave stops long-press (finger drag off)', () => {
    const { onChange } = renderStepper({ value: 50, step: 1 });
    const inc = screen.getByTestId('stepper-weight-increment');

    fireEvent.pointerDown(inc); // immediate → 51
    act(() => vi.advanceTimersByTime(500)); // timeout → 52
    const countBeforeLeave = onChange.mock.calls.length;
    fireEvent.pointerLeave(inc);
    act(() => vi.advanceTimersByTime(1000));

    expect(onChange).toHaveBeenCalledTimes(countBeforeLeave);
  });

  it('TC_17: short press (<500ms) does NOT trigger rapid mode', () => {
    const { onChange } = renderStepper({ value: 50, step: 1 });
    const inc = screen.getByTestId('stepper-weight-increment');

    fireEvent.pointerDown(inc); // immediate → 51
    act(() => vi.advanceTimersByTime(400)); // under threshold
    fireEvent.pointerUp(inc);
    act(() => vi.advanceTimersByTime(1000));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(51);
  });

  it('TC_18: long-press clamps at max during hold', () => {
    const { onChange } = renderStepper({ value: 298, step: 1, max: 300 });
    const inc = screen.getByTestId('stepper-weight-increment');

    fireEvent.pointerDown(inc); // immediate → 299
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.pointerUp(inc);

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toBe(300);
    // After reaching 300, no more calls
    const callsAt300 = onChange.mock.calls.filter(c => c[0] === 300).length;
    expect(callsAt300).toBe(1);
  });

  it('TC_19: long-press clamps at min during hold', () => {
    const { onChange } = renderStepper({ value: 2, step: 1, min: 0 });
    const dec = screen.getByTestId('stepper-weight-decrement');

    fireEvent.pointerDown(dec); // immediate → 1
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.pointerUp(dec);

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toBe(0);
    const callsAt0 = onChange.mock.calls.filter(c => c[0] === 0).length;
    expect(callsAt0).toBe(1);
  });
});

/* ================================================================== */
/* SC_W301_04: Manual Input                                            */
/* ================================================================== */

describe('SC_W301_04: Manual Input', () => {
  it('TC_20: type valid number in input field', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStepper({ value: 50, step: 1 });
    const input = screen.getByTestId('stepper-weight-input');

    await user.clear(input);
    await user.type(input, '75');
    await user.tab(); // blur

    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('TC_21: type valid decimal for weight (step=0.5)', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStepper({ value: 75.0, step: 0.5 });
    const input = screen.getByTestId('stepper-weight-input');

    await user.clear(input);
    await user.type(input, '80.5');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(80.5);
  });

  it('TC_22: empty input on blur reverts to current value', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStepper({ value: 50, step: 1 });
    const input = screen.getByTestId('stepper-weight-input');

    await user.clear(input);
    await user.tab();

    // onChange NOT called with NaN — either not called or called with previous value
    const nanCalls = onChange.mock.calls.filter(c => Number.isNaN(c[0]));
    expect(nanCalls).toHaveLength(0);
  });

  it('TC_23: input clamped to min on blur', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStepper({ value: 50, step: 1, min: 0 });
    const input = screen.getByTestId('stepper-weight-input');

    await user.clear(input);
    await user.type(input, '-5');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('TC_24: input clamped to max on blur', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStepper({ value: 50, step: 1, max: 300 });
    const input = screen.getByTestId('stepper-weight-input');

    await user.clear(input);
    await user.type(input, '999');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(300);
  });
});

/* ================================================================== */
/* SC_W301_05: Boundary Conditions                                     */
/* ================================================================== */

describe('SC_W301_05: Boundary Conditions', () => {
  it('TC_25: minus button disabled at min value (AC-4)', () => {
    const { onChange } = renderStepper({ value: 0, step: 1, min: 0 });
    const dec = screen.getByTestId('stepper-weight-decrement');
    expect(dec).toBeDisabled();
    fireEvent.pointerDown(dec);
    fireEvent.pointerUp(dec);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('TC_26: plus button disabled at max value (AC-5)', () => {
    const { onChange } = renderStepper({ value: 300, step: 1, max: 300 });
    const inc = screen.getByTestId('stepper-weight-increment');
    expect(inc).toBeDisabled();
    fireEvent.pointerDown(inc);
    fireEvent.pointerUp(inc);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('TC_27: value at min — decrement disabled, increment enabled', () => {
    const { onChange } = renderStepper({ value: 0, step: 0.5, min: 0 });
    expect(screen.getByTestId('stepper-weight-decrement')).toBeDisabled();
    expect(screen.getByTestId('stepper-weight-increment')).not.toBeDisabled();
    fireEvent.pointerDown(screen.getByTestId('stepper-weight-increment'));
    fireEvent.pointerUp(screen.getByTestId('stepper-weight-increment'));
    expect(onChange).toHaveBeenCalledWith(0.5);
  });

  it('TC_28: value at max — increment disabled, decrement enabled', () => {
    const { onChange } = renderStepper({ value: 300, step: 0.5, max: 300 });
    expect(screen.getByTestId('stepper-weight-increment')).toBeDisabled();
    expect(screen.getByTestId('stepper-weight-decrement')).not.toBeDisabled();
    fireEvent.pointerDown(screen.getByTestId('stepper-weight-decrement'));
    fireEvent.pointerUp(screen.getByTestId('stepper-weight-decrement'));
    expect(onChange).toHaveBeenCalledWith(299.5);
  });

  it('TC_29: no max prop — increment never disabled', () => {
    const { onChange } = renderStepper({ value: 99999, step: 1, max: undefined });
    const inc = screen.getByTestId('stepper-weight-increment');
    expect(inc).not.toBeDisabled();
    fireEvent.pointerDown(inc);
    fireEvent.pointerUp(inc);
    expect(onChange).toHaveBeenCalledWith(100000);
  });

  it('TC_30: min=0 prevents negative values', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <StepperInput value={0.5} step={0.5} min={0} onChange={onChange} testId="stepper-weight" />,
    );
    const dec = screen.getByTestId('stepper-weight-decrement');

    fireEvent.pointerDown(dec);
    fireEvent.pointerUp(dec);
    expect(onChange).toHaveBeenCalledWith(0);

    rerender(<StepperInput value={0} step={0.5} min={0} onChange={onChange} testId="stepper-weight" />);
    onChange.mockClear();
    fireEvent.pointerDown(dec);
    fireEvent.pointerUp(dec);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('TC_31: long-press does NOT start when at boundary (increment at max)', () => {
    vi.useFakeTimers();
    const { onChange } = renderStepper({ value: 300, step: 1, max: 300 });
    const inc = screen.getByTestId('stepper-weight-increment');

    fireEvent.pointerDown(inc);
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.pointerUp(inc);

    expect(onChange).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('TC_32: floating-point precision — step=0.5 from 0.1', () => {
    const { onChange } = renderStepper({ value: 0.1, step: 0.5 });
    fireEvent.pointerDown(screen.getByTestId('stepper-weight-increment'));
    fireEvent.pointerUp(screen.getByTestId('stepper-weight-increment'));
    expect(onChange).toHaveBeenCalledWith(0.6);
  });
});

/* ================================================================== */
/* SC_W301_06: Warning State                                           */
/* ================================================================== */

describe('SC_W301_06: Warning State', () => {
  it('TC_33: no warning when value ≤ warningThreshold', () => {
    renderStepper({ value: 300, warningThreshold: 300 });
    expect(screen.queryByTestId('stepper-weight-warning')).not.toBeInTheDocument();
  });

  it('TC_34: warning shown when value > warningThreshold (BR-14)', () => {
    renderStepper({ value: 301, step: 0.5, warningThreshold: 300 });
    const warning = screen.getByTestId('stepper-weight-warning');
    expect(warning).toBeInTheDocument();
    expect(warning.className).toContain('text-warning');
    expect(warning).toHaveTextContent('Cân nặng cao bất thường');
  });

  it('TC_35: warning appears dynamically when crossing threshold', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <StepperInput value={300} step={0.5} warningThreshold={300} onChange={onChange} testId="stepper-weight" />,
    );
    expect(screen.queryByTestId('stepper-weight-warning')).not.toBeInTheDocument();

    rerender(
      <StepperInput value={300.5} step={0.5} warningThreshold={300} onChange={onChange} testId="stepper-weight" />,
    );
    expect(screen.getByTestId('stepper-weight-warning')).toBeInTheDocument();
  });

  it('TC_36: warning disappears when value drops below threshold', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <StepperInput value={301} step={1} warningThreshold={300} onChange={onChange} testId="stepper-weight" />,
    );
    expect(screen.getByTestId('stepper-weight-warning')).toBeInTheDocument();

    rerender(<StepperInput value={300} step={1} warningThreshold={300} onChange={onChange} testId="stepper-weight" />);
    expect(screen.queryByTestId('stepper-weight-warning')).not.toBeInTheDocument();
  });

  it('TC_37: no warningThreshold prop — warning never shows', () => {
    renderStepper({ value: 99999 });
    expect(screen.queryByTestId('stepper-weight-warning')).not.toBeInTheDocument();
  });
});

/* ================================================================== */
/* SC_W301_07: Disabled State                                          */
/* ================================================================== */

describe('SC_W301_07: Disabled State', () => {
  it('TC_38: all interaction blocked when disabled=true', async () => {
    const { onChange } = renderStepper({ value: 50, step: 1, disabled: true });
    const inc = screen.getByTestId('stepper-weight-increment');
    const dec = screen.getByTestId('stepper-weight-decrement');
    const input = screen.getByTestId('stepper-weight-input');

    fireEvent.pointerDown(inc);
    fireEvent.pointerUp(inc);
    fireEvent.pointerDown(dec);
    fireEvent.pointerUp(dec);

    expect(onChange).not.toHaveBeenCalled();
    expect(inc).toBeDisabled();
    expect(dec).toBeDisabled();
    expect(input).toBeDisabled();
  });

  it('TC_39: disabled buttons have opacity-50 visual', () => {
    renderStepper({ disabled: true });
    const dec = screen.getByTestId('stepper-weight-decrement');
    const inc = screen.getByTestId('stepper-weight-increment');
    expect(dec.className).toContain('disabled:opacity-50');
    expect(inc.className).toContain('disabled:opacity-50');
  });

  it('TC_40: long-press does not trigger when disabled', () => {
    vi.useFakeTimers();
    const { onChange } = renderStepper({ value: 50, step: 1, disabled: true });
    const inc = screen.getByTestId('stepper-weight-increment');

    fireEvent.pointerDown(inc);
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.pointerUp(inc);

    expect(onChange).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

/* ================================================================== */
/* SC_W301_08: Compact Variant                                         */
/* ================================================================== */

describe('SC_W301_08: Compact Variant', () => {
  it('TC_41: compact mode renders smaller elements', () => {
    renderStepper({ compact: true });
    const dec = screen.getByTestId('stepper-weight-decrement');
    const inc = screen.getByTestId('stepper-weight-increment');
    const input = screen.getByTestId('stepper-weight-input');

    expect(dec.className).toContain('min-h-11');
    expect(dec.className).toContain('min-w-11');
    expect(inc.className).toContain('min-h-11');
    expect(inc.className).toContain('min-w-11');
    expect(input.className).toContain('h-11');
    expect(input.className).toContain('w-16');
  });

  it('TC_42: compact mode — functionality identical', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <StepperInput value={10} step={1} compact onChange={onChange} testId="stepper-weight" />,
    );
    const inc = screen.getByTestId('stepper-weight-increment');
    const dec = screen.getByTestId('stepper-weight-decrement');

    fireEvent.pointerDown(inc);
    fireEvent.pointerUp(inc);
    expect(onChange).toHaveBeenCalledWith(11);

    rerender(<StepperInput value={11} step={1} compact onChange={onChange} testId="stepper-weight" />);
    fireEvent.pointerDown(dec);
    fireEvent.pointerUp(dec);
    expect(onChange).toHaveBeenCalledWith(10);
  });
});

/* ================================================================== */
/* SC_W301_09: NaN Prevention                                          */
/* ================================================================== */

describe('SC_W301_09: NaN Prevention', () => {
  it('TC_43: non-numeric input rejected on blur', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStepper({ value: 50, step: 1 });
    const input = screen.getByTestId('stepper-weight-input');

    await user.clear(input);
    await user.type(input, 'abc');
    await user.tab();

    const nanCalls = onChange.mock.calls.filter(c => Number.isNaN(c[0]));
    expect(nanCalls).toHaveLength(0);
  });

  it('TC_44: input "1e2" (scientific notation) handled', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStepper({ value: 50, step: 1 });
    const input = screen.getByTestId('stepper-weight-input');

    await user.clear(input);
    await user.type(input, '1e2');
    await user.tab();

    // 1e2 = 100 — valid number. Either accepted or reverted, but NOT NaN.
    const nanCalls = onChange.mock.calls.filter(c => Number.isNaN(c[0]));
    expect(nanCalls).toHaveLength(0);
    if (onChange.mock.calls.length > 0) {
      const lastVal = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(Number.isFinite(lastVal)).toBe(true);
    }
  });

  it('TC_45: input with spaces handled', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStepper({ value: 50, step: 1 });
    const input = screen.getByTestId('stepper-weight-input');

    await user.clear(input);
    await user.type(input, ' 75 ');
    await user.tab();

    const nanCalls = onChange.mock.calls.filter(c => Number.isNaN(c[0]));
    expect(nanCalls).toHaveLength(0);
    // Trimmed should result in 75
    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('TC_46: input "0" is valid (when min=0)', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStepper({ value: 5, step: 1, min: 0 });
    const input = screen.getByTestId('stepper-weight-input');

    await user.clear(input);
    await user.type(input, '0');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('TC_47: extremely large number clamped', async () => {
    const user = userEvent.setup();
    const { onChange } = renderStepper({ value: 50, step: 1, max: 300 });
    const input = screen.getByTestId('stepper-weight-input');

    await user.clear(input);
    await user.type(input, '999999');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(300);
  });

  it('blur without editing does not call onChange', () => {
    const { onChange } = renderStepper({ value: 50, step: 1 });
    const input = screen.getByTestId('stepper-weight-input');
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });
});

/* ================================================================== */
/* SC_W301_10: Accessibility                                           */
/* ================================================================== */

describe('SC_W301_10: Accessibility', () => {
  it('TC_48: buttons have aria-labels with label context', () => {
    renderStepper({ label: 'Cân nặng' });
    const dec = screen.getByTestId('stepper-weight-decrement');
    const inc = screen.getByTestId('stepper-weight-increment');

    expect(dec.getAttribute('aria-label')).toMatch(/Giảm.*Cân nặng/);
    expect(inc.getAttribute('aria-label')).toMatch(/Tăng.*Cân nặng/);
  });

  it('TC_49: input has inputMode="decimal" for float step', () => {
    renderStepper({ step: 0.5 });
    expect(screen.getByTestId('stepper-weight-input')).toHaveAttribute('inputMode', 'decimal');
  });

  it('TC_50: input has inputMode="numeric" for integer step', () => {
    renderStepper({ step: 1 });
    expect(screen.getByTestId('stepper-weight-input')).toHaveAttribute('inputMode', 'numeric');
  });

  it('TC_51: warning has role="alert"', () => {
    renderStepper({ value: 301, warningThreshold: 300 });
    const warning = screen.getByTestId('stepper-weight-warning');
    expect(warning).toHaveAttribute('role', 'alert');
  });
});
