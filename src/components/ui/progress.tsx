import { Progress as ProgressPrimitive } from '@base-ui/react/progress';

import { cn } from '@/lib/utils';

function Progress({ className, children, value, ...props }: Readonly<ProgressPrimitive.Root.Props>) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn('flex flex-wrap items-center gap-3', className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

function ProgressTrack({ className, ...props }: Readonly<ProgressPrimitive.Track.Props>) {
  return (
    <ProgressPrimitive.Track
      className={cn('bg-muted relative flex h-2 w-full items-center overflow-hidden rounded-full', className)}
      data-slot="progress-track"
      {...props}
    />
  );
}

function ProgressIndicator({ className, ...props }: Readonly<ProgressPrimitive.Indicator.Props>) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        'bg-primary h-full rounded-full transition-[width,transform] motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  );
}

function ProgressLabel({ className, ...props }: Readonly<ProgressPrimitive.Label.Props>) {
  return (
    <ProgressPrimitive.Label
      className={cn('text-sm leading-none font-medium', className)}
      data-slot="progress-label"
      {...props}
    />
  );
}

function ProgressValue({ className, ...props }: Readonly<ProgressPrimitive.Value.Props>) {
  return (
    <ProgressPrimitive.Value
      className={cn('text-muted-foreground inline-flex items-center text-sm leading-none tabular-nums', className)}
      data-slot="progress-value"
      {...props}
    />
  );
}

export { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue };
