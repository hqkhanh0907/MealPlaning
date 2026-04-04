import { fireEvent, render, screen } from '@testing-library/react';

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
    expect(dialog?.className).toContain('bg-background/50');
  });

  it('calls onClose when Escape key is pressed', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <div>Content</div>
      </ModalBackdrop>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('only calls topmost modal onClose when nested modals are mounted and Escape is pressed', () => {
    const onCloseOuter = vi.fn();
    const onCloseInner = vi.fn();

    render(
      <ModalBackdrop onClose={onCloseOuter} zIndex="z-50">
        <div>Outer</div>
      </ModalBackdrop>,
    );
    render(
      <ModalBackdrop onClose={onCloseInner} zIndex="z-60">
        <div>Inner</div>
      </ModalBackdrop>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    // Only topmost (inner) modal should respond
    expect(onCloseInner).toHaveBeenCalledTimes(1);
    expect(onCloseOuter).not.toHaveBeenCalled();
  });

  /**
   * BUG: scroll-lock-nested-modal
   *
   * When IngredientEditModal (ModalBackdrop A) and UnsavedChangesDialog
   * (ModalBackdrop B) unmounted simultaneously, React could call A's
   * cleanup first (unlocking body) then B's cleanup second (re-locking
   * body with the captured prev values). The result: body stayed
   * position:fixed / overflow:hidden permanently, breaking scroll on
   * every page.
   *
   * Fix: module-level reference-counted lock (_scrollLockDepth).
   * Lock is applied only on the first mount (0→1) and released only
   * on the last unmount (1→0), so cleanup order no longer matters.
   */
  describe('body scroll lock (reference-counted)', () => {
    beforeEach(() => {
      // Guard-reset body styles in case any previous test left them locked.
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      // Silence jsdom "not implemented" warning for scrollTo.
      vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('locks body scroll when a modal mounts', () => {
      render(
        <ModalBackdrop onClose={onClose}>
          <div />
        </ModalBackdrop>,
      );
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when the modal unmounts', () => {
      const { unmount } = render(
        <ModalBackdrop onClose={onClose}>
          <div />
        </ModalBackdrop>,
      );
      unmount();
      expect(document.body.style.position).toBe('');
      expect(document.body.style.overflow).toBe('');
    });

    it('keeps body locked when inner modal closes while outer is still open', () => {
      // Outer modal (z-60) — still visible throughout the test
      render(
        <ModalBackdrop onClose={onClose} zIndex="z-60">
          <div />
        </ModalBackdrop>,
      );
      // Inner modal (z-70) — will be closed mid-test
      const { unmount: unmountInner } = render(
        <ModalBackdrop onClose={onClose} zIndex="z-70">
          <div />
        </ModalBackdrop>,
      );

      // Close only the inner modal
      unmountInner();

      // Outer modal is still open — body MUST remain locked
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('BUG-regression: two nested modals unmounting together fully restores body scroll', () => {
      // Simulates IngredientEditModal (A) + UnsavedChangesDialog (B) both
      // unmounting at the same moment when the user clicks "Discard".
      const { unmount: unmountA } = render(
        <ModalBackdrop onClose={onClose} zIndex="z-60">
          <div />
        </ModalBackdrop>,
      );
      const { unmount: unmountB } = render(
        <ModalBackdrop onClose={onClose} zIndex="z-70">
          <div />
        </ModalBackdrop>,
      );

      // Both modals are visible — body must be locked
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.overflow).toBe('hidden');

      // Simulate React committing both unmounts simultaneously.
      // Previously: A cleanup unlocked → B cleanup re-locked (bug).
      unmountA();
      unmountB();

      // Body MUST be fully restored regardless of cleanup call order.
      expect(document.body.style.position).toBe('');
      expect(document.body.style.overflow).toBe('');
    });
  });
});
