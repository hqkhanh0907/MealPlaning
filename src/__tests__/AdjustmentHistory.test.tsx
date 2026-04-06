import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import type { AdjustmentRecord } from '../features/dashboard/components/AdjustmentHistory';
import { AdjustmentHistory } from '../features/dashboard/components/AdjustmentHistory';

function makeRecord(overrides: Partial<AdjustmentRecord> = {}): AdjustmentRecord {
  return {
    id: 'adj-1',
    date: '2024-06-15',
    reason: 'Weight loss has stalled during cut phase',
    oldTargetCal: 2000,
    newTargetCal: 1850,
    triggerType: 'auto',
    applied: true,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AdjustmentHistory', () => {
  it('renders collapsed by default', () => {
    render(<AdjustmentHistory adjustments={[makeRecord()]} />);
    expect(screen.getByTestId('adjustment-history')).toBeInTheDocument();
    expect(screen.queryByTestId('adjustment-history-list')).not.toBeInTheDocument();
  });

  it('expands when toggle button is clicked', () => {
    render(<AdjustmentHistory adjustments={[makeRecord()]} />);
    fireEvent.click(screen.getByTestId('adjustment-history-toggle'));
    expect(screen.getByTestId('adjustment-history-list')).toBeInTheDocument();
  });

  it('collapses when toggle button is clicked twice', () => {
    render(<AdjustmentHistory adjustments={[makeRecord()]} />);
    const toggle = screen.getByTestId('adjustment-history-toggle');
    fireEvent.click(toggle);
    expect(screen.getByTestId('adjustment-history-list')).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByTestId('adjustment-history-list')).not.toBeInTheDocument();
  });

  it('renders expanded when defaultCollapsed is false', () => {
    render(<AdjustmentHistory adjustments={[makeRecord()]} defaultCollapsed={false} />);
    expect(screen.getByTestId('adjustment-history-list')).toBeInTheDocument();
  });

  it('shows empty message when no adjustments', () => {
    render(<AdjustmentHistory adjustments={[]} defaultCollapsed={false} />);
    expect(screen.getByTestId('adjustment-history-empty')).toHaveTextContent('Chưa có điều chỉnh nào');
  });

  it('shows applied status with green indicator', () => {
    render(<AdjustmentHistory adjustments={[makeRecord({ id: 'adj-a', applied: true })]} defaultCollapsed={false} />);
    expect(screen.getByTestId('status-label-adj-a')).toHaveTextContent('Đã áp dụng');
  });

  it('shows declined status with gray indicator', () => {
    render(<AdjustmentHistory adjustments={[makeRecord({ id: 'adj-b', applied: false })]} defaultCollapsed={false} />);
    expect(screen.getByTestId('status-label-adj-b')).toHaveTextContent('Đã từ chối');
  });

  it('shows trigger type badge', () => {
    render(
      <AdjustmentHistory adjustments={[makeRecord({ id: 'adj-c', triggerType: 'auto' })]} defaultCollapsed={false} />,
    );
    expect(screen.getByTestId('trigger-badge-adj-c')).toHaveTextContent('Tự động');
  });

  it('shows manual trigger type badge', () => {
    render(
      <AdjustmentHistory adjustments={[makeRecord({ id: 'adj-d', triggerType: 'manual' })]} defaultCollapsed={false} />,
    );
    expect(screen.getByTestId('trigger-badge-adj-d')).toHaveTextContent('Thủ công');
  });

  it('displays old and new target calories', () => {
    render(
      <AdjustmentHistory
        adjustments={[
          makeRecord({
            id: 'adj-e',
            oldTargetCal: 2000,
            newTargetCal: 1850,
          }),
        ]}
        defaultCollapsed={false}
      />,
    );
    const row = screen.getByTestId('adjustment-row-adj-e');
    expect(row.textContent).toContain('2000');
    expect(row.textContent).toContain('1850');
  });

  it('sorts adjustments in reverse chronological order', () => {
    const adjustments: AdjustmentRecord[] = [
      makeRecord({ id: 'adj-old', date: '2024-06-01' }),
      makeRecord({ id: 'adj-new', date: '2024-06-15' }),
      makeRecord({ id: 'adj-mid', date: '2024-06-10' }),
    ];
    render(<AdjustmentHistory adjustments={adjustments} defaultCollapsed={false} />);
    const list = screen.getByTestId('adjustment-history-list');
    const rows = list.querySelectorAll('[data-testid^="adjustment-row-"]');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveAttribute('data-testid', 'adjustment-row-adj-new');
    expect(rows[1]).toHaveAttribute('data-testid', 'adjustment-row-adj-mid');
    expect(rows[2]).toHaveAttribute('data-testid', 'adjustment-row-adj-old');
  });

  it('renders title in toggle button', () => {
    render(<AdjustmentHistory adjustments={[]} />);
    expect(screen.getByTestId('adjustment-history-toggle')).toHaveTextContent('Lịch sử điều chỉnh');
  });

  it('shows multiple adjustments correctly', () => {
    const adjustments: AdjustmentRecord[] = [
      makeRecord({ id: 'adj-1', applied: true }),
      makeRecord({ id: 'adj-2', applied: false }),
    ];
    render(<AdjustmentHistory adjustments={adjustments} defaultCollapsed={false} />);
    expect(screen.getByTestId('status-label-adj-1')).toHaveTextContent('Đã áp dụng');
    expect(screen.getByTestId('status-label-adj-2')).toHaveTextContent('Đã từ chối');
  });

  it('shows TrendingUp icon when newTargetCal > oldTargetCal', () => {
    render(
      <AdjustmentHistory
        adjustments={[makeRecord({ id: 'adj-up', oldTargetCal: 2000, newTargetCal: 2150 })]}
        defaultCollapsed={false}
      />,
    );
    const row = screen.getByTestId('adjustment-row-adj-up');
    expect(row.textContent).toContain('2000');
    expect(row.textContent).toContain('2150');
  });
});
