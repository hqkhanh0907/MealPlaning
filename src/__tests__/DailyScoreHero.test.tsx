import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DailyScoreData } from '../features/dashboard/hooks/useDailyScore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'dashboard.hero.scoreLabel.excellent': 'Tuyệt vời!',
        'dashboard.hero.scoreLabel.good': 'Khá tốt',
        'dashboard.hero.scoreLabel.needsWork': 'Cần cố gắng',
        'dashboard.hero.partialData': 'cập nhật khi log thêm',
        'dashboard.hero.firstTime.title': 'Hãy bắt đầu nào! 🚀',
        'dashboard.hero.firstTime.step1': 'Cập nhật hồ sơ sức khỏe',
        'dashboard.hero.firstTime.step2': 'Ghi nhận cân nặng',
        'dashboard.hero.firstTime.step3': 'Log bữa ăn đầu tiên',
        'dashboard.hero.firstTime.a11y': 'Chào mừng bạn mới. Hãy bắt đầu thiết lập hồ sơ sức khỏe.',
        'dashboard.hero.a11yLabel': `Daily Score: ${params?.score ?? ''} trên 100. ${params?.label ?? ''}`,
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../features/dashboard/hooks/useDailyScore', () => ({
  useDailyScore: vi.fn(),
}));

import { DailyScoreHero } from '../features/dashboard/components/DailyScoreHero';
import { useDailyScore } from '../features/dashboard/hooks/useDailyScore';

const mockUseDailyScore = vi.mocked(useDailyScore);

function setDailyScore(overrides: Partial<DailyScoreData> = {}): void {
  mockUseDailyScore.mockReturnValue({
    totalScore: 85,
    factors: {
      calories: 90,
      protein: 60,
      workout: 100,
      weightLog: 100,
      streak: 60,
    },
    color: 'emerald',
    greeting: 'Chào buổi sáng!',
    isFirstTimeUser: false,
    ...overrides,
  });
}

describe('DailyScoreHero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('gradient by score range', () => {
    it('renders emerald gradient for score >= 80', () => {
      setDailyScore({ totalScore: 85, color: 'emerald' });
      render(<DailyScoreHero />);

      const hero = screen.getByTestId('daily-score-hero');
      expect(hero.className).toContain('from-emerald-500');
      expect(hero.className).toContain('to-emerald-600');
    });

    it('renders amber gradient for score 50-79', () => {
      setDailyScore({ totalScore: 65, color: 'amber' });
      render(<DailyScoreHero />);

      const hero = screen.getByTestId('daily-score-hero');
      expect(hero.className).toContain('from-amber-500');
      expect(hero.className).toContain('to-amber-600');
    });

    it('renders slate gradient for score < 50', () => {
      setDailyScore({ totalScore: 30, color: 'slate' });
      render(<DailyScoreHero />);

      const hero = screen.getByTestId('daily-score-hero');
      expect(hero.className).toContain('from-slate-500');
      expect(hero.className).toContain('to-slate-600');
    });
  });

  describe('greeting', () => {
    it('displays morning greeting', () => {
      setDailyScore({ greeting: 'Chào buổi sáng!' });
      render(<DailyScoreHero />);
      expect(screen.getByText('Chào buổi sáng!')).toBeInTheDocument();
    });

    it('displays afternoon greeting', () => {
      setDailyScore({ greeting: 'Chào buổi chiều!' });
      render(<DailyScoreHero />);
      expect(screen.getByText('Chào buổi chiều!')).toBeInTheDocument();
    });

    it('displays evening greeting', () => {
      setDailyScore({ greeting: 'Chào buổi tối!' });
      render(<DailyScoreHero />);
      expect(screen.getByText('Chào buổi tối!')).toBeInTheDocument();
    });
  });

  describe('score display', () => {
    it('shows score number with tabular-nums', () => {
      setDailyScore({ totalScore: 92 });
      render(<DailyScoreHero />);

      const scoreEl = screen.getByTestId('score-number');
      expect(scoreEl).toHaveTextContent('92');
      expect(scoreEl.className).toContain('tabular-nums');
    });

    it('shows "Tuyệt vời!" label for score >= 80', () => {
      setDailyScore({ totalScore: 80, color: 'emerald' });
      render(<DailyScoreHero />);
      expect(screen.getByText('Tuyệt vời!')).toBeInTheDocument();
    });

    it('shows "Khá tốt" label for score 50-79', () => {
      setDailyScore({ totalScore: 65, color: 'amber' });
      render(<DailyScoreHero />);
      expect(screen.getByText('Khá tốt')).toBeInTheDocument();
    });

    it('shows "Cần cố gắng" label for score < 50', () => {
      setDailyScore({ totalScore: 30, color: 'slate' });
      render(<DailyScoreHero />);
      expect(screen.getByText('Cần cố gắng')).toBeInTheDocument();
    });
  });

  describe('sub-score badges', () => {
    it('renders all 5 badges when all factors are present', () => {
      setDailyScore({
        factors: {
          calories: 90,
          protein: 60,
          workout: 100,
          weightLog: 100,
          streak: 60,
        },
      });
      render(<DailyScoreHero />);

      const badges = screen.getByTestId('score-badges');
      expect(badges).toBeInTheDocument();

      expect(screen.getByTestId('badge-calories')).toBeInTheDocument();
      expect(screen.getByTestId('badge-protein')).toBeInTheDocument();
      expect(screen.getByTestId('badge-workout')).toBeInTheDocument();
      expect(screen.getByTestId('badge-weightLog')).toBeInTheDocument();
      expect(screen.getByTestId('badge-streak')).toBeInTheDocument();
    });

    it('displays correct score values in badges', () => {
      setDailyScore({
        factors: {
          calories: 90,
          protein: 60,
          workout: 100,
          weightLog: 100,
          streak: 60,
        },
      });
      render(<DailyScoreHero />);

      const caloriesBadge = screen.getByTestId('badge-calories');
      expect(caloriesBadge).toHaveTextContent('90');

      const proteinBadge = screen.getByTestId('badge-protein');
      expect(proteinBadge).toHaveTextContent('60');

      const workoutBadge = screen.getByTestId('badge-workout');
      expect(workoutBadge).toHaveTextContent('100');
    });

    it('renders icon SVGs inside badges', () => {
      setDailyScore({
        factors: {
          calories: 90,
          protein: null,
          workout: null,
          weightLog: null,
          streak: null,
        },
      });
      render(<DailyScoreHero />);

      const caloriesBadge = screen.getByTestId('badge-calories');
      const svg = caloriesBadge.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('lucide');
    });
  });

  describe('null handling (partial data)', () => {
    it('excludes factors with null values from badges', () => {
      setDailyScore({
        totalScore: 75,
        color: 'amber',
        factors: {
          calories: 90,
          protein: 60,
          workout: null,
          weightLog: null,
          streak: null,
        },
      });
      render(<DailyScoreHero />);

      expect(screen.getByTestId('badge-calories')).toBeInTheDocument();
      expect(screen.getByTestId('badge-protein')).toBeInTheDocument();
      expect(screen.queryByTestId('badge-workout')).not.toBeInTheDocument();
      expect(screen.queryByTestId('badge-weightLog')).not.toBeInTheDocument();
      expect(screen.queryByTestId('badge-streak')).not.toBeInTheDocument();
    });

    it('shows partial data label when not all factors are available', () => {
      setDailyScore({
        totalScore: 75,
        color: 'amber',
        factors: {
          calories: 90,
          protein: 60,
          workout: null,
          weightLog: null,
          streak: null,
        },
      });
      render(<DailyScoreHero />);

      expect(screen.getByTestId('partial-data-label')).toBeInTheDocument();
      expect(screen.getByText(/cập nhật khi log thêm/)).toBeInTheDocument();
    });

    it('does not show partial data label when all factors are available', () => {
      setDailyScore({
        factors: {
          calories: 90,
          protein: 60,
          workout: 100,
          weightLog: 100,
          streak: 60,
        },
      });
      render(<DailyScoreHero />);

      expect(screen.queryByTestId('partial-data-label')).not.toBeInTheDocument();
    });

    it('shows score with only one factor available', () => {
      setDailyScore({
        totalScore: 90,
        color: 'emerald',
        factors: {
          calories: 90,
          protein: null,
          workout: null,
          weightLog: null,
          streak: null,
        },
      });
      render(<DailyScoreHero />);

      expect(screen.getByTestId('score-number')).toHaveTextContent('90');
      expect(screen.getByTestId('badge-calories')).toBeInTheDocument();
      expect(screen.getByTestId('partial-data-label')).toBeInTheDocument();
    });
  });

  describe('first-time state', () => {
    it('shows first-time title and hides score', () => {
      setDailyScore({
        isFirstTimeUser: true,
        totalScore: 50,
        color: 'slate',
        factors: {
          calories: null,
          protein: null,
          workout: null,
          weightLog: null,
          streak: null,
        },
      });
      render(<DailyScoreHero />);

      expect(screen.getByText('Hãy bắt đầu nào! 🚀')).toBeInTheDocument();
      expect(screen.queryByTestId('score-number')).not.toBeInTheDocument();
    });

    it('uses slate gradient for first-time users', () => {
      setDailyScore({
        isFirstTimeUser: true,
        color: 'emerald',
      });
      render(<DailyScoreHero />);

      const hero = screen.getByTestId('daily-score-hero');
      expect(hero.className).toContain('from-slate-500');
      expect(hero.className).toContain('to-slate-600');
    });

    it('renders 3-step checklist', () => {
      setDailyScore({ isFirstTimeUser: true });
      render(<DailyScoreHero />);

      expect(screen.getByText('Cập nhật hồ sơ sức khỏe')).toBeInTheDocument();
      expect(screen.getByText('Ghi nhận cân nặng')).toBeInTheDocument();
      expect(screen.getByText('Log bữa ăn đầu tiên')).toBeInTheDocument();
    });

    it('shows numbered steps 1, 2, 3', () => {
      setDailyScore({ isFirstTimeUser: true });
      render(<DailyScoreHero />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent('1');
      expect(items[1]).toHaveTextContent('2');
      expect(items[2]).toHaveTextContent('3');
    });

    it('does not render badge container', () => {
      setDailyScore({ isFirstTimeUser: true });
      render(<DailyScoreHero />);

      expect(screen.queryByTestId('score-badges')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has region role with score accessibility label', () => {
      setDailyScore({ totalScore: 85, color: 'emerald' });
      render(<DailyScoreHero />);

      const hero = screen.getByRole('region');
      expect(hero).toHaveAttribute('aria-label', 'Daily Score: 85 trên 100. Tuyệt vời!');
    });

    it('has first-time accessibility label for new users', () => {
      setDailyScore({ isFirstTimeUser: true });
      render(<DailyScoreHero />);

      const hero = screen.getByRole('region');
      expect(hero).toHaveAttribute('aria-label', 'Chào mừng bạn mới. Hãy bắt đầu thiết lập hồ sơ sức khỏe.');
    });

    it('icons have aria-hidden attribute', () => {
      setDailyScore({
        factors: {
          calories: 90,
          protein: null,
          workout: null,
          weightLog: null,
          streak: null,
        },
      });
      render(<DailyScoreHero />);

      const badge = screen.getByTestId('badge-calories');
      const svg = badge.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('React.memo', () => {
    it('exports a memoized component', async () => {
      const mod = await import('../features/dashboard/components/DailyScoreHero');
      expect(mod.DailyScoreHero.$$typeof).toBe(Symbol.for('react.memo'));
    });
  });
});
