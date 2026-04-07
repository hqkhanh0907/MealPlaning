import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CloseButton } from '../components/shared/CloseButton';

describe('CloseButton', () => {
  it('renders with default aria-label "Đóng hộp thoại"', () => {
    render(<CloseButton onClick={vi.fn()} />);
    expect(screen.getByLabelText('Đóng hộp thoại')).toBeInTheDocument();
  });

  it('renders with rounded-full shape', () => {
    render(<CloseButton onClick={vi.fn()} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('rounded-full');
    expect(btn.className).not.toContain('rounded-lg');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<CloseButton onClick={handleClick} />);
    await user.click(screen.getByLabelText('Đóng hộp thoại'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders with custom data-testid', () => {
    render(<CloseButton onClick={vi.fn()} data-testid="btn-close-dish" />);
    expect(screen.getByTestId('btn-close-dish')).toBeInTheDocument();
  });

  it('does not render data-testid when not provided', () => {
    render(<CloseButton onClick={vi.fn()} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.getAttribute('data-testid')).toBeNull();
  });

  it('renders with custom ariaLabel override', () => {
    render(<CloseButton onClick={vi.fn()} ariaLabel="Đóng" />);
    expect(screen.getByLabelText('Đóng')).toBeInTheDocument();
    expect(screen.queryByLabelText('Đóng hộp thoại')).not.toBeInTheDocument();
  });

  it('renders default variant styling', () => {
    render(<CloseButton onClick={vi.fn()} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('text-muted-foreground');
    expect(btn.className).not.toContain('backdrop-blur');
  });

  it('renders overlay variant styling', () => {
    render(<CloseButton onClick={vi.fn()} variant="overlay" />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('text-white');
    expect(btn.className).toContain('backdrop-blur');
  });

  it('renders X icon inside the button', () => {
    render(<CloseButton onClick={vi.fn()} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    const svg = btn.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-5', 'w-5');
  });

  it('has accessible focus ring', () => {
    render(<CloseButton onClick={vi.fn()} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('focus-visible:ring-2');
  });

  it('has min 44px touch target', () => {
    render(<CloseButton onClick={vi.fn()} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('min-h-11');
    expect(btn.className).toContain('min-w-11');
  });
});
