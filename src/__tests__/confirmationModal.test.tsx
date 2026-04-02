import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmationModal } from '../components/modals/ConfirmationModal';

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ConfirmationModal', () => {
  let onConfirm = vi.fn<() => void>();
  let onCancel = vi.fn<() => void>();

  beforeEach(() => {
    onConfirm = vi.fn<() => void>();
    onCancel = vi.fn<() => void>();
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

  // --- Rendering ---

  it('renders title and message when isOpen is true', () => {
    renderModal();
    expect(screen.getByText('Xóa món ăn?')).toBeInTheDocument();
    expect(screen.getByText('Bạn có chắc chắn muốn xóa món ăn này không?')).toBeInTheDocument();
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(
      <ConfirmationModal
        isOpen={false}
        title="Test"
        message="Test message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders default confirm and cancel button labels', () => {
    renderModal();
    expect(screen.getByTestId('btn-confirm-action')).toHaveTextContent('Xác nhận');
    expect(screen.getByTestId('btn-cancel-action')).toHaveTextContent('Hủy');
  });

  it('renders custom confirm label when provided', () => {
    renderModal({ confirmLabel: 'Đồng ý xóa' });
    expect(screen.getByTestId('btn-confirm-action')).toHaveTextContent('Đồng ý xóa');
  });

  it('renders custom cancel label when provided', () => {
    renderModal({ cancelLabel: 'Quay lại' });
    expect(screen.getByTestId('btn-cancel-action')).toHaveTextContent('Quay lại');
  });

  it('renders both custom labels when provided', () => {
    renderModal({ confirmLabel: 'Có', cancelLabel: 'Không' });
    expect(screen.getByTestId('btn-confirm-action')).toHaveTextContent('Có');
    expect(screen.getByTestId('btn-cancel-action')).toHaveTextContent('Không');
  });

  // --- Button Callbacks ---

  it('calls onConfirm when confirm button clicked', async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-confirm-action'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-cancel-action'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when confirm is clicked', async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-confirm-action'));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('does not call onConfirm when cancel is clicked', async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-cancel-action'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  // --- Variant Styling: danger ---

  it('defaults to danger variant', () => {
    renderModal();
    const confirmBtn = screen.getByTestId('btn-confirm-action');
    expect(confirmBtn.className).toContain('bg-rose-500');
  });

  it('danger variant applies rose button styles', () => {
    renderModal({ variant: 'danger' });
    const confirmBtn = screen.getByTestId('btn-confirm-action');
    expect(confirmBtn.className).toContain('bg-rose-500');
    expect(confirmBtn.className).toContain('hover:bg-rose-600');
  });

  it('danger variant applies rose icon background', () => {
    const { container } = renderModal({ variant: 'danger' });
    const iconWrapper = container.querySelector('.bg-rose-100');
    expect(iconWrapper).toBeInTheDocument();
  });

  // --- Variant Styling: warning ---

  it('warning variant applies amber button styles', () => {
    renderModal({ variant: 'warning' });
    const confirmBtn = screen.getByTestId('btn-confirm-action');
    expect(confirmBtn.className).toContain('bg-amber-500');
    expect(confirmBtn.className).toContain('hover:bg-amber-600');
  });

  it('warning variant applies amber icon background', () => {
    const { container } = renderModal({ variant: 'warning' });
    const iconWrapper = container.querySelector('.bg-amber-100');
    expect(iconWrapper).toBeInTheDocument();
  });

  // --- Custom Icon ---

  it('renders custom icon when provided', () => {
    renderModal({
      icon: <span data-testid="custom-icon">🔥</span>,
    });
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders default icon for danger variant when no icon provided', () => {
    const { container } = renderModal({ variant: 'danger' });
    const trashIcon = container.querySelector('.lucide-trash-2');
    expect(trashIcon).toBeInTheDocument();
  });

  it('renders default icon for warning variant when no icon provided', () => {
    const { container } = renderModal({ variant: 'warning' });
    const iconContainer = container.querySelector('.bg-amber-100');
    expect(iconContainer).toBeInTheDocument();
    const svgIcon = iconContainer?.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
  });

  // --- Message as ReactNode ---

  it('renders message as ReactNode (JSX)', () => {
    renderModal({
      message: (
        <div>
          <strong data-testid="strong-msg">Cẩn thận!</strong> Hành động này không thể hoàn tác.
        </div>
      ),
    });
    expect(screen.getByTestId('strong-msg')).toBeInTheDocument();
    expect(screen.getByText(/Hành động này/)).toBeInTheDocument();
  });

  // --- isOpen toggling ---

  it('shows content when isOpen changes from false to true', () => {
    const { rerender } = render(
      <ConfirmationModal
        isOpen={false}
        title="Test Title"
        message="Test Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();

    rerender(
      <ConfirmationModal
        isOpen={true}
        title="Test Title"
        message="Test Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('hides content when isOpen changes from true to false', () => {
    const { rerender } = render(
      <ConfirmationModal
        isOpen={true}
        title="Test Title"
        message="Test Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();

    rerender(
      <ConfirmationModal
        isOpen={false}
        title="Test Title"
        message="Test Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });
});
