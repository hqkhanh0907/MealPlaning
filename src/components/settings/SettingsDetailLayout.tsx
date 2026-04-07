import { ChevronLeft, Loader2, Pencil } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { DisabledReason } from '@/components/shared/DisabledReason';

interface SectionTab {
  id: string;
  label: string;
}

interface SettingsDetailLayoutProps {
  title: string;
  icon: React.ReactNode;
  isEditing: boolean;
  hasChanges: boolean;
  isSaving?: boolean;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  sections?: SectionTab[];
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
  isSaving = false,
  activeSection,
  onSectionChange,
  sections,
  onBack,
  onEdit,
  onSave,
  onCancel,
  children,
}: Readonly<SettingsDetailLayoutProps>) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-full flex-col" data-testid="settings-detail-layout">
      {/* Section Quick-Jump Tabs */}
      {sections && sections.length > 0 && !isEditing && (
        <div className="border-border mb-4 flex gap-1 border-b pb-3" data-testid="settings-section-tabs" role="tablist">
          {sections.map(section => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeSection === section.id}
              data-testid={`section-tab-${section.id}`}
              onClick={() => onSectionChange?.(section.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}

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
            <h3 className="text-foreground text-xl font-semibold">
              {isEditing ? `${t('settings.edit')} ${title}` : title}
            </h3>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={onEdit}
            data-testid="settings-detail-edit"
            className="focus-visible:ring-ring bg-primary-subtle text-primary hover:bg-primary/10 flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('settings.edit')}
          </button>
        )}
      </div>

      {/* Content */}
      <div className={isEditing ? 'flex-1 pb-24' : 'flex-1'}>{children}</div>

      {/* Fixed Save/Cancel Footer — only in edit mode */}
      {isEditing && (
        <div
          className="bg-card/95 border-border fixed inset-x-0 bottom-0 z-40 border-t px-4 py-4 backdrop-blur-sm"
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
              disabled={!hasChanges || isSaving}
              aria-describedby={hasChanges ? undefined : 'settings-save-disabled-reason'}
              className={`text-primary-foreground flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                hasChanges && !isSaving
                  ? 'bg-primary hover:bg-primary active:scale-[0.98]'
                  : 'bg-muted-foreground/30 cursor-not-allowed'
              }`}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSaving ? t('settings.saving') : t('healthProfile.save')}
            </button>
          </div>
          <DisabledReason
            id="settings-save-disabled-reason"
            reason={t('disabledReason.noChanges')}
            show={!hasChanges}
            className="text-center"
          />
        </div>
      )}
    </div>
  );
}
