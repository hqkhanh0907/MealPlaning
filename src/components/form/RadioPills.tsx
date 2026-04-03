import React from 'react';
import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';

interface PillOption {
  value: string | number;
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
        <fieldset className={[className ?? 'flex flex-wrap gap-2', 'm-0 border-0 p-0'].join(' ')} aria-label={name}>
          {options.map(option => {
            const isActive = field.value === option.value;

            return (
              <label
                key={option.value}
                data-testid={testIdPrefix ? `${testIdPrefix}-${option.value}` : undefined}
                className={
                  isActive
                    ? 'bg-primary text-primary-foreground has-[:focus-visible]:ring-ring dark:bg-primary flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none'
                    : 'has-[:focus-visible]:ring-ring bg-muted text-foreground-secondary hover:bg-accent flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none'
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
