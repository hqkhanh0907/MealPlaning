import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mocks ---

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'common.back': 'Quay lại',
        'fitness.splitChanger.title': 'Đổi kiểu chia nhóm cơ',
        'fitness.splitChanger.fullBody': 'Toàn thân',
        'fitness.splitChanger.fullBodyDesc': 'Tập toàn bộ cơ thể mỗi buổi',
        'fitness.splitChanger.upperLower': 'Trên/Dưới',
        'fitness.splitChanger.upperLowerDesc': 'Chia thành thân trên và thân dưới',
        'fitness.splitChanger.ppl': 'Đẩy/Kéo/Chân',
        'fitness.splitChanger.pplDesc': 'Push, Pull, Legs',
        'fitness.splitChanger.broSplit': 'Chia từng nhóm',
        'fitness.splitChanger.broSplitDesc': 'Mỗi ngày một nhóm cơ',
        'fitness.splitChanger.custom': 'Tùy chỉnh',
        'fitness.splitChanger.customDesc': 'Tự sắp xếp nhóm cơ',
        'fitness.splitChanger.modeTitle': 'Cách xử lý bài tập hiện tại',
        'fitness.splitChanger.regenerate': 'Tạo mới toàn bộ',
        'fitness.splitChanger.regenerateWarning': 'Tất cả bài tập tùy chỉnh sẽ bị mất',
        'fitness.splitChanger.remap': 'Giữ bài tập & sắp xếp lại',
        'fitness.splitChanger.remapDesc': 'Bài tập hiện tại sẽ được sắp xếp lại theo cấu trúc mới',
        'fitness.splitChanger.mapped': 'Đã ghép',
        'fitness.splitChanger.suggested': 'Gợi ý',
        'fitness.splitChanger.unmapped': 'Chưa ghép',
        'fitness.splitChanger.apply': 'Áp dụng',
        'fitness.splitChanger.cancel': 'Hủy',
        'fitness.splitChanger.confirm': 'Xác nhận',
        'fitness.splitChanger.preview': 'Xem trước',
        'fitness.splitChanger.previewError': 'Không thể xem trước. Vui lòng thử lại.',
        'fitness.splitChanger.applyError': 'Lỗi áp dụng thay đổi. Vui lòng thử lại.',
      };
      if (key === 'fitness.splitChanger.changeTo' && opts?.split) {
        return `Đổi sang ${opts.split}`;
      }
      return translations[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

const mockPopPage = vi.fn();
vi.mock('@/store/navigationStore', () => ({
  useNavigationStore: () => ({
    popPage: mockPopPage,
  }),
}));

const mockChangeSplitType = vi.fn();
const mockPreviewSplitChange = vi.fn();

vi.mock('@/store/fitnessStore', () => ({
  useFitnessStore: () => ({
    changeSplitType: mockChangeSplitType,
    previewSplitChange: mockPreviewSplitChange,
  }),
}));

vi.mock('lucide-react', () => {
  const icon = (name: string) =>
    ({ className, ...rest }: Record<string, unknown>) => (
      <span data-testid={`icon-${name}`} className={className as string} {...rest}>{name}</span>
    );
  return {
    ArrowLeft: icon('arrow-left'),
    Check: icon('check'),
    AlertTriangle: icon('alert-triangle'),
    Lightbulb: icon('lightbulb'),
    CircleAlert: icon('circle-alert'),
    Loader2: icon('loader'),
    RefreshCw: icon('refresh'),
    Shuffle: icon('shuffle'),
    Info: icon('info'),
    XIcon: icon('x'),
  };
});

// Minimal mock for Sheet — renders children directly when open
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="mock-sheet">{children}</div> : null,
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

import { SplitChanger } from '../features/fitness/components/SplitChanger';
import type { SplitChangePreview } from '../features/fitness/types';

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
          muscleGroups: '["chest","shoulders"]',
          exercises: '[]',
          isUserAssigned: false,
          originalDayOfWeek: 1,
          notes: 'Push Day',
        },
        toDay: 'Push Day',
        toMuscleGroups: ['chest', 'shoulders'],
      },
    ],
    suggested: [
      { day: 'Pull Day', muscleGroups: ['back', 'arms'], reason: 'Gợi ý dựa trên profile' },
    ],
    unmapped: [
      {
        id: 'd3',
        planId: 'plan1',
        dayOfWeek: 5,
        sessionOrder: 1,
        workoutType: 'cardio',
        isUserAssigned: false,
        originalDayOfWeek: 5,
        notes: 'Cardio Day',
      },
    ],
    ...overrides,
  };
}

describe('SplitChanger', () => {
  const defaultProps = {
    planId: 'plan1',
    currentSplit: 'upper_lower' as const,
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    mockPreviewSplitChange.mockReturnValue(makeMockPreview());
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders header with title', () => {
    render(<SplitChanger {...defaultProps} />);
    expect(screen.getByText('Đổi kiểu chia nhóm cơ')).toBeInTheDocument();
  });

  it('renders all 5 split options', () => {
    render(<SplitChanger {...defaultProps} />);
    expect(screen.getByText('Toàn thân')).toBeInTheDocument();
    expect(screen.getByText('Trên/Dưới')).toBeInTheDocument();
    expect(screen.getByText('Đẩy/Kéo/Chân')).toBeInTheDocument();
    expect(screen.getByText('Chia từng nhóm')).toBeInTheDocument();
    expect(screen.getByText('Tùy chỉnh')).toBeInTheDocument();
  });

  it('renders descriptions for split options', () => {
    render(<SplitChanger {...defaultProps} />);
    expect(screen.getByText('Tập toàn bộ cơ thể mỗi buổi')).toBeInTheDocument();
    expect(screen.getByText('Chia thành thân trên và thân dưới')).toBeInTheDocument();
    expect(screen.getByText('Push, Pull, Legs')).toBeInTheDocument();
  });

  it('shows checkmark on current split', () => {
    render(<SplitChanger {...defaultProps} />);
    const checkmarks = screen.getAllByTestId('current-split-check');
    expect(checkmarks).toHaveLength(1);
    const upperLowerOption = screen.getByTestId('split-option-upper_lower');
    expect(upperLowerOption).toContainElement(checkmarks[0]);
  });

  it('apply button disabled when same split selected', () => {
    render(<SplitChanger {...defaultProps} />);
    const applyBtn = screen.getByTestId('apply-button');
    expect(applyBtn).toBeDisabled();
  });

  it('does not show mode selector when same split selected', () => {
    render(<SplitChanger {...defaultProps} />);
    expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument();
  });

  it('shows mode selector when different split selected', () => {
    render(<SplitChanger {...defaultProps} />);
    const pplOption = screen.getByTestId('split-option-ppl');
    fireEvent.click(pplOption);
    expect(screen.getByTestId('mode-selector')).toBeInTheDocument();
    expect(screen.getByText('Tạo mới toàn bộ')).toBeInTheDocument();
    expect(screen.getByText('Giữ bài tập & sắp xếp lại')).toBeInTheDocument();
  });

  it('enables apply button when different split selected', () => {
    render(<SplitChanger {...defaultProps} />);
    const pplOption = screen.getByTestId('split-option-ppl');
    fireEvent.click(pplOption);
    const applyBtn = screen.getByTestId('apply-button');
    expect(applyBtn).not.toBeDisabled();
  });

  it('shows preview panel in remap mode with preview data', () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    // Default mode is remap, so preview panel should show
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
    expect(screen.getByTestId('preview-summary')).toBeInTheDocument();
  });

  it('displays mapped, suggested, unmapped counts', () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    const summary = screen.getByTestId('preview-summary');
    expect(summary).toHaveTextContent('1 Đã ghép');
    expect(summary).toHaveTextContent('1 Gợi ý');
    expect(summary).toHaveTextContent('1 Chưa ghép');
  });

  it('displays mapped exercise items', () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    const mappedItems = screen.getAllByTestId('preview-mapped-item');
    expect(mappedItems).toHaveLength(1);
    expect(mappedItems[0]).toHaveTextContent('Push Day');
  });

  it('displays suggested exercise items', () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    const suggestedItems = screen.getAllByTestId('preview-suggested-item');
    expect(suggestedItems).toHaveLength(1);
    expect(suggestedItems[0]).toHaveTextContent('Pull Day');
  });

  it('displays unmapped exercise items', () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    const unmappedItems = screen.getAllByTestId('preview-unmapped-item');
    expect(unmappedItems).toHaveLength(1);
    expect(unmappedItems[0]).toHaveTextContent('Cardio Day');
  });

  it('hides preview panel when regenerate mode selected', () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('mode-regenerate'));
    expect(screen.queryByTestId('preview-panel')).not.toBeInTheDocument();
  });

  it('shows regenerate warning text', () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    expect(screen.getByText('Tất cả bài tập tùy chỉnh sẽ bị mất')).toBeInTheDocument();
  });

  it('opens confirmation sheet on apply', () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    fireEvent.click(screen.getByTestId('apply-button'));
    expect(screen.getByTestId('mock-sheet')).toBeInTheDocument();
  });

  it('calls changeSplitType and onComplete on confirm', async () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    fireEvent.click(screen.getByTestId('apply-button'));

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-button'));
    });

    expect(mockChangeSplitType).toHaveBeenCalledWith('plan1', 'ppl', 'remap');
    expect(defaultProps.onComplete).toHaveBeenCalled();
  });

  it('calls changeSplitType with regenerate mode when selected', async () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    fireEvent.click(screen.getByTestId('mode-regenerate'));
    fireEvent.click(screen.getByTestId('apply-button'));

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-button'));
    });

    expect(mockChangeSplitType).toHaveBeenCalledWith('plan1', 'ppl', 'regenerate');
  });

  it('back button calls popPage', () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(mockPopPage).toHaveBeenCalled();
  });

  it('back button has aria-label', () => {
    render(<SplitChanger {...defaultProps} />);
    const backBtn = screen.getByTestId('back-button');
    expect(backBtn).toHaveAttribute('aria-label', 'Quay lại');
  });

  it('calls previewSplitChange when selecting a different split', () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    expect(mockPreviewSplitChange).toHaveBeenCalledWith('plan1', 'ppl');
  });

  it('shows error when previewSplitChange throws', () => {
    mockPreviewSplitChange.mockImplementation(() => {
      throw new Error('fail');
    });
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    expect(screen.getByTestId('preview-error')).toBeInTheDocument();
    expect(screen.getByText('Không thể xem trước. Vui lòng thử lại.')).toBeInTheDocument();
  });

  it('does not show preview when selecting the current split again', () => {
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('split-option-upper_lower'));
    expect(screen.queryByTestId('preview-panel')).not.toBeInTheDocument();
  });

  it('preview panel shows empty when no mapped/suggested/unmapped', () => {
    mockPreviewSplitChange.mockReturnValue({ mapped: [], suggested: [], unmapped: [] });
    render(<SplitChanger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('split-option-ppl'));
    const summary = screen.getByTestId('preview-summary');
    expect(summary).toHaveTextContent('0 Đã ghép');
    expect(summary).toHaveTextContent('0 Gợi ý');
    expect(summary).toHaveTextContent('0 Chưa ghép');
  });
});
