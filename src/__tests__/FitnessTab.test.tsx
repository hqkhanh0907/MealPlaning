import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { FitnessTab } from '../features/fitness/components/FitnessTab';
import { useFitnessStore } from '../store/fitnessStore';
import { useNavigationStore } from '../store/navigationStore';

const { mockGeneratePlan, mockNotifySuccess, mockNotifyError, mockPushPage, mockInsightRef, mockHealthProfileRef } =
  vi.hoisted(() => ({
    mockGeneratePlan: vi.fn(),
    mockNotifySuccess: vi.fn(),
    mockNotifyError: vi.fn(),
    mockPushPage: vi.fn(),
    mockInsightRef: { current: null as string | null },
    mockHealthProfileRef: {
      current: { age: 25 as number | null, weightKg: 83 } as { age: number | null; weightKg: number } | null,
    },
  }));

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

vi.mock('../store/navigationStore', () => ({
  useNavigationStore: vi.fn(),
}));

vi.mock('../features/fitness/components/TrainingPlanView', () => ({
  TrainingPlanView: ({
    onGeneratePlan,
    onCreateManualPlan,
    planStrategy,
    isGenerating,
  }: {
    onGeneratePlan: () => void;
    onCreateManualPlan: () => void;
    planStrategy: string | null;
    isGenerating: boolean;
  }) => (
    <div data-testid="training-plan-view">
      <span data-testid="plan-strategy">{planStrategy ?? 'null'}</span>
      <span data-testid="is-generating">{String(isGenerating)}</span>
      <button data-testid="generate-plan-btn" onClick={onGeneratePlan}>
        Generate
      </button>
      <button data-testid="create-manual-plan-btn" onClick={onCreateManualPlan}>
        Manual
      </button>
    </div>
  ),
}));

vi.mock('../features/fitness/components/WorkoutHistory', () => ({
  WorkoutHistory: () => <div data-testid="workout-history">WorkoutHistory</div>,
}));

vi.mock('../features/fitness/components/ProgressDashboard', () => ({
  ProgressDashboard: () => <div data-testid="progress-dashboard">ProgressDashboard</div>,
}));

vi.mock('../features/fitness/components/StreakCounter', () => ({
  StreakCounter: () => <div data-testid="streak-counter">StreakCounter</div>,
}));

vi.mock('../features/fitness/components/SmartInsightBanner', () => ({
  SmartInsightBanner: ({ insight }: { insight: string }) => <div data-testid="smart-insight-banner">{insight}</div>,
}));

vi.mock('../features/fitness/components/PlanGeneratedCard', () => ({
  PlanGeneratedCard: () => <div data-testid="plan-generated-card">PlanGeneratedCard</div>,
}));

vi.mock('../features/fitness/hooks/useFitnessNutritionBridge', () => ({
  useFitnessNutritionBridge: () => ({ insight: mockInsightRef.current }),
}));

vi.mock('../features/fitness/hooks/useTrainingPlan', () => ({
  useTrainingPlan: () => ({
    generatePlan: mockGeneratePlan,
    isGenerating: false,
    generationError: null,
  }),
}));

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: (selector: (state: { profile: { age: number | null; weightKg: number } | null }) => unknown) =>
    selector({ profile: mockHealthProfileRef.current }),
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
    success: mockNotifySuccess,
    error: mockNotifyError,
  }),
}));

interface MockFitnessState {
  trainingProfile: unknown;
  planStrategy: 'auto' | 'manual' | null;
  profileOutOfSync: boolean;
  profileChangedFields: string[];
  addTrainingPlan: Mock;
  addPlanDays: Mock;
  setActivePlan: Mock;
}

const mockUseFitnessStore = useFitnessStore as unknown as Mock;
const mockUseNavigationStore = useNavigationStore as unknown as Mock;

afterEach(cleanup);

describe('FitnessTab', () => {
  describe('when user is onboarded', () => {
    const mockAddTrainingPlan = vi.fn();
    const mockAddPlanDays = vi.fn();
    const mockSetActivePlan = vi.fn();

    beforeEach(() => {
      mockAddTrainingPlan.mockClear();
      mockAddPlanDays.mockClear();
      mockSetActivePlan.mockClear();
      mockGeneratePlan.mockClear();
      mockNotifySuccess.mockClear();
      mockNotifyError.mockClear();
      mockPushPage.mockClear();
      mockInsightRef.current = null;
      mockHealthProfileRef.current = { age: 25, weightKg: 83 };
      mockUseNavigationStore.mockImplementation((selector: (s: { pushPage: Mock }) => unknown) =>
        selector({ pushPage: mockPushPage }),
      );
      mockUseFitnessStore.mockImplementation((selector: (state: MockFitnessState) => unknown) =>
        selector({
          trainingProfile: null,
          planStrategy: null,
          profileOutOfSync: false,
          profileChangedFields: [],
          addTrainingPlan: mockAddTrainingPlan,
          addPlanDays: mockAddPlanDays,
          setActivePlan: mockSetActivePlan,
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
      expect(screen.getByTestId('subtab-plan')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('plan-subtab-content')).toBeInTheDocument();
      expect(screen.getByTestId('training-plan-view')).toBeInTheDocument();
    });

    it('clicking Lịch sử tab shows WorkoutHistory', () => {
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('subtab-history'));

      expect(screen.getByTestId('history-subtab-content')).toBeInTheDocument();
      expect(screen.getByTestId('workout-history')).toBeInTheDocument();
      expect(screen.queryByTestId('plan-subtab-content')).not.toBeInTheDocument();
    });

    it('clicking Tiến trình tab shows ProgressDashboard', () => {
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('subtab-progress'));

      expect(screen.getByTestId('progress-subtab-content')).toBeInTheDocument();
      expect(screen.getByTestId('progress-dashboard')).toBeInTheDocument();
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
      expect(screen.getByTestId('history-subtab-content')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('subtab-plan'));
      expect(screen.getByTestId('plan-subtab-content')).toBeInTheDocument();
      expect(screen.queryByTestId('history-subtab-content')).not.toBeInTheDocument();
    });

    it('only renders active tab content (lazy rendering)', () => {
      render(<FitnessTab />);
      expect(screen.getByTestId('plan-subtab-content')).toBeInTheDocument();
      expect(screen.queryByTestId('history-subtab-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('progress-subtab-content')).not.toBeInTheDocument();
    });

    it('all three sub-tab buttons have correct aria-selected', () => {
      render(<FitnessTab />);

      expect(screen.getByTestId('subtab-plan')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('subtab-progress')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('subtab-history')).toHaveAttribute('aria-selected', 'false');

      fireEvent.click(screen.getByTestId('subtab-progress'));
      expect(screen.getByTestId('subtab-plan')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('subtab-progress')).toHaveAttribute('aria-selected', 'true');
    });

    it('each sub-tab content has role tabpanel', () => {
      render(<FitnessTab />);
      expect(screen.getByTestId('plan-subtab-content')).toHaveAttribute('role', 'tabpanel');

      fireEvent.click(screen.getByTestId('subtab-history'));
      expect(screen.getByTestId('history-subtab-content')).toHaveAttribute('role', 'tabpanel');

      fireEvent.click(screen.getByTestId('subtab-progress'));
      expect(screen.getByTestId('progress-subtab-content')).toHaveAttribute('role', 'tabpanel');
    });
  });

  describe('handleGeneratePlan', () => {
    const localAddTrainingPlan = vi.fn();
    const localAddPlanDays = vi.fn();
    const localSetActivePlan = vi.fn();

    function setupStore(overrides: Partial<MockFitnessState> = {}) {
      mockUseFitnessStore.mockImplementation((selector: (state: MockFitnessState) => unknown) =>
        selector({
          trainingProfile: null,
          planStrategy: 'auto',
          profileOutOfSync: false,
          profileChangedFields: [],
          addTrainingPlan: localAddTrainingPlan,
          addPlanDays: localAddPlanDays,
          setActivePlan: localSetActivePlan,
          ...overrides,
        }),
      );
      mockUseNavigationStore.mockImplementation((selector: (s: { pushPage: Mock }) => unknown) =>
        selector({ pushPage: mockPushPage }),
      );
    }

    beforeEach(() => {
      localAddTrainingPlan.mockClear();
      localAddPlanDays.mockClear();
      localSetActivePlan.mockClear();
      mockGeneratePlan.mockReset();
      mockNotifySuccess.mockClear();
      mockNotifyError.mockClear();
      mockPushPage.mockClear();
      mockInsightRef.current = null;
      mockHealthProfileRef.current = { age: 25, weightKg: 83 };
    });

    it('does nothing when trainingProfile is null', () => {
      setupStore({ trainingProfile: null });
      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('generate-plan-btn'));
      expect(mockGeneratePlan).not.toHaveBeenCalled();
      expect(localAddTrainingPlan).not.toHaveBeenCalled();
    });

    it('adds plan and days then shows success notification', async () => {
      const mockPlan = { id: 'plan-1', name: 'Test Plan' };
      const mockDays = [{ id: 'day-1', planId: 'plan-1' }];
      mockGeneratePlan.mockReturnValue({ plan: mockPlan, days: mockDays });
      setupStore({ trainingProfile: { level: 'beginner', goal: 'strength' } });

      render(<FitnessTab />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('generate-plan-btn'));
      });

      expect(mockGeneratePlan).toHaveBeenCalledWith({
        trainingProfile: { level: 'beginner', goal: 'strength' },
        healthProfile: { age: 25, weightKg: 83 },
      });
      expect(localAddTrainingPlan).toHaveBeenCalledWith(mockPlan);
      expect(localAddPlanDays).toHaveBeenCalledWith(mockDays);
      expect(localSetActivePlan).toHaveBeenCalledWith('plan-1');
      expect(mockNotifySuccess).toHaveBeenCalledWith('fitness.plan.planCreated');
    });

    it('does not call setActivePlan when generatePlan returns null', () => {
      mockGeneratePlan.mockReturnValue(null);
      setupStore({ trainingProfile: { level: 'beginner', goal: 'strength' } });

      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('generate-plan-btn'));

      expect(localSetActivePlan).not.toHaveBeenCalled();
    });

    it('shows error notification when generatePlan returns null', () => {
      mockGeneratePlan.mockReturnValue(null);
      setupStore({ trainingProfile: { level: 'beginner', goal: 'strength' } });

      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('generate-plan-btn'));

      expect(mockGeneratePlan).toHaveBeenCalled();
      expect(localAddTrainingPlan).not.toHaveBeenCalled();
      expect(localAddPlanDays).not.toHaveBeenCalled();
      expect(mockNotifyError).toHaveBeenCalledWith('fitness.plan.planError');
    });

    it('uses fallback age 30 when healthProfileAge is null', () => {
      const mockPlan = { id: 'p2', name: 'Plan' };
      const mockDays = [{ id: 'd1', planId: 'p2' }];
      mockGeneratePlan.mockReturnValue({ plan: mockPlan, days: mockDays });
      mockHealthProfileRef.current = { age: null, weightKg: 70 };
      setupStore({ trainingProfile: { level: 'advanced', goal: 'hypertrophy' } });

      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('generate-plan-btn'));

      expect(mockGeneratePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          healthProfile: { age: 30, weightKg: 70 },
        }),
      );
    });

    it('uses fallback values when profile is null', () => {
      const mockPlan = { id: 'p3', name: 'Plan' };
      const mockDays = [{ id: 'd1', planId: 'p3' }];
      mockGeneratePlan.mockReturnValue({ plan: mockPlan, days: mockDays });
      mockHealthProfileRef.current = null;
      setupStore({ trainingProfile: { level: 'beginner', goal: 'strength' } });

      render(<FitnessTab />);
      fireEvent.click(screen.getByTestId('generate-plan-btn'));

      expect(mockGeneratePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          healthProfile: { age: 30, weightKg: 70 },
        }),
      );
    });
  });

  describe('handleCreateManualPlan', () => {
    const localAddTrainingPlan = vi.fn();
    const localAddPlanDays = vi.fn();
    const localSetActivePlan = vi.fn();

    function setupStore(overrides: Partial<MockFitnessState> = {}) {
      mockUseFitnessStore.mockImplementation((selector: (state: MockFitnessState) => unknown) =>
        selector({
          trainingProfile: null,
          planStrategy: 'manual',
          profileOutOfSync: false,
          profileChangedFields: [],
          addTrainingPlan: localAddTrainingPlan,
          addPlanDays: localAddPlanDays,
          setActivePlan: localSetActivePlan,
          ...overrides,
        }),
      );
      mockUseNavigationStore.mockImplementation((selector: (s: { pushPage: Mock }) => unknown) =>
        selector({ pushPage: mockPushPage }),
      );
    }

    beforeEach(() => {
      localAddTrainingPlan.mockClear();
      localAddPlanDays.mockClear();
      localSetActivePlan.mockClear();
      mockGeneratePlan.mockClear();
      mockNotifySuccess.mockClear();
      mockNotifyError.mockClear();
      mockPushPage.mockClear();
      mockInsightRef.current = null;
      mockHealthProfileRef.current = { age: 25, weightKg: 83 };
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('creates a 7-day blank plan and opens PlanDayEditor on a weekday', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 8, 12, 0, 0)); // Wednesday
      const now = new Date();
      const expectedTimestamp = now.getTime();
      const expectedPlanId = `manual-${expectedTimestamp}`;
      const expectedIso = now.toISOString();
      const expectedEndIso = new Date(expectedTimestamp + 7 * 24 * 60 * 60 * 1000).toISOString();
      const expectedDow = now.getDay(); // 3 for Wednesday

      setupStore();
      render(<FitnessTab />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-manual-plan-btn'));
      });

      expect(localAddTrainingPlan).toHaveBeenCalledWith({
        id: expectedPlanId,
        name: 'Manual Plan',
        status: 'active',
        splitType: 'custom',
        durationWeeks: 1,
        currentWeek: 1,
        startDate: expectedIso,
        endDate: expectedEndIso,
        createdAt: expectedIso,
        updatedAt: expectedIso,
        trainingDays: [],
        restDays: [1, 2, 3, 4, 5, 6, 7],
      });

      const addedDays = localAddPlanDays.mock.calls[0][0] as Array<{
        id: string;
        planId: string;
        dayOfWeek: number;
        sessionOrder: number;
        workoutType: string;
        exercises: string;
        originalExercises: string;
      }>;
      expect(addedDays).toHaveLength(7);
      expect(addedDays[0].dayOfWeek).toBe(1);
      expect(addedDays[6].dayOfWeek).toBe(7);
      addedDays.forEach(day => {
        expect(day.planId).toBe(expectedPlanId);
        expect(day.workoutType).toBe('Rest');
        expect(day.exercises).toBe('[]');
        expect(day.originalExercises).toBe('[]');
      });

      expect(mockPushPage).toHaveBeenCalledWith({
        id: 'plan-day-editor',
        component: 'PlanDayEditor',
        props: { planDay: addedDays[expectedDow - 1] },
      });
      expect(localSetActivePlan).toHaveBeenCalledWith(expectedPlanId);
      expect(mockNotifySuccess).toHaveBeenCalledWith('fitness.plan.planCreated');
    });

    it('maps Sunday (getDay()=0) to dayOfWeek 7', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 5, 12, 0, 0)); // Sunday

      setupStore();
      render(<FitnessTab />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-manual-plan-btn'));
      });

      expect(mockPushPage).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            planDay: expect.objectContaining({
              dayOfWeek: 7,
            }),
          }),
        }),
      );
      expect(localAddPlanDays.mock.calls[0][0] as Array<{ dayOfWeek: number }>).toHaveLength(7);
    });

    it('skips pushPage when todayDay is not found', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 8, 12, 0, 0));
      const spy = vi.spyOn(Date.prototype, 'getDay').mockReturnValue(8);

      setupStore();
      render(<FitnessTab />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-manual-plan-btn'));
      });

      expect(localAddTrainingPlan).toHaveBeenCalled();
      expect(localAddPlanDays).toHaveBeenCalled();
      expect(mockPushPage).not.toHaveBeenCalled();
      expect(mockNotifySuccess).toHaveBeenCalledWith('fitness.plan.planCreated');

      spy.mockRestore();
    });
  });

  describe('SmartInsightBanner visibility', () => {
    beforeEach(() => {
      mockGeneratePlan.mockClear();
      mockNotifySuccess.mockClear();
      mockNotifyError.mockClear();
      mockPushPage.mockClear();
      mockHealthProfileRef.current = { age: 25, weightKg: 83 };
      mockUseNavigationStore.mockImplementation((selector: (s: { pushPage: Mock }) => unknown) =>
        selector({ pushPage: mockPushPage }),
      );
      mockUseFitnessStore.mockImplementation((selector: (state: MockFitnessState) => unknown) =>
        selector({
          trainingProfile: null,
          planStrategy: null,
          profileOutOfSync: false,
          profileChangedFields: [],
          addTrainingPlan: vi.fn(),
          addPlanDays: vi.fn(),
          setActivePlan: vi.fn(),
        }),
      );
    });

    it('renders SmartInsightBanner when insight is present on plan tab', () => {
      mockInsightRef.current = 'You need more protein';
      render(<FitnessTab />);
      expect(screen.getByTestId('smart-insight-banner')).toBeInTheDocument();
    });

    it('does not render SmartInsightBanner when insight is null', () => {
      mockInsightRef.current = null;
      render(<FitnessTab />);
      expect(screen.queryByTestId('smart-insight-banner')).not.toBeInTheDocument();
    });

    it('does not render SmartInsightBanner on history tab', () => {
      mockInsightRef.current = 'You need more protein';
      render(<FitnessTab />);
      const historyTab = screen.getByRole('tab', { name: /lịch sử/i });
      fireEvent.click(historyTab);
      expect(screen.queryByTestId('smart-insight-banner')).not.toBeInTheDocument();
    });

    it('does not render SmartInsightBanner on progress tab', () => {
      mockInsightRef.current = 'You need more protein';
      render(<FitnessTab />);
      const progressTab = screen.getByRole('tab', { name: /tiến trình/i });
      fireEvent.click(progressTab);
      expect(screen.queryByTestId('smart-insight-banner')).not.toBeInTheDocument();
    });
  });

  describe('profileOutOfSync banner', () => {
    const localAddTrainingPlan = vi.fn();
    const localAddPlanDays = vi.fn();
    const localSetActivePlan = vi.fn();

    function setupStore(overrides: Partial<MockFitnessState> = {}) {
      mockUseFitnessStore.mockImplementation((selector: (state: MockFitnessState) => unknown) =>
        selector({
          trainingProfile: { level: 'beginner', goal: 'strength' },
          planStrategy: 'auto',
          profileOutOfSync: false,
          profileChangedFields: [],
          addTrainingPlan: localAddTrainingPlan,
          addPlanDays: localAddPlanDays,
          setActivePlan: localSetActivePlan,
          ...overrides,
        }),
      );
      mockUseNavigationStore.mockImplementation((selector: (s: { pushPage: Mock }) => unknown) =>
        selector({ pushPage: mockPushPage }),
      );
    }

    beforeEach(() => {
      localAddTrainingPlan.mockClear();
      localAddPlanDays.mockClear();
      localSetActivePlan.mockClear();
      mockGeneratePlan.mockClear();
      mockNotifySuccess.mockClear();
      mockNotifyError.mockClear();
      mockPushPage.mockClear();
      mockInsightRef.current = null;
      mockHealthProfileRef.current = { age: 25, weightKg: 83 };
    });

    it('shows banner when profileOutOfSync is true and on plan tab', () => {
      setupStore({ profileOutOfSync: true });
      render(<FitnessTab />);

      expect(screen.getByTestId('profile-out-of-sync-banner')).toBeInTheDocument();
      expect(screen.getByTestId('regenerate-plan-btn')).toBeInTheDocument();
      expect(screen.getByText('fitness.plan.profileOutOfSync')).toBeInTheDocument();
      expect(screen.getByText('fitness.plan.regeneratePlan')).toBeInTheDocument();
    });

    it('shows changed fields hint when profileChangedFields is not empty', () => {
      setupStore({ profileOutOfSync: true, profileChangedFields: ['daysPerWeek', 'sessionDurationMin'] });
      render(<FitnessTab />);

      expect(screen.getByTestId('changed-fields-hint')).toBeInTheDocument();
    });

    it('does not show changed fields hint when profileChangedFields is empty', () => {
      setupStore({ profileOutOfSync: true, profileChangedFields: [] });
      render(<FitnessTab />);

      expect(screen.queryByTestId('changed-fields-hint')).not.toBeInTheDocument();
    });

    it('does NOT show banner when profileOutOfSync is false', () => {
      setupStore({ profileOutOfSync: false });
      render(<FitnessTab />);

      expect(screen.queryByTestId('profile-out-of-sync-banner')).not.toBeInTheDocument();
    });

    it('does NOT show banner when on history tab', () => {
      setupStore({ profileOutOfSync: true });
      render(<FitnessTab />);

      fireEvent.click(screen.getByTestId('subtab-history'));

      expect(screen.queryByTestId('profile-out-of-sync-banner')).not.toBeInTheDocument();
    });

    it('does NOT show banner when on progress tab', () => {
      setupStore({ profileOutOfSync: true });
      render(<FitnessTab />);

      fireEvent.click(screen.getByTestId('subtab-progress'));

      expect(screen.queryByTestId('profile-out-of-sync-banner')).not.toBeInTheDocument();
    });

    it('clicking "Tạo lại" calls generatePlan and addTrainingPlan', async () => {
      const mockPlan = { id: 'regen-1', name: 'Regenerated' };
      const mockDays = [{ id: 'rd-1', planId: 'regen-1' }];
      mockGeneratePlan.mockReturnValue({ plan: mockPlan, days: mockDays });
      setupStore({ profileOutOfSync: true });

      render(<FitnessTab />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('regenerate-plan-btn'));
      });

      expect(mockGeneratePlan).toHaveBeenCalledWith({
        trainingProfile: { level: 'beginner', goal: 'strength' },
        healthProfile: { age: 25, weightKg: 83 },
      });
      expect(localAddTrainingPlan).toHaveBeenCalledWith(mockPlan);
      expect(localAddPlanDays).toHaveBeenCalledWith(mockDays);
      expect(localSetActivePlan).toHaveBeenCalledWith('regen-1');
      expect(mockNotifySuccess).toHaveBeenCalledWith('fitness.plan.planCreated');
    });
  });

  describe('React.memo', () => {
    it('has correct displayName', () => {
      expect(FitnessTab.displayName).toBe('FitnessTab');
    });

    it('is wrapped in React.memo', () => {
      const memoType = (FitnessTab as unknown as { $$typeof: symbol }).$$typeof;
      expect(memoType).toBe(Symbol.for('react.memo'));
    });
  });
});
