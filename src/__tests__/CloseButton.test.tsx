import { fireEvent, render, screen } from '@testing-library/react';

import { CloseButton } from '../components/shared/CloseButton';

describe('CloseButton', () => {
  const onClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a button with accessible close label', () => {
    render(<CloseButton onClick={onClick} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('calls onClick when clicked', () => {
    render(<CloseButton onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('Đóng hộp thoại'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders X icon inside the button', () => {
    render(<CloseButton onClick={onClick} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    const svg = btn.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-5', 'w-5');
  });

  it('applies data-testid when provided', () => {
    render(<CloseButton onClick={onClick} data-testid="btn-close-test" />);
    expect(screen.getByTestId('btn-close-test')).toBeInTheDocument();
  });

  it('does not render data-testid when not provided', () => {
    render(<CloseButton onClick={onClick} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.getAttribute('data-testid')).toBeNull();
  });

  it('has 44px minimum touch target', () => {
    render(<CloseButton onClick={onClick} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('min-h-11');
    expect(btn.className).toContain('min-w-11');
  });

  it('has focus-visible ring styles for accessibility', () => {
    render(<CloseButton onClick={onClick} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('focus-visible:ring-2');
    expect(btn.className).toContain('focus-visible:ring-ring');
  });

  it('has hover styles for visual feedback', () => {
    render(<CloseButton onClick={onClick} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('hover:text-foreground');
    expect(btn.className).toContain('hover:bg-accent');
  });
});
