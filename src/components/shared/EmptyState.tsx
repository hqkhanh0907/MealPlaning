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
    <div
      className={`bg-card rounded-2xl border border-dashed border-slate-200 p-8 text-center sm:p-12 dark:border-slate-700 ${className}`}
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-700 dark:text-slate-200">
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
          className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" /> {actionLabel}
        </button>
      )}
    </div>
  );
};
