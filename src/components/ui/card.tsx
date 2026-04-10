import * as React from 'react';

import { cn } from '@/lib/utils';

function Card({
  className,
  size = 'default',
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm'; variant?: 'default' | 'ghost' | 'elevated' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        'group/card bg-card text-card-foreground flex min-w-0 flex-col gap-[var(--card-gap)] overflow-hidden rounded-xl py-[var(--card-padding-y)] text-sm [--card-gap:1rem] [--card-padding-x:1rem] [--card-padding-y:1rem] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-gap:0.75rem] data-[size=sm]:[--card-padding-x:0.75rem] data-[size=sm]:[--card-padding-y:0.75rem] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
        variant === 'default' && 'ring-foreground/10 ring-1',
        variant === 'ghost' && 'bg-muted/40 ring-0',
        variant === 'elevated' && 'shadow-md ring-0',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-xl px-[var(--card-padding-x)] has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-[var(--card-padding-y)]',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm leading-relaxed', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 shrink-0 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('min-w-0 px-[var(--card-padding-x)]', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'bg-muted/50 mt-auto flex items-center gap-3 rounded-b-xl border-t px-[var(--card-padding-x)] py-[var(--card-padding-y)]',
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
