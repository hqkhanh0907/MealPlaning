import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AddSessionModal } from '../features/fitness/components/AddSessionModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'fitness.plan.addSession': 'Thêm buổi tập',
        'fitness.plan.strengthOption': 'Sức mạnh',
        'fitness.plan.strengthDesc': 'Chọn nhóm cơ → auto-gợi ý bài tập',
        'fitness.plan.cardioOption': 'Cardio',
        'fitness.plan.cardioDesc': 'HIIT, chạy bộ, đạp xe, bơi...',
        'fitness.plan.freestyleOption': 'Tập tự do',
        'fitness.plan.freestyleDesc': 'Tự chọn bài tập, không theo template',
        'fitness.plan.maxSessions': 'Tối đa 3 buổi/ngày',
        'fitness.plan.selectMuscleGroups': 'Chọn nhóm cơ',
        'fitness.plan.createSession': 'Tạo buổi tập',
        'common.close': 'Đóng',
        'common.back': 'Quay lại',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="modal-backdrop" onClick={onClose}>
      {children}
    </div>
  ),
}));

afterEach(cleanup);

describe('AddSessionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectStrength: vi.fn(),
    onSelectCardio: vi.fn(),
    onSelectFreestyle: vi.fn(),
    currentSessionCount: 1,
  };

  it('renders 3 options with correct labels', () => {
    render(<AddSessionModal {...defaultProps} />);
    expect(screen.getByText('Sức mạnh')).toBeInTheDocument();
    expect(screen.getByText('Cardio')).toBeInTheDocument();
    expect(screen.getByText('Tập tự do')).toBeInTheDocument();
  });

  it('clicking Strength shows muscle group selector', () => {
    render(<AddSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Sức mạnh'));
    expect(screen.getByText('Chọn nhóm cơ')).toBeInTheDocument();
    // 7 muscle groups should be visible as buttons
    expect(screen.getByRole('button', { name: 'chest' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'legs' })).toBeInTheDocument();
  });

  it('selecting muscle groups and confirming calls onSelectStrength with groups', () => {
    render(<AddSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Sức mạnh'));
    fireEvent.click(screen.getByRole('button', { name: 'chest' }));
    fireEvent.click(screen.getByRole('button', { name: 'shoulders' }));
    fireEvent.click(screen.getByTestId('create-strength-session'));
    expect(defaultProps.onSelectStrength).toHaveBeenCalledWith(['chest', 'shoulders']);
  });

  it('create button disabled when no muscle groups selected', () => {
    render(<AddSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Sức mạnh'));
    expect(screen.getByTestId('create-strength-session')).toBeDisabled();
  });

  it('Cardio calls onSelectCardio immediately', () => {
    render(<AddSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cardio'));
    expect(defaultProps.onSelectCardio).toHaveBeenCalled();
  });

  it('Freestyle calls onSelectFreestyle immediately', () => {
    render(<AddSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Tập tự do'));
    expect(defaultProps.onSelectFreestyle).toHaveBeenCalled();
  });

  it('shows disabled state when currentSessionCount >= 3', () => {
    render(<AddSessionModal {...defaultProps} currentSessionCount={3} />);
    expect(screen.getByText('Tối đa 3 buổi/ngày')).toBeInTheDocument();
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(<AddSessionModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('back button returns to options from muscle group view', () => {
    render(<AddSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Sức mạnh'));
    expect(screen.getByText('Chọn nhóm cơ')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Quay lại'));
    expect(screen.getByText('Sức mạnh')).toBeInTheDocument();
  });
});
