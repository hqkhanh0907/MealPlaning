import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import VolumeTrendChart, { type WeekVolume } from '@/features/fitness/components/VolumeTrendChart';

function makeWeeks(data: Array<[string, number, boolean]>): WeekVolume[] {
  return data.map(([weekLabel, volume, isCurrent]) => ({ weekLabel, volume, isCurrent }));
}

describe('VolumeTrendChart', () => {
  // ─── TC_W401_01-02: Empty state ───
  it('TC_W401_01: shows empty message when weeks=[]', () => {
    render(<VolumeTrendChart weeks={[]} />);
    expect(screen.getByTestId('volume-trend-empty')).toBeInTheDocument();
    expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument();
  });

  it('TC_W401_02: no bars rendered when weeks=[]', () => {
    render(<VolumeTrendChart weeks={[]} />);
    expect(screen.queryByTestId('volume-bar-0')).not.toBeInTheDocument();
    expect(screen.queryByTestId('volume-trend-chart')).not.toBeInTheDocument();
  });

  // ─── TC_W401_03-04: Single week ───
  it('TC_W401_03: single week renders 1 bar', () => {
    const weeks = makeWeeks([['W1', 3000, true]]);
    render(<VolumeTrendChart weeks={weeks} />);
    expect(screen.getByTestId('volume-bar-0')).toBeInTheDocument();
    expect(screen.queryByTestId('volume-bar-1')).not.toBeInTheDocument();
  });

  it('TC_W401_04: single week bar has 100% height', () => {
    const weeks = makeWeeks([['W1', 3000, true]]);
    render(<VolumeTrendChart weeks={weeks} />);
    const bar = screen.getByTestId('volume-bar-0');
    expect(bar).toHaveStyle({ height: '100%' });
  });

  // ─── TC_W401_05-06: 8 weeks proportional ───
  it('TC_W401_05: 8 weeks renders 8 bars', () => {
    const weeks = makeWeeks([
      ['W1', 2000, false],
      ['W2', 3000, false],
      ['W3', 3500, false],
      ['W4', 4000, false],
      ['W5', 4200, false],
      ['W6', 4500, false],
      ['W7', 5000, false],
      ['W8', 5500, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    for (let i = 0; i < 8; i++) {
      expect(screen.getByTestId(`volume-bar-${i}`)).toBeInTheDocument();
    }
  });

  it('TC_W401_06: 8 weeks proportional heights (maxVolume=5500)', () => {
    const weeks = makeWeeks([
      ['W1', 2000, false],
      ['W2', 3000, false],
      ['W3', 3500, false],
      ['W4', 4000, false],
      ['W5', 4200, false],
      ['W6', 4500, false],
      ['W7', 5000, false],
      ['W8', 5500, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    const expected = [36, 55, 64, 73, 76, 82, 91, 100];
    expected.forEach((pct, i) => {
      expect(screen.getByTestId(`volume-bar-${i}`)).toHaveStyle({ height: `${pct}%` });
    });
  });

  // ─── TC_W401_07-09: Current week highlighting ───
  it('TC_W401_07: current week bar has bg-primary class', () => {
    const weeks = makeWeeks([
      ['W1', 100, false],
      ['W2', 200, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    const bar = screen.getByTestId('volume-bar-1');
    expect(bar.className).toContain('bg-primary');
    expect(bar.className).not.toContain('bg-primary/30');
  });

  it('TC_W401_08: non-current week bar has bg-primary/30 class', () => {
    const weeks = makeWeeks([
      ['W1', 100, false],
      ['W2', 200, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    const bar = screen.getByTestId('volume-bar-0');
    expect(bar.className).toContain('bg-primary/30');
  });

  it('TC_W401_09: only one bar can be current', () => {
    const weeks = makeWeeks([
      ['W1', 100, false],
      ['W2', 200, false],
      ['W3', 300, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    const bar0 = screen.getByTestId('volume-bar-0');
    const bar1 = screen.getByTestId('volume-bar-1');
    const bar2 = screen.getByTestId('volume-bar-2');
    expect(bar0.className).toContain('bg-primary/30');
    expect(bar1.className).toContain('bg-primary/30');
    expect(bar2.className).toContain('bg-primary');
    expect(bar2.className).not.toContain('bg-primary/30');
  });

  // ─── TC_W401_10-11: Height proportionality ───
  it('TC_W401_10: max volume gets 100% height', () => {
    const weeks = makeWeeks([
      ['W1', 1000, false],
      ['W2', 7500, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    expect(screen.getByTestId('volume-bar-1')).toHaveStyle({ height: '100%' });
  });

  it('TC_W401_11: fractional rounding (1000/7500=13%, 3000/7500=40%)', () => {
    const weeks = makeWeeks([
      ['W1', 1000, false],
      ['W2', 3000, false],
      ['W3', 7500, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    expect(screen.getByTestId('volume-bar-0')).toHaveStyle({ height: '13%' });
    expect(screen.getByTestId('volume-bar-1')).toHaveStyle({ height: '40%' });
    expect(screen.getByTestId('volume-bar-2')).toHaveStyle({ height: '100%' });
  });

  // ─── TC_W401_12-13: Zero volume ───
  it('TC_W401_12: zero volume bar has 0% height', () => {
    const weeks = makeWeeks([
      ['W1', 0, false],
      ['W2', 5000, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    expect(screen.getByTestId('volume-bar-0')).toHaveStyle({ height: '0%' });
  });

  it('TC_W401_13: all-zero volumes → all 0% height', () => {
    const weeks = makeWeeks([
      ['W1', 0, false],
      ['W2', 0, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    expect(screen.getByTestId('volume-bar-0')).toHaveStyle({ height: '0%' });
    expect(screen.getByTestId('volume-bar-1')).toHaveStyle({ height: '0%' });
  });

  // ─── TC_W401_14-15: Week labels ───
  it('TC_W401_14: week labels display correct text', () => {
    const weeks = makeWeeks([
      ['W1', 100, false],
      ['W2', 200, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    expect(screen.getByText('W1')).toBeInTheDocument();
    expect(screen.getByText('W2')).toBeInTheDocument();
  });

  it('TC_W401_15: week labels have correct CSS classes', () => {
    const weeks = makeWeeks([['W1', 100, true]]);
    render(<VolumeTrendChart weeks={weeks} />);
    const label = screen.getByText('W1');
    expect(label.className).toContain('text-[10px]');
    expect(label.className).toContain('tabular-nums');
    expect(label.className).toContain('text-muted-foreground');
  });

  // ─── TC_W401_16-17: Container CSS ───
  it('TC_W401_16: chart container has correct CSS classes', () => {
    const weeks = makeWeeks([['W1', 100, true]]);
    render(<VolumeTrendChart weeks={weeks} />);
    const chart = screen.getByTestId('volume-trend-chart');
    expect(chart.className).toContain('h-40');
    expect(chart.className).toContain('flex');
    expect(chart.className).toContain('items-end');
    expect(chart.className).toContain('gap-1');
  });

  it('TC_W401_17: bar columns have flex-1 class', () => {
    const weeks = makeWeeks([['W1', 100, true]]);
    render(<VolumeTrendChart weeks={weeks} />);
    const bar = screen.getByTestId('volume-bar-0');
    const column = bar.closest('.flex-1');
    expect(column).not.toBeNull();
  });

  // ─── TC_W401_18: Transition classes ───
  it('TC_W401_18: bars have transition-all duration-300', () => {
    const weeks = makeWeeks([['W1', 100, true]]);
    render(<VolumeTrendChart weeks={weeks} />);
    const bar = screen.getByTestId('volume-bar-0');
    expect(bar.className).toContain('transition-all');
    expect(bar.className).toContain('duration-300');
  });

  // ─── TC_W401_19: Equal volumes ───
  it('TC_W401_19: equal volumes all get 100%', () => {
    const weeks = makeWeeks([
      ['W1', 5000, false],
      ['W2', 5000, false],
      ['W3', 5000, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    for (let i = 0; i < 3; i++) {
      expect(screen.getByTestId(`volume-bar-${i}`)).toHaveStyle({ height: '100%' });
    }
  });

  // ─── TC_W401_20: Single non-zero among zeros ───
  it('TC_W401_20: single non-zero among zeros gets 100%, rest 0%', () => {
    const weeks = makeWeeks([
      ['W1', 0, false],
      ['W2', 3000, true],
      ['W3', 0, false],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    expect(screen.getByTestId('volume-bar-0')).toHaveStyle({ height: '0%' });
    expect(screen.getByTestId('volume-bar-1')).toHaveStyle({ height: '100%' });
    expect(screen.getByTestId('volume-bar-2')).toHaveStyle({ height: '0%' });
  });

  // ─── TC_W401_21: Large volumes ───
  it('TC_W401_21: large volumes (50000/100000=50%, 3333/10000=33%)', () => {
    const weeks = makeWeeks([
      ['W1', 50000, false],
      ['W2', 100000, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    expect(screen.getByTestId('volume-bar-0')).toHaveStyle({ height: '50%' });
    expect(screen.getByTestId('volume-bar-1')).toHaveStyle({ height: '100%' });

    // Also verify 3333/10000 = 33%
    const { unmount } = render(
      <VolumeTrendChart
        weeks={makeWeeks([
          ['W1', 3333, false],
          ['W2', 10000, true],
        ])}
      />,
    );
    const bars = screen.getAllByTestId(/^volume-bar-0$/);
    const lastBar = bars[bars.length - 1];
    expect(lastBar).toHaveStyle({ height: '33%' });
    unmount();
  });

  // ─── TC_W401_22-25: Tooltip ───
  it('TC_W401_22: tooltip shown on mouseEnter', () => {
    const weeks = makeWeeks([['W1', 3000, true]]);
    render(<VolumeTrendChart weeks={weeks} />);
    expect(screen.queryByTestId('volume-tooltip')).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByTestId('volume-bar-0'));
    expect(screen.getByTestId('volume-tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('volume-tooltip')).toHaveTextContent('3.000 kg');
  });

  it('TC_W401_23: tooltip hidden on mouseLeave', () => {
    const weeks = makeWeeks([['W1', 3000, true]]);
    render(<VolumeTrendChart weeks={weeks} />);
    fireEvent.mouseEnter(screen.getByTestId('volume-bar-0'));
    expect(screen.getByTestId('volume-tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByTestId('volume-bar-0'));
    expect(screen.queryByTestId('volume-tooltip')).not.toBeInTheDocument();
  });

  it('TC_W401_24: tooltip switches between bars', () => {
    const weeks = makeWeeks([
      ['W1', 1000, false],
      ['W2', 2000, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    fireEvent.mouseEnter(screen.getByTestId('volume-bar-0'));
    expect(screen.getByTestId('volume-tooltip')).toHaveTextContent('1.000 kg');
    fireEvent.mouseLeave(screen.getByTestId('volume-bar-0'));
    fireEvent.mouseEnter(screen.getByTestId('volume-bar-1'));
    expect(screen.getByTestId('volume-tooltip')).toHaveTextContent('2.000 kg');
  });

  it('TC_W401_25: tooltip for zero volume shows "0 kg"', () => {
    const weeks = makeWeeks([
      ['W1', 0, false],
      ['W2', 100, true],
    ]);
    render(<VolumeTrendChart weeks={weeks} />);
    fireEvent.mouseEnter(screen.getByTestId('volume-bar-0'));
    expect(screen.getByTestId('volume-tooltip')).toHaveTextContent('0 kg');
  });

  // ─── TC_W401_25b: Tooltip click toggle ───
  it('TC_W401_25b: click opens tooltip, second click closes it', () => {
    const weeks = makeWeeks([['W1', 4000, true]]);
    render(<VolumeTrendChart weeks={weeks} />);
    const bar = screen.getByTestId('volume-bar-0');
    fireEvent.click(bar);
    expect(screen.getByTestId('volume-tooltip')).toHaveTextContent('4.000 kg');
    fireEvent.click(bar);
    expect(screen.queryByTestId('volume-tooltip')).not.toBeInTheDocument();
  });

  // ─── TC_W401_26-27: Accessibility ───
  it('TC_W401_26: chart container has aria-label', () => {
    const weeks = makeWeeks([['W1', 100, true]]);
    render(<VolumeTrendChart weeks={weeks} />);
    const chart = screen.getByTestId('volume-trend-chart');
    expect(chart).toHaveAttribute('aria-label');
  });

  it('TC_W401_27: bars are decorative with aria-hidden', () => {
    const weeks = makeWeeks([['W3', 5000, true]]);
    render(<VolumeTrendChart weeks={weeks} />);
    const bar = screen.getByTestId('volume-bar-0');
    expect(bar).toHaveAttribute('aria-hidden', 'true');
  });

  // ─── TC_W401_28: React.memo + displayName ───
  it('TC_W401_28: component has displayName and is memoized', () => {
    expect(VolumeTrendChart.displayName).toBe('VolumeTrendChart');
    // React.memo wraps the component — verify via $$typeof or type
    expect(typeof VolumeTrendChart).toBe('object');
    expect((VolumeTrendChart as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.memo'));
  });
});
