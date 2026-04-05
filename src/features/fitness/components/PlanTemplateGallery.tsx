import { ArrowLeft, Loader2, RotateCw, Save } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { ModalBackdrop } from '@/components/shared/ModalBackdrop';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotification } from '@/contexts/NotificationContext';
import { useFitnessStore } from '@/store/fitnessStore';
import { useNavigationStore } from '@/store/navigationStore';

import { EQUIPMENT_DISPLAY } from '../constants';
import type { PlanTemplate, SplitType } from '../types';
import { computeMatchScore } from '../utils/templateMatcher';
import { TemplateMatchBadge } from './TemplateMatchBadge';

interface PlanTemplateGalleryProps {
  planId: string;
}

const SPLIT_GROUP_ORDER: SplitType[] = ['full_body', 'upper_lower', 'ppl', 'bro_split', 'custom'];

const SPLIT_GROUP_LABELS: Record<SplitType, string> = {
  full_body: 'Toàn thân',
  upper_lower: 'Trên/Dưới',
  ppl: 'Đẩy/Kéo/Chân',
  bro_split: 'Chia từng nhóm',
  custom: 'Tùy chỉnh',
};

function TemplateCard({
  template,
  matchScore,
  onApply,
}: Readonly<{
  template: PlanTemplate;
  matchScore?: number;
  onApply: (template: PlanTemplate) => void;
}>): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      data-testid={`template-card-${template.id}`}
      onClick={() => onApply(template)}
      className="bg-card focus-visible:ring-ring border-border hover:bg-accent flex w-full touch-manipulation flex-col gap-2 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">{template.name}</h3>
        {matchScore != null && <TemplateMatchBadge score={matchScore} />}
      </div>
      <p className="text-muted-foreground line-clamp-2 text-xs">{template.description}</p>
      <div className="text-foreground-secondary flex flex-wrap gap-2 text-xs">
        <span className="bg-muted rounded-full px-2 py-0.5">{SPLIT_GROUP_LABELS[template.splitType]}</span>
        <span className="bg-muted rounded-full px-2 py-0.5 tabular-nums">
          {t('fitness.templateGallery.daysPerWeek', { count: template.daysPerWeek })}
        </span>
        {template.equipmentRequired.map(eq => (
          <span key={eq} className="bg-muted rounded-full px-2 py-0.5">
            {EQUIPMENT_DISPLAY[eq] ?? eq}
          </span>
        ))}
      </div>
    </button>
  );
}

function LoadingSkeleton(): React.JSX.Element {
  return (
    <div data-testid="template-loading" className="space-y-4 px-4 py-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={`skeleton-${String(i)}`} className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function PlanTemplateGalleryInner({ planId }: Readonly<PlanTemplateGalleryProps>): React.JSX.Element {
  const { t } = useTranslation();
  const popPage = useNavigationStore(s => s.popPage);
  const notify = useNotification();

  const { getTemplates, getRecommendedTemplates, applyTemplate, saveCurrentAsTemplate, trainingProfile } =
    useFitnessStore(
      useShallow(s => ({
        getTemplates: s.getTemplates,
        getRecommendedTemplates: s.getRecommendedTemplates,
        applyTemplate: s.applyTemplate,
        saveCurrentAsTemplate: s.saveCurrentAsTemplate,
        trainingProfile: s.trainingProfile,
      })),
    );

  const [isLoading, setIsLoading] = useState(true);
  const [allTemplates, setAllTemplates] = useState<PlanTemplate[]>([]);
  const [recommendedTemplates, setRecommendedTemplates] = useState<PlanTemplate[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [applyTarget, setApplyTarget] = useState<PlanTemplate | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadTemplates = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const templates = getTemplates();
      setAllTemplates(templates);
      if (trainingProfile) {
        const recommended = getRecommendedTemplates(trainingProfile);
        setRecommendedTemplates(recommended.slice(0, 3));
      }
      setIsLoading(false);
    } catch {
      setLoadError(true);
      setIsLoading(false);
    }
  }, [getTemplates, getRecommendedTemplates, trainingProfile]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const matchScores = useMemo(() => {
    if (!trainingProfile) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const tpl of recommendedTemplates) {
      map.set(tpl.id, computeMatchScore(tpl, trainingProfile));
    }
    return map;
  }, [recommendedTemplates, trainingProfile]);

  const groupedTemplates = useMemo(() => {
    const groups = new Map<SplitType, PlanTemplate[]>();
    for (const tpl of allTemplates) {
      const existing = groups.get(tpl.splitType) ?? [];
      existing.push(tpl);
      groups.set(tpl.splitType, existing);
    }
    return groups;
  }, [allTemplates]);

  const handleBack = useCallback(() => {
    popPage();
  }, [popPage]);

  const handleApplyRequest = useCallback((template: PlanTemplate) => {
    setApplyTarget(template);
  }, []);

  const handleConfirmApply = useCallback(() => {
    if (!applyTarget) return;
    setIsApplying(true);
    try {
      applyTemplate(planId, applyTarget.id);
      popPage();
    } catch {
      setIsApplying(false);
    }
  }, [applyTarget, applyTemplate, planId, popPage]);

  const handleCancelApply = useCallback(() => {
    setApplyTarget(null);
  }, []);

  const handleOpenSaveDialog = useCallback(() => {
    setSaveName('');
    setShowSaveDialog(true);
  }, []);

  const handleConfirmSave = useCallback(() => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    try {
      saveCurrentAsTemplate(planId, saveName.trim());
      setShowSaveDialog(false);
      setSaveName('');
    } catch {
      notify.error(t('fitness.templateGallery.saveError'));
    } finally {
      setIsSaving(false);
    }
  }, [saveCurrentAsTemplate, planId, saveName, notify, t]);

  const handleCancelSave = useCallback(() => {
    setShowSaveDialog(false);
    setSaveName('');
  }, []);

  if (isLoading) {
    return (
      <div className="bg-card flex h-full flex-col">
        <div className="pt-safe bg-primary border-border flex items-center gap-2 border-b px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label={t('common.back')}
            className="text-primary-foreground active:bg-primary/80 flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg"
            data-testid="back-button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-lg font-semibold text-white">{t('fitness.templateGallery.title')}</h1>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (loadError || allTemplates.length === 0) {
    return (
      <div className="bg-card flex h-full flex-col">
        <div className="pt-safe bg-primary border-border flex items-center gap-2 border-b px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label={t('common.back')}
            className="text-primary-foreground active:bg-primary/80 flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg"
            data-testid="back-button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-lg font-semibold text-white">{t('fitness.templateGallery.title')}</h1>
        </div>
        <div
          data-testid="template-empty-state"
          className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center"
        >
          <p className="text-muted-foreground">{t('fitness.templateGallery.empty')}</p>
          <button
            type="button"
            onClick={loadTemplates}
            data-testid="retry-button"
            className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring flex min-h-[44px] touch-manipulation items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            {t('fitness.templateGallery.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card flex h-full flex-col">
      {/* Header */}
      <div className="pt-safe bg-primary border-border flex items-center gap-2 border-b px-4 py-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t('common.back')}
          className="text-primary-foreground active:bg-primary/80 flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="truncate text-lg font-semibold text-white">{t('fitness.templateGallery.title')}</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Recommended Section */}
        {recommendedTemplates.length > 0 && (
          <section data-testid="recommended-section" className="mb-6">
            <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
              {t('fitness.templateGallery.recommended')}
            </h2>
            <div className="space-y-3">
              {recommendedTemplates.map(tpl => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  matchScore={matchScores.get(tpl.id)}
                  onApply={handleApplyRequest}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Templates grouped by split type */}
        <section data-testid="all-templates-section">
          <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            {t('fitness.templateGallery.allTemplates')}
          </h2>
          {SPLIT_GROUP_ORDER.map(splitType => {
            const templates = groupedTemplates.get(splitType);
            if (!templates || templates.length === 0) return null;
            return (
              <div key={splitType} className="mb-4" data-testid={`split-group-${splitType}`}>
                <h3 className="text-muted-foreground mb-2 text-xs font-medium">{SPLIT_GROUP_LABELS[splitType]}</h3>
                <div className="space-y-3">
                  {templates.map(tpl => (
                    <TemplateCard key={tpl.id} template={tpl} onApply={handleApplyRequest} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Save Current Plan as Template */}
        <div className="border-border mt-6 border-t pt-4">
          <button
            type="button"
            data-testid="save-as-template-btn"
            onClick={handleOpenSaveDialog}
            className="focus-visible:ring-ring bg-primary-subtle text-primary-emphasis border-primary/30 hover:bg-primary/10 flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {t('fitness.templateGallery.saveCurrent')}
          </button>
        </div>
      </div>

      {/* Apply Confirmation Modal */}
      <ConfirmationModal
        isOpen={applyTarget !== null}
        variant="warning"
        title={t('fitness.templateGallery.apply')}
        message={t('fitness.templateGallery.applyConfirm')}
        confirmLabel={isApplying ? t('fitness.templateGallery.apply') : t('fitness.templateGallery.confirm')}
        cancelLabel={t('fitness.templateGallery.cancel')}
        onConfirm={handleConfirmApply}
        onCancel={handleCancelApply}
      />

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <ModalBackdrop onClose={handleCancelSave} zIndex="z-50">
          <div
            data-testid="save-template-dialog"
            className="bg-card relative w-full overflow-hidden rounded-t-2xl p-6 shadow-xl sm:mx-4 sm:max-w-sm sm:rounded-2xl"
            aria-label={t('fitness.templateGallery.saveNamePrompt')}
          >
            <h3 className="text-foreground mb-4 text-lg font-semibold">
              {t('fitness.templateGallery.saveNamePrompt')}
            </h3>
            <input
              data-testid="save-template-input"
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder={t('fitness.templateGallery.saveNamePrompt')}
              className="focus:border-primary focus:ring-ring bg-card border-border text-foreground mb-4 w-full rounded-lg border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                data-testid="save-template-cancel"
                onClick={handleCancelSave}
                className="focus-visible:ring-ring border-border text-foreground-secondary hover:bg-accent flex min-h-[44px] flex-1 touch-manipulation items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                {t('fitness.templateGallery.cancel')}
              </button>
              <button
                type="button"
                data-testid="save-template-confirm"
                onClick={handleConfirmSave}
                disabled={!saveName.trim() || isSaving}
                className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring flex min-h-[44px] flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {t('fitness.templateGallery.confirm')}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
}

export const PlanTemplateGallery = React.memo(PlanTemplateGalleryInner);
PlanTemplateGallery.displayName = 'PlanTemplateGallery';

export default PlanTemplateGallery;
