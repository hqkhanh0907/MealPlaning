import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { AutoAdjustBanner } from '../features/dashboard/components/AutoAdjustBanner';
import type { Adjustment } from '../features/dashboard/hooks/useFeedbackLoop';

function makeAdjustment(overrides: Partial<Adjustment> = {}): Adjustment {
  return {
    reason: 'Weight loss has stalled during cut phase',
    oldTargetCal: 2000,
    newTargetCal: 1850,
    triggerType: 'auto',
    movingAvgWeight: 72.5,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AutoAdjustBanner', () => {
  it('renders with correct title text', () => {
    const onApply = vi.fn();
    const onDismiss = vi.fn();
    render(<AutoAdjustBanner adjustment={makeAdjustment()} onApply={onApply} onDismiss={onDismiss} />);
    expect(screen.getByTestId('banner-title')).toHaveTextContent('Đề xuất điều chỉnh');
  });

  it('renders banner body with stalled message for cut', () => {
    render(
      <AutoAdjustBanner
        adjustment={makeAdjustment({
          reason: 'Weight loss has stalled during cut phase',
        })}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    const body = screen.getByTestId('banner-body');
    expect(body.textContent).toContain('150');
    expect(body.textContent).toContain('Giảm');
  });

  it('renders banner body with gaining message for cut', () => {
    render(
      <AutoAdjustBanner
        adjustment={makeAdjustment({
          reason: 'Weight is increasing during cut phase',
        })}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    const body = screen.getByTestId('banner-body');
    expect(body.textContent).toContain('Giảm');
    expect(body.textContent).toContain('150');
  });

  it('renders banner body with losing message for bulk', () => {
    render(
      <AutoAdjustBanner
        adjustment={makeAdjustment({
          reason: 'Weight is decreasing during bulk phase',
          oldTargetCal: 3000,
          newTargetCal: 3150,
        })}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    const body = screen.getByTestId('banner-body');
    expect(body.textContent).toContain('Tăng');
  });

  it('renders AlertTriangle icon', () => {
    render(<AutoAdjustBanner adjustment={makeAdjustment()} onApply={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByTestId('banner-icon')).toBeInTheDocument();
  });

  it('renders apply and dismiss buttons', () => {
    render(<AutoAdjustBanner adjustment={makeAdjustment()} onApply={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByTestId('banner-apply-btn')).toHaveTextContent('Áp dụng');
    expect(screen.getByTestId('banner-dismiss-btn')).toHaveTextContent('Bỏ qua');
  });

  it('calls onApply when apply button is clicked', () => {
    const onApply = vi.fn();
    render(<AutoAdjustBanner adjustment={makeAdjustment()} onApply={onApply} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByTestId('banner-apply-btn'));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<AutoAdjustBanner adjustment={makeAdjustment()} onApply={vi.fn()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('banner-dismiss-btn'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has role="alert" for accessibility', () => {
    render(<AutoAdjustBanner adjustment={makeAdjustment()} onApply={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByTestId('auto-adjust-banner')).toHaveAttribute('role', 'alert');
  });

  it('has dark amber background class', () => {
    render(<AutoAdjustBanner adjustment={makeAdjustment()} onApply={vi.fn()} onDismiss={vi.fn()} />);
    const banner = screen.getByTestId('auto-adjust-banner');
    expect(banner.className).toContain('bg-warning');
  });

  it('does not auto-dismiss — persists on render', () => {
    const { rerender } = render(
      <AutoAdjustBanner adjustment={makeAdjustment()} onApply={vi.fn()} onDismiss={vi.fn()} />,
    );
    rerender(<AutoAdjustBanner adjustment={makeAdjustment()} onApply={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByTestId('auto-adjust-banner')).toBeInTheDocument();
  });
});
