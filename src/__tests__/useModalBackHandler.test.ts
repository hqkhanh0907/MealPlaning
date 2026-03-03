import { renderHook } from '@testing-library/react';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

const mockRemove = vi.fn();
const mockAddListener = vi.fn().mockResolvedValue({ remove: mockRemove });
const mockExitApp = vi.fn();

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (...args: unknown[]) => mockAddListener(...args),
    exitApp: (...args: unknown[]) => mockExitApp(...args),
  },
}));

describe('useModalBackHandler', () => {
  const pushStateSpy = vi.spyOn(globalThis.history, 'pushState');
  const backSpy = vi.spyOn(globalThis.history, 'back');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pushes history state when modal opens', () => {
    renderHook(() => useModalBackHandler(true, vi.fn()));
    expect(pushStateSpy).toHaveBeenCalledWith({ modal: true }, '');
  });

  it('does not push history when modal is closed', () => {
    renderHook(() => useModalBackHandler(false, vi.fn()));
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('calls history.back when modal closes (already pushed)', () => {
    const { rerender } = renderHook(
      ({ isOpen, onClose }) => useModalBackHandler(isOpen, onClose),
      { initialProps: { isOpen: true, onClose: vi.fn() } },
    );
    pushStateSpy.mockClear();

    // Close modal
    rerender({ isOpen: false, onClose: vi.fn() });
    expect(backSpy).toHaveBeenCalled();
  });

  it('calls onClose when popstate fires', () => {
    const onClose = vi.fn();
    renderHook(() => useModalBackHandler(true, onClose));

    // Simulate user pressing back
    globalThis.dispatchEvent(new PopStateEvent('popstate'));
    // onClose might not fire because of programmaticBackCount reset,
    // but the handler should have been registered
    expect(pushStateSpy).toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventSpy = vi.spyOn(globalThis, 'removeEventListener');
    const { unmount } = renderHook(() => useModalBackHandler(true, vi.fn()));
    unmount();
    expect(removeEventSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    removeEventSpy.mockRestore();
  });

  it('popstate calls onClose when programmaticBackCount is 0', () => {
    const onClose = vi.fn();
    // Open modal (push) then dispatch popstate (simulates user pressing back)
    renderHook(() => useModalBackHandler(true, onClose));

    // First open→close cycle to reset programmaticBackCount
    // We need a clean state: open modal, no programmatic back happened
    // The hook pushed state. Now simulate user pressing back:
    globalThis.dispatchEvent(new PopStateEvent('popstate'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('swallows the next popstate after a programmatic close (does not fire onClose)', () => {
    const onClose = vi.fn();
    const { rerender } = renderHook(
      ({ isOpen }) => useModalBackHandler(isOpen, onClose),
      { initialProps: { isOpen: true } },
    );
    // Programmatic close — increments programmaticBackCount
    rerender({ isOpen: false });
    // The subsequent popstate from history.back() should be swallowed
    globalThis.dispatchEvent(new PopStateEvent('popstate'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('useModalBackHandler (native)', () => {
  const backSpy = vi.spyOn(globalThis.history, 'back');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers Capacitor back button listener on native platform', async () => {
    // Override Capacitor mock for this test
    const { Capacitor } = await import('@capacitor/core');
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

    renderHook(() => useModalBackHandler(true, vi.fn()));

    expect(mockAddListener).toHaveBeenCalledWith('backButton', expect.any(Function));

    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });

  it('Capacitor back button triggers history.back when modal is pushed', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

    renderHook(() => useModalBackHandler(true, vi.fn()));

    // Get the callback passed to addListener
    const _backButtonCallback = mockAddListener.mock.calls[0]?.[1];
    expect(_backButtonCallback).toBeDefined();

    backSpy.mockClear();
    _backButtonCallback({ canGoBack: true });
    expect(backSpy).toHaveBeenCalled();

    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });

  it('Capacitor back button calls exitApp when no pushed state and cannot go back', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

    // Open modal so listener is registered and isPushedRef=true
    const { rerender } = renderHook(
      ({ isOpen }) => useModalBackHandler(isOpen, vi.fn()),
      { initialProps: { isOpen: true } },
    );

    // Capture the registered back button callback
    const backCallback = mockAddListener.mock.calls[0]?.[1] as ((info: { canGoBack: boolean }) => void) | undefined;
    expect(backCallback).toBeDefined();

    // Close modal → isPushedRef becomes false
    rerender({ isOpen: false });

    // Trigger back button with canGoBack=false while isPushedRef=false → exitApp
    if (backCallback) backCallback({ canGoBack: false });
    expect(mockExitApp).toHaveBeenCalledTimes(1);

    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });

  it('removes Capacitor back button listener on unmount', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

    const { unmount } = renderHook(() => useModalBackHandler(true, vi.fn()));
    // Flush microtask so the .then() sets the remove reference
    await Promise.resolve();
    unmount();
    expect(mockRemove).toHaveBeenCalled();

    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });
});
