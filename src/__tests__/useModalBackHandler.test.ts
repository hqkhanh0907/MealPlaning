import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
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

  it('pushes back entry when isOpen becomes true', () => {
    renderHook(() => useModalBackHandler(true, vi.fn()));
    expect(backService.pushBackEntry).toHaveBeenCalledTimes(1);
  });

  it('does not push when isOpen is false', () => {
    renderHook(() => useModalBackHandler(false, vi.fn()));
    expect(backService.pushBackEntry).not.toHaveBeenCalled();
  });

  it('removes back entry when isOpen becomes false', () => {
    const { rerender } = renderHook(
      ({ isOpen }) => useModalBackHandler(isOpen, vi.fn()),
      { initialProps: { isOpen: true } }
    );
    rerender({ isOpen: false });
    expect(backService.removeTopBackEntry).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when handler is invoked by service', () => {
    const onClose = vi.fn();
    let capturedHandler: (() => void) | null = null;
    vi.mocked(backService.pushBackEntry).mockImplementation((handler) => {
      capturedHandler = handler;
    });

    renderHook(() => useModalBackHandler(true, onClose));
    expect(capturedHandler).not.toBeNull();
    capturedHandler!();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes back entry on unmount if still pushed', () => {
    const { unmount } = renderHook(() => useModalBackHandler(true, vi.fn()));
    unmount();
    expect(backService.removeTopBackEntry).toHaveBeenCalledTimes(1);
  });

  it('does not remove on unmount if already closed', () => {
    const { rerender, unmount } = renderHook(
      ({ isOpen }) => useModalBackHandler(isOpen, vi.fn()),
      { initialProps: { isOpen: true } }
    );
    rerender({ isOpen: false });
    vi.clearAllMocks();
    unmount();
    expect(backService.removeTopBackEntry).not.toHaveBeenCalled();
  });

  it('uses latest onClose via ref', () => {
    const onClose1 = vi.fn();
    const onClose2 = vi.fn();
    let capturedHandler: (() => void) | null = null;
    vi.mocked(backService.pushBackEntry).mockImplementation((handler) => {
      capturedHandler = handler;
    });

    const { rerender } = renderHook(
      ({ onClose }) => useModalBackHandler(true, onClose),
      { initialProps: { onClose: onClose1 } }
    );
    rerender({ onClose: onClose2 });
    capturedHandler!();
    expect(onClose2).toHaveBeenCalledTimes(1);
    expect(onClose1).not.toHaveBeenCalled();
  });

  it('does not double-remove when handler was invoked before close', () => {
    let capturedHandler: (() => void) | null = null;
    vi.mocked(backService.pushBackEntry).mockImplementation((handler) => {
      capturedHandler = handler;
    });

    const { rerender } = renderHook(
      ({ isOpen }) => useModalBackHandler(isOpen, vi.fn()),
      { initialProps: { isOpen: true } },
    );

    capturedHandler!();
    vi.clearAllMocks();

    rerender({ isOpen: false });
    expect(backService.removeTopBackEntry).not.toHaveBeenCalled();
  });

  it('removes entry when closed without handler invocation', () => {
    const { rerender } = renderHook(
      ({ isOpen }) => useModalBackHandler(isOpen, vi.fn()),
      { initialProps: { isOpen: true } },
    );

    rerender({ isOpen: false });
    expect(backService.removeTopBackEntry).toHaveBeenCalledTimes(1);
  });

  it('re-pushes back entry when reopened after close', () => {
    const { rerender } = renderHook(
      ({ isOpen }) => useModalBackHandler(isOpen, vi.fn()),
      { initialProps: { isOpen: true } },
    );
    expect(backService.pushBackEntry).toHaveBeenCalledTimes(1);

    rerender({ isOpen: false });
    vi.clearAllMocks();

    rerender({ isOpen: true });
    expect(backService.pushBackEntry).toHaveBeenCalledTimes(1);
  });
});
