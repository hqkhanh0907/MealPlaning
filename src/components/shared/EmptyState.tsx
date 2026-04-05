import { Plus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon: React.ReactNode;
  searchQuery: string;
  entityName: string; // e.g. "món ăn", "nguyên liệu"
  actionLabel?: string; // e.g. "Tạo món ăn", "Thêm nguyên liệu"
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  icon,
  searchQuery,
  entityName,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) => {
  const { t } = useTranslation();
  return (
    <div className={`bg-card border-border rounded-2xl border border-dashed p-8 text-center sm:p-12 ${className}`}>
      <div className="bg-primary-subtle mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        {icon}
      </div>
      <h3 className="text-foreground mb-2 text-lg font-semibold">
        {searchQuery
          ? t('emptyState.notFound', { entity: entityName })
          : t('emptyState.noItems', { entity: entityName })}
      </h3>
      <p className="text-muted-foreground mb-4 text-sm">
        {searchQuery ? t('emptyState.searchHint') : t('emptyState.createHint', { entity: entityName })}
      </p>
      {!searchQuery && actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" aria-hidden="true" /> {actionLabel}
        </button>
      )}
    </div>
  );
};
