import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { cn } from '@/lib/utils';

function Switch({
  className,
  size = 'default',
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: 'sm' | 'default';
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:before:bg-primary data-unchecked:before:bg-input dark:data-unchecked:before:bg-input/80 relative inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full border border-transparent transition-[colors,box-shadow,opacity] duration-100 ease-out outline-none before:absolute before:rounded-full before:transition-colors before:duration-100 before:ease-out before:content-[''] focus-visible:ring-3 aria-invalid:ring-3 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:saturate-50 data-[size=default]:before:h-5 data-[size=default]:before:w-9 data-[size=sm]:before:h-4 data-[size=sm]:before:w-7 motion-reduce:transition-none motion-reduce:before:transition-none",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-background dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground pointer-events-none absolute top-1/2 left-1/2 block -translate-y-1/2 rounded-full ring-0 transition-transform duration-100 ease-out group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[10px] group-data-[size=sm]/switch:data-checked:translate-x-[8px] group-data-[size=default]/switch:data-unchecked:-translate-x-[10px] group-data-[size=sm]/switch:data-unchecked:-translate-x-[8px] motion-reduce:transition-none"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
