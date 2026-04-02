import { beforeEach, describe, expect, it, vi } from 'vitest';

import { errorFeedback, hapticFeedback, successFeedback, tapFeedback } from '../utils/haptics';

const mockImpact = vi.fn().mockResolvedValue(undefined);

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: (...args: unknown[]) => mockImpact(...args),
  },
  ImpactStyle: {
    Light: 'LIGHT',
    Medium: 'MEDIUM',
    Heavy: 'HEAVY',
  },
}));

describe('hapticFeedback', () => {
  beforeEach(() => {
    mockImpact.mockClear();
  });

  it('calls Haptics.impact with Light style for "light"', async () => {
    await hapticFeedback('light');
    expect(mockImpact).toHaveBeenCalledWith({ style: 'LIGHT' });
  });

  it('calls Haptics.impact with Medium style for "medium"', async () => {
    await hapticFeedback('medium');
    expect(mockImpact).toHaveBeenCalledWith({ style: 'MEDIUM' });
  });

  it('calls Haptics.impact with Heavy style for "heavy"', async () => {
    await hapticFeedback('heavy');
    expect(mockImpact).toHaveBeenCalledWith({ style: 'HEAVY' });
  });
});

describe('convenience functions', () => {
  beforeEach(() => {
    mockImpact.mockClear();
  });

  it('tapFeedback triggers light haptic', async () => {
    tapFeedback();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(mockImpact).toHaveBeenCalledWith({ style: 'LIGHT' });
  });

  it('successFeedback triggers medium haptic', async () => {
    successFeedback();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(mockImpact).toHaveBeenCalledWith({ style: 'MEDIUM' });
  });

  it('errorFeedback triggers heavy haptic', async () => {
    errorFeedback();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(mockImpact).toHaveBeenCalledWith({ style: 'HEAVY' });
  });
});

describe('hapticFeedback graceful no-op', () => {
  it('does not throw when plugin is unavailable', async () => {
    const failingImpact = vi.fn().mockRejectedValue(new Error('Plugin not available'));
    vi.doMock('@capacitor/haptics', () => ({
      Haptics: {
        impact: failingImpact,
      },
      ImpactStyle: {
        Light: 'LIGHT',
        Medium: 'MEDIUM',
        Heavy: 'HEAVY',
      },
    }));

    const haptics = await import('../utils/haptics');
    await expect(haptics.hapticFeedback('light')).resolves.toBeUndefined();
    expect(failingImpact).toHaveBeenCalled();
  });
});
