import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAnimationClass, MOTION_PRESETS, staggerDelay, useReducedMotion } from '../utils/motion';

describe('MOTION_PRESETS', () => {
  it('has correct fadeIn preset', () => {
    expect(MOTION_PRESETS.fadeIn).toEqual({ duration: 200, easing: 'ease-out' });
  });

  it('has correct slideUp preset', () => {
    expect(MOTION_PRESETS.slideUp).toEqual({ duration: 300, easing: 'ease-out' });
  });

  it('has correct scaleIn preset', () => {
    expect(MOTION_PRESETS.scaleIn).toEqual({ duration: 150, easing: 'ease-out' });
  });

  it('has correct stagger value', () => {
    expect(MOTION_PRESETS.stagger).toBe(30);
  });
});

describe('staggerDelay', () => {
  it.each([
    [0, '0ms'],
    [1, '30ms'],
    [2, '60ms'],
    [3, '90ms'],
    [4, '120ms'],
    [5, '150ms'],
  ])('returns %s for tier %i', (tier, expected) => {
    expect(staggerDelay(tier)).toBe(expected);
  });
});

describe('useReducedMotion', () => {
  let matchMediaListeners: ((e: { matches: boolean }) => void)[];
  let originalMatchMedia: typeof window.matchMedia;

  function mockMatchMedia(matches: boolean) {
    matchMediaListeners = [];
    window.matchMedia = vi.fn().mockImplementation(
      () =>
        ({
          matches,
          addEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
            matchMediaListeners.push(handler);
          },
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );
  }

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns false when motion is not reduced', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion matches', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      matchMediaListeners.forEach(listener => listener({ matches: true }));
    });
    expect(result.current).toBe(true);
  });
});

describe('getAnimationClass', () => {
  it('returns correct class for fadeIn', () => {
    expect(getAnimationClass('fadeIn')).toBe('animate-fade-in');
  });

  it('returns correct class for slideUp', () => {
    expect(getAnimationClass('slideUp')).toBe('animate-slide-up');
  });

  it('returns correct class for scaleIn', () => {
    expect(getAnimationClass('scaleIn')).toBe('animate-scale-in');
  });

  it('returns empty string for unknown preset', () => {
    expect(getAnimationClass('unknown')).toBe('');
  });

  it('appends stagger tier class when tier is provided', () => {
    expect(getAnimationClass('fadeIn', 3)).toBe('animate-fade-in animate-stagger-3');
  });

  it('supports stagger tiers 1 through 5', () => {
    for (let tier = 1; tier <= 5; tier++) {
      expect(getAnimationClass('slideUp', tier)).toBe(`animate-slide-up animate-stagger-${tier}`);
    }
  });

  it('ignores tier 0', () => {
    expect(getAnimationClass('fadeIn', 0)).toBe('animate-fade-in');
  });

  it('ignores tier greater than 5', () => {
    expect(getAnimationClass('fadeIn', 6)).toBe('animate-fade-in');
  });

  it('returns empty string when reduced motion is true', () => {
    expect(getAnimationClass('fadeIn', undefined, true)).toBe('');
  });

  it('returns empty string with tier when reduced motion is true', () => {
    expect(getAnimationClass('slideUp', 2, true)).toBe('');
  });
});
