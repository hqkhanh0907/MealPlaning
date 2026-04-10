import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useModalBackHandler } from '../hooks/useModalBackHandler';
import * as backService from '../services/backNavigationService';

vi.mock('../services/backNavigationService', () => ({
  pushBackEntry: vi.fn(),
  removeTopBackEntry: vi.fn(),
}));

describe('useModalBackHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pushes one back entry only while open', () => {
    renderHook(() => useModalBackHandler(true, vi.fn()));
    expect(backService.pushBackEntry).toHaveBeenCalledTimes(1);
  });

  it('does not push when closed', () => {
    renderHook(() => useModalBackHandler(false, vi.fn()));
    expect(backService.pushBackEntry).not.toHaveBeenCalled();
  });

  it('removes exactly one entry when closed normally', () => {
    const { rerender } = renderHook(({ isOpen }) => useModalBackHandler(isOpen, vi.fn()), {
      initialProps: { isOpen: true },
    });

    rerender({ isOpen: false });
    expect(backService.removeTopBackEntry).toHaveBeenCalledTimes(1);
  });

  it('uses the latest onClose callback from the pushed handler', () => {
    const onClose1 = vi.fn();
    const onClose2 = vi.fn();
    let capturedHandler: (() => void) | null = null;
    vi.mocked(backService.pushBackEntry).mockImplementation(handler => {
      capturedHandler = handler;
    });

    const { rerender } = renderHook(({ onClose }) => useModalBackHandler(true, onClose), {
      initialProps: { onClose: onClose1 },
    });
    rerender({ onClose: onClose2 });

    if (!capturedHandler) throw new Error('Expected handler');
    const handler = capturedHandler as () => void;
    handler();
    expect(onClose2).toHaveBeenCalledTimes(1);
    expect(onClose1).not.toHaveBeenCalled();
  });

  it('does not double-remove after service-triggered close', () => {
    let capturedHandler: (() => void) | null = null;
    vi.mocked(backService.pushBackEntry).mockImplementation(handler => {
      capturedHandler = handler;
    });

    const { rerender } = renderHook(({ isOpen }) => useModalBackHandler(isOpen, vi.fn()), {
      initialProps: { isOpen: true },
    });

    if (!capturedHandler) throw new Error('Expected handler');
    const handler = capturedHandler as () => void;
    handler();
    vi.clearAllMocks();
    rerender({ isOpen: false });

    expect(backService.removeTopBackEntry).not.toHaveBeenCalled();
  });

  it('removes once on unmount if still open', () => {
    const { unmount } = renderHook(() => useModalBackHandler(true, vi.fn()));
    unmount();
    expect(backService.removeTopBackEntry).toHaveBeenCalledTimes(1);
  });

  it('supports reopen after close', () => {
    const { rerender } = renderHook(({ isOpen }) => useModalBackHandler(isOpen, vi.fn()), {
      initialProps: { isOpen: true },
    });

    rerender({ isOpen: false });
    vi.clearAllMocks();
    rerender({ isOpen: true });

    expect(backService.pushBackEntry).toHaveBeenCalledTimes(1);
  });

  it('documents LIFO removal requirement for nested overlays by removing the top entry per instance', () => {
    const outer = renderHook(() => useModalBackHandler(true, vi.fn()));
    const inner = renderHook(() => useModalBackHandler(true, vi.fn()));

    inner.unmount();
    outer.unmount();

    expect(backService.removeTopBackEntry).toHaveBeenCalledTimes(2);
  });
});
