import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmationModal } from '../components/modals/ConfirmationModal';

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

describe('ConfirmationModal', () => {
  let onConfirm: ReturnType<typeof vi.fn<() => void>>;
  let onCancel: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    onConfirm = vi.fn<() => void>();
    onCancel = vi.fn<() => void>();
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

  const renderModal = (overrides: Record<string, unknown> = {}) =>
    render(
      <ConfirmationModal
        isOpen={true}
        title="Xóa món ăn?"
        message="Bạn có chắc chắn muốn xóa món ăn này không?"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...overrides}
      />,
    );

  it('renders alertdialog semantics with title as name and message as description', () => {
    renderModal();

    const dialog = screen.getByRole('alertdialog', { name: 'Xóa món ăn?' });
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(screen.getByText('Bạn có chắc chắn muốn xóa món ăn này không?').id).toBe(
      dialog.getAttribute('aria-describedby'),
    );
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('focuses the cancel action first as the safest default', async () => {
    renderModal();

    await waitFor(() => expect(screen.getByTestId('btn-cancel-action')).toHaveFocus());
  });

  it('maps cancel button, backdrop click, and Escape to onCancel only', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByTestId('btn-cancel-action'));
    await user.click(screen.getByLabelText('Đóng'));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(3);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('maps confirm button only to onConfirm', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByTestId('btn-confirm-action'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('wraps long labels safely on narrow layouts', () => {
    renderModal({
      confirmLabel: 'Đồng ý xóa toàn bộ dữ liệu kế hoạch dinh dưỡng đã chọn ngay bây giờ',
      cancelLabel: 'Quay lại để xem lại mọi thay đổi trước khi tiếp tục thao tác này',
    });

    expect(screen.getByTestId('btn-confirm-action').className).toContain('whitespace-normal');
    expect(screen.getByTestId('btn-confirm-action').className).toContain('break-words');
    expect(screen.getByTestId('btn-cancel-action').className).toContain('whitespace-normal');
    expect(screen.getByTestId('btn-cancel-action').className).toContain('break-words');
  });

  it('renders custom message nodes and warning styling', () => {
    renderModal({
      variant: 'warning',
      message: (
        <div>
          <strong data-testid="warning-strong">Cảnh báo:</strong> thao tác này sẽ thay đổi dữ liệu.
        </div>
      ),
    });

    expect(screen.getByTestId('warning-strong')).toBeInTheDocument();
    expect(screen.getByTestId('btn-confirm-action').className).toContain('bg-warning');
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmationModal isOpen={false} title="Ẩn" message="Ẩn" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
