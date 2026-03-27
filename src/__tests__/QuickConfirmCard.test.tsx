import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickConfirmCard } from '../features/fitness/components/QuickConfirmCard';

vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="check-icon" />,
  Pencil: () => <span data-testid="pencil-icon" />,
  Dumbbell: () => <span data-testid="dumbbell-icon" />,
}));

describe('QuickConfirmCard', () => {
  const defaultProps = {
    exerciseName: 'Bench Press',
    suggestion: {
      weight: 80,
      reps: 5,
      source: 'progressive_overload' as const,
    },
    onConfirm: vi.fn(),
    onCustomize: vi.fn(),
  };

  it('renders exercise name and suggestion', () => {
    render(<QuickConfirmCard {...defaultProps} />);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('80kg × 5')).toBeInTheDocument();
  });

  it('shows progressive overload label', () => {
    render(<QuickConfirmCard {...defaultProps} />);
    expect(screen.getByText('Progressive overload')).toBeInTheDocument();
  });

  it('shows rep progression label', () => {
    render(
      <QuickConfirmCard
        {...defaultProps}
        suggestion={{ weight: 75, reps: 8, source: 'rep_progression' }}
      />,
    );
    expect(screen.getByText('Rep progression')).toBeInTheDocument();
  });

  it('shows manual entry label', () => {
    render(
      <QuickConfirmCard
        {...defaultProps}
        suggestion={{ weight: 0, reps: 5, source: 'manual' }}
      />,
    );
    expect(screen.getByText('Manual entry')).toBeInTheDocument();
  });

  it('calls onConfirm with suggestion on check click', () => {
    const onConfirm = vi.fn();
    render(<QuickConfirmCard {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByTestId('quick-confirm-button'));
    expect(onConfirm).toHaveBeenCalledWith({
      weight: 80,
      reps: 5,
      source: 'progressive_overload',
    });
  });

  it('calls onCustomize on pencil click', () => {
    const onCustomize = vi.fn();
    render(<QuickConfirmCard {...defaultProps} onCustomize={onCustomize} />);
    fireEvent.click(screen.getByTestId('customize-button'));
    expect(onCustomize).toHaveBeenCalledOnce();
  });

  it('has correct test id for card container', () => {
    render(<QuickConfirmCard {...defaultProps} />);
    expect(screen.getByTestId('quick-confirm-card')).toBeInTheDocument();
  });

  it('renders dumbbell icon', () => {
    render(<QuickConfirmCard {...defaultProps} />);
    expect(screen.getByTestId('dumbbell-icon')).toBeInTheDocument();
  });

  it('renders weight and reps formatting correctly', () => {
    render(
      <QuickConfirmCard
        {...defaultProps}
        suggestion={{ weight: 100.5, reps: 12, source: 'progressive_overload' }}
      />,
    );
    expect(screen.getByText('100.5kg × 12')).toBeInTheDocument();
  });

  it('falls back to raw source string for unknown sources', () => {
    render(
      <QuickConfirmCard
        {...defaultProps}
        suggestion={{ weight: 50, reps: 10, source: 'unknown_source' as 'manual' }}
      />,
    );
    expect(screen.getByText('unknown_source')).toBeInTheDocument();
  });
});
