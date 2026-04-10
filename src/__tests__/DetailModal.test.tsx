import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DetailModal } from '../components/shared/DetailModal';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

describe('DetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wires title and description into dialog semantics', () => {
    render(
      <DetailModal
        title="Chi tiết bữa ăn"
        description="Mô tả dài"
        editLabel="Chỉnh sửa"
        onClose={vi.fn()}
        onEdit={vi.fn()}
      >
        <p>Nội dung</p>
      </DetailModal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Chi tiết bữa ăn' });
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(screen.getByText('Mô tả dài')).toHaveAttribute('id', dialog.getAttribute('aria-describedby'));
  });

  it('wires close button and both edit affordances to the correct callbacks', () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();

    render(
      <DetailModal title="Chi tiết" editLabel="Chỉnh sửa" onClose={onClose} onEdit={onEdit}>
        <p>Nội dung</p>
      </DetailModal>,
    );

    fireEvent.click(screen.getByTestId('btn-detail-close'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-detail-edit'));
    fireEvent.click(screen.getByText('Chỉnh sửa'));
    expect(onEdit).toHaveBeenCalledTimes(2);
  });

  it('registers modal back handling and exposes sticky body/footer regions', () => {
    const onClose = vi.fn();
    render(
      <DetailModal title="Chi tiết" editLabel="Chỉnh sửa" onClose={onClose} onEdit={vi.fn()}>
        <div>Nội dung dài</div>
      </DetailModal>,
    );

    expect(useModalBackHandler).toHaveBeenCalledWith(true, onClose);
    expect(screen.getByTestId('detail-modal-body').className).toContain('overflow-y-auto');
    expect(screen.getByTestId('detail-modal-footer').className).toContain('sticky');
  });
});
