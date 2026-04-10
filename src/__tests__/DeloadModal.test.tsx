import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DeloadModal } from '../features/fitness/components/DeloadModal';

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

describe('DeloadModal', () => {
  const defaultProps = {
    isOpen: true,
    reason:
      'Chuỗi lý do rất dài để kiểm tra xuống dòng an toàn trên màn hình hẹp 411px và không làm vỡ bố cục cảnh báo.',
    onAccept: vi.fn(),
    onOverride: vi.fn(),
  };

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

  it('renders as an alertdialog with long reason text wrapping safely', () => {
    render(<DeloadModal {...defaultProps} />);

    expect(screen.getByRole('alertdialog', { name: '🔄 Đề xuất giảm tải' })).toBeInTheDocument();
    expect(screen.getByText(defaultProps.reason).className).toContain('break-words');
    expect(screen.getByTestId('deload-accept').className).toContain('whitespace-normal');
    expect(screen.getByTestId('deload-override').className).toContain('whitespace-normal');
  });

  it('accepts only through onAccept and override only through onOverride', async () => {
    const user = userEvent.setup();
    render(<DeloadModal {...defaultProps} />);

    await user.click(screen.getByTestId('deload-accept'));
    await user.click(screen.getByTestId('deload-override'));

    expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
    expect(defaultProps.onOverride).toHaveBeenCalledTimes(1);
  });

  it('blocks implicit dismiss from backdrop and Escape', async () => {
    const user = userEvent.setup();
    render(<DeloadModal {...defaultProps} />);

    await user.click(screen.getByLabelText('Đóng'));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onAccept).not.toHaveBeenCalled();
    expect(defaultProps.onOverride).not.toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<DeloadModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
