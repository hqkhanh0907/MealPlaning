import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { DeloadModal } from '../features/fitness/components/DeloadModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fitness.deload.title': 'Đề xuất giảm tải',
        'fitness.deload.explanation':
          'Hệ thống phát hiện bạn đã tập với cường độ cao liên tục nhiều tuần.',
        'fitness.deload.accept': 'Chấp nhận giảm tải',
        'fitness.deload.override': 'Bỏ qua',
        'common.close': 'Đóng',
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({
    onClose,
    children,
  }: {
    onClose: () => void;
    children: React.ReactNode;
  }) => (
    <div data-testid="modal-backdrop">
      <button data-testid="backdrop-close" onClick={onClose} />
      {children}
    </div>
  ),
}));

afterEach(cleanup);

describe('DeloadModal', () => {
  const defaultProps = {
    isOpen: true,
    reason: '4 consecutive weeks with avg RPE ≥ 8',
    onAccept: vi.fn(),
    onOverride: vi.fn(),
  };

  it('renders modal with accept and override buttons', () => {
    render(<DeloadModal {...defaultProps} />);
    expect(screen.getByTestId('deload-modal')).toBeInTheDocument();
    expect(screen.getByTestId('deload-accept')).toBeInTheDocument();
    expect(screen.getByTestId('deload-override')).toBeInTheDocument();
  });

  it('displays the translated title', () => {
    render(<DeloadModal {...defaultProps} />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Đề xuất giảm tải');
  });

  it('displays the translated explanation', () => {
    render(<DeloadModal {...defaultProps} />);
    expect(
      screen.getByText(
        'Hệ thống phát hiện bạn đã tập với cường độ cao liên tục nhiều tuần.',
      ),
    ).toBeInTheDocument();
  });

  it('displays the reason text', () => {
    render(<DeloadModal {...defaultProps} />);
    expect(
      screen.getByText('4 consecutive weeks with avg RPE ≥ 8'),
    ).toBeInTheDocument();
  });

  it('calls onAccept when accept button is clicked', () => {
    const onAccept = vi.fn();
    render(<DeloadModal {...defaultProps} onAccept={onAccept} />);
    fireEvent.click(screen.getByTestId('deload-accept'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('calls onOverride when override button is clicked', () => {
    const onOverride = vi.fn();
    render(<DeloadModal {...defaultProps} onOverride={onOverride} />);
    fireEvent.click(screen.getByTestId('deload-override'));
    expect(onOverride).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <DeloadModal {...defaultProps} isOpen={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('uses ModalBackdrop with onClose bound to onAccept', () => {
    const onAccept = vi.fn();
    render(<DeloadModal {...defaultProps} onAccept={onAccept} />);
    fireEvent.click(screen.getByTestId('backdrop-close'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
