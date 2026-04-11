import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { PlanEmptyState } from '../features/fitness/components/PlanEmptyState';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, optionsOrFallback?: string | Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'fitness.plan.planExpired': 'Kế hoạch đã hết hạn',
        'fitness.plan.planExpiredMessage': 'Kế hoạch tập luyện của bạn đã hết hạn.',
        'fitness.plan.createNewCycle': 'Tạo chu kỳ mới',
        'fitness.plan.autoReadyTitle': 'Chưa có lịch tập cho tuần này',
        'fitness.plan.autoReadyMissing': 'kế hoạch tập luyện đang hoạt động',
        'fitness.plan.autoReadyReason': 'không có plan nào để hệ thống gợi ý buổi tập',
        'fitness.plan.autoReadyNextStep': 'tạo kế hoạch để biết hôm nay nên tập gì',
        'fitness.plan.autoReadyValue': 'Sau khi tạo plan, tab này sẽ hiển thị lịch tuần.',
        'fitness.plan.createPlan': 'Tạo kế hoạch',
        'fitness.plan.generating': 'Đang tạo...',
        'fitness.plan.manualReadyTitle': 'Sẵn sàng tự xếp lịch tập',
        'fitness.plan.manualReadyMissing': 'buổi tập đầu tiên trong tuần',
        'fitness.plan.manualReadyReason': 'bạn đã chọn chế độ thủ công',
        'fitness.plan.manualReadyNextStep': 'tạo buổi đầu tiên để mở lịch tuần',
        'fitness.plan.manualReadyValue': 'Khi có buổi đầu tiên, bạn sẽ quản lý được ngày tập.',
        'fitness.plan.createFirstWorkout': 'Tạo buổi tập đầu tiên',
      };
      const template = translations[key];
      if (template && typeof optionsOrFallback === 'object' && optionsOrFallback !== null) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
          String((optionsOrFallback as Record<string, unknown>)[k] ?? ''),
        );
      }
      if (template) return template;
      if (typeof optionsOrFallback === 'string') return optionsOrFallback;
      return key;
    },
    i18n: { language: 'vi' },
  }),
}));

afterEach(cleanup);

describe('PlanEmptyState', () => {
  describe('expired-plan context', () => {
    it('renders expired plan UI with CTA', () => {
      const onAction = vi.fn();
      render(<PlanEmptyState context="expired-plan" onAction={onAction} />);
      expect(screen.getByTestId('training-plan-view')).toBeInTheDocument();
      expect(screen.getByTestId('plan-expired-cta')).toBeInTheDocument();
      expect(screen.getByText('Kế hoạch đã hết hạn')).toBeInTheDocument();
      expect(screen.getByText('Kế hoạch tập luyện của bạn đã hết hạn.')).toBeInTheDocument();
      expect(screen.getByTestId('create-new-cycle-btn')).toBeInTheDocument();
    });

    it('calls onAction when CTA clicked', () => {
      const onAction = vi.fn();
      render(<PlanEmptyState context="expired-plan" onAction={onAction} />);
      fireEvent.click(screen.getByTestId('create-new-cycle-btn'));
      expect(onAction).toHaveBeenCalledOnce();
    });

    it('does not render no-plan or manual elements', () => {
      render(<PlanEmptyState context="expired-plan" onAction={vi.fn()} />);
      expect(screen.queryByTestId('no-plan-cta')).not.toBeInTheDocument();
      expect(screen.queryByTestId('manual-plan-cta')).not.toBeInTheDocument();
    });
  });

  describe('no-plan context', () => {
    it('renders auto plan CTA', () => {
      render(<PlanEmptyState context="no-plan" onAction={vi.fn()} />);
      expect(screen.getByTestId('training-plan-view')).toBeInTheDocument();
      expect(screen.getByTestId('no-plan-cta')).toBeInTheDocument();
      expect(screen.getByText('Chưa có lịch tập cho tuần này')).toBeInTheDocument();
      expect(screen.getByTestId('create-plan-btn')).toBeInTheDocument();
    });

    it('calls onAction when CTA clicked', () => {
      const onAction = vi.fn();
      render(<PlanEmptyState context="no-plan" onAction={onAction} />);
      fireEvent.click(screen.getByTestId('create-plan-btn'));
      expect(onAction).toHaveBeenCalledOnce();
    });

    it('shows generating spinner when isGenerating', () => {
      render(<PlanEmptyState context="no-plan" onAction={vi.fn()} isGenerating />);
      const btn = screen.getByTestId('create-plan-btn');
      expect(btn).toBeDisabled();
      expect(btn).toHaveTextContent('Đang tạo...');
    });

    it('shows normal label when not generating', () => {
      render(<PlanEmptyState context="no-plan" onAction={vi.fn()} />);
      expect(screen.getByTestId('create-plan-btn')).toHaveTextContent('Tạo kế hoạch');
    });

    it('does not render expired or manual elements', () => {
      render(<PlanEmptyState context="no-plan" onAction={vi.fn()} />);
      expect(screen.queryByTestId('plan-expired-cta')).not.toBeInTheDocument();
      expect(screen.queryByTestId('manual-plan-cta')).not.toBeInTheDocument();
    });
  });

  describe('manual-no-exercises context', () => {
    it('renders manual plan CTA', () => {
      render(<PlanEmptyState context="manual-no-exercises" onAction={vi.fn()} />);
      expect(screen.getByTestId('training-plan-view')).toBeInTheDocument();
      expect(screen.getByTestId('manual-plan-cta')).toBeInTheDocument();
      expect(screen.getByText('Sẵn sàng tự xếp lịch tập')).toBeInTheDocument();
      expect(screen.getByTestId('create-manual-plan-btn')).toBeInTheDocument();
    });

    it('calls onAction when CTA clicked', () => {
      const onAction = vi.fn();
      render(<PlanEmptyState context="manual-no-exercises" onAction={onAction} />);
      fireEvent.click(screen.getByTestId('create-manual-plan-btn'));
      expect(onAction).toHaveBeenCalledOnce();
    });

    it('shows SurfaceStateContract content', () => {
      render(<PlanEmptyState context="manual-no-exercises" onAction={vi.fn()} />);
      expect(screen.getByText(/buổi tập đầu tiên trong tuần/)).toBeInTheDocument();
    });

    it('does not render expired or no-plan elements', () => {
      render(<PlanEmptyState context="manual-no-exercises" onAction={vi.fn()} />);
      expect(screen.queryByTestId('plan-expired-cta')).not.toBeInTheDocument();
      expect(screen.queryByTestId('no-plan-cta')).not.toBeInTheDocument();
    });
  });

  describe('isGenerating default', () => {
    it('defaults to false', () => {
      render(<PlanEmptyState context="no-plan" onAction={vi.fn()} />);
      expect(screen.getByTestId('create-plan-btn')).not.toBeDisabled();
    });
  });
});
