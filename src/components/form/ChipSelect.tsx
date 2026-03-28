import React, { useCallback } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

interface ChipOption {
  value: string;
  label: string;
}

interface ChipSelectProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  options: ChipOption[];
  maxItems?: number;
  minItems?: number;
  className?: string;
  testIdPrefix?: string;
}

function ChipSelectInner<T extends FieldValues>({
  name,
  control,
  options,
  maxItems,
  minItems,
  className,
  testIdPrefix,
}: ChipSelectProps<T>) {
  const toggleValue = useCallback(
    (current: string[], value: string): string[] => {
      const isSelected = current.includes(value);

      if (isSelected) {
        if (minItems !== undefined && current.length <= minItems) return current;
        return current.filter((v) => v !== value);
      }

      if (maxItems !== undefined && current.length >= maxItems) return current;
      return [...current, value];
    },
    [maxItems, minItems],
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selected: string[] = Array.isArray(field.value) ? (field.value as string[]) : [];

        return (
          <div
            className={className ?? 'flex flex-wrap gap-2'}
            role="group"
            aria-label={name}
          >
            {options.map((option) => {
              const isActive = selected.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  role="checkbox"
                  aria-checked={isActive}
                  data-testid={testIdPrefix ? `${testIdPrefix}-${option.value}` : undefined}
                  onClick={() => field.onChange(toggleValue(selected, option.value))}
                  className={
                    isActive
                      ? 'min-h-[44px] min-w-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm'
                      : 'min-h-[44px] min-w-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        );
      }}
    />
  );
}

export const ChipSelect = React.memo(ChipSelectInner) as <T extends FieldValues>(
  props: ChipSelectProps<T>,
) => React.ReactElement | null;

const displayName = 'ChipSelect';
(ChipSelect as React.FC).displayName = displayName;
