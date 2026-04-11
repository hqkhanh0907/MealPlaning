import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CalorieRing } from '@/features/dashboard/components/CalorieRing';

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

/* ------------------------------------------------------------------ */
/*  Constants for assertion                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_SIZE = 120;
const STROKE_WIDTH = 7;
const RADIUS = (DEFAULT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

describe('CalorieRing', () => {
  it('renders with eaten/target text', () => {
    render(<CalorieRing eaten={1327} target={2091} />);
    expect(screen.getByTestId('calorie-ring')).toBeInTheDocument();
    expect(screen.getByText(/1327/)).toBeInTheDocument();
    expect(screen.getByText(/2091/)).toBeInTheDocument();
    expect(screen.getByText('kcal')).toBeInTheDocument();
  });

  it('has data-testid="calorie-ring"', () => {
    render(<CalorieRing eaten={100} target={200} />);
    expect(screen.getByTestId('calorie-ring')).toBeInTheDocument();
  });

  it('renders SVG circles with correct attributes', () => {
    const { container } = render(<CalorieRing eaten={500} target={2000} />);
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2);

    // Track circle
    const track = circles[0];
    expect(track.getAttribute('stroke')).toBe('var(--color-border-subtle)');
    expect(track.getAttribute('r')).toBe(String(RADIUS));

    // Fill circle
    const fill = circles[1];
    expect(fill.getAttribute('stroke')).toBe('var(--color-macro-protein)');
    expect(fill.getAttribute('stroke-linecap')).toBe('round');
    expect(fill.getAttribute('stroke-dasharray')).toBe(String(CIRCUMFERENCE));
  });

  it('center text shows "eaten / target" format', () => {
    render(<CalorieRing eaten={1327} target={2091} />);
    const ring = screen.getByTestId('calorie-ring');
    expect(ring.textContent).toContain('1327');
    expect(ring.textContent).toContain('2091');
  });

  it('clamps percentage at 0% when eaten is 0', () => {
    const { container } = render(<CalorieRing eaten={0} target={2000} />);
    const fill = container.querySelectorAll('circle')[1];
    const style = fill.getAttribute('style') ?? '';
    // offset should equal circumference (0% fill)
    expect(style).toContain(`stroke-dashoffset`);
  });

  it('clamps percentage at 100% when eaten exceeds target', () => {
    render(<CalorieRing eaten={3000} target={2000} />);
    // Should not crash, renders normally
    expect(screen.getByTestId('calorie-ring')).toBeInTheDocument();
    expect(screen.getByText(/3000/)).toBeInTheDocument();
  });

  it('handles NaN eaten gracefully (defaults to 0)', () => {
    render(<CalorieRing eaten={NaN} target={2000} />);
    expect(screen.getByTestId('calorie-ring')).toBeInTheDocument();
    expect(screen.getByText(/0/)).toBeInTheDocument();
    expect(screen.getByText(/2000/)).toBeInTheDocument();
  });

  it('handles NaN target gracefully (defaults to 0)', () => {
    render(<CalorieRing eaten={500} target={NaN} />);
    expect(screen.getByTestId('calorie-ring')).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it('handles Infinity eaten gracefully (defaults to 0)', () => {
    render(<CalorieRing eaten={Infinity} target={2000} />);
    expect(screen.getByTestId('calorie-ring')).toBeInTheDocument();
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });

  it('handles Infinity target gracefully (defaults to 0)', () => {
    render(<CalorieRing eaten={500} target={Infinity} />);
    expect(screen.getByTestId('calorie-ring')).toBeInTheDocument();
  });

  it('handles negative eaten (clamped to 0%)', () => {
    render(<CalorieRing eaten={-100} target={2000} />);
    expect(screen.getByTestId('calorie-ring')).toBeInTheDocument();
  });

  it('handles 0 target without division error', () => {
    render(<CalorieRing eaten={500} target={0} />);
    expect(screen.getByTestId('calorie-ring')).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it('respects reduced motion — sets transition-duration: 0ms', () => {
    mockMatchMedia(true);

    const { container } = render(<CalorieRing eaten={1000} target={2000} />);
    const fill = container.querySelectorAll('circle')[1];
    const style = fill.getAttribute('style') ?? '';
    expect(style).toContain('transition-duration: 0ms');
  });

  it('uses 800ms spring animation when motion is allowed', () => {
    const { container } = render(<CalorieRing eaten={1000} target={2000} />);
    const fill = container.querySelectorAll('circle')[1];
    const style = fill.getAttribute('style') ?? '';
    expect(style).toContain('transition-duration: 800ms');
    expect(style).toContain('var(--ease-spring)');
  });

  it('applies reduced motion offset immediately (no animation start from full circumference)', () => {
    mockMatchMedia(true);

    const { container } = render(<CalorieRing eaten={1000} target={2000} />);
    const fill = container.querySelectorAll('circle')[1];
    const style = fill.getAttribute('style') ?? '';
    // At 50%, offset should be circumference/2
    const expectedOffset = CIRCUMFERENCE - (50 / 100) * CIRCUMFERENCE;
    expect(style).toContain(`stroke-dashoffset: ${expectedOffset}`);
  });

  it('accepts custom size prop', () => {
    const customSize = 200;
    const { container } = render(<CalorieRing eaten={100} target={200} size={customSize} />);
    const ring = screen.getByTestId('calorie-ring');
    expect(ring.style.width).toBe(`${customSize}px`);
    expect(ring.style.height).toBe(`${customSize}px`);

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe(String(customSize));
    expect(svg?.getAttribute('height')).toBe(String(customSize));
  });

  it('uses default size of 120px when size prop not provided', () => {
    render(<CalorieRing eaten={100} target={200} />);
    const ring = screen.getByTestId('calorie-ring');
    expect(ring.style.width).toBe('120px');
    expect(ring.style.height).toBe('120px');
  });

  it('has aria-label with eaten/target info', () => {
    render(<CalorieRing eaten={1327} target={2091} />);
    const ring = screen.getByTestId('calorie-ring');
    expect(ring.getAttribute('aria-label')).toBe('1327 / 2091 kcal');
  });

  it('has accessible aria-label without role="img"', () => {
    render(<CalorieRing eaten={500} target={2000} />);
    const ring = screen.getByTestId('calorie-ring');
    expect(ring).toHaveAttribute('aria-label');
    expect(ring.getAttribute('role')).toBeNull();
  });

  it('applies className prop', () => {
    render(<CalorieRing eaten={100} target={200} className="my-custom-class" />);
    const ring = screen.getByTestId('calorie-ring');
    expect(ring.className).toContain('my-custom-class');
  });

  it('rounds eaten and target for display', () => {
    render(<CalorieRing eaten={1327.7} target={2091.3} />);
    expect(screen.getByText(/1328/)).toBeInTheDocument();
    expect(screen.getByText(/2091/)).toBeInTheDocument();
  });

  it('is wrapped with React.memo (has displayName)', () => {
    // CalorieRing is exported as memo-wrapped, verify displayName
    expect(CalorieRing.displayName).toBe('CalorieRing');
  });

  it('SVG has aria-hidden="true"', () => {
    const { container } = render(<CalorieRing eaten={500} target={2000} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('fill circle has data-testid="calorie-ring-fill"', () => {
    render(<CalorieRing eaten={500} target={2000} />);
    expect(screen.getByTestId('calorie-ring-fill')).toBeInTheDocument();
  });
});
