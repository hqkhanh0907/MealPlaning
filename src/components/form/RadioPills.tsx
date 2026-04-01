import React from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

interface PillOption {
  value: string;
  label: string;
}

interface RadioPillsProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  options: PillOption[];
  className?: string;
  testIdPrefix?: string;
}

function RadioPillsInner<T extends FieldValues>({
  name,
  control,
  options,
  className,
  testIdPrefix,
}: RadioPillsProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <fieldset
          className={[className ?? 'flex flex-wrap gap-2', 'border-0 p-0 m-0'].join(' ')}
          role="radiogroup"
          aria-label={name}
        >
          {options.map((option) => {
            const isActive = field.value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                data-testid={testIdPrefix ? `${testIdPrefix}-${option.value}` : undefined}
                onClick={() => field.onChange(option.value)}
                className={
                  isActive
                    ? 'min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm'
                    : 'min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }
              >
                {option.label}
              </button>
            );
          })}
        </fieldset>
      )}
    />
  );
}

export const RadioPills = React.memo(RadioPillsInner) as <T extends FieldValues>(
  props: RadioPillsProps<T>,
) => React.ReactElement | null;

const displayName = 'RadioPills';
(RadioPills as React.FC).displayName = displayName;
