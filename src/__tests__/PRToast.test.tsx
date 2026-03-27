import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { PRToast } from '../features/fitness/components/PRToast';
import type { PRDetection } from '../features/fitness/utils/gamification';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fitness.gamification.newPR': 'KỶ LỤC MỚI!',
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

afterEach(cleanup);

const samplePR: PRDetection = {
  exerciseId: 'bench',
  exerciseName: 'Bench Press',
  newWeight: 80,
  previousWeight: 75,
  reps: 5,
  improvement: 5,
};

describe('PRToast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders PR info (exercise name, weight, improvement)', () => {
    render(<PRToast pr={samplePR} onDismiss={vi.fn()} />);
    expect(screen.getByTestId('pr-toast')).toBeInTheDocument();
    expect(screen.getByText('KỶ LỤC MỚI!', { exact: false })).toBeInTheDocument();
    const details = screen.getByTestId('pr-details');
    expect(details).toHaveTextContent('Bench Press');
    expect(details).toHaveTextContent('80kg');
    expect(details).toHaveTextContent('5 reps');
    expect(details).toHaveTextContent('+5kg');
  });

  it('auto-dismisses after 3 seconds', () => {
    const onDismiss = vi.fn();
    render(<PRToast pr={samplePR} onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses on tap immediately', () => {
    const onDismiss = vi.fn();
    render(<PRToast pr={samplePR} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('pr-toast'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
