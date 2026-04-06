import { render, screen } from '@testing-library/react';
import type { FieldError } from 'react-hook-form';

import { FormField } from '../components/form/FormField';

describe('FormField', () => {
  it('renders label and children', () => {
    render(
      <FormField label="Tên">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Tên')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    render(
      <FormField label="Tên" required>
        <input />
      </FormField>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders error message with AlertCircle icon when error is present', () => {
    const error: FieldError = { type: 'required', message: 'Trường bắt buộc' };
    render(
      <FormField label="Tên" error={error}>
        <input />
      </FormField>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Trường bắt buộc');

    // AlertCircle icon rendered with aria-hidden
    const icon = alert.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveClass('h-3.5', 'w-3.5', 'shrink-0');
  });

  it('does not render error section when no error', () => {
    render(
      <FormField label="Tên">
        <input />
      </FormField>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sets aria-describedby on child when error present', () => {
    const error: FieldError = { type: 'required', message: 'Lỗi' };
    render(
      <FormField label="Tên" error={error}>
        <input />
      </FormField>,
    );
    const input = screen.getByRole('textbox');
    const alert = screen.getByRole('alert');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('sets aria-required on child when required', () => {
    render(
      <FormField label="Tên" required>
        <input />
      </FormField>,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });

  it('uses custom htmlFor when provided', () => {
    render(
      <FormField label="Tên" htmlFor="custom-id">
        <input id="custom-id" />
      </FormField>,
    );
    expect(screen.getByLabelText('Tên')).toHaveAttribute('id', 'custom-id');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <FormField label="Tên" className="custom-class">
        <input />
      </FormField>,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies default mb-4 className when no className provided', () => {
    const { container } = render(
      <FormField label="Tên">
        <input />
      </FormField>,
    );
    expect(container.firstChild).toHaveClass('mb-4');
  });

  it('error alert has flex layout with gap for icon alignment', () => {
    const error: FieldError = { type: 'required', message: 'Lỗi' };
    render(
      <FormField label="Tên" error={error}>
        <input />
      </FormField>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('flex', 'items-center', 'gap-1');
  });

  it('skips non-element children gracefully', () => {
    const error: FieldError = { type: 'required', message: 'Lỗi' };
    render(
      <FormField label="Tên" error={error}>
        plain text
        <input />
      </FormField>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
