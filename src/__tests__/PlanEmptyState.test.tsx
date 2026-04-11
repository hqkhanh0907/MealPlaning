import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import type { PlanEmptyContext } from '../features/fitness/components/PlanEmptyState';
import { PlanEmptyState } from '../features/fitness/components/PlanEmptyState';

const translations: Record<string, string> = {
  'fitness.emptyState.noPlanTitle': 'Bắt đầu hành trình',
  'fitness.emptyState.noPlanDescription': 'Tạo kế hoạch tập luyện phù hợp với bạn',
  'fitness.emptyState.noPlanCta': 'Tạo kế hoạch',
  'fitness.emptyState.noHistoryTitle': 'Chưa có buổi tập',
  'fitness.emptyState.noHistoryDescription': 'Hoàn thành buổi tập đầu tiên',
  'fitness.emptyState.noHistoryCta': 'Bắt đầu tập',
  'fitness.emptyState.noProgressTitle': 'Chưa có dữ liệu',
  'fitness.emptyState.noProgressDescription': 'Tập luyện để xem tiến trình',
  'fitness.emptyState.noProgressCta': 'Bắt đầu tập',
  'fitness.emptyState.emptyDayTitle': 'Chưa có bài tập',
  'fitness.emptyState.emptyDayCta': 'Thêm bài tập',
  'fitness.emptyState.searchNoResultsTitle': 'Không tìm thấy',
  'fitness.emptyState.searchNoResultsCta': 'Tạo bài tập mới',
};

const mockT = vi.fn((key: string) => translations[key] ?? key);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'vi' },
  }),
}));

afterEach(() => {
  cleanup();
  mockT.mockClear();
});

describe('PlanEmptyState', () => {
  // ── TS-01: Context → Variant Mapping ──

  describe('context: no-plan (hero)', () => {
    // TC_ES_01 + TC_ES_06: hero variant with Target icon
    it('renders hero variant with Target icon', () => {
      const { container } = render(<PlanEmptyState context="no-plan" onAction={vi.fn()} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass('animate-slide-up');
      expect(root).toHaveClass('rounded-2xl', 'border-dashed');

      const iconSvg = root.querySelector('svg[aria-hidden="true"]');
      expect(iconSvg).toBeInTheDocument();
      expect(iconSvg).toHaveClass('h-8', 'w-8');
    });

    // TC_ES_11: correct title, description, CTA
    it('displays correct title, description, CTA', () => {
      render(<PlanEmptyState context="no-plan" onAction={vi.fn()} />);
      expect(screen.getByText('Bắt đầu hành trình')).toBeInTheDocument();
      expect(screen.getByText('Tạo kế hoạch tập luyện phù hợp với bạn')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tạo kế hoạch/ })).toBeInTheDocument();
    });

    // TC_ES_16: CTA click calls onAction
    it('calls onAction when CTA clicked', () => {
      const onAction = vi.fn();
      render(<PlanEmptyState context="no-plan" onAction={onAction} />);
      fireEvent.click(screen.getByRole('button', { name: /Tạo kế hoạch/ }));
      expect(onAction).toHaveBeenCalledOnce();
    });

    // TC_ES_21: entrance animation class
    it('has entrance animation class', () => {
      const { container } = render(<PlanEmptyState context="no-plan" onAction={vi.fn()} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass('animate-slide-up');
    });

    // TC_ES_24: hero CTA button touch target
    it('hero CTA button has sufficient touch target', () => {
      render(<PlanEmptyState context="no-plan" onAction={vi.fn()} />);
      const btn = screen.getByRole('button', { name: /Tạo kế hoạch/ });
      expect(btn).toHaveClass('py-2.5', 'px-5');
    });

    // TC_ES_29: context isolation
    it('does not render other context content', () => {
      render(<PlanEmptyState context="no-plan" onAction={vi.fn()} />);
      expect(screen.queryByText('Chưa có buổi tập')).not.toBeInTheDocument();
      expect(screen.queryByText('Không tìm thấy')).not.toBeInTheDocument();
      expect(screen.queryByText('Chưa có bài tập')).not.toBeInTheDocument();
    });
  });

  // ── TS-01/02/03: no-history (standard) ──

  describe('context: no-history (standard)', () => {
    // TC_ES_02 + TC_ES_07: standard variant with Dumbbell icon
    it('renders standard variant with Dumbbell icon', () => {
      const { container } = render(<PlanEmptyState context="no-history" onAction={vi.fn()} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass('animate-fade-in');
      expect(root).toHaveClass('px-6', 'py-12');

      const iconSvg = root.querySelector('svg[aria-hidden="true"]');
      expect(iconSvg).toBeInTheDocument();
      expect(iconSvg).toHaveClass('h-6', 'w-6');
    });

    // TC_ES_12: correct text
    it('displays correct title, description, CTA', () => {
      render(<PlanEmptyState context="no-history" onAction={vi.fn()} />);
      expect(screen.getByText('Chưa có buổi tập')).toBeInTheDocument();
      expect(screen.getByText('Hoàn thành buổi tập đầu tiên')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Bắt đầu tập/ })).toBeInTheDocument();
    });

    // TC_ES_17: CTA click
    it('calls onAction when CTA clicked', () => {
      const onAction = vi.fn();
      render(<PlanEmptyState context="no-history" onAction={onAction} />);
      fireEvent.click(screen.getByRole('button', { name: /Bắt đầu tập/ }));
      expect(onAction).toHaveBeenCalledOnce();
    });

    // TC_ES_22: animation class
    it('has animate-fade-in class', () => {
      const { container } = render(<PlanEmptyState context="no-history" onAction={vi.fn()} />);
      expect(container.firstElementChild).toHaveClass('animate-fade-in');
    });

    // TC_ES_25: touch target
    it('standard CTA button meets touch target', () => {
      render(<PlanEmptyState context="no-history" onAction={vi.fn()} />);
      const btn = screen.getByRole('button', { name: /Bắt đầu tập/ });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveClass('py-2.5', 'px-5');
    });
  });

  // ── TS-01/02/03: no-progress (standard) ──

  describe('context: no-progress (standard)', () => {
    // TC_ES_03 + TC_ES_08: standard variant with BarChart3 icon
    it('renders standard variant with BarChart3 icon', () => {
      const { container } = render(<PlanEmptyState context="no-progress" onAction={vi.fn()} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass('animate-fade-in');
      expect(root).toHaveClass('px-6', 'py-12');

      const iconSvg = root.querySelector('svg[aria-hidden="true"]');
      expect(iconSvg).toBeInTheDocument();
      expect(iconSvg).toHaveClass('h-6', 'w-6');
    });

    // TC_ES_13: correct text
    it('displays correct title, description, CTA', () => {
      render(<PlanEmptyState context="no-progress" onAction={vi.fn()} />);
      expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument();
      expect(screen.getByText('Tập luyện để xem tiến trình')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Bắt đầu tập/ })).toBeInTheDocument();
    });

    // TC_ES_18: CTA click
    it('calls onAction when CTA clicked', () => {
      const onAction = vi.fn();
      render(<PlanEmptyState context="no-progress" onAction={onAction} />);
      fireEvent.click(screen.getByRole('button', { name: /Bắt đầu tập/ }));
      expect(onAction).toHaveBeenCalledOnce();
    });
  });

  // ── TS-01/03/07: empty-plan-day (compact) ──

  describe('context: empty-plan-day (compact)', () => {
    // TC_ES_04: compact variant
    it('renders compact variant', () => {
      const { container } = render(<PlanEmptyState context="empty-plan-day" onAction={vi.fn()} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass('animate-fade-in');
      expect(root).toHaveClass('px-4', 'py-6');
    });

    // TC_ES_14 + TC_ES_27: title and CTA, no description
    it('displays title and CTA, no description', () => {
      const { container } = render(<PlanEmptyState context="empty-plan-day" onAction={vi.fn()} />);
      expect(screen.getByText('Chưa có bài tập')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Thêm bài tập/ })).toBeInTheDocument();

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(1); // only title <p>, no description <p>
    });

    // TC_ES_09: compact has no icon container
    it('has no icon rendering', () => {
      const { container } = render(<PlanEmptyState context="empty-plan-day" onAction={vi.fn()} />);
      expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    // TC_ES_19: CTA click
    it('calls onAction when CTA clicked', () => {
      const onAction = vi.fn();
      render(<PlanEmptyState context="empty-plan-day" onAction={onAction} />);
      fireEvent.click(screen.getByRole('button', { name: /Thêm bài tập/ }));
      expect(onAction).toHaveBeenCalledOnce();
    });

    // TC_ES_23: animation class
    it('has animate-fade-in class', () => {
      const { container } = render(<PlanEmptyState context="empty-plan-day" onAction={vi.fn()} />);
      expect(container.firstElementChild).toHaveClass('animate-fade-in');
    });

    // TC_ES_26: compact CTA is link-style
    it('CTA is link-style with text-primary', () => {
      render(<PlanEmptyState context="empty-plan-day" onAction={vi.fn()} />);
      const btn = screen.getByRole('button', { name: /Thêm bài tập/ });
      expect(btn).toHaveClass('text-primary');
    });

    // TC_ES_30: context isolation
    it('does not render hero/standard elements', () => {
      const { container } = render(<PlanEmptyState context="empty-plan-day" onAction={vi.fn()} />);
      expect(screen.queryByText('Bắt đầu hành trình')).not.toBeInTheDocument();
      expect(screen.queryByText('Chưa có buổi tập')).not.toBeInTheDocument();
      expect(container.querySelector('.rounded-2xl.border-dashed')).not.toBeInTheDocument();
    });
  });

  // ── TS-01/03/07: search-no-results (compact) ──

  describe('context: search-no-results (compact)', () => {
    // TC_ES_05: compact variant
    it('renders compact variant', () => {
      const { container } = render(<PlanEmptyState context="search-no-results" onAction={vi.fn()} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass('animate-fade-in');
      expect(root).toHaveClass('px-4', 'py-6');
    });

    // TC_ES_15 + TC_ES_28: title and CTA, no description
    it('displays title and CTA, no description', () => {
      const { container } = render(<PlanEmptyState context="search-no-results" onAction={vi.fn()} />);
      expect(screen.getByText('Không tìm thấy')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tạo bài tập mới/ })).toBeInTheDocument();

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(1); // only title <p>, no description <p>
    });

    // TC_ES_10: compact has no icon
    it('has no icon rendering', () => {
      const { container } = render(<PlanEmptyState context="search-no-results" onAction={vi.fn()} />);
      expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    // TC_ES_20: CTA click
    it('calls onAction when CTA clicked', () => {
      const onAction = vi.fn();
      render(<PlanEmptyState context="search-no-results" onAction={onAction} />);
      fireEvent.click(screen.getByRole('button', { name: /Tạo bài tập mới/ }));
      expect(onAction).toHaveBeenCalledOnce();
    });
  });

  // ── Edge Cases ──

  describe('edge cases', () => {
    // TC_ES_31: all text via t() — no hardcoded Vietnamese
    it('all text comes from t() — no hardcoded strings', () => {
      const contexts: PlanEmptyContext[] = [
        'no-plan',
        'no-history',
        'no-progress',
        'empty-plan-day',
        'search-no-results',
      ];

      const expectedKeysByContext: Record<PlanEmptyContext, string[]> = {
        'no-plan': [
          'fitness.emptyState.noPlanTitle',
          'fitness.emptyState.noPlanDescription',
          'fitness.emptyState.noPlanCta',
        ],
        'no-history': [
          'fitness.emptyState.noHistoryTitle',
          'fitness.emptyState.noHistoryDescription',
          'fitness.emptyState.noHistoryCta',
        ],
        'no-progress': [
          'fitness.emptyState.noProgressTitle',
          'fitness.emptyState.noProgressDescription',
          'fitness.emptyState.noProgressCta',
        ],
        'empty-plan-day': ['fitness.emptyState.emptyDayTitle', 'fitness.emptyState.emptyDayCta'],
        'search-no-results': ['fitness.emptyState.searchNoResultsTitle', 'fitness.emptyState.searchNoResultsCta'],
      };

      for (const ctx of contexts) {
        mockT.mockClear();
        cleanup();
        render(<PlanEmptyState context={ctx} onAction={vi.fn()} />);
        const calledKeys = mockT.mock.calls.map(call => call[0]);
        for (const expectedKey of expectedKeysByContext[ctx]) {
          expect(calledKeys).toContain(expectedKey);
        }
      }
    });

    // TC_ES_32: onAction not called without user interaction
    it('onAction not called without user click', () => {
      const onAction = vi.fn();
      render(<PlanEmptyState context="no-plan" onAction={onAction} />);
      expect(onAction).not.toHaveBeenCalled();
    });
  });
});
