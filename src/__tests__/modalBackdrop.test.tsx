import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModalBackdrop } from '../components/shared/ModalBackdrop';

const originalMatchMedia = globalThis.matchMedia;

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

describe('ModalBackdrop', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined);
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  });

  it('renders dialog root with semantic role and aria wiring', () => {
    render(
      <ModalBackdrop onClose={onClose} role="alertdialog" ariaLabelledBy="title-id" ariaDescribedBy="desc-id">
        <h2 id="title-id">Cảnh báo</h2>
        <p id="desc-id">Mô tả</p>
      </ModalBackdrop>,
    );

    const dialog = screen.getByRole('alertdialog', { name: 'Cảnh báo' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'title-id');
    expect(dialog).toHaveAttribute('aria-describedby', 'desc-id');
  });

  it('calls onClose when backdrop is clicked but not when content is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ModalBackdrop onClose={onClose}>
        <button>Inner action</button>
      </ModalBackdrop>,
    );

    await user.click(screen.getByText('Inner action'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText('Đóng'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps backdrop click inert when disabled by consumer', async () => {
    const user = userEvent.setup();

    render(
      <ModalBackdrop onClose={onClose} closeOnBackdropClick={false}>
        <div>Content</div>
      </ModalBackdrop>,
    );

    await user.click(screen.getByLabelText('Đóng'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('only closes the topmost modal on Escape', () => {
    const onCloseOuter = vi.fn();
    const onCloseInner = vi.fn();

    render(
      <ModalBackdrop onClose={onCloseOuter}>
        <div>Outer</div>
      </ModalBackdrop>,
    );
    render(
      <ModalBackdrop onClose={onCloseInner}>
        <div>Inner</div>
      </ModalBackdrop>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseInner).toHaveBeenCalledTimes(1);
    expect(onCloseOuter).not.toHaveBeenCalled();
  });

  it('traps focus inside the topmost overlay and restores it on unmount', async () => {
    const user = userEvent.setup();
    const trigger = document.createElement('button');
    trigger.textContent = 'Trigger';
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(
      <ModalBackdrop onClose={onClose}>
        <div>
          <button>First</button>
          <button>Second</button>
        </div>
      </ModalBackdrop>,
    );

    await waitFor(() => expect(screen.getByText('First')).toHaveFocus());
    await user.tab();
    expect(screen.getByText('Second')).toHaveFocus();
    await user.tab();
    await waitFor(() => expect(screen.getByText('First')).toHaveFocus());
    await user.tab({ shift: true });
    expect(screen.getByText('Second')).toHaveFocus();

    unmount();
    expect(trigger).toHaveFocus();
    document.body.removeChild(trigger);
  });

  it('preserves child autofocus when present', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <div>
          <button>First</button>
          <input autoFocus aria-label="Tên" />
        </div>
      </ModalBackdrop>,
    );

    expect(screen.getByLabelText('Tên')).toHaveFocus();
  });

  it('locks body scroll until the last nested overlay closes', () => {
    const outer = render(
      <ModalBackdrop onClose={onClose}>
        <div>Outer</div>
      </ModalBackdrop>,
    );
    const inner = render(
      <ModalBackdrop onClose={onClose} zIndex="z-60">
        <div>Inner</div>
      </ModalBackdrop>,
    );

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');

    inner.unmount();
    expect(document.body.style.position).toBe('fixed');

    outer.unmount();
    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('marks reduced-motion branch and suppresses animated drag reset', () => {
    mockMatchMedia(true);
    render(
      <ModalBackdrop onClose={onClose}>
        <div>Content</div>
      </ModalBackdrop>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-reduced-motion', 'true');

    const handle = screen.getByTestId('modal-grab-handle');
    fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(handle, { touches: [{ clientY: 140 }] });
    fireEvent.touchEnd(handle);

    const content = screen.getByRole('dialog').querySelector('[data-modal-content="true"]') as HTMLDivElement;
    expect(content.style.transition).toBe('none');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('supports swipe-to-dismiss threshold on mobile sheet overlays', () => {
    render(
      <ModalBackdrop onClose={onClose}>
        <div>Content</div>
      </ModalBackdrop>,
    );

    const handle = screen.getByTestId('modal-grab-handle');
    fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(handle, { touches: [{ clientY: 260 }] });
    fireEvent.touchEnd(handle);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('omits swipe handle when swipe dismissal is disabled', () => {
    render(
      <ModalBackdrop onClose={onClose} allowSwipeToDismiss={false}>
        <div>Content</div>
      </ModalBackdrop>,
    );

    expect(screen.queryByTestId('modal-grab-handle')).not.toBeInTheDocument();
  });
});
