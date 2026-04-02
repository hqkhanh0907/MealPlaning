import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { WeightMini } from '../features/dashboard/components/WeightMini';
import type { WeightEntry } from '../features/fitness/types';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import type { Goal } from '../features/health-profile/types';
import { useFitnessStore } from '../store/fitnessStore';

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: vi.fn(),
}));

const mockFitnessStore = useFitnessStore as unknown as Mock;
const mockHealthStore = useHealthProfileStore as unknown as Mock;

afterEach(cleanup);

function makeWeightEntries(weights: number[], startDate = '2024-01-01'): WeightEntry[] {
  return weights.map((w, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    return {
      id: `we-${i}`,
      date: dateStr,
      weightKg: w,
      createdAt: `${dateStr}T10:00:00Z`,
      updatedAt: `${dateStr}T10:00:00Z`,
    };
  });
}

function makeGoal(type: 'cut' | 'bulk' | 'maintain'): Goal {
  return {
    id: 'g1',
    type,
    rateOfChange: 'moderate',
    calorieOffset: type === 'cut' ? -500 : type === 'bulk' ? 300 : 0,
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

function setupStores(entries: WeightEntry[], goal: Goal | null) {
  mockFitnessStore.mockImplementation((selector: (s: { weightEntries: WeightEntry[] }) => unknown) =>
    selector({ weightEntries: entries }),
  );
  mockHealthStore.mockImplementation((selector: (s: { activeGoal: Goal | null }) => unknown) =>
    selector({ activeGoal: goal }),
  );
}

describe('WeightMini', () => {
  it('renders empty state when no weight data', () => {
    setupStores([], null);
    render(<WeightMini />);

    expect(screen.getByTestId('weight-mini-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('weight-mini')).not.toBeInTheDocument();
    expect(screen.getByText('Chưa có dữ liệu cân nặng')).toBeInTheDocument();
    expect(screen.getByText('Ghi cân nặng đầu tiên')).toBeInTheDocument();
  });

  it('empty state has proper aria-label', () => {
    setupStores([], null);
    render(<WeightMini />);

    expect(screen.getByTestId('weight-mini-empty')).toHaveAttribute('aria-label', 'Chưa ghi cân nặng');
  });

  it('shows current weight with tabular-nums', () => {
    const entries = makeWeightEntries([72, 71.8, 71.5, 71.2, 71, 70.8, 70.5]);
    setupStores(entries, makeGoal('cut'));
    render(<WeightMini />);

    const value = screen.getByTestId('weight-value');
    expect(value).toHaveTextContent('70.5');
    expect(value.className).toContain('tabular-nums');
  });

  it('shows unit label kg', () => {
    const entries = makeWeightEntries([72, 71.5]);
    setupStores(entries, null);
    render(<WeightMini />);

    expect(screen.getByTestId('weight-value')).toHaveTextContent('kg');
  });

  // ===== Goal-Aware Color States =====

  it('Cut + Losing → green, TrendingDown, "Đúng tiến độ"', () => {
    const entries = makeWeightEntries([72, 71.8, 71.5, 71.2, 71, 70.8, 70.5]);
    setupStores(entries, makeGoal('cut'));
    render(<WeightMini />);

    const trendEl = screen.getByTestId('weight-trend');
    expect(trendEl).toHaveTextContent('Đúng tiến độ');
    const mini = screen.getByTestId('weight-mini');
    expect(mini.className).toContain('primary-subtle');
  });

  it('Cut + Gaining → amber, TrendingUp, "Cần điều chỉnh"', () => {
    const entries = makeWeightEntries([70, 70.3, 70.6, 71, 71.3, 71.6, 72]);
    setupStores(entries, makeGoal('cut'));
    render(<WeightMini />);

    const trendEl = screen.getByTestId('weight-trend');
    expect(trendEl).toHaveTextContent('Cần điều chỉnh');
    const mini = screen.getByTestId('weight-mini');
    expect(mini.className).toContain('amber');
  });

  it('Bulk + Gaining moderate (≤0.5kg/wk) → green, "Đúng tiến độ"', () => {
    // 7 entries over 7 days, gaining ~0.42kg total = ~0.42kg/wk
    const entries = makeWeightEntries([70, 70.06, 70.12, 70.18, 70.24, 70.3, 70.42]);
    setupStores(entries, makeGoal('bulk'));
    render(<WeightMini />);

    const trendEl = screen.getByTestId('weight-trend');
    expect(trendEl).toHaveTextContent('Đúng tiến độ');
    const mini = screen.getByTestId('weight-mini');
    expect(mini.className).toContain('primary-subtle');
  });

  it('Bulk + Gaining fast (>0.5kg/wk) → amber, "Tăng nhanh"', () => {
    // 7 entries over 7 days, gaining ~1kg total = ~1kg/wk
    const entries = makeWeightEntries([70, 70.15, 70.3, 70.5, 70.65, 70.85, 71]);
    setupStores(entries, makeGoal('bulk'));
    render(<WeightMini />);

    const trendEl = screen.getByTestId('weight-trend');
    expect(trendEl).toHaveTextContent('Tăng nhanh');
    const mini = screen.getByTestId('weight-mini');
    expect(mini.className).toContain('amber');
  });

  it('Maintain + Stable (±0.3kg/wk) → green, Minus icon, "Ổn định"', () => {
    // stable at 70kg with small fluctuations
    const entries = makeWeightEntries([70, 70.02, 69.98, 70.01, 70.03, 69.99, 70.05]);
    setupStores(entries, makeGoal('maintain'));
    render(<WeightMini />);

    const trendEl = screen.getByTestId('weight-trend');
    expect(trendEl).toHaveTextContent('Ổn định');
    const mini = screen.getByTestId('weight-mini');
    expect(mini.className).toContain('primary-subtle');
  });

  // ===== Sparkline =====

  it('sparkline renders with correct points when ≥2 entries', () => {
    const entries = makeWeightEntries([70, 71, 72, 73, 74, 75, 76]);
    setupStores(entries, null);
    render(<WeightMini />);

    const sparkline = screen.getByTestId('weight-sparkline');
    expect(sparkline).toBeInTheDocument();
    const polyline = sparkline.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
    const points = polyline?.getAttribute('points') ?? '';
    expect(points.split(' ').length).toBe(7);
  });

  it('sparkline not rendered with single entry', () => {
    const entries = makeWeightEntries([70]);
    setupStores(entries, null);
    render(<WeightMini />);

    expect(screen.queryByTestId('weight-sparkline')).not.toBeInTheDocument();
  });

  // ===== Tap Handler =====

  it('fires onTap callback on click', () => {
    const entries = makeWeightEntries([70, 71]);
    setupStores(entries, null);
    const onTap = vi.fn();
    render(<WeightMini onTap={onTap} />);

    fireEvent.click(screen.getByTestId('weight-mini'));
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('fires onTap on Enter key', () => {
    const entries = makeWeightEntries([70, 71]);
    setupStores(entries, null);
    const onTap = vi.fn();
    render(<WeightMini onTap={onTap} />);

    fireEvent.keyDown(screen.getByTestId('weight-mini'), { key: 'Enter' });
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('fires onTap on Space key', () => {
    const entries = makeWeightEntries([70, 71]);
    setupStores(entries, null);
    const onTap = vi.fn();
    render(<WeightMini onTap={onTap} />);

    fireEvent.keyDown(screen.getByTestId('weight-mini'), { key: ' ' });
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('fires onTap on empty state click', () => {
    setupStores([], null);
    const onTap = vi.fn();
    render(<WeightMini onTap={onTap} />);

    fireEvent.click(screen.getByTestId('weight-mini-empty'));
    expect(onTap).toHaveBeenCalledOnce();
  });

  // ===== Accessibility =====

  it('has proper aria-label with weight and trend', () => {
    const entries = makeWeightEntries([70, 70.02, 69.98, 70.01, 70.03, 69.99, 70.05]);
    setupStores(entries, makeGoal('maintain'));
    render(<WeightMini />);

    const mini = screen.getByTestId('weight-mini');
    expect(mini).toHaveAttribute('aria-label', expect.stringContaining('70.05'));
    expect(mini).toHaveAttribute('aria-label', expect.stringContaining('Ổn định'));
  });

  // ===== Edge cases =====

  it('defaults to maintain when no active goal', () => {
    // stable weights with no goal → should show stable
    const entries = makeWeightEntries([70, 70.01, 70.02, 70.01, 70, 70.01, 70.02]);
    setupStores(entries, null);
    render(<WeightMini />);

    const trendEl = screen.getByTestId('weight-trend');
    expect(trendEl).toHaveTextContent('Ổn định');
  });

  it('does not fire onTap on other keys', () => {
    const entries = makeWeightEntries([70, 71]);
    setupStores(entries, null);
    const onTap = vi.fn();
    render(<WeightMini onTap={onTap} />);

    fireEvent.keyDown(screen.getByTestId('weight-mini'), { key: 'Escape' });
    expect(onTap).not.toHaveBeenCalled();
  });

  it('maintain + unstable shows amber', () => {
    // Gaining >0.3kg/wk
    const entries = makeWeightEntries([70, 70.1, 70.2, 70.3, 70.4, 70.5, 70.8]);
    setupStores(entries, makeGoal('maintain'));
    render(<WeightMini />);

    const mini = screen.getByTestId('weight-mini');
    expect(mini.className).toContain('amber');
    expect(screen.getByTestId('weight-trend')).toHaveTextContent('Cần điều chỉnh');
  });

  it('bulk + not gaining shows amber adjust', () => {
    // Losing weight while in bulk
    const entries = makeWeightEntries([72, 71.8, 71.6, 71.4, 71.2, 71, 70.8]);
    setupStores(entries, makeGoal('bulk'));
    render(<WeightMini />);

    expect(screen.getByTestId('weight-trend')).toHaveTextContent('Cần điều chỉnh');
    expect(screen.getByTestId('weight-mini').className).toContain('amber');
  });
});
