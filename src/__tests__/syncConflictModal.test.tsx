import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SyncConflictModal } from '../components/modals/SyncConflictModal';

const LOCAL_TIME = '2024-01-15T10:30:00Z';
const REMOTE_TIME = '2024-01-14T08:00:00Z';
const formattedLocal = new Date(LOCAL_TIME).toLocaleString();
const formattedRemote = new Date(REMOTE_TIME).toLocaleString();
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

vi.mock('../services/backNavigationService', () => ({
  pushBackEntry: vi.fn(),
  removeTopBackEntry: vi.fn(),
}));

describe('SyncConflictModal', () => {
  const onResolve = vi.fn();
  const onClose = vi.fn();

  const renderModal = () =>
    render(
      <SyncConflictModal localTime={LOCAL_TIME} remoteTime={REMOTE_TIME} onResolve={onResolve} onClose={onClose} />,
    );

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

  it('renders alertdialog semantics and readable timestamps', () => {
    renderModal();

    const dialog = screen.getByRole('alertdialog', { name: 'Xung đột dữ liệu' });
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(screen.getByText('Dữ liệu cục bộ và dữ liệu đám mây khác nhau. Bạn muốn giữ phiên bản nào?').id).toBe(
      dialog.getAttribute('aria-describedby'),
    );
    expect(screen.getByText(formattedLocal).className).toContain('whitespace-normal');
    expect(screen.getByText(formattedRemote).className).toContain('break-words');
  });

  it('keeps resolve actions exclusive to their respective buttons', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByTestId('btn-keep-local'));
    await user.click(screen.getByTestId('btn-use-cloud'));

    expect(onResolve).toHaveBeenNthCalledWith(1, 'local');
    expect(onResolve).toHaveBeenNthCalledWith(2, 'cloud');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('maps cancel, backdrop, and Escape only to onClose', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByTestId('btn-cancel-sync'));
    await user.click(screen.getByLabelText('Đóng'));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onResolve).not.toHaveBeenCalled();
  });

  it('uses mobile-safe wrapping classes on action buttons', () => {
    renderModal();

    expect(screen.getByTestId('btn-keep-local').className).toContain('whitespace-normal');
    expect(screen.getByTestId('btn-use-cloud').className).toContain('break-words');
    expect(screen.getByTestId('btn-cancel-sync').className).toContain('whitespace-normal');
  });
});
