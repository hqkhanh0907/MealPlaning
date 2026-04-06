import React, { useCallback, useState } from 'react';
import { type Control, type FieldValues, type Path, useController } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { blockNegativeKeys } from '@/utils/numericInputHandlers';

import { parseNumericInput } from '../../features/fitness/utils/parseNumericInput';

interface StringNumberControllerProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  inputMode?: 'numeric' | 'decimal';
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  label?: string;
  testId?: string;
  ariaLabel?: string;
  disabled?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
}

function StringNumberControllerInner<T extends FieldValues>({
  name,
  control,
  inputMode = 'decimal',
  placeholder,
  min,
  max,
  step,
  className,
  label,
  testId,
  ariaLabel,
  disabled,
  'aria-required': ariaRequired,
  'aria-invalid': ariaInvalid,
  ref,
}: StringNumberControllerProps<T> & { ref?: React.Ref<HTMLInputElement> }) {
  const { field } = useController({ name, control });
  const [localValue, setLocalValue] = useState(() => (field.value === 0 ? '0' : String(field.value ?? '')));
  const [prevFieldValue, setPrevFieldValue] = useState<number>(field.value as number);

  const clampValue = useCallback(
    (num: number): number => {
      let clamped = num;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      return clamped;
    },
    [min, max],
  );

  /*
   * Render-time sync: when field.value changes externally (reset, setValue),
   * update local string state. React-recommended "adjusting state from props"
   * pattern using setState during render (replaces getDerivedStateFromProps).
   */
  const fieldNum = field.value as number;
  const bothNaN = Number.isNaN(fieldNum) && Number.isNaN(prevFieldValue);
  if (fieldNum !== prevFieldValue && !bothNaN) {
    if (!Number.isNaN(fieldNum)) {
      setPrevFieldValue(fieldNum);
      const parsed = parseNumericInput(localValue, Number.NaN);
      if (Number.isNaN(parsed) || parsed !== fieldNum) {
        setLocalValue(fieldNum === 0 ? '0' : String(fieldNum ?? ''));
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);

    if (raw === '-') return;

    if (raw === '') {
      const nanVal = Number.NaN as unknown as typeof field.value;
      field.onChange(nanVal);
      return;
    }

    const parsed = parseNumericInput(raw, Number.NaN);
    if (!Number.isNaN(parsed)) {
      const clamped = clampValue(parsed);
      setPrevFieldValue(clamped);
      field.onChange(clamped);
    }
  };

  const handleBlur = () => {
    if (localValue === '' || Number.isNaN(parseNumericInput(localValue, Number.NaN))) {
      // Allow empty — don't revert to previous value.
      // RHF field already holds NaN from handleChange; just fire onBlur.
    } else {
      const clamped = clampValue(parseNumericInput(localValue));
      setPrevFieldValue(clamped);
      field.onChange(clamped);
      setLocalValue(String(clamped));
    }
    field.onBlur();
  };

  return (
    <>
      {label && (
        <label htmlFor={testId ?? name} className="text-foreground mb-1 block text-sm font-medium">
          {label}
        </label>
      )}
      <Input
        ref={ref}
        id={testId ?? name}
        data-testid={testId}
        type="text"
        inputMode={inputMode}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={blockNegativeKeys}
        placeholder={placeholder}
        step={step}
        min={min}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        aria-required={ariaRequired}
        aria-invalid={ariaInvalid}
        className={className ?? 'text-foreground min-h-[44px] w-full'}
      />
    </>
  );
}

export const StringNumberController = React.memo(StringNumberControllerInner) as <T extends FieldValues>(
  props: StringNumberControllerProps<T> & { ref?: React.Ref<HTMLInputElement> },
) => React.ReactElement | null;

const displayName = 'StringNumberController';
(StringNumberController as unknown as { displayName: string }).displayName = displayName;
