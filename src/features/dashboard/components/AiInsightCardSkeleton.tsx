import { Skeleton } from '@/components/ui/skeleton';

import { useMinimumDelay } from '../../../hooks/useMinimumDelay';

interface AiInsightCardSkeletonProps {
  readonly isLoading: boolean;
  readonly minDelay?: number;
}

export function AiInsightCardSkeleton({ isLoading, minDelay = 200 }: AiInsightCardSkeletonProps) {
  const showSkeleton = useMinimumDelay(isLoading, minDelay);

  if (!showSkeleton) return null;

  return (
    <div
      className="bg-card border-border-subtle flex min-h-14 items-center gap-3 rounded-2xl border p-3 shadow-md"
      aria-busy="true"
      aria-label="Loading AI insight"
      data-testid="ai-insight-card-skeleton"
    >
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}
