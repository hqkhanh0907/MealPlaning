import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { SplitChangePreview } from '../features/fitness/types';

// --- Mocks ---

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'fitness.splitChanger.fullBody': 'Toàn thân',
        'fitness.splitChanger.upperLower': 'Trên/Dưới',
        'fitness.splitChanger.ppl': 'Đẩy/Kéo/Chân',
        'fitness.splitChanger.broSplit': 'Chia từng nhóm',
        'fitness.splitChanger.custom': 'Tùy chỉnh',
        'fitness.splitChanger.regenerateWarning': 'Tất cả bài tập tùy chỉnh sẽ bị mất',
        'fitness.splitChanger.remapDesc': 'Bài tập hiện tại sẽ được sắp xếp lại theo cấu trúc mới',
        'fitness.splitChanger.mapped': 'Đã ghép',
        'fitness.splitChanger.suggested': 'Gợi ý',
        'fitness.splitChanger.unmapped': 'Chưa ghép',
        'fitness.splitChanger.cancel': 'Hủy',
        'fitness.splitChanger.confirm': 'Xác nhận',
      };
      if (key === 'fitness.splitChanger.changeTo' && opts?.split) {
        return `Đổi sang ${opts.split}`;
      }
      return translations[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: { className?: string }) => (
    <span data-testid="warning-icon" className={className}>warning</span>
  ),
  Info: ({ className }: { className?: string }) => (
    <span data-testid="info-icon" className={className}>info</span>
  ),
  XIcon: ({ className }: { className?: string }) => (
    <span data-testid="icon-x" className={className}>x</span>
  ),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ open, children, onOpenChange }: { open: boolean; children: React.ReactNode; onOpenChange?: (v: boolean) => void }) => {
    if (!open) return null;
    return (
      <div data-testid="mock-sheet">
        {children}
        <button data-testid="sheet-close-trigger" onClick={() => onOpenChange?.(false)}>close</button>
      </div>
    );
  },
  SheetContent: ({ children, showCloseButton: _, ...props }: { children: React.ReactNode; showCloseButton?: boolean; [key: string]: unknown }) => (
    <div data-testid="split-change-confirm-sheet" {...props}>{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <h2 data-testid="confirm-title" {...props}>{children}</h2>
  ),
  SheetDescription: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <p data-testid="confirm-description" {...props}>{children}</p>
  ),
  SheetFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

import { SplitChangeConfirm } from '../features/fitness/components/SplitChangeConfirm';

function makeMockPreview(overrides: Partial<SplitChangePreview> = {}): SplitChangePreview {
  return {
    mapped: [
      {
        from: {
          id: 'd1',
          planId: 'plan1',
          dayOfWeek: 1,
          sessionOrder: 1,
          workoutType: 'push',
          isUserAssigned: false,
          originalDayOfWeek: 1,
          notes: 'Push Day',
        },
        toDay: 'Push Day',
        toMuscleGroups: ['chest', 'shoulders'],
      },
      {
        from: {
          id: 'd2',
          planId: 'plan1',
          dayOfWeek: 3,
          sessionOrder: 1,
          workoutType: 'pull',
          isUserAssigned: false,
          originalDayOfWeek: 3,
          notes: 'Pull Day',
        },
        toDay: 'Pull Day',
        toMuscleGroups: ['back', 'arms'],
      },
    ],
    suggested: [
      { day: 'Legs Day', muscleGroups: ['legs', 'glutes'], reason: 'Gợi ý' },
    ],
    unmapped: [
      {
        id: 'd4',
        planId: 'plan1',
        dayOfWeek: 6,
        sessionOrder: 1,
        workoutType: 'extra',
        isUserAssigned: false,
        originalDayOfWeek: 6,
        notes: 'Extra Day',
      },
    ],
    ...overrides,
  };
}

describe('SplitChangeConfirm', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    newSplit: 'ppl' as const,
    mode: 'remap' as const,
    preview: makeMockPreview(),
    isLoading: false,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<SplitChangeConfirm {...defaultProps} />);
    expect(screen.getByTestId('split-change-confirm-sheet')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SplitChangeConfirm {...defaultProps} open={false} />);
    expect(screen.queryByTestId('split-change-confirm-sheet')).not.toBeInTheDocument();
  });

  it('displays title with split name for remap', () => {
    render(<SplitChangeConfirm {...defaultProps} />);
    expect(screen.getByTestId('confirm-title')).toHaveTextContent('Đổi sang Đẩy/Kéo/Chân');
  });

  it('shows info icon for remap mode', () => {
    render(<SplitChangeConfirm {...defaultProps} />);
    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();
  });

  it('shows warning icon for regenerate mode', () => {
    render(<SplitChangeConfirm {...defaultProps} mode="regenerate" />);
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('info-icon')).not.toBeInTheDocument();
  });

  it('displays regenerate warning text', () => {
    render(<SplitChangeConfirm {...defaultProps} mode="regenerate" />);
    expect(screen.getByTestId('confirm-description')).toHaveTextContent(
      'Tất cả bài tập tùy chỉnh sẽ bị mất',
    );
  });

  it('displays remap description text', () => {
    render(<SplitChangeConfirm {...defaultProps} />);
    expect(screen.getByTestId('confirm-description')).toHaveTextContent(
      'Bài tập hiện tại sẽ được sắp xếp lại theo cấu trúc mới',
    );
  });

  it('shows mapped/suggested/unmapped counts for remap', () => {
    render(<SplitChangeConfirm {...defaultProps} />);
    const summary = screen.getByTestId('confirm-remap-summary');
    expect(summary).toHaveTextContent('2 Đã ghép');
    expect(summary).toHaveTextContent('1 Gợi ý');
    expect(summary).toHaveTextContent('1 Chưa ghép');
  });

  it('does not show remap summary for regenerate mode', () => {
    render(<SplitChangeConfirm {...defaultProps} mode="regenerate" />);
    expect(screen.queryByTestId('confirm-remap-summary')).not.toBeInTheDocument();
  });

  it('confirm button calls onConfirm', () => {
    render(<SplitChangeConfirm {...defaultProps} />);
    fireEvent.click(screen.getByTestId('confirm-button'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('cancel button calls onClose', () => {
    render(<SplitChangeConfirm {...defaultProps} />);
    fireEvent.click(screen.getByTestId('cancel-button'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('disables buttons during loading', () => {
    render(<SplitChangeConfirm {...defaultProps} isLoading={true} />);
    expect(screen.getByTestId('confirm-button')).toBeDisabled();
    expect(screen.getByTestId('cancel-button')).toBeDisabled();
  });

  it('shows loading spinner on confirm button when loading', () => {
    render(<SplitChangeConfirm {...defaultProps} isLoading={true} />);
    const confirmBtn = screen.getByTestId('confirm-button');
    expect(confirmBtn).toHaveTextContent('Xác nhận');
  });

  it('uses destructive variant for regenerate confirm button', () => {
    render(<SplitChangeConfirm {...defaultProps} mode="regenerate" />);
    const confirmBtn = screen.getByTestId('confirm-button');
    expect(confirmBtn).toBeInTheDocument();
  });

  it('closing sheet calls onClose', () => {
    render(<SplitChangeConfirm {...defaultProps} />);
    fireEvent.click(screen.getByTestId('sheet-close-trigger'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays correct title for different split types', () => {
    render(<SplitChangeConfirm {...defaultProps} newSplit="full_body" />);
    expect(screen.getByTestId('confirm-title')).toHaveTextContent('Đổi sang Toàn thân');
  });

  it('displays correct title for bro_split', () => {
    render(<SplitChangeConfirm {...defaultProps} newSplit="bro_split" />);
    expect(screen.getByTestId('confirm-title')).toHaveTextContent('Đổi sang Chia từng nhóm');
  });

  it('handles empty preview data', () => {
    const emptyPreview = makeMockPreview({ mapped: [], suggested: [], unmapped: [] });
    render(<SplitChangeConfirm {...defaultProps} preview={emptyPreview} />);
    const summary = screen.getByTestId('confirm-remap-summary');
    expect(summary).toHaveTextContent('0 Đã ghép');
    expect(summary).toHaveTextContent('0 Gợi ý');
    expect(summary).toHaveTextContent('0 Chưa ghép');
  });
});
