import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickActionsBar } from '../features/dashboard/components/QuickActionsBar';
import { useDayPlanStore } from '../store/dayPlanStore';
import { useFitnessStore } from '../store/fitnessStore';
import { useNavigationStore } from '../store/navigationStore';

const today = new Date().toISOString().split('T')[0];

function resetStores() {
  useDayPlanStore.setState({ dayPlans: [] });
  useFitnessStore.setState({
    weightEntries: [],
    workouts: [],
    trainingPlans: [],
  });
  useNavigationStore.setState({ navigateTab: vi.fn() });
}

function setMeals(meals: {
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
}) {
  useDayPlanStore.setState({
    dayPlans: [
      {
        date: today,
        breakfastDishIds: meals.breakfast ? ['d1'] : [],
        lunchDishIds: meals.lunch ? ['d2'] : [],
        dinnerDishIds: meals.dinner ? ['d3'] : [],
        servings: {},
      },
    ],
  });
}

function setWorkoutCompleted() {
  useFitnessStore.setState((prev) => ({
    ...prev,
    workouts: [
      {
        id: 'w1',
        date: `${today}T08:00:00.000Z`,
        name: 'Push Day',
        createdAt: today,
        updatedAt: today,
      },
    ],
  }));
}

function setActiveTrainingPlan() {
  useFitnessStore.setState((prev) => ({
    ...prev,
    trainingPlans: [
      {
        id: 'plan-1',
        name: 'Plan A',
        status: 'active' as const,
        splitType: 'push-pull-legs',
        durationWeeks: 8,
        currentWeek: 1,
        startDate: today,
        createdAt: today,
        updatedAt: today,
      },
    ],
  }));
}

afterEach(cleanup);

describe('QuickActionsBar', () => {
  beforeEach(resetStores);

  /* ------------------------------------------------------------ */
  /*  Rendering                                                    */
  /* ------------------------------------------------------------ */
  it('renders the quick actions bar with three buttons', () => {
    render(<QuickActionsBar />);
    expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('renders a nav element with accessible label', () => {
    render(<QuickActionsBar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label');
  });

  /* ------------------------------------------------------------ */
  /*  Context Mapping 1: Morning — nothing logged                  */
  /* ------------------------------------------------------------ */
  describe('Context: Morning (nothing logged)', () => {
    beforeEach(() => {
      resetStores();
    });

    it('shows log-weight on the left', () => {
      render(<QuickActionsBar />);
      expect(screen.getByTestId('quick-action-log-weight')).toBeInTheDocument();
    });

    it('shows log-breakfast in the center', () => {
      render(<QuickActionsBar />);
      expect(
        screen.getByTestId('quick-action-log-breakfast'),
      ).toBeInTheDocument();
    });

    it('shows log-cardio on the right (no training plan)', () => {
      render(<QuickActionsBar />);
      expect(screen.getByTestId('quick-action-log-cardio')).toBeInTheDocument();
    });

    it('shows start-workout on the right when training plan exists', () => {
      setActiveTrainingPlan();
      render(<QuickActionsBar />);
      expect(
        screen.getByTestId('quick-action-start-workout'),
      ).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------ */
  /*  Context Mapping 2: After meals — breakfast+lunch logged      */
  /* ------------------------------------------------------------ */
  describe('Context: After meals (breakfast+lunch logged)', () => {
    beforeEach(() => {
      resetStores();
      setMeals({ breakfast: true, lunch: true });
      setActiveTrainingPlan();
    });

    it('shows log-weight on the left', () => {
      render(<QuickActionsBar />);
      expect(screen.getByTestId('quick-action-log-weight')).toBeInTheDocument();
    });

    it('shows log-dinner in the center', () => {
      render(<QuickActionsBar />);
      expect(
        screen.getByTestId('quick-action-log-dinner'),
      ).toBeInTheDocument();
    });

    it('shows start-workout on the right', () => {
      render(<QuickActionsBar />);
      expect(
        screen.getByTestId('quick-action-start-workout'),
      ).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------ */
  /*  Context Mapping 3: Workout done                              */
  /* ------------------------------------------------------------ */
  describe('Context: Workout done', () => {
    beforeEach(() => {
      resetStores();
      setWorkoutCompleted();
    });

    it('shows log-weight on the left', () => {
      render(<QuickActionsBar />);
      expect(screen.getByTestId('quick-action-log-weight')).toBeInTheDocument();
    });

    it('shows log-meal in the center', () => {
      render(<QuickActionsBar />);
      expect(screen.getByTestId('quick-action-log-meal')).toBeInTheDocument();
    });

    it('shows view-results on the right', () => {
      render(<QuickActionsBar />);
      expect(
        screen.getByTestId('quick-action-view-results'),
      ).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------ */
  /*  Context Mapping 4: All 3 meals logged (with training plan)   */
  /* ------------------------------------------------------------ */
  describe('Context: All meals logged', () => {
    beforeEach(() => {
      resetStores();
      setMeals({ breakfast: true, lunch: true, dinner: true });
      setActiveTrainingPlan();
    });

    it('shows log-weight on the left', () => {
      render(<QuickActionsBar />);
      expect(screen.getByTestId('quick-action-log-weight')).toBeInTheDocument();
    });

    it('shows start-workout in the center', () => {
      render(<QuickActionsBar />);
      expect(
        screen.getByTestId('quick-action-start-workout'),
      ).toBeInTheDocument();
    });

    it('shows log-snack on the right', () => {
      render(<QuickActionsBar />);
      expect(
        screen.getByTestId('quick-action-log-snack'),
      ).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------ */
  /*  Context Mapping 5: All logged + workout done                 */
  /* ------------------------------------------------------------ */
  describe('Context: All logged + workout done', () => {
    beforeEach(() => {
      resetStores();
      setMeals({ breakfast: true, lunch: true, dinner: true });
      setWorkoutCompleted();
    });

    it('shows log-weight on the left', () => {
      render(<QuickActionsBar />);
      expect(screen.getByTestId('quick-action-log-weight')).toBeInTheDocument();
    });

    it('shows view-results in the center', () => {
      render(<QuickActionsBar />);
      expect(
        screen.getByTestId('quick-action-view-results'),
      ).toBeInTheDocument();
    });

    it('shows log-snack on the right', () => {
      render(<QuickActionsBar />);
      expect(
        screen.getByTestId('quick-action-log-snack'),
      ).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------ */
  /*  Primary button always center                                 */
  /* ------------------------------------------------------------ */
  describe('Primary button styling', () => {
    it('center button has primary emerald styling', () => {
      render(<QuickActionsBar />);
      const centerButton = screen.getByTestId('quick-action-log-breakfast');
      expect(centerButton.className).toContain('bg-emerald-500');
      expect(centerButton.className).toContain('text-white');
    });

    it('center button has shadow-glow via inline style', () => {
      render(<QuickActionsBar />);
      const centerButton = screen.getByTestId('quick-action-log-breakfast');
      expect(centerButton.style.boxShadow).toBe('var(--shadow-glow)');
    });

    it('center button height is 56px', () => {
      render(<QuickActionsBar />);
      const centerButton = screen.getByTestId('quick-action-log-breakfast');
      expect(centerButton.style.height).toBe('56px');
    });

    it('left button has secondary styling with border', () => {
      render(<QuickActionsBar />);
      const leftButton = screen.getByTestId('quick-action-log-weight');
      expect(leftButton.className).toContain('bg-white');
      expect(leftButton.className).toContain('text-emerald-600');
      expect(leftButton.className).toContain('border');
      expect(leftButton.className).toContain('border-gray-200');
    });

    it('secondary button height is 48px', () => {
      render(<QuickActionsBar />);
      const leftButton = screen.getByTestId('quick-action-log-weight');
      expect(leftButton.style.height).toBe('48px');
    });

    it('all buttons have rounded-full and min-width', () => {
      render(<QuickActionsBar />);
      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        expect(button.className).toContain('rounded-full');
        expect(button.className).toContain('min-w-[100px]');
      }
    });

    it('center is always primary across different contexts', () => {
      // Context: workout done
      setWorkoutCompleted();
      const { unmount } = render(<QuickActionsBar />);
      const center1 = screen.getByTestId('quick-action-log-meal');
      expect(center1.className).toContain('bg-emerald-500');
      expect(center1.style.height).toBe('56px');
      unmount();

      // Context: all meals + workout
      setMeals({ breakfast: true, lunch: true, dinner: true });
      render(<QuickActionsBar />);
      const center2 = screen.getByTestId('quick-action-view-results');
      expect(center2.className).toContain('bg-emerald-500');
      expect(center2.style.height).toBe('56px');
    });
  });

  /* ------------------------------------------------------------ */
  /*  Action handlers – navigation                                 */
  /* ------------------------------------------------------------ */
  describe('Action handlers', () => {
    it('tapping left button (log-weight) navigates to fitness tab', async () => {
      const mockNavigateTab = vi.fn();
      useNavigationStore.setState({ navigateTab: mockNavigateTab });
      const user = userEvent.setup();

      render(<QuickActionsBar />);
      await user.click(screen.getByTestId('quick-action-log-weight'));

      expect(mockNavigateTab).toHaveBeenCalledWith('fitness');
    });

    it('tapping center meal button navigates to calendar tab', async () => {
      const mockNavigateTab = vi.fn();
      useNavigationStore.setState({ navigateTab: mockNavigateTab });
      const user = userEvent.setup();

      render(<QuickActionsBar />);
      await user.click(screen.getByTestId('quick-action-log-breakfast'));

      expect(mockNavigateTab).toHaveBeenCalledWith('calendar');
    });

    it('tapping start-workout navigates to fitness tab', async () => {
      const mockNavigateTab = vi.fn();
      useNavigationStore.setState({ navigateTab: mockNavigateTab });
      setMeals({ breakfast: true, lunch: true, dinner: true });
      setActiveTrainingPlan();
      const user = userEvent.setup();

      render(<QuickActionsBar />);
      await user.click(screen.getByTestId('quick-action-start-workout'));

      expect(mockNavigateTab).toHaveBeenCalledWith('fitness');
    });

    it('tapping view-results navigates to fitness tab', async () => {
      const mockNavigateTab = vi.fn();
      useNavigationStore.setState({ navigateTab: mockNavigateTab });
      setMeals({ breakfast: true, lunch: true, dinner: true });
      setWorkoutCompleted();
      const user = userEvent.setup();

      render(<QuickActionsBar />);
      await user.click(screen.getByTestId('quick-action-view-results'));

      expect(mockNavigateTab).toHaveBeenCalledWith('fitness');
    });

    it('tapping log-snack navigates to calendar tab', async () => {
      const mockNavigateTab = vi.fn();
      useNavigationStore.setState({ navigateTab: mockNavigateTab });
      setMeals({ breakfast: true, lunch: true, dinner: true });
      setWorkoutCompleted();
      const user = userEvent.setup();

      render(<QuickActionsBar />);
      await user.click(screen.getByTestId('quick-action-log-snack'));

      expect(mockNavigateTab).toHaveBeenCalledWith('calendar');
    });

    it('tapping log-cardio navigates to fitness tab', async () => {
      const mockNavigateTab = vi.fn();
      useNavigationStore.setState({ navigateTab: mockNavigateTab });
      const user = userEvent.setup();

      render(<QuickActionsBar />);
      await user.click(screen.getByTestId('quick-action-log-cardio'));

      expect(mockNavigateTab).toHaveBeenCalledWith('fitness');
    });
  });

  /* ------------------------------------------------------------ */
  /*  Each button displays translated label                        */
  /* ------------------------------------------------------------ */
  describe('Labels', () => {
    it('buttons show translated text for morning context', () => {
      render(<QuickActionsBar />);
      expect(screen.getByText('Log cân')).toBeInTheDocument();
      expect(screen.getByText('Log bữa sáng')).toBeInTheDocument();
    });

    it('buttons show translated text for all-logged context', () => {
      setMeals({ breakfast: true, lunch: true, dinner: true });
      setWorkoutCompleted();
      render(<QuickActionsBar />);
      expect(screen.getByText('Log cân')).toBeInTheDocument();
      expect(screen.getByText('Xem kết quả')).toBeInTheDocument();
      expect(screen.getByText('Thêm snack')).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------ */
  /*  Accessibility                                                */
  /* ------------------------------------------------------------ */
  describe('Accessibility', () => {
    it('each button has an aria-label', () => {
      render(<QuickActionsBar />);
      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        expect(button).toHaveAttribute('aria-label');
        expect(button.getAttribute('aria-label')).not.toBe('');
      }
    });

    it('icons are hidden from screen readers', () => {
      const { container } = render(<QuickActionsBar />);
      const svgs = container.querySelectorAll('svg');
      for (const svg of svgs) {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      }
    });
  });
});
