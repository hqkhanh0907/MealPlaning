import { useState, useEffect } from 'react';

/** Timing preset for a single animation type */
export interface MotionPreset {
  duration: number;
  easing: string;
}

/** All available motion presets with timing constants (§12.5) */
export const MOTION_PRESETS = {
  fadeIn: { duration: 200, easing: 'ease-out' } as MotionPreset,
  slideUp: { duration: 300, easing: 'ease-out' } as MotionPreset,
  scaleIn: { duration: 150, easing: 'ease-out' } as MotionPreset,
  stagger: 30,
} as const;

/**
 * Returns a CSS animation-delay value for stagger animations.
 * Each tier is delayed by `tierIndex * 30ms`.
 */
export function staggerDelay(tierIndex: number): string {
  return `${tierIndex * MOTION_PRESETS.stagger}ms`;
}

/**
 * React hook that checks the `prefers-reduced-motion: reduce` media query.
 * Returns `true` when the user prefers reduced motion.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof globalThis.window === 'undefined') return false;
    return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/** Maps preset names to their corresponding CSS animation utility classes */
const ANIMATION_CLASS_MAP: Record<string, string> = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  scaleIn: 'animate-scale-in',
};

/**
 * Returns Tailwind/utility animation classes for the given preset.
 * Optionally applies a stagger tier delay class.
 * Returns empty string when reduced motion is preferred.
 */
export function getAnimationClass(
  preset: string,
  tier?: number,
  reducedMotion = false,
): string {
  if (reducedMotion) return '';

  const base = ANIMATION_CLASS_MAP[preset] ?? '';
  if (!base) return '';

  if (tier !== undefined && tier >= 1 && tier <= 5) {
    return `${base} animate-stagger-${tier}`;
  }

  return base;
}
