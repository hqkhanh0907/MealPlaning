import { fireEvent, render, screen } from '@testing-library/react';

import { CompactForm } from '../components/shared/CompactForm';

describe('CompactForm', () => {
  const defaultProps = {
    variant: 'onboarding' as const,
    ctaLabel: 'Tiếp tục',
    onSubmit: vi.fn(),
    isValid: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders children and CTA button', () => {
      render(
        <CompactForm {...defaultProps}>
          <input data-testid="child-input" />
        </CompactForm>,
      );
      expect(screen.getByTestId('child-input')).toBeInTheDocument();
      expect(screen.getByTestId('compact-form-cta')).toHaveTextContent('Tiếp tục');
    });

    it('renders form element with data-testid', () => {
      render(<CompactForm {...defaultProps}>content</CompactForm>);
      expect(screen.getByTestId('compact-form')).toBeInTheDocument();
      expect(screen.getByTestId('compact-form').tagName).toBe('FORM');
    });

    it('applies noValidate attribute', () => {
      render(<CompactForm {...defaultProps}>content</CompactForm>);
      expect(screen.getByTestId('compact-form')).toHaveAttribute('noValidate');
    });
  });

  describe('variant styling', () => {
    it('applies onboarding padding', () => {
      render(
        <CompactForm {...defaultProps} variant="onboarding">
          content
        </CompactForm>,
      );
      const form = screen.getByTestId('compact-form');
      expect(form.className).toContain('px-6');
      expect(form.className).toContain('py-8');
    });

    it('applies settings padding', () => {
      render(
        <CompactForm {...defaultProps} variant="settings">
          content
        </CompactForm>,
      );
      const form = screen.getByTestId('compact-form');
      expect(form.className).toContain('px-4');
      expect(form.className).toContain('py-4');
    });

    it('applies custom className', () => {
      render(
        <CompactForm {...defaultProps} className="custom-class">
          content
        </CompactForm>,
      );
      expect(screen.getByTestId('compact-form').className).toContain('custom-class');
    });

    it('applies flex layout with gap', () => {
      render(<CompactForm {...defaultProps}>content</CompactForm>);
      const form = screen.getByTestId('compact-form');
      expect(form.className).toContain('flex');
      expect(form.className).toContain('flex-col');
      expect(form.className).toContain('gap-[--spacing-card-gap]');
    });
  });

  describe('CTA button', () => {
    it('is enabled when isValid is true', () => {
      render(<CompactForm {...defaultProps}>content</CompactForm>);
      expect(screen.getByTestId('compact-form-cta')).not.toBeDisabled();
    });

    it('is disabled when isValid is false', () => {
      render(
        <CompactForm {...defaultProps} isValid={false}>
          content
        </CompactForm>,
      );
      expect(screen.getByTestId('compact-form-cta')).toBeDisabled();
    });

    it('is disabled when isSubmitting is true', () => {
      render(
        <CompactForm {...defaultProps} isSubmitting={true}>
          content
        </CompactForm>,
      );
      expect(screen.getByTestId('compact-form-cta')).toBeDisabled();
    });

    it('is disabled when both isValid is false and isSubmitting is true', () => {
      render(
        <CompactForm {...defaultProps} isValid={false} isSubmitting={true}>
          content
        </CompactForm>,
      );
      expect(screen.getByTestId('compact-form-cta')).toBeDisabled();
    });

    it('shows spinner when isSubmitting', () => {
      render(
        <CompactForm {...defaultProps} isSubmitting={true}>
          content
        </CompactForm>,
      );
      const cta = screen.getByTestId('compact-form-cta');
      expect(cta.querySelector('.animate-spin')).toBeInTheDocument();
      expect(cta).toHaveTextContent('Tiếp tục');
    });

    it('has correct styling classes', () => {
      render(<CompactForm {...defaultProps}>content</CompactForm>);
      const cta = screen.getByTestId('compact-form-cta');
      expect(cta.className).toContain('h-12');
      expect(cta.className).toContain('w-full');
      expect(cta.className).toContain('rounded-xl');
      expect(cta.className).toContain('font-semibold');
    });

    it('has type submit', () => {
      render(<CompactForm {...defaultProps}>content</CompactForm>);
      expect(screen.getByTestId('compact-form-cta')).toHaveAttribute('type', 'submit');
    });
  });

  describe('form submission', () => {
    it('calls onSubmit when form is valid', () => {
      const onSubmit = vi.fn();
      render(
        <CompactForm {...defaultProps} onSubmit={onSubmit}>
          content
        </CompactForm>,
      );
      fireEvent.submit(screen.getByTestId('compact-form'));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not call onSubmit when isValid is false', () => {
      const onSubmit = vi.fn();
      render(
        <CompactForm {...defaultProps} onSubmit={onSubmit} isValid={false}>
          content
        </CompactForm>,
      );
      fireEvent.submit(screen.getByTestId('compact-form'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when isSubmitting is true', () => {
      const onSubmit = vi.fn();
      render(
        <CompactForm {...defaultProps} onSubmit={onSubmit} isSubmitting={true}>
          content
        </CompactForm>,
      );
      fireEvent.submit(screen.getByTestId('compact-form'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('prevents default form submission', () => {
      render(<CompactForm {...defaultProps}>content</CompactForm>);
      const form = screen.getByTestId('compact-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const prevented = !form.dispatchEvent(submitEvent);
      expect(prevented).toBe(true);
    });
  });

  describe('auto-scroll to first error', () => {
    it('scrolls to first aria-invalid element on invalid submit', () => {
      const scrollIntoViewMock = vi.fn();

      render(
        <CompactForm {...defaultProps} isValid={false}>
          <input aria-invalid="true" data-testid="error-field" />
          <input aria-invalid="true" data-testid="error-field-2" />
        </CompactForm>,
      );

      const errorField = screen.getByTestId('error-field');
      errorField.scrollIntoView = scrollIntoViewMock;
      errorField.focus = vi.fn();

      fireEvent.submit(screen.getByTestId('compact-form'));

      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    });

    it('focuses the first invalid element', () => {
      const focusMock = vi.fn();

      render(
        <CompactForm {...defaultProps} isValid={false}>
          <input aria-invalid="true" data-testid="error-field" />
        </CompactForm>,
      );

      const errorField = screen.getByTestId('error-field');
      errorField.scrollIntoView = vi.fn();
      errorField.focus = focusMock;

      fireEvent.submit(screen.getByTestId('compact-form'));

      expect(focusMock).toHaveBeenCalledTimes(1);
    });

    it('does nothing when no aria-invalid elements exist', () => {
      render(
        <CompactForm {...defaultProps} isValid={false}>
          <input data-testid="valid-field" />
        </CompactForm>,
      );

      fireEvent.submit(screen.getByTestId('compact-form'));
      // No error — just verifies it doesn't throw
    });

    it('does not scroll when form is valid (no aria-invalid elements)', () => {
      const onSubmit = vi.fn();
      render(
        <CompactForm {...defaultProps} onSubmit={onSubmit}>
          <input data-testid="valid-field" />
        </CompactForm>,
      );
      fireEvent.submit(screen.getByTestId('compact-form'));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('isSubmitting default', () => {
    it('defaults isSubmitting to false', () => {
      render(<CompactForm {...defaultProps}>content</CompactForm>);
      expect(screen.getByTestId('compact-form-cta')).not.toBeDisabled();
      expect(screen.getByTestId('compact-form-cta').querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });
});
