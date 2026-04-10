import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn('bg-muted pointer-events-none shrink-0 animate-pulse rounded-md select-none', className)}
      {...props}
    />
  );
}

export { Skeleton };
