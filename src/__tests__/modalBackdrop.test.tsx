import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalBackdrop } from '../components/shared/ModalBackdrop';

// ModalBackdrop renders <dialog open> with aria-modal="true" and a backdrop button

describe('ModalBackdrop', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a dialog element with open attribute', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <div>Content</div>
      </ModalBackdrop>,
    );
    const dialog = document.querySelector('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('open');
  });

  it('has aria-modal="true" for accessibility', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <div>Content</div>
      </ModalBackdrop>,
    );
    const dialog = document.querySelector('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose when backdrop button is clicked', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <div>Content</div>
      </ModalBackdrop>,
    );
    const backdropBtn = screen.getByLabelText('Đóng');
    fireEvent.click(backdropBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders children content', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <div data-testid="child">Hello World</div>
      </ModalBackdrop>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('applies default z-50 zIndex class', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <div>Content</div>
      </ModalBackdrop>,
    );
    const dialog = document.querySelector('dialog');
    expect(dialog?.className).toContain('z-50');
  });

  it('applies custom zIndex class when provided', () => {
    render(
      <ModalBackdrop onClose={onClose} zIndex="z-[60]">
        <div>Content</div>
      </ModalBackdrop>,
    );
    const dialog = document.querySelector('dialog');
    expect(dialog?.className).toContain('z-[60]');
    expect(dialog?.className).not.toContain('z-50');
  });

  it('renders backdrop button behind children', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <button>Inner Button</button>
      </ModalBackdrop>,
    );
    // Both backdrop and inner button should be present
    expect(screen.getByLabelText('Đóng')).toBeInTheDocument();
    expect(screen.getByText('Inner Button')).toBeInTheDocument();
  });

  it('does not call onClose when inner content is clicked', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <button onClick={() => {}}>Inner Button</button>
      </ModalBackdrop>,
    );
    fireEvent.click(screen.getByText('Inner Button'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('backdrop button has tabIndex -1 for focus management', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <div>Content</div>
      </ModalBackdrop>,
    );
    const backdropBtn = screen.getByLabelText('Đóng');
    expect(backdropBtn).toHaveAttribute('tabindex', '-1');
  });

  it('has backdrop blur and dark overlay styling', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <div>Content</div>
      </ModalBackdrop>,
    );
    const dialog = document.querySelector('dialog');
    expect(dialog?.className).toContain('backdrop-blur');
    expect(dialog?.className).toContain('bg-slate-900/50');
  });
});
