import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { FitnessTab } from '../features/fitness/components/FitnessTab';
import { useFitnessStore } from '../store/fitnessStore';
import type { Mock } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fitness.plan.tab': 'Kế hoạch',
        'fitness.history.title': 'Lịch sử',
        'fitness.progress.title': 'Tiến trình',
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../features/fitness/components/TrainingPlanView', () => ({
  TrainingPlanView: () => (
    <div data-testid="training-plan-view">TrainingPlanView</div>
  ),
}));

vi.mock('../features/fitness/components/WorkoutHistory', () => ({
  WorkoutHistory: () => (
    <div data-testid="workout-history">WorkoutHistory</div>
  ),
}));

vi.mock('../features/fitness/components/ProgressDashboard', () => ({
  ProgressDashboard: () => (
    <div data-testid="progress-dashboard">ProgressDashboard</div>
  ),
}));

vi.mock('../features/fitness/components/StreakCounter', () => ({
  StreakCounter: () => (
    <div data-testid="streak-counter">StreakCounter</div>
  ),
}));

vi.mock('../features/fitness/components/SmartInsightBanner', () => ({
  SmartInsightBanner: () => (
    <div data-testid="smart-insight-banner">SmartInsightBanner</div>
  ),
}));

vi.mock('../features/fitness/hooks/useFitnessNutritionBridge', () => ({
  useFitnessNutritionBridge: () => ({ insight: null }),
}));

vi.mock('../features/fitness/hooks/useTrainingPlan', () => ({
  useTrainingPlan: () => ({
    generatePlan: vi.fn(() => null),
    isGenerating: false,
    generationError: null,
  }),
}));

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: (selector: (state: { profile: { age: number; weightKg: number } }) => unknown) =>
    selector({ profile: { age: 25, weightKg: 83 } }),
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
  }),
}));

interface MockFitnessState {
  trainingProfile: unknown;
  addTrainingPlan: Mock;
  addPlanDays: Mock;
}

const mockUseFitnessStore = useFitnessStore as unknown as Mock;

afterEach(cleanup);

describe('FitnessTab', () => {
  describe('when user is onboarded', () => {
    const mockAddTrainingPlan = vi.fn();
    const mockAddPlanDays = vi.fn();

    beforeEach(() => {
      mockAddTrainingPlan.mockClear();
      mockAddPlanDays.mockClear();
      mockUseFitnessStore.mockImplementation(
        (selector: (state: MockFitnessState) => unknown) =>
          selector({
            trainingProfile: null,
            addTrainingPlan: mockAddTrainingPlan,
            addPlanDays: mockAddPlanDays,
          }),
      );
    });

    it('renders sub-tab bar', () => {
      render(<FitnessTab />);
      expect(screen.getByTestId('subtab-bar')).toBeInTheDocument();
    });

    it('renders all three sub-tab buttons per spec §5.1', () => {
      render(<FitnessTab />);
      expect(screen.getByTestId('subtab-plan')).toBeInTheDocument();
      expect(screen.getByTestId('subtab-progress')).toBeInTheDocument();
      expect(screen.getByTestId('subtab-history')).toBeInTheDocument();
      expect(screen.queryByTestId('subtab-workout')).not.toBeInTheDocument();
    });

    it('defaults to Kế hoạch tab with TrainingPlanView', () => {
      render(<FitnessTab />);
      expect(screen.getByTestId('subtab-plan')).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByTestId('plan-subtab-content')).toBeInTheDocument();
      expect(
        screen.getByTestId('training-plan-view'),
      ).toBeInTheDocument();
    });

    it('clicking Lịch sử tab shows WorkoutHistory', () => {
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('subtab-history'));

      expect(
        screen.getByTestId('history-subtab-content'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('workout-history')).toBeInTheDocument();
      expect(
        screen.queryByTestId('plan-subtab-content'),
      ).not.toBeInTheDocument();
    });

    it('clicking Tiến trình tab shows ProgressDashboard', () => {
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('subtab-progress'));

      expect(
        screen.getByTestId('progress-subtab-content'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('progress-dashboard'),
      ).toBeInTheDocument();
    });

    it('sub-tab labels are correct per spec §5.1', () => {
      render(<FitnessTab />);
      expect(screen.getByText('Kế hoạch')).toBeInTheDocument();
      expect(screen.getByText('Tiến trình')).toBeInTheDocument();
      expect(screen.getByText('Lịch sử')).toBeInTheDocument();
      expect(screen.queryByText('Tập luyện')).not.toBeInTheDocument();
    });

    it('renders fitness-tab container', () => {
      render(<FitnessTab />);
      expect(screen.getByTestId('fitness-tab')).toBeInTheDocument();
    });

    it('can navigate back to Plan tab after switching', () => {
      render(<FitnessTab />);

      fireEvent.click(screen.getByTestId('subtab-history'));
      expect(
        screen.getByTestId('history-subtab-content'),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('subtab-plan'));
      expect(screen.getByTestId('plan-subtab-content')).toBeInTheDocument();
      expect(
        screen.queryByTestId('history-subtab-content'),
      ).not.toBeInTheDocument();
    });

    it('only renders active tab content (lazy rendering)', () => {
      render(<FitnessTab />);
      expect(screen.getByTestId('plan-subtab-content')).toBeInTheDocument();
      expect(
        screen.queryByTestId('history-subtab-content'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('progress-subtab-content'),
      ).not.toBeInTheDocument();
    });

    it('all three sub-tab buttons have correct aria-selected', () => {
      render(<FitnessTab />);

      expect(screen.getByTestId('subtab-plan')).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByTestId('subtab-progress')).toHaveAttribute(
        'aria-selected',
        'false',
      );
      expect(screen.getByTestId('subtab-history')).toHaveAttribute(
        'aria-selected',
        'false',
      );

      fireEvent.click(screen.getByTestId('subtab-progress'));
      expect(screen.getByTestId('subtab-plan')).toHaveAttribute(
        'aria-selected',
        'false',
      );
      expect(screen.getByTestId('subtab-progress')).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('each sub-tab content has role tabpanel', () => {
      render(<FitnessTab />);
      expect(screen.getByTestId('plan-subtab-content')).toHaveAttribute(
        'role',
        'tabpanel',
      );

      fireEvent.click(screen.getByTestId('subtab-history'));
      expect(
        screen.getByTestId('history-subtab-content'),
      ).toHaveAttribute('role', 'tabpanel');

      fireEvent.click(screen.getByTestId('subtab-progress'));
      expect(
        screen.getByTestId('progress-subtab-content'),
      ).toHaveAttribute('role', 'tabpanel');
    });
  });

  describe('React.memo', () => {
    it('has correct displayName', () => {
      expect(FitnessTab.displayName).toBe('FitnessTab');
    });

    it('is wrapped in React.memo', () => {
      const memoType = (FitnessTab as unknown as { $$typeof: symbol })
        .$$typeof;
      expect(memoType).toBe(Symbol.for('react.memo'));
    });
  });
});
