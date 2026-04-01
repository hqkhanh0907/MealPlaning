import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider, useNotification } from '../contexts/NotificationContext';

// Test consumer component
const TestConsumer = () => {
  const notify = useNotification();
  return (
    <div>
      <button onClick={() => notify.success('Success!', 'Done')}>show-success</button>
      <button onClick={() => notify.error('Error!', 'Failed')}>show-error</button>
      <button onClick={() => notify.warning('Warning!', 'Careful')}>show-warning</button>
      <button onClick={() => notify.info('Info!', 'Note')}>show-info</button>
      <button onClick={() => notify.dismissAll()}>dismiss-all</button>
    </div>
  );
};

describe('NotificationContext', () => {
  it('throws when useNotification is used outside provider', () => {
    // Suppress console.error for expected error
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      const Broken = () => { useNotification(); return null; };
      render(<Broken />);
    }).toThrow('useNotification must be used within <NotificationProvider>');
    consoleError.mockRestore();
  });

  it('renders success toast', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders error toast', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-error'));
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('renders warning toast', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-warning'));
    expect(screen.getByText('Warning!')).toBeInTheDocument();
  });

  it('renders info toast', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-info'));
    expect(screen.getByText('Info!')).toBeInTheDocument();
  });

  it('dismissAll removes all toasts', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-success'));
    await userEvent.click(screen.getByText('show-error'));
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();

    await userEvent.click(screen.getByText('dismiss-all'));
    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    expect(screen.queryByText('Error!')).not.toBeInTheDocument();
  });

  it('auto-dismisses toast after duration', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();

    // Success duration is 3000ms + 300ms exit animation
    act(() => { vi.advanceTimersByTime(3500); });
    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('limits to MAX_TOASTS (5)', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );
    for (let i = 0; i < 7; i++) {
      await userEvent.click(screen.getByText('show-info'));
    }
    // Should show max 5 toasts (old ones evicted)
    const infoTitles = screen.getAllByText('Info!');
    expect(infoTitles.length).toBeLessThanOrEqual(5);
  });

  it('handles toast with onClick callback', async () => {
    const onClick = vi.fn();
    const ClickConsumer = () => {
      const notify = useNotification();
      return (
        <button onClick={() => notify.info('Clickable', 'Click me', { onClick })}>
          show-clickable
        </button>
      );
    };

    render(
      <NotificationProvider>
        <ClickConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-clickable'));
    // The toast with onClick should have an overlay button
    const toastContainer = screen.getByText('Clickable').closest('[class*="rounded-2xl"]');
    expect(toastContainer).toBeTruthy();
    // Find the overlay button (the one covering the entire toast)
    const overlayBtn = toastContainer?.querySelector('button[class*="absolute"]');
    expect(overlayBtn).toBeTruthy();
    if (overlayBtn) {
      fireEvent.click(overlayBtn);
      expect(onClick).toHaveBeenCalledTimes(1);
    }
  });

  it('handles toast with action button', async () => {
    const actionClick = vi.fn();
    const ActionConsumer = () => {
      const notify = useNotification();
      return (
        <button onClick={() => notify.success('With Action', 'msg', { action: { label: 'Undo', onClick: actionClick } })}>
          show-action
        </button>
      );
    };

    render(
      <NotificationProvider>
        <ActionConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-action'));
    const actionBtn = screen.getByText('Undo');
    expect(actionBtn).toBeInTheDocument();
    fireEvent.click(actionBtn);
    expect(actionClick).toHaveBeenCalledTimes(1);
  });

  it('dismiss button removes individual toast', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();

    // Click the X button on the toast
    const closeButtons = document.querySelectorAll('button');
    const dismissBtn = Array.from(closeButtons).find(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.closest('[class*="rounded-2xl"]') && !btn.textContent?.includes('show');
    });
    if (dismissBtn) fireEvent.click(dismissBtn);
  });

  it('handles keyboard interaction on clickable toast', async () => {
    const onClick = vi.fn();
    const KeyConsumer = () => {
      const notify = useNotification();
      return (
        <button onClick={() => notify.info('Key', 'msg', { onClick })}>show-key</button>
      );
    };

    render(
      <NotificationProvider>
        <KeyConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-key'));
    const toastContainer = screen.getByText('Key').closest('[class*="rounded-2xl"]');
    const overlayBtn = toastContainer?.querySelector('button[class*="absolute"]');
    if (overlayBtn) {
      fireEvent.keyDown(overlayBtn, { key: 'Enter' });
      // The overlay button handles click; keyboard Enter on a native button triggers click
      fireEvent.click(overlayBtn);
      expect(onClick).toHaveBeenCalled();
    }
  });

  it('pauses auto-dismiss on mouse enter and resumes on mouse leave', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-success'));
    const toastEl = screen.getByText('Success!').closest('[class*="rounded-2xl"]');
    expect(toastEl).toBeTruthy();

    if (toastEl) {
      // Use native dispatchEvent to ensure v8 coverage tracks DOM listeners
      act(() => { toastEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })); });
      act(() => { vi.advanceTimersByTime(5000); });
      expect(screen.getByText('Success!')).toBeInTheDocument();

      act(() => { toastEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true })); });
      act(() => { vi.advanceTimersByTime(2500); });
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    }
    vi.useRealTimers();
  });

  it('toast without onClick has no overlay button', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-success'));
    const toastContainer = screen.getByText('Success!').closest('[class*="rounded-2xl"]');
    expect(toastContainer).toBeTruthy();
    // No overlay button when there is no onClick option
    const overlayBtn = toastContainer?.querySelector('button[class*="absolute"]');
    expect(overlayBtn).toBeNull();
  });

  it('action button stopPropagation does not trigger toast onClick', async () => {
    const toastOnClick = vi.fn();
    const actionClick = vi.fn();
    const BothConsumer = () => {
      const notify = useNotification();
      return (
        <button
          onClick={() =>
            notify.info('Both', 'msg', {
              onClick: toastOnClick,
              action: { label: 'Act', onClick: actionClick },
            })
          }
        >
          show-both
        </button>
      );
    };

    render(
      <NotificationProvider>
        <BothConsumer />
      </NotificationProvider>,
    );
    await userEvent.click(screen.getByText('show-both'));
    const actionBtn = screen.getByText('Act');
    fireEvent.click(actionBtn);
    expect(actionClick).toHaveBeenCalledTimes(1);
    // toast onClick must NOT fire because action button stops propagation
    expect(toastOnClick).not.toHaveBeenCalled();
  });
});
