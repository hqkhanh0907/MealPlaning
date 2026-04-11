import React from 'react';

const NutritionDetailsSkeleton = React.memo(function NutritionDetailsSkeleton() {
  return (
    <div aria-hidden="true" className="bg-card animate-pulse rounded-2xl border p-6" style={{ minHeight: 56 }}>
      <div className="bg-muted h-5 w-40 rounded" />
    </div>
  );
});

export { NutritionDetailsSkeleton };
