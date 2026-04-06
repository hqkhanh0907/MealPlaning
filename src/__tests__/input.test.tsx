import { render, screen } from '@testing-library/react';

import { Input } from '../components/ui/input';

describe('Input', () => {
  it('renders with default classes', () => {
    render(<Input data-testid="my-input" />);
    const input = screen.getByTestId('my-input');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('applies custom className alongside defaults', () => {
    render(<Input className="custom-extra" data-testid="my-input" />);
    const input = screen.getByTestId('my-input');
    expect(input).toHaveClass('custom-extra');
    expect(input).toHaveClass('rounded-lg');
  });

  it('forwards type prop', () => {
    render(<Input type="email" data-testid="my-input" />);
    expect(screen.getByTestId('my-input')).toHaveAttribute('type', 'email');
  });

  it('has aria-invalid error ring classes for invalid state', () => {
    render(<Input aria-invalid="true" data-testid="my-input" />);
    const input = screen.getByTestId('my-input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('contains compound aria-invalid:focus-visible:ring-destructive/30 class for error+focus state', () => {
    // Verify the className string includes the compound state class
    const { container } = render(<Input data-testid="my-input" />);
    const input = container.querySelector('[data-slot="input"]');
    expect(input).not.toBeNull();
    const classList = input!.className;
    expect(classList).toContain('aria-invalid:focus-visible:ring-destructive/30');
  });

  it('contains base aria-invalid ring classes', () => {
    const { container } = render(<Input data-testid="my-input" />);
    const input = container.querySelector('[data-slot="input"]');
    const classList = input!.className;
    expect(classList).toContain('aria-invalid:border-destructive');
    expect(classList).toContain('aria-invalid:ring-destructive/20');
    expect(classList).toContain('aria-invalid:ring-3');
  });

  it('contains focus-visible ring classes', () => {
    const { container } = render(<Input data-testid="my-input" />);
    const input = container.querySelector('[data-slot="input"]');
    const classList = input!.className;
    expect(classList).toContain('focus-visible:ring-ring/50');
    expect(classList).toContain('focus-visible:ring-3');
  });

  it('forwards additional props', () => {
    render(<Input placeholder="Nhập tên" data-testid="my-input" />);
    expect(screen.getByTestId('my-input')).toHaveAttribute('placeholder', 'Nhập tên');
  });

  it('has data-slot="input" attribute', () => {
    render(<Input data-testid="my-input" />);
    expect(screen.getByTestId('my-input')).toHaveAttribute('data-slot', 'input');
  });

  it('has disabled styling classes', () => {
    const { container } = render(<Input disabled data-testid="my-input" />);
    const input = container.querySelector('[data-slot="input"]');
    const classList = input!.className;
    expect(classList).toContain('disabled:pointer-events-none');
    expect(classList).toContain('disabled:opacity-50');
  });
});
