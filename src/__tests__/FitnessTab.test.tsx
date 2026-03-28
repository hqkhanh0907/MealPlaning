import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { FitnessTab } from '../features/fitness/components/FitnessTab';
import { useFitnessStore } from '../store/fitnessStore';
import type { Mock } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fitness.plan.tab': 'Kế hoạch',
        'fitness.workout.tab': 'Tập luyện',
        'fitness.history.title': 'Lịch sử',
        'fitness.progress.title': 'Tiến trình',
        'fitness.history.strength': 'Sức mạnh',
        'fitness.history.cardio': 'Cardio',
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../features/fitness/components/FitnessOnboarding', () => ({
  FitnessOnboarding: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="fitness-onboarding">
      <button data-testid="complete-onboarding" onClick={onComplete}>
        Complete
      </button>
    </div>
  ),
}));

vi.mock('../features/fitness/components/TrainingPlanView', () => ({
  TrainingPlanView: () => (
    <div data-testid="training-plan-view">TrainingPlanView</div>
  ),
}));

vi.mock('../features/fitness/components/WorkoutLogger', () => ({
  WorkoutLogger: () => (
    <div data-testid="workout-logger">WorkoutLogger</div>
  ),
}));

vi.mock('../features/fitness/components/CardioLogger', () => ({
  CardioLogger: () => <div data-testid="cardio-logger">CardioLogger</div>,
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

vi.mock('../features/fitness/components/QuickConfirmCard', () => ({
  QuickConfirmCard: () => (
    <div data-testid="quick-confirm-card">QuickConfirmCard</div>
  ),
}));

vi.mock('../features/fitness/hooks/useFitnessNutritionBridge', () => ({
  useFitnessNutritionBridge: () => ({ insight: null }),
}));

vi.mock('../features/fitness/hooks/useProgressiveOverload', () => ({
  useProgressiveOverload: () => ({
    suggestNextSet: () => ({ weight: 60, reps: 8, source: 'manual' }),
    getLastSets: () => [],
    checkPlateau: () => ({ isPlateaued: false, weeks: 0 }),
    analyzeExercisePlateau: () => ({
      isPlateaued: false,
      plateauWeeks: 0,
      suggestion: null,
    }),
    checkAcuteFatigue: () => ({ level: 'none', message: '' }),
    checkChronicOvertraining: () => ({ level: 'none', message: '' }),
    acuteFatigue: { level: 'none', message: '' },
    chronicOvertraining: { level: 'none', message: '' },
  }),
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
  isOnboarded: boolean;
  setOnboarded: Mock;
  workoutMode: 'strength' | 'cardio';
  setWorkoutMode: Mock;
  trainingPlans: unknown[];
  trainingPlanDays: unknown[];
  trainingProfile: unknown;
  addTrainingPlan: Mock;
  addPlanDays: Mock;
}

const mockUseFitnessStore = useFitnessStore as unknown as Mock;

afterEach(cleanup);

describe('FitnessTab', () => {
  describe('when user is not onboarded', () => {
    const mockSetOnboarded = vi.fn();
    const mockSetWorkoutMode = vi.fn();
    const mockAddTrainingPlan = vi.fn();
    const mockAddPlanDays = vi.fn();

    beforeEach(() => {
      mockSetOnboarded.mockClear();
      mockSetWorkoutMode.mockClear();
      mockAddTrainingPlan.mockClear();
      mockAddPlanDays.mockClear();
      mockUseFitnessStore.mockImplementation(
        (selector: (state: MockFitnessState) => unknown) =>
          selector({
            isOnboarded: false,
            setOnboarded: mockSetOnboarded,
            workoutMode: 'strength',
            setWorkoutMode: mockSetWorkoutMode,
            trainingPlans: [],
            trainingPlanDays: [],
            trainingProfile: null,
            addTrainingPlan: mockAddTrainingPlan,
            addPlanDays: mockAddPlanDays,
          }),
      );
    });

    it('renders FitnessOnboarding when isOnboarded is false', () => {
      render(<FitnessTab />);
      expect(
        screen.getByTestId('fitness-onboarding'),
      ).toBeInTheDocument();
    });

    it('does not render sub-tab bar', () => {
      render(<FitnessTab />);
      expect(screen.queryByTestId('subtab-bar')).not.toBeInTheDocument();
    });

    it('does not render fitness-tab container', () => {
      render(<FitnessTab />);
      expect(screen.queryByTestId('fitness-tab')).not.toBeInTheDocument();
    });

    it('calls setOnboarded(true) when onboarding completes', () => {
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('complete-onboarding'));
      expect(mockSetOnboarded).toHaveBeenCalledWith(true);
    });
  });

  describe('when user is onboarded', () => {
    const mockSetOnboarded = vi.fn();
    const mockSetWorkoutMode = vi.fn();
    const mockAddTrainingPlan = vi.fn();
    const mockAddPlanDays = vi.fn();

    beforeEach(() => {
      mockSetOnboarded.mockClear();
      mockSetWorkoutMode.mockClear();
      mockAddTrainingPlan.mockClear();
      mockAddPlanDays.mockClear();
      mockUseFitnessStore.mockImplementation(
        (selector: (state: MockFitnessState) => unknown) =>
          selector({
            isOnboarded: true,
            setOnboarded: mockSetOnboarded,
            workoutMode: 'strength',
            setWorkoutMode: mockSetWorkoutMode,
            trainingPlans: [],
            trainingPlanDays: [],
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

    it('renders all four sub-tab buttons', () => {
      render(<FitnessTab />);
      expect(screen.getByTestId('subtab-plan')).toBeInTheDocument();
      expect(screen.getByTestId('subtab-workout')).toBeInTheDocument();
      expect(screen.getByTestId('subtab-history')).toBeInTheDocument();
      expect(screen.getByTestId('subtab-progress')).toBeInTheDocument();
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

    it('clicking Tập luyện tab shows workout content with WorkoutLogger', () => {
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('subtab-workout'));

      expect(
        screen.getByTestId('workout-subtab-content'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('workout-logger')).toBeInTheDocument();
      expect(
        screen.queryByTestId('plan-subtab-content'),
      ).not.toBeInTheDocument();
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

    it('clicking Tiến trình tab shows ProgressDashboard and StreakCounter', () => {
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('subtab-progress'));

      expect(
        screen.getByTestId('progress-subtab-content'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('progress-dashboard'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('streak-counter')).toBeInTheDocument();
    });

    it('Tập luyện tab defaults to strength mode', () => {
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('subtab-workout'));

      expect(
        screen.getByTestId('workout-mode-strength'),
      ).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('workout-mode-cardio')).toHaveAttribute(
        'aria-checked',
        'false',
      );
      expect(screen.getByTestId('workout-logger')).toBeInTheDocument();
    });

    it('toggling to cardio mode calls setWorkoutMode', () => {
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('subtab-workout'));
      fireEvent.click(screen.getByTestId('workout-mode-cardio'));
      expect(mockSetWorkoutMode).toHaveBeenCalledWith('cardio');
    });

    it('renders CardioLogger when workoutMode is cardio', () => {
      mockUseFitnessStore.mockImplementation(
        (selector: (state: MockFitnessState) => unknown) =>
          selector({
            isOnboarded: true,
            setOnboarded: mockSetOnboarded,
            workoutMode: 'cardio',
            setWorkoutMode: mockSetWorkoutMode,
            trainingPlans: [],
            trainingPlanDays: [],
            trainingProfile: null,
            addTrainingPlan: mockAddTrainingPlan,
            addPlanDays: mockAddPlanDays,
          }),
      );
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('subtab-workout'));

      expect(screen.getByTestId('cardio-logger')).toBeInTheDocument();
      expect(
        screen.queryByTestId('workout-logger'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('workout-mode-cardio')).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    it('toggling back to strength mode calls setWorkoutMode', () => {
      mockUseFitnessStore.mockImplementation(
        (selector: (state: MockFitnessState) => unknown) =>
          selector({
            isOnboarded: true,
            setOnboarded: mockSetOnboarded,
            workoutMode: 'cardio',
            setWorkoutMode: mockSetWorkoutMode,
            trainingPlans: [],
            trainingPlanDays: [],
            trainingProfile: null,
            addTrainingPlan: mockAddTrainingPlan,
            addPlanDays: mockAddPlanDays,
          }),
      );
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('subtab-workout'));
      fireEvent.click(screen.getByTestId('workout-mode-strength'));
      expect(mockSetWorkoutMode).toHaveBeenCalledWith('strength');
    });

    it('sub-tab labels are correct', () => {
      render(<FitnessTab />);
      expect(screen.getByText('Kế hoạch')).toBeInTheDocument();
      expect(screen.getByText('Tập luyện')).toBeInTheDocument();
      expect(screen.getByText('Lịch sử')).toBeInTheDocument();
      expect(screen.getByText('Tiến trình')).toBeInTheDocument();
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
        screen.queryByTestId('workout-subtab-content'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('history-subtab-content'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('progress-subtab-content'),
      ).not.toBeInTheDocument();
    });

    it('all four sub-tab buttons have correct aria-selected', () => {
      render(<FitnessTab />);

      expect(screen.getByTestId('subtab-plan')).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByTestId('subtab-workout')).toHaveAttribute(
        'aria-selected',
        'false',
      );
      expect(screen.getByTestId('subtab-history')).toHaveAttribute(
        'aria-selected',
        'false',
      );
      expect(screen.getByTestId('subtab-progress')).toHaveAttribute(
        'aria-selected',
        'false',
      );

      fireEvent.click(screen.getByTestId('subtab-workout'));
      expect(screen.getByTestId('subtab-plan')).toHaveAttribute(
        'aria-selected',
        'false',
      );
      expect(screen.getByTestId('subtab-workout')).toHaveAttribute(
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

      fireEvent.click(screen.getByTestId('subtab-workout'));
      expect(
        screen.getByTestId('workout-subtab-content'),
      ).toHaveAttribute('role', 'tabpanel');

      fireEvent.click(screen.getByTestId('subtab-history'));
      expect(
        screen.getByTestId('history-subtab-content'),
      ).toHaveAttribute('role', 'tabpanel');

      fireEvent.click(screen.getByTestId('subtab-progress'));
      expect(
        screen.getByTestId('progress-subtab-content'),
      ).toHaveAttribute('role', 'tabpanel');
    });

    it('workout mode toggle labels are correct', () => {
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('subtab-workout'));

      expect(screen.getByText('Sức mạnh')).toBeInTheDocument();
      expect(screen.getByText('Cardio')).toBeInTheDocument();
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
