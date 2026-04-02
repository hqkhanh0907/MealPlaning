import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() })),
    exitApp: vi.fn(),
  },
}));

let service: typeof import('../services/backNavigationService');

describe('backNavigationService', () => {
  beforeEach(async () => {
    vi.resetModules();
    service = await import('../services/backNavigationService');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pushBackEntry increases stack depth', () => {
    expect(service.getBackStackDepth()).toBe(0);
    service.pushBackEntry(() => {});
    expect(service.getBackStackDepth()).toBe(1);
  });

  it('pushBackEntry calls history.pushState', () => {
    const spy = vi.spyOn(globalThis.history, 'pushState');
    service.pushBackEntry(() => {});
    expect(spy).toHaveBeenCalledWith({ backNav: true, depth: 1 }, '');
  });

  it('removeTopBackEntry pops handler and calls history.back', () => {
    const handler = vi.fn();
    const backSpy = vi.spyOn(globalThis.history, 'back');
    service.pushBackEntry(handler);
    expect(service.getBackStackDepth()).toBe(1);
    service.removeTopBackEntry();
    expect(service.getBackStackDepth()).toBe(0);
    expect(backSpy).toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it('removeBackEntries removes N handlers and calls history.go(-N)', () => {
    const goSpy = vi.spyOn(globalThis.history, 'go');
    service.pushBackEntry(() => {});
    service.pushBackEntry(() => {});
    service.pushBackEntry(() => {});
    expect(service.getBackStackDepth()).toBe(3);
    service.removeBackEntries(2);
    expect(service.getBackStackDepth()).toBe(1);
    expect(goSpy).toHaveBeenCalledWith(-2);
  });

  it('removeBackEntries with count > stack depth removes all', () => {
    const goSpy = vi.spyOn(globalThis.history, 'go');
    service.pushBackEntry(() => {});
    service.removeBackEntries(5);
    expect(service.getBackStackDepth()).toBe(0);
    expect(goSpy).toHaveBeenCalledWith(-1);
  });

  it('removeTopBackEntry on empty stack does nothing', () => {
    const backSpy = vi.spyOn(globalThis.history, 'back');
    service.removeTopBackEntry();
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('initBackNavigation registers popstate listener', () => {
    const addSpy = vi.spyOn(globalThis, 'addEventListener');
    const cleanup = service.initBackNavigation();
    expect(addSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    cleanup();
  });

  it('popstate calls top handler (LIFO)', () => {
    const cleanup = service.initBackNavigation();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    service.pushBackEntry(handler1);
    service.pushBackEntry(handler2);

    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler1).not.toHaveBeenCalled();
    expect(service.getBackStackDepth()).toBe(1);

    cleanup();
  });

  it('programmatic removeTopBackEntry skips next popstate', () => {
    const cleanup = service.initBackNavigation();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    service.pushBackEntry(handler1);
    service.pushBackEntry(handler2);

    service.removeTopBackEntry();

    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
    expect(service.getBackStackDepth()).toBe(1);

    cleanup();
  });

  it('double init returns noop cleanup', () => {
    const cleanup1 = service.initBackNavigation();
    const cleanup2 = service.initBackNavigation();
    expect(cleanup2).toBeDefined();
    cleanup1();
  });
});
