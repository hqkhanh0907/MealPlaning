import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MacroBar } from '@/features/dashboard/components/MacroBar';

/* ------------------------------------------------------------------ */
/*  matchMedia mock                                                    */
/* ------------------------------------------------------------------ */

const originalMatchMedia = globalThis.matchMedia;

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  mockMatchMedia(false);
});

afterEach(() => {
  cleanup();
  Object.defineProperty(globalThis, 'matchMedia', { writable: true, value: originalMatchMedia });
  vi.restoreAllMocks();
});

describe('MacroBar', () => {
  const defaultProps = {
    label: 'Protein',
    current: 120,
    target: 180,
    colorClass: 'bg-macro-protein',
    testId: 'macro-protein',
  };

  it('renders label text', () => {
    render(<MacroBar {...defaultProps} />);
    expect(screen.getByText('Protein')).toBeInTheDocument();
  });

  it('renders current/target text in "Xg/Yg" format', () => {
    render(<MacroBar {...defaultProps} />);
    expect(screen.getByText('120/180g')).toBeInTheDocument();
  });

  it('applies data-testid from testId prop', () => {
    render(<MacroBar {...defaultProps} />);
    expect(screen.getByTestId('macro-protein')).toBeInTheDocument();
  });

  it('renders fill bar with correct percentage width', () => {
    mockMatchMedia(true);

    render(<MacroBar {...defaultProps} />);
    const fill = screen.getByTestId('macro-protein-fill');
    // 120/180 = 66.67% → round → 67%
    expect(fill.style.width).toBe('67%');
  });

  it('applies colorClass to fill bar', () => {
    render(<MacroBar {...defaultProps} />);
    const fill = screen.getByTestId('macro-protein-fill');
    expect(fill.className).toContain('bg-macro-protein');
  });

  it('handles NaN current gracefully (shows dash)', () => {
    render(<MacroBar {...defaultProps} current={NaN} />);
    expect(screen.getByText('—/180g')).toBeInTheDocument();
  });

  it('handles Infinity current gracefully (shows dash)', () => {
    render(<MacroBar {...defaultProps} current={Infinity} />);
    expect(screen.getByText('—/180g')).toBeInTheDocument();
  });

  it('handles NaN target gracefully (defaults to 0)', () => {
    render(<MacroBar {...defaultProps} target={NaN} />);
    expect(screen.getByText('120/0g')).toBeInTheDocument();
  });

  it('handles Infinity target gracefully (defaults to 0)', () => {
    render(<MacroBar {...defaultProps} target={Infinity} />);
    expect(screen.getByText('120/0g')).toBeInTheDocument();
  });

  it('handles 0 target without division by zero', () => {
    mockMatchMedia(true);

    render(<MacroBar {...defaultProps} target={0} />);
    expect(screen.getByTestId('macro-protein')).toBeInTheDocument();
    const fill = screen.getByTestId('macro-protein-fill');
    // target=0 → safeTarget=1, pct = min(100, round(120/1 * 100)) = 100%
    expect(fill.style.width).toBe('100%');
  });

  it('handles negative target (treated as 0)', () => {
    render(<MacroBar {...defaultProps} target={-50} />);
    expect(screen.getByText('120/0g')).toBeInTheDocument();
  });

  it('clamps percentage at 100% when current exceeds target', () => {
    mockMatchMedia(true);

    render(<MacroBar {...defaultProps} current={300} target={180} />);
    const fill = screen.getByTestId('macro-protein-fill');
    expect(fill.style.width).toBe('100%');
  });

  it('shows 0% fill when current is 0', () => {
    mockMatchMedia(true);

    render(<MacroBar {...defaultProps} current={0} />);
    const fill = screen.getByTestId('macro-protein-fill');
    expect(fill.style.width).toBe('0%');
    expect(screen.getByText('0/180g')).toBeInTheDocument();
  });

  it('uses 600ms enter animation when motion is allowed', () => {
    render(<MacroBar {...defaultProps} />);
    const fill = screen.getByTestId('macro-protein-fill');
    expect(fill.style.transitionDuration).toBe('600ms');
    expect(fill.style.transitionTimingFunction).toBe('var(--ease-enter)');
  });

  it('respects reduced motion — sets transition-duration: 0ms', () => {
    mockMatchMedia(true);

    render(<MacroBar {...defaultProps} />);
    const fill = screen.getByTestId('macro-protein-fill');
    expect(fill.style.transitionDuration).toBe('0ms');
  });

  it('rounds current and target for display', () => {
    render(<MacroBar {...defaultProps} current={119.7} target={180.3} />);
    expect(screen.getByText('120/180g')).toBeInTheDocument();
  });

  it('handles negative current (clamped to 0% fill)', () => {
    mockMatchMedia(true);

    render(<MacroBar {...defaultProps} current={-50} />);
    const fill = screen.getByTestId('macro-protein-fill');
    expect(fill.style.width).toBe('0%');
    expect(screen.getByText('-50/180g')).toBeInTheDocument();
  });

  it('is wrapped with React.memo (has displayName)', () => {
    expect(MacroBar.displayName).toBe('MacroBar');
  });

  it('renders with different colorClass (fat)', () => {
    render(<MacroBar label="Chất béo" current={50} target={80} colorClass="bg-macro-fat" testId="macro-fat" />);
    const fill = screen.getByTestId('macro-fat-fill');
    expect(fill.className).toContain('bg-macro-fat');
    expect(screen.getByText('Chất béo')).toBeInTheDocument();
  });

  it('renders with different colorClass (carbs)', () => {
    render(<MacroBar label="Carbs" current={200} target={300} colorClass="bg-macro-carbs" testId="macro-carbs" />);
    const fill = screen.getByTestId('macro-carbs-fill');
    expect(fill.className).toContain('bg-macro-carbs');
  });

  it('bar track has correct height class', () => {
    const { container } = render(<MacroBar {...defaultProps} />);
    const track = container.querySelector('.bg-muted');
    expect(track?.className).toContain('h-2');
    expect(track?.className).toContain('rounded-full');
  });
});
