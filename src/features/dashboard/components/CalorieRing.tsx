import React, { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';

interface CalorieRingProps {
  readonly eaten: number;
  readonly target: number;
  readonly size?: number;
  readonly className?: string;
}

const DEFAULT_SIZE = 120;
const STROKE_WIDTH = 7;

function safeNum(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function CalorieRingInner({ eaten, target, size = DEFAULT_SIZE, className }: CalorieRingProps) {
  const reducedMotion = useReducedMotion();
  const mountedRef = useRef(false);
  const [animated, setAnimated] = useState(false);

  const safeEaten = safeNum(eaten);
  const safeTarget = safeNum(target);

  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const denominator = safeTarget > 0 ? safeTarget : 1;
  const pct = Math.min(100, Math.max(0, (Math.max(0, safeEaten) / denominator) * 100));
  const offset = circumference - (pct / 100) * circumference;

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    if (!reducedMotion) {
      requestAnimationFrame(() => setAnimated(true));
    }
  }, [reducedMotion]);

  const showAnimation = animated && !reducedMotion;

  const circleStyle: React.CSSProperties = {
    strokeDasharray: circumference,
    strokeDashoffset: showAnimation ? offset : circumference,
    transitionProperty: 'stroke-dashoffset',
    transitionDuration: reducedMotion ? '0ms' : '800ms',
    transitionTimingFunction: 'var(--ease-spring)',
  };

  if (reducedMotion) {
    circleStyle.strokeDashoffset = offset;
  }

  const half = size / 2;
  const displayEaten = Math.round(safeEaten);
  const displayTarget = Math.round(safeTarget);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${className ?? ''}`}
      style={{ width: size, height: size }}
      data-testid="calorie-ring"
      aria-label={`${displayEaten} / ${displayTarget} kcal`}
    >
      <svg width={size} height={size} className="absolute -rotate-90" aria-hidden="true">
        <circle
          cx={half}
          cy={half}
          r={radius}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          cx={half}
          cy={half}
          r={radius}
          fill="none"
          stroke="var(--color-macro-protein)"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={circleStyle}
          data-testid="calorie-ring-fill"
        />
      </svg>
      <div className="flex flex-col items-center justify-center">
        <span className="text-foreground text-lg font-bold tabular-nums">
          {displayEaten} / {displayTarget}
        </span>
        <span className="text-muted-foreground -mt-0.5 text-[10px]">kcal</span>
      </div>
    </div>
  );
}

const CalorieRing = React.memo(CalorieRingInner);
CalorieRing.displayName = 'CalorieRing';

export { CalorieRing };
export type { CalorieRingProps };
