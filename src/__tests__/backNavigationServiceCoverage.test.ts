/**
 * Supplementary branch-coverage tests for backNavigationService.ts.
 * Covers native platform (Capacitor) paths, edge cases for empty stacks,
 * and removeBackEntries(0) early return.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* ------------------------------------------------------------------ */
/* Mock setup — native platform enabled                                */
/* ------------------------------------------------------------------ */
const mockRemoveListener = vi.fn();
const mockAddListener = vi.fn((_event: string, _callback: (args: { canGoBack: boolean }) => void) =>
  Promise.resolve({ remove: mockRemoveListener }),
);
const mockExitApp = vi.fn(() => Promise.resolve());

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (...args: [string, (args: { canGoBack: boolean }) => void]) => mockAddListener(...args),
    exitApp: () => mockExitApp(),
  },
}));

let service: typeof import('../services/backNavigationService');

describe('backNavigationService — native platform', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    service = await import('../services/backNavigationService');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removeBackEntries(0) does nothing (early return)', () => {
    const goSpy = vi.spyOn(globalThis.history, 'go');
    service.removeBackEntries(0);
    expect(goSpy).not.toHaveBeenCalled();
    expect(service.getBackStackDepth()).toBe(0);
  });

  it('initBackNavigation registers Capacitor backButton listener', () => {
    const cleanup = service.initBackNavigation();
    expect(mockAddListener).toHaveBeenCalledWith('backButton', expect.any(Function));
    cleanup();
  });

  it('Capacitor backButton with handler stack calls history.back', async () => {
    const backSpy = vi.spyOn(globalThis.history, 'back').mockImplementation(() => {});
    const cleanup = service.initBackNavigation();

    service.pushBackEntry(() => {});

    // Get the backButton callback
    const backButtonCallback = mockAddListener.mock.calls[0]![1];

    backButtonCallback({ canGoBack: false });
    expect(backSpy).toHaveBeenCalled();

    cleanup();
  });

  it('Capacitor backButton with canGoBack and empty stack calls history.back', async () => {
    const backSpy = vi.spyOn(globalThis.history, 'back').mockImplementation(() => {});
    const cleanup = service.initBackNavigation();

    const backButtonCallback = mockAddListener.mock.calls[0]![1];

    backButtonCallback({ canGoBack: true });
    expect(backSpy).toHaveBeenCalled();

    cleanup();
  });

  it('Capacitor backButton with empty stack and !canGoBack calls exitApp', async () => {
    const cleanup = service.initBackNavigation();

    const backButtonCallback = mockAddListener.mock.calls[0]![1];

    backButtonCallback({ canGoBack: false });
    expect(mockExitApp).toHaveBeenCalled();

    cleanup();
  });

  it('popstate with empty handler stack does nothing', () => {
    const cleanup = service.initBackNavigation();

    // No handlers pushed, fire popstate
    globalThis.dispatchEvent(new PopStateEvent('popstate'));
    expect(service.getBackStackDepth()).toBe(0);

    cleanup();
  });

  it('cleanup removes Capacitor listener after it resolves', async () => {
    const cleanup = service.initBackNavigation();

    // Wait for the addListener promise to resolve
    await vi.waitFor(() => {
      expect(mockAddListener).toHaveBeenCalled();
    });
    // Give microtask queue time to set removeCapacitorListener
    await new Promise(r => setTimeout(r, 10));

    cleanup();
    expect(mockRemoveListener).toHaveBeenCalled();
  });

  it('programmatic removeBackEntries skips next popstate', () => {
    const cleanup = service.initBackNavigation();

    const handler1 = vi.fn();
    const handler2 = vi.fn();
    service.pushBackEntry(handler1);
    service.pushBackEntry(handler2);

    // Programmatically remove 2 entries
    vi.spyOn(globalThis.history, 'go').mockImplementation(() => {});
    service.removeBackEntries(2);
    expect(service.getBackStackDepth()).toBe(0);

    // Next popstate should be skipped (programmatic back)
    globalThis.dispatchEvent(new PopStateEvent('popstate'));
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();

    cleanup();
  });
});
