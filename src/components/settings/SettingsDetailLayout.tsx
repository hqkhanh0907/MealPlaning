import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Pencil } from 'lucide-react';

interface SettingsDetailLayoutProps {
  title: string;
  icon: React.ReactNode;
  isEditing: boolean;
  hasChanges: boolean;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

export function SettingsDetailLayout({
  title,
  icon,
  isEditing,
  hasChanges,
  onBack,
  onEdit,
  onSave,
  onCancel,
  children,
}: Readonly<SettingsDetailLayoutProps>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-full" data-testid="settings-detail-layout">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            data-testid="settings-detail-back"
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={t('settings.back')}
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isEditing ? `${t('settings.edit')} ${title}` : title}
            </h3>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={onEdit}
            data-testid="settings-detail-edit"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t('settings.edit')}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>

      {/* Sticky Save/Cancel Footer — only in edit mode */}
      {isEditing && (
        <div
          className="sticky bottom-0 left-0 right-0 mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700"
          data-testid="settings-detail-footer"
        >
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              data-testid="settings-detail-cancel"
              className="flex-1 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {t('settings.cancel')}
            </button>
            <button
              type="button"
              onClick={onSave}
              data-testid="settings-detail-save"
              disabled={!hasChanges}
              className={`flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all ${
                hasChanges
                  ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98]'
                  : 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed'
              }`}
            >
              {t('healthProfile.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
