import { type KeyboardEvent, type ReactNode, useCallback, useRef } from 'react';

import { cn } from '@/lib/utils';

interface ButtonGroupOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly icon?: ReactNode;
}

interface ButtonGroupSelectorProps<T extends string> {
  readonly options: ReadonlyArray<ButtonGroupOption<T>>;
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly columns?: 2 | 3 | 4;
  readonly name: string;
}

const COLUMN_CLASSES = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
} as const;

export function ButtonGroupSelector<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
  name,
}: ButtonGroupSelectorProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = options.findIndex(opt => opt.value === value);
      let nextIndex = -1;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % options.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + options.length) % options.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = options.length - 1;
      }

      if (nextIndex >= 0) {
        onChange(options[nextIndex].value);
        const inputs = groupRef.current?.querySelectorAll<HTMLInputElement>('input[type="radio"]');
        inputs?.[nextIndex]?.focus();
      }
    },
    [options, value, onChange],
  );

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={name}
      tabIndex={-1}
      className={cn('grid gap-2', COLUMN_CLASSES[columns])}
      onKeyDown={handleKeyDown}
      data-testid={`button-group-${name}`}
    >
      {options.map(option => {
        const isSelected = option.value === value;
        const inputId = `${name}-${option.value}`;
        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={cn(
              'inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
              isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground',
            )}
            data-testid={`button-group-option-${option.value}`}
          >
            <input
              id={inputId}
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.icon && <span className="shrink-0 [&_svg]:size-[18px]">{option.icon}</span>}
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
