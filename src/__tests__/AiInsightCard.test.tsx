import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { AiInsightCard } from '../features/dashboard/components/AiInsightCard';
import type { Insight } from '../features/dashboard/hooks/useInsightEngine';

/* ---------- mock useInsightEngine ---------- */
let mockInsight: Insight | null = null;
const mockDismiss = vi.fn();
const mockHandleAction = vi.fn();

vi.mock('../features/dashboard/hooks/useInsightEngine', () => ({
  useInsightEngine: () => ({
    currentInsight: mockInsight,
    dismissInsight: mockDismiss,
    handleAction: mockHandleAction,
  }),
}));

/* ---------- helpers ---------- */
function makeInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'test-insight',
    priority: 8,
    type: 'tip',
    color: 'gray',
    title: 'Test Tip',
    message: 'Test message',
    dismissable: true,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockInsight = null;
});

/* ========== COMPONENT RENDER ========== */

describe('AiInsightCard', () => {
  describe('Empty state', () => {
    it('renders empty placeholder when insight is null', () => {
      mockInsight = null;
      render(<AiInsightCard />);
      expect(screen.getByTestId('ai-insight-card-empty')).toBeInTheDocument();
      expect(screen.queryByTestId('ai-insight-card')).not.toBeInTheDocument();
    });

    it('empty placeholder has min-h-[56px] for CLS prevention', () => {
      mockInsight = null;
      render(<AiInsightCard />);
      const el = screen.getByTestId('ai-insight-card-empty');
      expect(el.className).toContain('min-h-[56px]');
    });
  });

  describe('Basic rendering', () => {
    it('renders card when insight exists', () => {
      mockInsight = makeInsight();
      render(<AiInsightCard />);
      expect(screen.getByTestId('ai-insight-card')).toBeInTheDocument();
    });

    it('displays title text', () => {
      mockInsight = makeInsight({ title: 'Điều chỉnh tự động' });
      render(<AiInsightCard />);
      expect(screen.getByTestId('insight-title')).toHaveTextContent('Điều chỉnh tự động');
    });

    it('displays message text', () => {
      mockInsight = makeInsight({ message: '💧 Uống 2-3L nước mỗi ngày' });
      render(<AiInsightCard />);
      expect(screen.getByTestId('insight-message')).toHaveTextContent('💧 Uống 2-3L nước mỗi ngày');
    });

    it('renders icon element', () => {
      mockInsight = makeInsight();
      render(<AiInsightCard />);
      expect(screen.getByTestId('insight-icon')).toBeInTheDocument();
      const svg = screen.getByTestId('insight-icon').querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Fixed height (CLS prevention)', () => {
    it('card has min-h-[56px]', () => {
      mockInsight = makeInsight();
      render(<AiInsightCard />);
      const card = screen.getByTestId('ai-insight-card');
      expect(card.className).toContain('min-h-[56px]');
    });
  });

  describe('Accessibility', () => {
    it('has region role', () => {
      mockInsight = makeInsight();
      render(<AiInsightCard />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('aria-label includes type label and title for tip', () => {
      mockInsight = makeInsight({ type: 'tip', title: 'Nước' });
      render(<AiInsightCard />);
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label', 'Mẹo: Nước');
    });

    it('aria-label includes type label for alert', () => {
      mockInsight = makeInsight({ type: 'alert', color: 'dark-amber', title: 'Lưu ý' });
      render(<AiInsightCard />);
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label', 'Lưu ý: Lưu ý');
    });

    it('dismiss button has aria-label', () => {
      mockInsight = makeInsight({ dismissable: true });
      render(<AiInsightCard />);
      const dismissBtn = screen.getByTestId('insight-dismiss-btn');
      expect(dismissBtn).toHaveAttribute('aria-label');
    });
  });

  /* ========== PRIORITY-SPECIFIC RENDERING (P0-P8) ========== */

  describe('P0: Adjust (dark-amber)', () => {
    it('renders dark-amber color scheme for adjust insight', () => {
      mockInsight = makeInsight({
        id: 'p0-feedback-adjust',
        priority: 0,
        type: 'adjust',
        color: 'dark-amber',
        title: 'Đề xuất điều chỉnh',
        message: 'TB 7 ngày: 74.7 → 74.5 kg. Đề xuất Giảm 150 kcal.',
        actionLabel: 'Áp dụng',
        dismissable: true,
      });
      render(<AiInsightCard />);
      const card = screen.getByTestId('ai-insight-card');
      expect(card.className).toContain('border-warning');
      expect(card.className).toContain('bg-warning/20');
    });

    it('shows both action and dismiss buttons for adjust insight', () => {
      mockInsight = makeInsight({
        type: 'adjust',
        color: 'dark-amber',
        actionLabel: 'Áp dụng',
        dismissable: true,
      });
      render(<AiInsightCard />);
      expect(screen.getByTestId('insight-action-btn')).toHaveTextContent('Áp dụng');
      expect(screen.getByTestId('insight-dismiss-btn')).toBeInTheDocument();
    });

    it('aria-label includes adjust type label', () => {
      mockInsight = makeInsight({ type: 'adjust', color: 'dark-amber', title: 'Đề xuất điều chỉnh' });
      render(<AiInsightCard />);
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label', 'Điều chỉnh: Đề xuất điều chỉnh');
    });
  });

  describe('P1: Alert (dark-amber)', () => {
    it('renders dark-amber color scheme', () => {
      mockInsight = makeInsight({
        id: 'p1-auto-adjust',
        priority: 1,
        type: 'alert',
        color: 'dark-amber',
        title: 'Điều chỉnh tự động',
        message: 'Calories điều chỉnh: 2000 → 1800 kcal',
        actionLabel: 'Xem chi tiết',
        actionType: 'navigate',
        dismissable: false,
      });
      render(<AiInsightCard />);
      const card = screen.getByTestId('ai-insight-card');
      expect(card.className).toContain('border-warning');
      expect(card.className).toContain('bg-warning/20');
    });

    it('does not show dismiss button (P1 not dismissable)', () => {
      mockInsight = makeInsight({
        priority: 1,
        type: 'alert',
        color: 'dark-amber',
        dismissable: false,
      });
      render(<AiInsightCard />);
      expect(screen.queryByTestId('insight-dismiss-btn')).not.toBeInTheDocument();
    });

    it('shows action button with label', () => {
      mockInsight = makeInsight({
        priority: 1,
        type: 'alert',
        color: 'dark-amber',
        actionLabel: 'Xem chi tiết',
        actionType: 'navigate',
        dismissable: false,
      });
      render(<AiInsightCard />);
      expect(screen.getByTestId('insight-action-btn')).toHaveTextContent('Xem chi tiết');
    });
  });

  describe('P2: Action (amber)', () => {
    it('renders amber color scheme', () => {
      mockInsight = makeInsight({
        id: 'p2-low-protein',
        priority: 2,
        type: 'action',
        color: 'amber',
        title: 'Protein thấp',
        message: 'Bạn mới đạt 50% mục tiêu protein',
        actionLabel: 'Gợi ý bữa tối',
        dismissable: true,
      });
      render(<AiInsightCard />);
      const card = screen.getByTestId('ai-insight-card');
      expect(card.className).toContain('border-warning');
      expect(card.className).toContain('bg-warning/10');
    });

    it('shows both action and dismiss buttons', () => {
      mockInsight = makeInsight({
        type: 'action',
        color: 'amber',
        actionLabel: 'Gợi ý bữa tối',
        dismissable: true,
      });
      render(<AiInsightCard />);
      expect(screen.getByTestId('insight-action-btn')).toBeInTheDocument();
      expect(screen.getByTestId('insight-dismiss-btn')).toBeInTheDocument();
    });
  });

  describe('P3: Remind (amber)', () => {
    it('renders with remind type', () => {
      mockInsight = makeInsight({
        id: 'p3-weight-log',
        priority: 3,
        type: 'remind',
        color: 'amber',
        title: 'Cập nhật cân nặng',
        actionLabel: 'Log cân nặng',
        dismissable: true,
      });
      render(<AiInsightCard />);
      expect(screen.getByTestId('insight-title')).toHaveTextContent('Cập nhật cân nặng');
      expect(screen.getByTestId('insight-action-btn')).toHaveTextContent('Log cân nặng');
    });
  });

  describe('P4: Motivate (blue)', () => {
    it('renders blue color scheme', () => {
      mockInsight = makeInsight({
        id: 'p4-streak-near-record',
        priority: 4,
        type: 'motivate',
        color: 'blue',
        title: 'Sắp phá kỷ lục!',
        message: 'Còn 2 ngày nữa!',
        dismissable: true,
        autoDismissHours: 24,
      });
      render(<AiInsightCard />);
      const card = screen.getByTestId('ai-insight-card');
      expect(card.className).toContain('border-info');
      expect(card.className).toContain('bg-info/10');
    });
  });

  describe('P5: Celebrate (blue)', () => {
    it('renders celebrate insight', () => {
      mockInsight = makeInsight({
        id: 'p5-pr-today',
        priority: 5,
        type: 'celebrate',
        color: 'blue',
        title: 'Kỷ lục mới! 🎉',
        dismissable: true,
      });
      render(<AiInsightCard />);
      expect(screen.getByTestId('insight-title')).toHaveTextContent('Kỷ lục mới!');
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Chúc mừng: Kỷ lục mới! 🎉');
    });
  });

  describe('P6: Praise (green)', () => {
    it('renders green color scheme', () => {
      mockInsight = makeInsight({
        id: 'p6-weekly-adherence',
        priority: 6,
        type: 'praise',
        color: 'green',
        title: 'Tuần xuất sắc! 👏',
        message: 'Bạn đã đạt 90% mục tiêu tuần này',
        dismissable: true,
      });
      render(<AiInsightCard />);
      const card = screen.getByTestId('ai-insight-card');
      expect(card.className).toContain('border-primary');
      expect(card.className).toContain('bg-primary-subtle');
    });
  });

  describe('P7: Progress (green)', () => {
    it('renders progress insight', () => {
      mockInsight = makeInsight({
        id: 'p7-weight-trend',
        priority: 7,
        type: 'progress',
        color: 'green',
        title: 'Xu hướng tốt! 📈',
        message: 'Cân nặng đúng hướng 3 tuần liên tiếp',
        dismissable: true,
      });
      render(<AiInsightCard />);
      expect(screen.getByTestId('insight-title')).toHaveTextContent('Xu hướng tốt!');
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Tiến trình: Xu hướng tốt! 📈');
    });
  });

  describe('P8: Tip (gray)', () => {
    it('renders gray color scheme', () => {
      mockInsight = makeInsight({
        id: 'p8-tip-0',
        priority: 8,
        type: 'tip',
        color: 'gray',
        title: 'Nước',
        message: '💧 Uống 2-3L nước mỗi ngày',
        dismissable: true,
      });
      render(<AiInsightCard />);
      const card = screen.getByTestId('ai-insight-card');
      expect(card.className).toContain('border-ai/20');
      expect(card.className).toContain('bg-ai-subtle');
    });

    it('does not show action button when no actionLabel', () => {
      mockInsight = makeInsight({
        type: 'tip',
        color: 'gray',
        dismissable: true,
      });
      render(<AiInsightCard />);
      expect(screen.queryByTestId('insight-action-btn')).not.toBeInTheDocument();
    });
  });

  /* ========== DISMISS BEHAVIOR ========== */

  describe('Dismiss interactions', () => {
    it('calls dismissInsight when dismiss button clicked', () => {
      mockInsight = makeInsight({ id: 'test-123', dismissable: true });
      render(<AiInsightCard />);

      fireEvent.click(screen.getByTestId('insight-dismiss-btn'));
      expect(mockDismiss).toHaveBeenCalledWith('test-123');
    });

    it('does not call dismissInsight when not dismissable', () => {
      mockInsight = makeInsight({ dismissable: false });
      render(<AiInsightCard />);

      expect(screen.queryByTestId('insight-dismiss-btn')).not.toBeInTheDocument();
    });

    it('calls handleAction when action button clicked', () => {
      mockInsight = makeInsight({
        id: 'p1-auto-adjust',
        actionLabel: 'Xem chi tiết',
        actionType: 'navigate',
        dismissable: false,
      });
      render(<AiInsightCard />);

      fireEvent.click(screen.getByTestId('insight-action-btn'));
      expect(mockHandleAction).toHaveBeenCalledWith(mockInsight);
    });
  });

  /* ========== COLOR BORDER MAPPING ========== */

  describe('Color border mapping', () => {
    const colorCases: Array<{
      color: Insight['color'];
      borderClass: string;
    }> = [
      { color: 'dark-amber', borderClass: 'border-warning' },
      { color: 'amber', borderClass: 'border-warning' },
      { color: 'blue', borderClass: 'border-info' },
      { color: 'green', borderClass: 'border-primary' },
      { color: 'gray', borderClass: 'border-ai/20' },
    ];

    it.each(colorCases)('applies $borderClass for $color color', ({ color, borderClass }) => {
      mockInsight = makeInsight({ color });
      render(<AiInsightCard />);
      const card = screen.getByTestId('ai-insight-card');
      expect(card.className).toContain('border-l-4');
      expect(card.className).toContain(borderClass);
      cleanup();
    });
  });

  /* ========== ICON MAPPING ========== */

  describe('Icon mapping', () => {
    const iconCases: Array<{ type: Insight['type']; typeLabel: string }> = [
      { type: 'adjust', typeLabel: 'Điều chỉnh' },
      { type: 'alert', typeLabel: 'Lưu ý' },
      { type: 'action', typeLabel: 'Hành động' },
      { type: 'remind', typeLabel: 'Nhắc nhở' },
      { type: 'motivate', typeLabel: 'Động lực' },
      { type: 'celebrate', typeLabel: 'Chúc mừng' },
      { type: 'praise', typeLabel: 'Khen ngợi' },
      { type: 'progress', typeLabel: 'Tiến trình' },
      { type: 'tip', typeLabel: 'Mẹo' },
    ];

    it.each(iconCases)('uses "$typeLabel" label in aria-label for $type', ({ type, typeLabel }) => {
      mockInsight = makeInsight({ type, title: 'Test' });
      render(<AiInsightCard />);
      const region = screen.getByRole('region');
      expect(region.getAttribute('aria-label')).toBe(`${typeLabel}: Test`);
      cleanup();
    });

    it.each(iconCases)('renders SVG icon for $type type', ({ type }) => {
      mockInsight = makeInsight({ type });
      render(<AiInsightCard />);
      const iconEl = screen.getByTestId('insight-icon');
      expect(iconEl.querySelector('svg')).toBeInTheDocument();
      cleanup();
    });
  });

  /* ========== React.memo ========== */

  describe('React.memo', () => {
    it('component is wrapped in React.memo', () => {
      expect((AiInsightCard as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.memo'));
    });
  });
});
