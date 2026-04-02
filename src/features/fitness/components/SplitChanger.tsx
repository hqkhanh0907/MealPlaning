import { AlertTriangle, ArrowLeft, Check, CircleAlert, Lightbulb, Loader2, RefreshCw, Shuffle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFitnessStore } from '@/store/fitnessStore';
import { useNavigationStore } from '@/store/navigationStore';

import type { SplitChangePreview, SplitType } from '../types';
import { SplitChangeConfirm } from './SplitChangeConfirm';

interface SplitChangerProps {
  planId: string;
  currentSplit: SplitType;
  onComplete: () => void;
}

const SPLIT_OPTIONS: Array<{ value: SplitType; labelKey: string; descKey: string }> = [
  { value: 'full_body', labelKey: 'fitness.splitChanger.fullBody', descKey: 'fitness.splitChanger.fullBodyDesc' },
  { value: 'upper_lower', labelKey: 'fitness.splitChanger.upperLower', descKey: 'fitness.splitChanger.upperLowerDesc' },
  { value: 'ppl', labelKey: 'fitness.splitChanger.ppl', descKey: 'fitness.splitChanger.pplDesc' },
  { value: 'bro_split', labelKey: 'fitness.splitChanger.broSplit', descKey: 'fitness.splitChanger.broSplitDesc' },
  { value: 'custom', labelKey: 'fitness.splitChanger.custom', descKey: 'fitness.splitChanger.customDesc' },
];

export function SplitChanger({ planId, currentSplit, onComplete }: Readonly<SplitChangerProps>) {
  const { t } = useTranslation();
  const { popPage } = useNavigationStore();
  const { changeSplitType, previewSplitChange } = useFitnessStore();

  const [selectedSplit, setSelectedSplit] = useState<SplitType>(currentSplit);
  const [mode, setMode] = useState<'regenerate' | 'remap'>('remap');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<SplitChangePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const isDifferentSplit = selectedSplit !== currentSplit;

  const handleBack = useCallback(() => {
    popPage();
  }, [popPage]);

  const handleSplitChange = useCallback(
    (value: string) => {
      const newSplit = value as SplitType;
      setSelectedSplit(newSplit);
      setPreview(null);
      setPreviewError(null);

      if (newSplit !== currentSplit) {
        setIsLoadingPreview(true);
        try {
          const result = previewSplitChange(planId, newSplit);
          setPreview(result);
        } catch {
          setPreviewError(t('fitness.splitChanger.previewError'));
        } finally {
          setIsLoadingPreview(false);
        }
      }
    },
    [currentSplit, planId, previewSplitChange, t],
  );

  const handleApply = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsApplying(true);
    try {
      changeSplitType(planId, selectedSplit, mode);
      setShowConfirm(false);
      onComplete();
    } catch {
      setPreviewError(t('fitness.splitChanger.applyError'));
    } finally {
      setIsApplying(false);
    }
  }, [changeSplitType, planId, selectedSplit, mode, onComplete, t]);

  const handleCloseConfirm = useCallback(() => {
    setShowConfirm(false);
  }, []);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="pt-safe flex items-center gap-2 border-b border-slate-200 bg-emerald-600 px-4 py-3 dark:border-slate-700">
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
        <h1 className="truncate text-lg font-semibold text-white">{t('fitness.splitChanger.title')}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Split type selector */}
        <RadioGroup
          value={selectedSplit}
          onValueChange={handleSplitChange}
          className="gap-3"
          data-testid="split-radio-group"
        >
          {SPLIT_OPTIONS.map(option => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                selectedSplit === option.value
                  ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950'
                  : 'bg-card border-slate-200 dark:border-slate-700'
              }`}
              style={{ touchAction: 'manipulation' }}
              data-testid={`split-option-${option.value}`}
            >
              <RadioGroupItem value={option.value} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{t(option.labelKey)}</span>
                  {option.value === currentSplit && (
                    <Check
                      className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                      data-testid="current-split-check"
                    />
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{t(option.descKey)}</p>
              </div>
            </label>
          ))}
        </RadioGroup>

        {/* Mode selector — only shown when a different split is selected */}
        {isDifferentSplit && (
          <div className="mt-6" data-testid="mode-selector">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('fitness.splitChanger.modeTitle')}
            </h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setMode('regenerate')}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                  mode === 'regenerate'
                    ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-950'
                    : 'bg-card border-slate-200 dark:border-slate-700'
                }`}
                style={{ touchAction: 'manipulation' }}
                data-testid="mode-regenerate"
              >
                <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {t('fitness.splitChanger.regenerate')}
                  </span>
                  <p className="mt-1 flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {t('fitness.splitChanger.regenerateWarning')}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('remap')}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                  mode === 'remap'
                    ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950'
                    : 'bg-card border-slate-200 dark:border-slate-700'
                }`}
                style={{ touchAction: 'manipulation' }}
                data-testid="mode-remap"
              >
                <Shuffle
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {t('fitness.splitChanger.remap')}
                  </span>
                  <p className="text-muted-foreground mt-1 text-sm">{t('fitness.splitChanger.remapDesc')}</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Preview panel */}
        {isDifferentSplit && mode === 'remap' && (
          <div className="mt-6" data-testid="preview-panel">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('fitness.splitChanger.preview')}
            </h2>

            {isLoadingPreview && (
              <div className="flex items-center justify-center py-8" data-testid="preview-loading">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600 motion-reduce:animate-none" />
              </div>
            )}

            {previewError && (
              <div
                className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
                data-testid="preview-error"
              >
                <p className="text-sm text-red-700 dark:text-red-300">{previewError}</p>
              </div>
            )}

            {preview && !isLoadingPreview && (
              <div className="space-y-3">
                {/* Summary counts */}
                <div className="flex gap-3 text-sm tabular-nums" data-testid="preview-summary">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    {String(preview.mapped.length)} {t('fitness.splitChanger.mapped')}
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {String(preview.suggested.length)} {t('fitness.splitChanger.suggested')}
                  </span>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {String(preview.unmapped.length)} {t('fitness.splitChanger.unmapped')}
                  </span>
                </div>

                {/* Mapped items */}
                {preview.mapped.length > 0 && (
                  <div className="space-y-2">
                    {preview.mapped.map(item => (
                      <div
                        key={item.from.id}
                        className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950"
                        data-testid="preview-mapped-item"
                      >
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                          {item.from.notes ?? item.from.workoutType}
                        </span>
                        <span className="text-xs text-slate-500">→ {item.toDay}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested items */}
                {preview.suggested.length > 0 && (
                  <div className="space-y-2">
                    {preview.suggested.map((item, idx) => (
                      <div
                        key={`suggested-${String(idx)}`}
                        className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950"
                        data-testid="preview-suggested-item"
                      >
                        <Lightbulb className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                          {item.day}
                        </span>
                        <span className="text-xs text-slate-500">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unmapped items */}
                {preview.unmapped.length > 0 && (
                  <div className="space-y-2">
                    {preview.unmapped.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-950"
                        data-testid="preview-unmapped-item"
                      >
                        <CircleAlert className="text-destructive h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                          {item.notes ?? item.workoutType}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="pb-safe border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <Button
          onClick={handleApply}
          disabled={!isDifferentSplit || isApplying}
          className="w-full"
          style={{ touchAction: 'manipulation' }}
          data-testid="apply-button"
        >
          {t('fitness.splitChanger.apply')}
        </Button>
      </div>

      {/* Confirmation sheet */}
      {preview && (
        <SplitChangeConfirm
          open={showConfirm}
          onClose={handleCloseConfirm}
          onConfirm={handleConfirm}
          newSplit={selectedSplit}
          mode={mode}
          preview={preview}
          isLoading={isApplying}
        />
      )}
    </div>
  );
}
