import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as backService from '../services/backNavigationService';

vi.mock('../services/backNavigationService', () => ({
  pushBackEntry: vi.fn(),
  removeBackEntries: vi.fn(),
}));

const mockPopPage = vi.fn();
let mockPageStackLength = 0;

vi.mock('../store/navigationStore', () => ({
  useNavigationStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      pageStack: { length: mockPageStackLength },
      popPage: mockPopPage,
    };
    return selector(state);
  },
}));

describe('usePageStackBackHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPageStackLength = 0;
  });

  it('pushes back entry when pageStack increases', async () => {
    const { usePageStackBackHandler } = await import('../hooks/usePageStackBackHandler');
    const { rerender } = renderHook(() => usePageStackBackHandler());

    mockPageStackLength = 1;
    rerender();

    expect(backService.pushBackEntry).toHaveBeenCalledTimes(1);
  });

  it('removes entries when pageStack decreases', async () => {
    mockPageStackLength = 2;
    const { usePageStackBackHandler } = await import('../hooks/usePageStackBackHandler');
    const { rerender } = renderHook(() => usePageStackBackHandler());

    vi.clearAllMocks();
    mockPageStackLength = 0;
    rerender();

    expect(backService.removeBackEntries).toHaveBeenCalledWith(2);
  });

  it('back handler calls popPage', async () => {
    let capturedHandler: (() => void) | null = null;
    vi.mocked(backService.pushBackEntry).mockImplementation((handler) => {
      capturedHandler = handler;
    });

    const { usePageStackBackHandler } = await import('../hooks/usePageStackBackHandler');
    mockPageStackLength = 0;
    const { rerender } = renderHook(() => usePageStackBackHandler());

    mockPageStackLength = 1;
    rerender();

    expect(capturedHandler).not.toBeNull();
    capturedHandler!();
    expect(mockPopPage).toHaveBeenCalledTimes(1);
  });

  it('does not push when pageStack stays same', async () => {
    const { usePageStackBackHandler } = await import('../hooks/usePageStackBackHandler');
    renderHook(() => usePageStackBackHandler());
    expect(backService.pushBackEntry).not.toHaveBeenCalled();
  });
});
