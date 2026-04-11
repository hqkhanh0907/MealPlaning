import { Skeleton } from '@/components/ui/skeleton';

import { useMinimumDelay } from '../../../hooks/useMinimumDelay';

interface TodaysPlanCardSkeletonProps {
  readonly isLoading: boolean;
  readonly minDelay?: number;
}

export function TodaysPlanCardSkeleton({ isLoading, minDelay = 200 }: TodaysPlanCardSkeletonProps) {
  const showSkeleton = useMinimumDelay(isLoading, minDelay);

  if (!showSkeleton) return null;

  return (
    <div
      className="bg-card border-border-subtle space-y-3 rounded-2xl border p-3 shadow-md"
      aria-busy="true"
      aria-label="Loading today's plan"
      data-testid="todays-plan-card-skeleton"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>

      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}
