import React from 'react';

const NutritionOverviewSkeleton = React.memo(function NutritionOverviewSkeleton() {
  return (
    <div aria-hidden="true" className="bg-card animate-pulse rounded-2xl border p-6" style={{ minHeight: 200 }}>
      <div className="flex items-start gap-4">
        <div className="flex flex-1 flex-col gap-4">
          {/* Progress bar row 1 */}
          <div className="flex flex-col gap-1">
            <div className="bg-muted h-4 w-24 rounded" />
            <div className="bg-muted h-2 w-full rounded-full" />
          </div>
          {/* Progress bar row 2 */}
          <div className="flex flex-col gap-1">
            <div className="bg-muted h-4 w-24 rounded" />
            <div className="bg-muted h-2 w-full rounded-full" />
          </div>
        </div>
        {/* Donut placeholder */}
        <div className="bg-muted h-12 w-12 rounded-full" />
      </div>
    </div>
  );
});

export { NutritionOverviewSkeleton };
