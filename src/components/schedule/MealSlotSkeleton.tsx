import React from 'react';

const MealSlotSkeleton = React.memo(function MealSlotSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="border-muted bg-card animate-pulse rounded-xl border border-l-[3px] p-4"
      style={{ minHeight: 120 }}
    >
      <div className="flex flex-col gap-2">
        <div className="bg-muted h-4 w-28 rounded" />
        <div className="bg-muted h-3 w-20 rounded" />
      </div>
    </div>
  );
});

export { MealSlotSkeleton };
