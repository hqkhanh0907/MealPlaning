'use client';

import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';

import { cn } from '@/lib/utils';

function RadioGroup({ className, ...props }: Readonly<RadioGroupPrimitive.Props>) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn('grid w-full gap-2', className)} {...props} />;
}

function RadioGroupItem({ className, ...props }: Readonly<RadioPrimitive.Root.Props>) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "group/radio-group-item peer border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:text-primary-foreground dark:data-checked:bg-primary before:bg-background data-checked:border-primary data-checked:before:bg-primary dark:before:bg-input/30 relative inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full border transition-[colors,box-shadow,opacity,border-color] duration-100 ease-out outline-none before:absolute before:size-4 before:rounded-full before:transition-[colors,border-color] before:duration-100 before:ease-out before:content-[''] focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-50 aria-invalid:ring-3 motion-reduce:transition-none motion-reduce:before:transition-none",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex size-4 items-center justify-center"
      >
        <span className="bg-primary-foreground absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
