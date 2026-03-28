import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppOnboarding } from '../components/AppOnboarding';

const mockSetAppOnboarded = vi.fn();

vi.mock('../store/appOnboardingStore', () => ({
  useAppOnboardingStore: (selector: (s: { isAppOnboarded: boolean; setAppOnboarded: (v: boolean) => void }) => unknown) =>
    selector({ isAppOnboarded: false, setAppOnboarded: mockSetAppOnboarded }),
}));

vi.mock('../contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    execute: vi.fn(),
    query: vi.fn().mockResolvedValue({ values: [] }),
  }),
}));

vi.mock('../features/health-profile/components/HealthProfileForm', () => ({
  HealthProfileForm: ({ saveRef }: { embedded?: boolean; saveRef?: React.MutableRefObject<(() => Promise<boolean>) | null> }) => {
    if (saveRef) {
      saveRef.current = vi.fn().mockResolvedValue(true);
    }
    return <div data-testid="health-profile-form">Health Profile Form</div>;
  },
}));

describe('AppOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the first welcome slide', () => {
    render(<AppOnboarding />);
    expect(screen.getByTestId('app-onboarding')).toBeInTheDocument();
    expect(screen.getByText(/Smart Meal Planner/)).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-next-btn')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-skip-btn')).toBeInTheDocument();
  });

  it('navigates through slides with Next button', () => {
    render(<AppOnboarding />);
    const nextBtn = screen.getByTestId('onboarding-next-btn');

    fireEvent.click(nextBtn);
    expect(screen.getByText(/Dinh dưỡng chính xác/)).toBeInTheDocument();

    fireEvent.click(nextBtn);
    expect(screen.getByText(/Tập luyện & Sức khỏe/)).toBeInTheDocument();
  });

  it('navigates to profile setup after last slide', () => {
    render(<AppOnboarding />);
    const nextBtn = screen.getByTestId('onboarding-next-btn');

    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);

    expect(screen.getByTestId('health-profile-form')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-complete-btn')).toBeInTheDocument();
  });

  it('skip button goes directly to profile setup', () => {
    render(<AppOnboarding />);
    fireEvent.click(screen.getByTestId('onboarding-skip-btn'));
    expect(screen.getByTestId('health-profile-form')).toBeInTheDocument();
  });

  it('calls setAppOnboarded on complete', async () => {
    render(<AppOnboarding />);
    fireEvent.click(screen.getByTestId('onboarding-skip-btn'));
    fireEvent.click(screen.getByTestId('onboarding-complete-btn'));

    await waitFor(() => {
      expect(mockSetAppOnboarded).toHaveBeenCalledWith(true);
    });
  });

  it('back button returns from profile to slides', () => {
    render(<AppOnboarding />);
    fireEvent.click(screen.getByTestId('onboarding-skip-btn'));
    expect(screen.getByTestId('health-profile-form')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Quay lại/));
    expect(screen.queryByTestId('health-profile-form')).not.toBeInTheDocument();
  });

  it('shows dot indicators matching current slide', () => {
    render(<AppOnboarding />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });
});
