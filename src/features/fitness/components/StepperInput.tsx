import { AlertTriangle, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface StepperInputProps {
  value: number;
  onChange: (value: number) => void;
  step: number;
  min?: number;
  max?: number;
  warningThreshold?: number;
  unit?: string;
  label?: string;
  compact?: boolean;
  disabled?: boolean;
  testId?: string;
}

const HOLD_DELAY = 500;
const RAPID_INTERVAL = 150;

function roundToStep(value: number, step: number): number {
  const p = Math.pow(10, Math.max(0, -Math.floor(Math.log10(step))));
  return Math.round(value * p) / p;
}

export function StepperInput({
  value,
  onChange,
  step,
  min = 0,
  max,
  warningThreshold,
  unit,
  label,
  compact = false,
  disabled = false,
  testId = 'stepper',
}: Readonly<StepperInputProps>) {
  const { t } = useTranslation();
  const [localInput, setLocalInput] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestRef = useRef(value);
  useEffect(() => {
    latestRef.current = value;
  });

  const clamp = (v: number): number => {
    const lo = Math.max(v, min);
    return max === undefined ? lo : Math.min(lo, max);
  };

  const stopHold = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const tick = (dir: 1 | -1) => {
    const clamped = clamp(roundToStep(latestRef.current + step * dir, step));
    if (clamped === latestRef.current) {
      stopHold();
      return;
    }
    latestRef.current = clamped;
    onChange(clamped);
  };

  const startHold = (dir: 1 | -1) => {
    if (disabled) return;
    tick(dir);
    timeoutRef.current = setTimeout(() => {
      tick(dir);
      intervalRef.current = setInterval(() => tick(dir), RAPID_INTERVAL);
    }, HOLD_DELAY);
  };

  const handleBlur = () => {
    if (localInput === null) return;
    const trimmed = localInput.trim();
    const parsed = Number(trimmed);
    if (trimmed === '' || Number.isNaN(parsed)) {
      setLocalInput(null);
      return;
    }
    onChange(clamp(roundToStep(parsed, step)));
    setLocalInput(null);
  };

  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;
  const showWarning = warningThreshold !== undefined && value > warningThreshold;
  const sz = compact
    ? { btn: 'min-h-11 min-w-11', input: 'h-11 w-16 text-base', icon: 'h-4 w-4' }
    : { btn: 'min-h-12 min-w-12', input: 'h-12 w-20 text-lg', icon: 'h-5 w-5' };
  const btnCls = `flex ${sz.btn} items-center justify-center rounded-xl border border-border bg-card transition-[colors,transform] active:scale-[0.95] motion-reduce:transform-none disabled:opacity-50 disabled:active:scale-100`;
  const inputCls = `${sz.input} rounded-lg border-none bg-muted text-center font-semibold text-foreground tabular-nums outline-none focus:ring-2 focus:ring-ring`;
  const decLabel = label ? t('fitness.plan.decreaseField', { label }) : t('common.decrease');
  const incLabel = label ? t('fitness.plan.increaseField', { label }) : t('common.increase');

  return (
    <div data-testid={testId}>
      <fieldset className="m-0 flex items-center gap-2 border-none p-0" aria-label={label}>
        <button
          type="button"
          data-testid={`${testId}-decrement`}
          className={`${btnCls} text-foreground-secondary active:bg-muted`}
          disabled={disabled || atMin}
          aria-label={decLabel}
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
        >
          <Minus className={sz.icon} />
        </button>
        <input
          type="text"
          inputMode={Number.isInteger(step) ? 'numeric' : 'decimal'}
          data-testid={`${testId}-input`}
          className={inputCls}
          value={localInput ?? String(value)}
          disabled={disabled}
          aria-label={label}
          onChange={e => setLocalInput(e.target.value)}
          onBlur={handleBlur}
        />
        <button
          type="button"
          data-testid={`${testId}-increment`}
          className={`${btnCls} active:bg-primary/10 active:text-primary`}
          disabled={disabled || atMax}
          aria-label={incLabel}
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
        >
          <Plus className={sz.icon} />
        </button>
        {unit && (
          <span data-testid={`${testId}-unit`} className="text-muted-foreground text-sm font-medium">
            {unit}
          </span>
        )}
      </fieldset>
      {showWarning && (
        <p data-testid={`${testId}-warning`} className="text-warning mt-1 flex items-center gap-1 text-xs" role="alert">
          <AlertTriangle className="h-3 w-3" /> {t('fitness.stepper.warningHigh')}
        </p>
      )}
    </div>
  );
}
