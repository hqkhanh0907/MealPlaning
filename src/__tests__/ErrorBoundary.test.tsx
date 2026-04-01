import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: { error: vi.fn() },
}));

// Component that throws
const ThrowingChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test error');
  return <div>Working</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected React error boundary logs
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument();
    expect(screen.getByText('Thử lại')).toBeInTheDocument();
    expect(screen.getByText('Tải lại trang')).toBeInTheDocument();
  });

  it('shows custom fallbackTitle', () => {
    render(
      <ErrorBoundary fallbackTitle="Lỗi tùy chỉnh">
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Lỗi tùy chỉnh')).toBeInTheDocument();
  });

  it('shows error details in expandable section', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Chi tiết lỗi')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('retry button resets error state', () => {
    // We need a controllable component
    let shouldThrow = true;
    const ControlledChild = () => {
      if (shouldThrow) throw new Error('First throw');
      return <div>Recovered</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ControlledChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Thử lại'));

    // After retry, ControlledChild should render without error
    rerender(
      <ErrorBoundary>
        <ControlledChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('reload button calls location.reload', () => {
    const reloadMock = vi.fn();
    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      value: { ...originalLocation, reload: reloadMock },
      writable: true,
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText('Tải lại trang'));
    expect(reloadMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});
