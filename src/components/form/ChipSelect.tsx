import React, { useCallback } from 'react';
import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';

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
}: Readonly<ChipSelectProps<T>>) {
  const toggleValue = useCallback(
    (current: string[], value: string): string[] => {
      const isSelected = current.includes(value);

      if (isSelected) {
        if (minItems !== undefined && current.length <= minItems) return current;
        return current.filter(v => v !== value);
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
          <fieldset className={[className ?? 'flex flex-wrap gap-2', 'm-0 border-0 p-0'].join(' ')} aria-label={name}>
            {options.map(option => {
              const isActive = selected.includes(option.value);

              return (
                <label
                  key={option.value}
                  aria-checked={isActive}
                  data-testid={testIdPrefix ? `${testIdPrefix}-${option.value}` : undefined}
                  className={
                    isActive
                      ? 'bg-primary text-primary-foreground has-[:focus-visible]:ring-ring dark:bg-primary min-h-[44px] min-w-[44px] cursor-pointer rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none'
                      : 'has-[:focus-visible]:ring-ring min-h-[44px] min-w-[44px] cursor-pointer rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isActive}
                    aria-checked={isActive}
                    onChange={() => field.onChange(toggleValue(selected, option.value))}
                  />
                  {option.label}
                </label>
              );
            })}
          </fieldset>
        );
      }}
    />
  );
}

export const ChipSelect = React.memo(ChipSelectInner) as <T extends FieldValues>(
  props: ChipSelectProps<T>,
) => React.ReactElement | null;

const displayName = 'ChipSelect';
(ChipSelect as unknown as { displayName: string }).displayName = displayName;
