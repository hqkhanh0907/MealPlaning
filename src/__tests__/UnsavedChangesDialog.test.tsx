import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UnsavedChangesDialog } from '../components/shared/UnsavedChangesDialog';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

describe('UnsavedChangesDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders alertdialog semantics with wired title and description', () => {
    render(<UnsavedChangesDialog isOpen={true} onSave={vi.fn()} onDiscard={vi.fn()} onCancel={vi.fn()} />);

    const dialog = screen.getByRole('alertdialog', { name: 'Thay đổi chưa lưu' });
    expect(dialog).toHaveAttribute('aria-describedby');
    const describedById = dialog.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    expect(document.getElementById(describedById!)).toHaveTextContent(
      'Bạn có muốn lưu các thay đổi trước khi quay lại?',
    );
  });

  it('keeps save, discard, and stay-editing callbacks strictly separated', () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    const onCancel = vi.fn();

    render(<UnsavedChangesDialog isOpen={true} onSave={onSave} onDiscard={onDiscard} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Lưu & quay lại'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onDiscard).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Bỏ thay đổi'));
    expect(onDiscard).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Ở lại chỉnh sửa'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('maps backdrop close and back handling to onCancel only', () => {
    const onCancel = vi.fn();

    render(<UnsavedChangesDialog isOpen={true} onSave={vi.fn()} onDiscard={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(useModalBackHandler).toHaveBeenCalledWith(true, onCancel);
  });

  it('keeps long action labels readable on narrow layouts', () => {
    render(<UnsavedChangesDialog isOpen={true} onSave={vi.fn()} onDiscard={vi.fn()} onCancel={vi.fn()} />);

    for (const label of ['Lưu & quay lại', 'Bỏ thay đổi', 'Ở lại chỉnh sửa']) {
      expect(screen.getByText(label).className).toContain('whitespace-normal');
    }
  });
});
