import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

/* ------------------------------------------------------------------ */
/* Mocks */
/* ------------------------------------------------------------------ */

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi' },
  }),
}));

const { mockCapAddListener } = vi.hoisted(() => ({
  mockCapAddListener: vi.fn((_event: string, _handler: () => void) => {
    return Promise.resolve({ remove: vi.fn() });
  }),
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: mockCapAddListener,
    exitApp: vi.fn(),
  },
}));

const { mockPushBackEntry, mockRemoveBackEntries } = vi.hoisted(() => ({
  mockPushBackEntry: vi.fn(),
  mockRemoveBackEntries: vi.fn(),
}));

vi.mock('../services/backNavigationService', () => ({
  pushBackEntry: mockPushBackEntry,
  removeBackEntries: mockRemoveBackEntries,
  initBackNavigation: vi.fn(() => vi.fn()),
}));

const mockSaveProfile = vi.fn().mockResolvedValue(undefined);
const mockSaveGoal = vi.fn().mockResolvedValue(undefined);

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      saveProfile: mockSaveProfile,
      saveGoal: mockSaveGoal,
      profile: {
        id: 'default',
        name: '',
        gender: 'male',
        age: 30,
        dateOfBirth: null,
        heightCm: 170,
        weightKg: 70,
        activityLevel: 'moderate',
        proteinRatio: 2.0,
        fatPct: 0.25,
        targetCalories: 1500,
        updatedAt: new Date().toISOString(),
      },
      activeGoal: null,
      loading: false,
    }),
}));

const mockSetAppOnboarded = vi.fn();
const mockSetOnboardingSection = vi.fn();
let mockOnboardingSection: number | null = null;

vi.mock('../store/appOnboardingStore', () => ({
  useAppOnboardingStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      isAppOnboarded: false,
      onboardingSection: mockOnboardingSection,
      setAppOnboarded: mockSetAppOnboarded,
      setOnboardingSection: mockSetOnboardingSection,
    }),
}));

const mockSetOnboarded = vi.fn();
const mockSetPlanStrategy = vi.fn();
const mockSetTrainingProfile = vi.fn();

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      isOnboarded: false,
      planStrategy: null,
      setOnboarded: mockSetOnboarded,
      setPlanStrategy: mockSetPlanStrategy,
      setTrainingProfile: mockSetTrainingProfile,
    }),
}));

vi.mock('../contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    execute: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
  }),
}));

vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        return ({ ref, ...props }: Record<string, unknown> & { ref?: React.Ref<HTMLElement> }) => {
          const {
            animate: _animate,
            initial: _initial,
            transition: _transition,
            whileHover: _whileHover,
            whileTap: _whileTap,
            exit: _exit,
            variants,
            custom,
            ...rest
          } = props;
          if (variants && typeof variants === 'object') {
            const v = variants as Record<string, unknown>;
            const d = typeof custom === 'number' ? custom : 1;
            if (typeof v.enter === 'function') {
              v.enter(d);
              v.enter(-d);
            }
            if (typeof v.exit === 'function') {
              v.exit(d);
              v.exit(-d);
            }
          }
          return React.createElement(prop, { ...rest, ref });
        };
      },
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

/**
 * Mock PlanComputingScreen to call goNext() immediately via a microtask.
 * The real component uses 11.5 s of setTimeout-based animation which
 * is already covered by unit tests. For the integration flow we only
 * care that computing eventually advances to the preview.
 */
vi.mock('../components/onboarding/PlanComputingScreen', () => ({
  PlanComputingScreen: function MockComputing(props: { goNext: () => void }) {
    React.useEffect(() => {
      const id = setTimeout(props.goNext, 0);
      return () => clearTimeout(id);
    }, [props.goNext]);
    return React.createElement('div', { 'data-testid': 'plan-computing' }, 'Computing…');
  },
}));

const welcomeThrowFlag = vi.fn().mockReturnValue(false);

vi.mock('../components/onboarding/WelcomeSlides', () => ({
  WelcomeSlides: function MockWelcome(props: {
    step: number;
    goNext: () => void;
    goBack: () => void;
    goToSection: (s: number) => void;
  }) {
    if (welcomeThrowFlag()) throw new Error('Simulated crash');
    return React.createElement(
      'div',
      { 'data-testid': 'welcome-slides' },
      React.createElement(
        'span',
        null,
        props.step === 0 ? 'welcome.slide1Title' : props.step === 1 ? 'welcome.slide2Title' : 'welcome.slide3Title',
      ),
      React.createElement(
        'button',
        { 'data-testid': 'onboarding-next-btn', onClick: props.goNext },
        props.step === 2 ? 'onboarding.nav.start' : 'welcome.next',
      ),
      React.createElement(
        'button',
        { 'data-testid': 'onboarding-skip-btn', onClick: () => props.goToSection(2) },
        'welcome.skip',
      ),
      React.createElement('button', { onClick: props.goBack }, 'onboarding.nav.back'),
    );
  },
}));

/* ------------------------------------------------------------------ */
/* Lazy import: UnifiedOnboarding */
/* ------------------------------------------------------------------ */

import { UnifiedOnboarding } from '../components/UnifiedOnboarding';

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */

/** Click a button found by data-testid, waiting for it to appear first. */
async function clickByTestId(testId: string) {
  const el = await screen.findByTestId(testId);
  fireEvent.click(el);
}

/**
 * Fill the HealthBasicStep required fields (name + dateOfBirth)
 * so that form validation passes when Next is clicked.
 */
async function fillHealthBasicFields() {
  const nameInput = await screen.findByLabelText('onboarding.health.name');
  fireEvent.change(nameInput, { target: { value: 'Integration Tester' } });
  fireEvent.blur(nameInput);

  const dobInput = screen.getByLabelText('onboarding.health.dateOfBirth');
  fireEvent.change(dobInput, { target: { value: '1990-06-15' } });
  fireEvent.blur(dobInput);

  const heightInput = screen.getByLabelText('onboarding.health.height');
  fireEvent.change(heightInput, { target: { value: '170' } });
  fireEvent.blur(heightInput);

  const weightInput = screen.getByLabelText('onboarding.health.weight');
  fireEvent.change(weightInput, { target: { value: '70' } });
  fireEvent.blur(weightInput);
}

/**
 * Navigate through all 3 Welcome Slides by clicking the Next/Start button.
 */
async function navigateWelcomeSlides() {
  await screen.findByTestId('welcome-slides');
  fireEvent.click(screen.getByTestId('onboarding-next-btn'));
  fireEvent.click(screen.getByTestId('onboarding-next-btn'));
  fireEvent.click(screen.getByTestId('onboarding-next-btn'));
}

/**
 * Navigate through Section 2 (Health): Basic → Activity → Nutrition → Confirm.
 */
async function navigateHealthSection() {
  await screen.findByTestId('health-basic-step');
  await fillHealthBasicFields();
  fireEvent.click(screen.getByTestId('health-basic-next'));

  await screen.findByTestId('activity-level-step');
  fireEvent.click(screen.getByText('onboarding.nav.next', { selector: 'button' }));

  await screen.findByText('onboarding.goal.title');
  fireEvent.click(screen.getByText('onboarding.nav.next', { selector: 'button' }));

  await screen.findByTestId('health-confirm-step');
  fireEvent.click(screen.getByTestId('health-confirm-btn'));
}

/**
 * Navigate through Section 3 (Training Core) and Section 4 (Training Details, beginner path).
 */
async function navigateTrainingSections() {
  await screen.findByTestId('training-core-step');
  fireEvent.click(screen.getByText('onboarding.nav.next', { selector: 'button' }));

  // Section 4: DurationStep → EquipmentStep → InjuriesStep → CardioStep → TrainingConfirmStep
  await screen.findByText('fitness.onboarding.sessionDuration');
  fireEvent.click(screen.getByText('onboarding.nav.next', { selector: 'button' }));

  await screen.findByText('fitness.onboarding.equipment');
  fireEvent.click(screen.getByText('onboarding.nav.next', { selector: 'button' }));

  await screen.findByText('fitness.onboarding.injuries');
  fireEvent.click(screen.getByText('onboarding.nav.next', { selector: 'button' }));

  await screen.findByText('fitness.onboarding.cardioSessions');
  fireEvent.click(screen.getByText('onboarding.nav.next', { selector: 'button' }));

  // TrainingConfirmStep for beginner → calls setOnboardingSection(5) + goNext
  await screen.findByTestId('training-confirm-step');
  fireEvent.click(screen.getByText('onboarding.nav.next', { selector: 'button' }));
}

/* ------------------------------------------------------------------ */
/* Tests */
/* ------------------------------------------------------------------ */

beforeEach(() => {
  mockOnboardingSection = null;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('UnifiedOnboarding Integration', () => {
  describe('Auto path flow', () => {
    it('navigates through all 7 sections and reaches preview', async () => {
      render(<UnifiedOnboarding />);

      // Section 1: Welcome (3 slides)
      await navigateWelcomeSlides();

      // Section 2: Health (4 steps)
      await navigateHealthSection();

      // Sections 3 + 4: Training
      await navigateTrainingSections();

      // Section 5: PlanStrategyChoice — choose Auto
      await clickByTestId('strategy-auto');
      expect(mockSetPlanStrategy).toHaveBeenCalledWith('auto');

      // Section 6: MockComputingScreen auto-calls goNext → Section 7
      // The mock calls goNext via setTimeout(…, 0), so flush it:
      await act(async () => {
        await new Promise(r => {
          setTimeout(r, 10);
        });
      });

      // Section 7: PlanPreviewScreen
      expect(await screen.findByTestId('plan-preview')).toBeInTheDocument();

      // Complete onboarding
      fireEvent.click(screen.getByTestId('onboarding-complete'));
      expect(mockSetOnboarded).toHaveBeenCalledWith(true);
      expect(mockSetAppOnboarded).toHaveBeenCalledWith(true);
      expect(mockSetOnboardingSection).toHaveBeenCalledWith(null);
    });
  });

  describe('Manual path flow', () => {
    it('navigates through 5 sections, skips computing, and completes', async () => {
      render(<UnifiedOnboarding />);

      // Section 1: Welcome
      await navigateWelcomeSlides();

      // Section 2: Health
      await navigateHealthSection();

      // Sections 3 + 4: Training
      await navigateTrainingSections();

      // Section 5: PlanStrategyChoice — choose Manual
      await clickByTestId('strategy-manual');
      expect(mockSetPlanStrategy).toHaveBeenCalledWith('manual');

      // Should skip Section 6 (computing) and go directly to Section 7
      expect(await screen.findByTestId('plan-preview')).toBeInTheDocument();

      // Complete onboarding
      fireEvent.click(screen.getByTestId('onboarding-complete'));
      expect(mockSetOnboarded).toHaveBeenCalledWith(true);
      expect(mockSetAppOnboarded).toHaveBeenCalledWith(true);
      expect(mockSetOnboardingSection).toHaveBeenCalledWith(null);
    });
  });

  describe('Resume behavior', () => {
    it('starts from saved onboardingSection when set to 3', async () => {
      mockOnboardingSection = 3;
      render(<UnifiedOnboarding />);

      // Should start at section 3 (TrainingCoreStep), skipping welcome + health
      expect(await screen.findByTestId('training-core-step')).toBeInTheDocument();
    });

    it('starts from section 5 when onboardingSection is 5', async () => {
      mockOnboardingSection = 5;
      render(<UnifiedOnboarding />);

      // Should start at section 5 (PlanStrategyChoice)
      expect(await screen.findByTestId('plan-strategy-choice')).toBeInTheDocument();
    });
  });

  describe('Store integration', () => {
    it('calls all store setters on completeOnboarding', async () => {
      render(<UnifiedOnboarding />);

      // Navigate the manual path (faster, no timers)
      await navigateWelcomeSlides();
      await navigateHealthSection();
      await navigateTrainingSections();
      await clickByTestId('strategy-manual');
      await screen.findByTestId('plan-preview');

      fireEvent.click(screen.getByTestId('onboarding-complete'));

      expect(mockSetOnboarded).toHaveBeenCalledTimes(1);
      expect(mockSetOnboarded).toHaveBeenCalledWith(true);
      expect(mockSetAppOnboarded).toHaveBeenCalledTimes(1);
      expect(mockSetAppOnboarded).toHaveBeenCalledWith(true);
      expect(mockSetOnboardingSection).toHaveBeenCalledWith(null);
    });

    it('persists section via setOnboardingSection during health confirm', async () => {
      render(<UnifiedOnboarding />);

      await navigateWelcomeSlides();
      await navigateHealthSection();

      // HealthConfirmStep calls setOnboardingSection(3) after async save
      await waitFor(() => {
        expect(mockSetOnboardingSection).toHaveBeenCalledWith(3);
      });
    });

    it('persists section via setOnboardingSection during training confirm', async () => {
      render(<UnifiedOnboarding />);

      await navigateWelcomeSlides();
      await navigateHealthSection();
      await navigateTrainingSections();

      // TrainingDetailSteps.handleConfirmTraining calls setOnboardingSection(5)
      expect(mockSetOnboardingSection).toHaveBeenCalledWith(5);
    });

    it('calls saveProfile and saveGoal during health confirm step', async () => {
      render(<UnifiedOnboarding />);

      await navigateWelcomeSlides();
      await navigateHealthSection();

      await waitFor(() => {
        expect(mockSaveProfile).toHaveBeenCalledTimes(1);
      });
      expect(mockSaveGoal).toHaveBeenCalledTimes(1);
    });
  });

  describe('Welcome skip behavior', () => {
    it('skip button jumps directly to health section', async () => {
      render(<UnifiedOnboarding />);

      await screen.findByTestId('welcome-slides');
      fireEvent.click(screen.getByTestId('onboarding-skip-btn'));

      expect(await screen.findByTestId('health-basic-step')).toBeInTheDocument();
    });
  });

  describe('Error boundary recovery (handleReset)', () => {
    it('handles crash in child and resets via error boundary', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(<UnifiedOnboarding />);
      await screen.findByTestId('welcome-slides');

      welcomeThrowFlag.mockReturnValue(true);
      fireEvent.click(screen.getByTestId('onboarding-next-btn'));

      await waitFor(() => {
        expect(screen.getByText('onboarding.error.title')).toBeInTheDocument();
      });

      welcomeThrowFlag.mockReturnValue(false);
      fireEvent.click(screen.getByText('onboarding.error.restart'));

      expect(mockSetOnboardingSection).toHaveBeenCalledWith(null);
      await waitFor(() => {
        expect(screen.getByTestId('welcome-slides')).toBeInTheDocument();
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Android back button (C-001)', () => {
    function getLatestBackHandler(): () => void {
      const calls = mockPushBackEntry.mock.calls;
      return calls[calls.length - 1][0];
    }

    it('should call goBack on Android back button when not on first step', async () => {
      render(<UnifiedOnboarding />);
      await screen.findByTestId('welcome-slides');

      // Navigate to slide 2 (section=1, step=1)
      fireEvent.click(screen.getByTestId('onboarding-next-btn'));
      await waitFor(() => {
        expect(screen.getByText('welcome.slide2Title')).toBeInTheDocument();
      });

      // pushBackEntry should have been called when navigating forward
      expect(mockPushBackEntry).toHaveBeenCalled();

      // Simulate Android back button by calling the pushed handler
      const handler = getLatestBackHandler();
      act(() => {
        handler();
      });

      // Should go back to slide 1
      await waitFor(() => {
        expect(screen.getByText('welcome.slide1Title')).toBeInTheDocument();
      });
    });

    it('should not push back entry on first step (section=1, step=0)', async () => {
      mockPushBackEntry.mockClear();
      render(<UnifiedOnboarding />);
      await screen.findByTestId('welcome-slides');
      expect(screen.getByText('welcome.slide1Title')).toBeInTheDocument();

      // No back entries should be pushed on initial render at depth 0
      expect(mockPushBackEntry).not.toHaveBeenCalled();
    });

    it('should go back from section 2 to section 1 via back button', async () => {
      render(<UnifiedOnboarding />);
      await screen.findByTestId('welcome-slides');

      // Navigate through all welcome slides to reach section 2
      fireEvent.click(screen.getByTestId('onboarding-next-btn'));
      fireEvent.click(screen.getByTestId('onboarding-next-btn'));
      fireEvent.click(screen.getByTestId('onboarding-next-btn'));
      await screen.findByTestId('health-basic-step');

      // Simulate Android back button
      const handler = getLatestBackHandler();
      act(() => {
        handler();
      });

      // Should go back to section 1, last step (slide 3)
      expect(await screen.findByText('welcome.slide3Title')).toBeInTheDocument();
    });
  });
});
