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
}: Readonly<RadioPillsProps<T>>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <fieldset
          className={[className ?? 'flex flex-wrap gap-2', 'border-0 p-0 m-0'].join(' ')}
          aria-label={name}
        >
          {options.map((option) => {
            const isActive = field.value === option.value;

            return (
              <label
                key={option.value}
                aria-checked={isActive}
                data-testid={testIdPrefix ? `${testIdPrefix}-${option.value}` : undefined}
                className={
                  isActive
                    ? 'cursor-pointer min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2'
                    : 'cursor-pointer min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2'
                }
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={isActive}
                  aria-checked={isActive}
                  onChange={() => field.onChange(option.value)}
                  name={name}
                />
                {option.label}
              </label>
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
(RadioPills as unknown as { displayName: string }).displayName = displayName;
