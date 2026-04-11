import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DailyScoreData } from '../features/dashboard/hooks/useDailyScore';

// --- i18n mock (preserve initReactI18next for ErrorBoundary's i18n import) ---

vi.mock('react-i18next', async importOriginal => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  const I18N_MAP: Record<string, string> = {
    'dashboard.hero.a11yLabel': 'Điểm số hôm nay: {{score}} - {{label}}',
    'dashboard.hero.scoreLabel.excellent': 'Xuất sắc',
    'dashboard.hero.scoreLabel.good': 'Tốt',
    'dashboard.hero.scoreLabel.needsWork': 'Cần cải thiện',
  };
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, params?: Record<string, unknown>) => {
        let text = I18N_MAP[key] ?? key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{{${k}}}`, String(v));
          }
        }
        return text;
      },
      i18n: { language: 'vi' },
    }),
  };
});

// --- Module mocks ---

vi.mock('../features/dashboard/hooks/useDailyScore', () => ({
  useDailyScore: vi.fn(),
}));

vi.mock('../features/dashboard/components/NutritionSection', () => ({
  NutritionSection: vi.fn(),
}));

vi.mock('../features/dashboard/components/WeeklyStatsRow', () => ({
  WeeklyStatsRow: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// --- Imports (after mocks) ---

import { CombinedHero } from '../features/dashboard/components/CombinedHero';
import { NutritionSection } from '../features/dashboard/components/NutritionSection';
import { WeeklyStatsRow } from '../features/dashboard/components/WeeklyStatsRow';
import { useDailyScore } from '../features/dashboard/hooks/useDailyScore';
import type { DashboardOrchestration } from '../features/dashboard/hooks/useDashboardOrchestration';

const mockedUseDailyScore = vi.mocked(useDailyScore);
const mockedNutritionSection = vi.mocked(NutritionSection);
const mockedWeeklyStatsRow = vi.mocked(WeeklyStatsRow);

// --- Defaults ---

const DEFAULT_SCORE: DailyScoreData = {
  totalScore: 75,
  factors: { calories: 80, protein: 70, workout: 100, weightLog: 50, streak: 60 },
  color: 'emerald',
  greeting: 'Chào buổi sáng!',
  isFirstTimeUser: false,
  heroContext: 'balanced-day',
};

const DEFAULT_ORCHESTRATION: DashboardOrchestration = {
  heroMode: 'passive',
  heroContract: {
    surface: 'dashboard.hero',
    state: 'success',
    copy: { title: 'Ổn định', reason: 'Đã sẵn sàng', nextStep: 'Theo dõi tiếp' },
  },
  showInsights: true,
  suppressInsightAction: false,
  showQuickActions: true,
  suppressPlanPrimaryActions: false,
  allowMealSlotActions: true,
};

function ThrowingComponent(): never {
  throw new Error('WeeklyStatsRow crashed');
}

// --- Tests ---

describe('CombinedHero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseDailyScore.mockReturnValue(DEFAULT_SCORE);
    mockedNutritionSection.mockImplementation(() => <div data-testid="nutrition-hero">NutritionSection</div>);
    mockedWeeklyStatsRow.mockImplementation(() => <div data-testid="weekly-snapshot">WeeklyStatsRow</div>);
  });

  it('renders NutritionSection + WeeklyStatsRow when isFirstTimeUser=false', () => {
    render(<CombinedHero />);
    expect(screen.getByTestId('nutrition-hero')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-snapshot')).toBeInTheDocument();
  });

  it('hides WeeklyStatsRow and divider when isFirstTimeUser=true', () => {
    mockedUseDailyScore.mockReturnValue({ ...DEFAULT_SCORE, isFirstTimeUser: true });
    const { container } = render(<CombinedHero />);

    expect(screen.getByTestId('nutrition-hero')).toBeInTheDocument();
    expect(screen.queryByTestId('weekly-snapshot')).not.toBeInTheDocument();
    expect(container.querySelector('.border-t')).not.toBeInTheDocument();
  });

  it('ErrorBoundary catches WeeklyStatsRow failure and shows fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedWeeklyStatsRow.mockImplementation(ThrowingComponent);

    render(<CombinedHero />);

    const fallback = screen.getByTestId('weekly-stats-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent('—');
    expect(screen.getByTestId('nutrition-hero')).toBeInTheDocument();
  });

  it.each([
    { color: 'emerald' as const, label: 'Xuất sắc' },
    { color: 'amber' as const, label: 'Tốt' },
    { color: 'slate' as const, label: 'Cần cải thiện' },
  ])('aria-label interpolates score + "$label" for color=$color', ({ color, label }) => {
    mockedUseDailyScore.mockReturnValue({ ...DEFAULT_SCORE, color, totalScore: 85 });
    render(<CombinedHero />);

    expect(screen.getByRole('region')).toHaveAttribute('aria-label', `Điểm số hôm nay: 85 - ${label}`);
  });

  it('aria-busy reflects isLoading prop', () => {
    render(<CombinedHero isLoading />);

    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
  });

  it('passes useDailyScore data as props to NutritionSection', () => {
    render(<CombinedHero />);

    expect(mockedNutritionSection).toHaveBeenCalled();
    const [props] = mockedNutritionSection.mock.calls[0];
    expect(props).toMatchObject({
      totalScore: 75,
      scoreColor: 'emerald',
      isFirstTimeUser: false,
      greeting: 'Chào buổi sáng!',
      heroContext: 'balanced-day',
    });
  });

  it('renders hero empty state when orchestration is blocking', () => {
    render(
      <CombinedHero
        orchestration={{
          ...DEFAULT_ORCHESTRATION,
          heroMode: 'blocking',
          heroContract: {
            ...DEFAULT_ORCHESTRATION.heroContract,
            state: 'setup',
            copy: {
              title: 'Hoàn tất hồ sơ sức khỏe trước',
              missing: 'Dữ liệu sức khỏe nền tảng',
              reason: 'Thiếu ngày sinh',
              nextStep: 'Mở cài đặt sức khỏe',
            },
            primaryAction: { label: 'Mở cài đặt', onAction: vi.fn() },
          },
        }}
      />,
    );

    expect(screen.getByText('Hoàn tất hồ sơ sức khỏe trước')).toBeInTheDocument();
    expect(screen.getByText(/Thiếu: Dữ liệu sức khỏe nền tảng/)).toBeInTheDocument();
    expect(screen.queryByTestId('nutrition-hero')).not.toBeInTheDocument();
    expect(screen.queryByTestId('weekly-snapshot')).not.toBeInTheDocument();
  });

  it('renders a single promoted next action strip for guided orchestration', () => {
    render(
      <CombinedHero
        orchestration={{
          ...DEFAULT_ORCHESTRATION,
          heroMode: 'guided',
          heroContract: {
            ...DEFAULT_ORCHESTRATION.heroContract,
            state: 'warning',
            copy: {
              title: 'Bắt đầu buổi tập được lên lịch',
              reason: 'Hôm nay còn buổi tập chưa bắt đầu.',
              nextStep: 'Bắt đầu buổi tập trước.',
            },
            primaryAction: { label: 'Bắt đầu buổi tập', onAction: vi.fn() },
          },
        }}
      />,
    );

    expect(screen.getByTestId('nutrition-hero')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-next-action')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-primary-action')).toHaveTextContent('Bắt đầu buổi tập');
    expect(screen.queryByTestId('weekly-snapshot')).not.toBeInTheDocument();
  });
});
