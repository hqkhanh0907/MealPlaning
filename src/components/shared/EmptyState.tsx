import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ReactNode;
  searchQuery: string;
  entityName: string;         // e.g. "món ăn", "nguyên liệu"
  actionLabel?: string;       // e.g. "Tạo món ăn", "Thêm nguyên liệu"
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, searchQuery, entityName, actionLabel, onAction, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 sm:p-12 text-center ${className}`}>
    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
      {searchQuery ? `Không tìm thấy ${entityName}` : `Chưa có ${entityName} nào`}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
      {searchQuery ? 'Thử tìm kiếm với từ khóa khác.' : `Bắt đầu tạo ${entityName} đầu tiên của bạn!`}
    </p>
    {!searchQuery && actionLabel && onAction && (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200"
      >
        <Plus className="w-5 h-5" /> {actionLabel}
      </button>
    )}
  </div>
);

