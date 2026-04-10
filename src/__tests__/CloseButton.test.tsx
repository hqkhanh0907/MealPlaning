import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CloseButton } from '../components/shared/CloseButton';

describe('CloseButton', () => {
  it('renders with default aria-label "Đóng hộp thoại"', () => {
    render(<CloseButton onClick={vi.fn()} />);
    expect(screen.getByLabelText('Đóng hộp thoại')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<CloseButton onClick={handleClick} />);
    await user.click(screen.getByLabelText('Đóng hộp thoại'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders with custom ariaLabel override', () => {
    render(<CloseButton onClick={vi.fn()} ariaLabel="Đóng" />);
    expect(screen.getByLabelText('Đóng')).toBeInTheDocument();
    expect(screen.queryByLabelText('Đóng hộp thoại')).not.toBeInTheDocument();
  });

  it('keeps a 44x44 minimum touch target and visible focus ring', () => {
    render(<CloseButton onClick={vi.fn()} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('min-h-11');
    expect(btn.className).toContain('min-w-11');
    expect(btn.className).toContain('focus-visible:ring-2');
    expect(btn.className).toContain('focus-visible:ring-offset-2');
  });

  it('supports overlay styling without wrapping the icon', () => {
    render(<CloseButton onClick={vi.fn()} variant="overlay" />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('text-white');
    expect(btn.className).toContain('whitespace-nowrap');
    const svg = btn.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('h-5', 'w-5');
  });
});
