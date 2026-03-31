import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, RotateCw, Save } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useNavigationStore } from '@/store/navigationStore';
import { useFitnessStore } from '@/store/fitnessStore';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { TemplateMatchBadge } from './TemplateMatchBadge';
import { computeMatchScore } from '../utils/templateMatcher';
import { EQUIPMENT_DISPLAY } from '../constants';
import type { PlanTemplate, SplitType } from '../types';

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
}: {
  template: PlanTemplate;
  matchScore?: number;
  onApply: (template: PlanTemplate) => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      data-testid={`template-card-${template.id}`}
      onClick={() => onApply(template)}
      className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750"
      style={{ touchAction: 'manipulation' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {template.name}
        </h3>
        {matchScore != null && <TemplateMatchBadge score={matchScore} />}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
        {template.description}
      </p>
      <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
          {SPLIT_GROUP_LABELS[template.splitType]}
        </span>
        <span
          className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {t('fitness.templateGallery.daysPerWeek', { count: template.daysPerWeek })}
        </span>
        {template.equipmentRequired.map((eq) => (
          <span
            key={eq}
            className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700"
          >
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

function PlanTemplateGalleryInner({ planId }: PlanTemplateGalleryProps): React.JSX.Element {
  const { t } = useTranslation();
  const popPage = useNavigationStore((s) => s.popPage);

  const { getTemplates, getRecommendedTemplates, applyTemplate, saveCurrentAsTemplate, trainingProfile } =
    useFitnessStore(
      useShallow((s) => ({
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
      // stay in dialog
    } finally {
      setIsSaving(false);
    }
  }, [saveCurrentAsTemplate, planId, saveName]);

  const handleCancelSave = useCallback(() => {
    setShowSaveDialog(false);
    setSaveName('');
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-600 px-4 py-3 pt-safe dark:border-slate-700">
          <button
            type="button"
            onClick={handleBack}
            aria-label={t('common.back')}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-white active:bg-emerald-700"
            style={{ touchAction: 'manipulation' }}
            data-testid="back-button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-lg font-semibold text-white">
            {t('fitness.templateGallery.title')}
          </h1>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (loadError || allTemplates.length === 0) {
    return (
      <div className="flex h-full flex-col bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-600 px-4 py-3 pt-safe dark:border-slate-700">
          <button
            type="button"
            onClick={handleBack}
            aria-label={t('common.back')}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-white active:bg-emerald-700"
            style={{ touchAction: 'manipulation' }}
            data-testid="back-button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-lg font-semibold text-white">
            {t('fitness.templateGallery.title')}
          </h1>
        </div>
        <div
          data-testid="template-empty-state"
          className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center"
        >
          <p className="text-slate-500 dark:text-slate-400">
            {t('fitness.templateGallery.empty')}
          </p>
          <button
            type="button"
            onClick={loadTemplates}
            data-testid="retry-button"
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            style={{ touchAction: 'manipulation' }}
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            {t('fitness.templateGallery.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-600 px-4 py-3 pt-safe dark:border-slate-700">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t('common.back')}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white active:bg-emerald-700"
          style={{ touchAction: 'manipulation' }}
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="truncate text-lg font-semibold text-white">
          {t('fitness.templateGallery.title')}
        </h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Recommended Section */}
        {recommendedTemplates.length > 0 && (
          <section data-testid="recommended-section" className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('fitness.templateGallery.recommended')}
            </h2>
            <div className="space-y-3">
              {recommendedTemplates.map((tpl) => (
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('fitness.templateGallery.allTemplates')}
          </h2>
          {SPLIT_GROUP_ORDER.map((splitType) => {
            const templates = groupedTemplates.get(splitType);
            if (!templates || templates.length === 0) return null;
            return (
              <div key={splitType} className="mb-4" data-testid={`split-group-${splitType}`}>
                <h3 className="mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                  {SPLIT_GROUP_LABELS[splitType]}
                </h3>
                <div className="space-y-3">
                  {templates.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      onApply={handleApplyRequest}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Save Current Plan as Template */}
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button
            type="button"
            data-testid="save-as-template-btn"
            onClick={handleOpenSaveDialog}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
            style={{ touchAction: 'manipulation' }}
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
        confirmLabel={
          isApplying
            ? t('fitness.templateGallery.apply')
            : t('fitness.templateGallery.confirm')
        }
        cancelLabel={t('fitness.templateGallery.cancel')}
        onConfirm={handleConfirmApply}
        onCancel={handleCancelApply}
      />

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div
          data-testid="save-template-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('fitness.templateGallery.saveNamePrompt')}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
              {t('fitness.templateGallery.saveNamePrompt')}
            </h3>
            <input
              data-testid="save-template-input"
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={t('fitness.templateGallery.saveNamePrompt')}
              className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                data-testid="save-template-cancel"
                onClick={handleCancelSave}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                style={{ touchAction: 'manipulation' }}
              >
                {t('fitness.templateGallery.cancel')}
              </button>
              <button
                type="button"
                data-testid="save-template-confirm"
                onClick={handleConfirmSave}
                disabled={!saveName.trim() || isSaving}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none disabled:opacity-60"
                style={{ touchAction: 'manipulation' }}
              >
                {isSaving && (
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                )}
                {t('fitness.templateGallery.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const PlanTemplateGallery = React.memo(PlanTemplateGalleryInner);
PlanTemplateGallery.displayName = 'PlanTemplateGallery';

export default PlanTemplateGallery;
