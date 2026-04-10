import * as React from 'react';

import { cn } from '@/lib/utils';

function Label({ className, htmlFor, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      htmlFor={htmlFor}
      data-slot="label"
      className={cn(
        'flex min-h-11 max-w-full items-start gap-2 py-1 text-sm leading-snug font-medium break-words whitespace-normal select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
