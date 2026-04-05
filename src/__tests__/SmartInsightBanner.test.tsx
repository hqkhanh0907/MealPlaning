import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { SmartInsightBanner } from '../features/fitness/components/SmartInsightBanner';
import type { FitnessNutritionInsight } from '../features/fitness/hooks/useFitnessNutritionBridge';

vi.mock('lucide-react', () => ({
  Info: ({ className }: { className?: string }) => (
    <span data-testid="icon-info" className={className}>
      info
    </span>
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <span data-testid="icon-warning" className={className}>
      warning
    </span>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <span data-testid="icon-success" className={className}>
      success
    </span>
  ),
  X: ({ className }: { className?: string }) => (
    <span data-testid="icon-x" className={className}>
      x
    </span>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function makeInsight(overrides: Partial<FitnessNutritionInsight> = {}): FitnessNutritionInsight {
  return {
    type: 'deficit-on-training',
    title: 'Calorie deficit on training day',
    message: 'You need more fuel!',
    severity: 'warning',
    ...overrides,
  };
}

describe('SmartInsightBanner', () => {
  it('renders warning banner with amber styling', () => {
    render(<SmartInsightBanner insight={makeInsight()} />);
    const banner = screen.getByTestId('smart-insight-banner');
    expect(banner).toBeInTheDocument();
    expect(banner.className).toContain('border-warning');
    expect(screen.getByTestId('icon-warning')).toBeInTheDocument();
  });

  it('renders info banner with blue styling', () => {
    render(
      <SmartInsightBanner
        insight={makeInsight({
          severity: 'info',
          type: 'recovery-day',
          title: 'Recovery day',
          message: 'Rest well.',
        })}
      />,
    );
    const banner = screen.getByTestId('smart-insight-banner');
    expect(banner.className).toContain('border-info');
    expect(screen.getByTestId('icon-info')).toBeInTheDocument();
  });

  it('renders success banner with green styling', () => {
    render(
      <SmartInsightBanner
        insight={makeInsight({
          severity: 'success',
          type: 'balanced',
          title: 'Balanced',
          message: 'Great job!',
        })}
      />,
    );
    const banner = screen.getByTestId('smart-insight-banner');
    expect(banner.className).toContain('border-primary/20');
    expect(screen.getByTestId('icon-success')).toBeInTheDocument();
  });

  it('displays title and message', () => {
    render(
      <SmartInsightBanner
        insight={makeInsight({
          title: 'Test Title',
          message: 'Test Message Body',
        })}
      />,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message Body')).toBeInTheDocument();
  });

  it('has role="alert"', () => {
    render(<SmartInsightBanner insight={makeInsight()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('dismisses on X click', () => {
    render(<SmartInsightBanner insight={makeInsight()} />);
    expect(screen.getByTestId('smart-insight-banner')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('dismiss-insight'));
    expect(screen.queryByTestId('smart-insight-banner')).not.toBeInTheDocument();
  });

  it('dismiss button has aria-label', () => {
    render(<SmartInsightBanner insight={makeInsight()} />);
    const btn = screen.getByTestId('dismiss-insight');
    expect(btn).toHaveAttribute('aria-label', 'Bỏ qua');
  });
});
