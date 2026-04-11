import React, { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MacroBarProps {
  readonly label: string;
  readonly current: number;
  readonly target: number;
  readonly colorClass: string;
  readonly testId: string;
}

function safeRound(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function safePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function MacroBarInner({ label, current, target, colorClass, testId }: MacroBarProps) {
  const reducedMotion = useReducedMotion();
  const mountedRef = useRef(false);
  const [animated, setAnimated] = useState(false);

  const displayCurrent = safeRound(current);
  const displayTarget = safePositive(target);
  const safeTarget = displayTarget > 0 ? displayTarget : 1;
  const pct =
    displayCurrent === null
      ? 0
      : Math.min(100, Math.max(0, Math.round((Math.max(0, displayCurrent) / safeTarget) * 100)));

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    if (!reducedMotion) {
      requestAnimationFrame(() => setAnimated(true));
    }
  }, [reducedMotion]);

  const showAnimation = animated && !reducedMotion;

  const barStyle: React.CSSProperties = {
    width: showAnimation ? `${pct}%` : '0%',
    transitionProperty: 'width',
    transitionDuration: reducedMotion ? '0ms' : '600ms',
    transitionTimingFunction: 'var(--ease-enter)',
  };

  if (reducedMotion) {
    barStyle.width = `${pct}%`;
  }

  const currentText =
    displayCurrent === null ? `—/${Math.round(displayTarget)}g` : `${displayCurrent}/${Math.round(displayTarget)}g`;

  return (
    <div className="flex-1 space-y-1" data-testid={testId}>
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-[10px] font-medium">{label}</span>
        <span className="text-foreground text-xs font-semibold tabular-nums">{currentText}</span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className={`h-full rounded-full ${colorClass}`} style={barStyle} data-testid={`${testId}-fill`} />
      </div>
    </div>
  );
}

const MacroBar = React.memo(MacroBarInner);
MacroBar.displayName = 'MacroBar';

export { MacroBar };
export type { MacroBarProps };
