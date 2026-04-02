import { ChevronLeft, Pencil } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
    <div className="flex min-h-full flex-col" data-testid="settings-detail-layout">
      {/* Header */}
      <div className="border-border mb-6 flex items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            data-testid="settings-detail-back"
            className="hover:bg-accent flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
            aria-label={t('settings.back')}
          >
            <ChevronLeft className="text-foreground-secondary h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="text-foreground text-lg font-bold">
              {isEditing ? `${t('settings.edit')} ${title}` : title}
            </h3>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={onEdit}
            data-testid="settings-detail-edit"
            className="focus-visible:ring-ring bg-primary-subtle text-primary hover:bg-primary/10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('settings.edit')}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>

      {/* Sticky Save/Cancel Footer — only in edit mode */}
      {isEditing && (
        <div
          className="bg-card/95 border-border sticky right-0 bottom-0 left-0 -mx-4 mt-6 border-t px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6"
          data-testid="settings-detail-footer"
        >
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              data-testid="settings-detail-cancel"
              className="bg-muted text-foreground hover:bg-accent flex-1 rounded-xl py-3 text-sm font-medium transition-colors"
            >
              {t('settings.cancel')}
            </button>
            <button
              type="button"
              onClick={onSave}
              data-testid="settings-detail-save"
              disabled={!hasChanges}
              className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all ${
                hasChanges
                  ? 'bg-primary hover:bg-primary active:scale-[0.98]'
                  : 'cursor-not-allowed bg-slate-300 dark:bg-slate-600'
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
