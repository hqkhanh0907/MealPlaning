import { Loader2, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useNotification } from '../contexts/NotificationContext';
import { analyzeDishImage } from '../services/geminiService';
import { AnalyzedDishResult, NotFoodImageError, SaveAnalyzedDishPayload } from '../types';
import { logger } from '../utils/logger';
import { AnalysisResultView } from './AnalysisResultView';
import { ImageCapture } from './ImageCapture';
import { SaveAnalyzedDishModal } from './modals/SaveAnalyzedDishModal';

interface AIImageAnalyzerProps {
  onAnalysisComplete: (result: AnalyzedDishResult) => void;
  onSave?: (result: SaveAnalyzedDishPayload) => void;
}

export const AIImageAnalyzer = ({ onAnalysisComplete, onSave }: AIImageAnalyzerProps) => {
  const notify = useNotification();
  const { t } = useTranslation();
  // Ref avoids stale closures in async callbacks
  const onAnalysisCompleteRef = useRef(onAnalysisComplete);
  useEffect(() => {
    onAnalysisCompleteRef.current = onAnalysisComplete;
  }, [onAnalysisComplete]);

  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzedDishResult | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const handleImageReady = useCallback((base64: string) => {
    setImage(base64);
    setResult(null);
  }, []);

  const handleClearImage = useCallback(() => {
    setImage(null);
    setResult(null);
  }, []);

  const handleAnalyze = async () => {
    if (!image) return;
    const img = image;
    try {
      setIsAnalyzing(true);
      const [header, base64Data] = img.split(',');
      const mimeType = header.split(':')[1].split(';')[0];

      const analysis = await analyzeDishImage(base64Data, mimeType);
      setResult(analysis);
      onAnalysisCompleteRef.current(analysis);
    } catch (error) {
      logger.error({ component: 'AIImageAnalyzer', action: 'analyze' }, error);
      if (error instanceof NotFoodImageError) {
        notify.warning(t('ai.notFoodTitle'), error.reason);
      } else {
        notify.error(t('ai.analysisFailed'), t('ai.analysisError'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      data-testid="ai-image-analyzer"
      className="bg-card rounded-2xl border border-slate-100 p-6 shadow-sm sm:p-8 dark:border-slate-700"
    >
      {!image && !result && (
        <div className="mb-6 flex items-center justify-center gap-4 text-xs text-slate-400 sm:gap-6 sm:text-sm dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              1
            </span>
            <span>{t('ai.step1')}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">→</span>
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              2
            </span>
            <span>{t('ai.step2')}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">→</span>
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              3
            </span>
            <span>{t('ai.step3')}</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <ImageCapture image={image} onImageReady={handleImageReady} onClear={handleClearImage} />

          <button
            onClick={handleAnalyze}
            disabled={!image || isAnalyzing}
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-bold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('ai.analyzing')}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {t('ai.analyzeDish')}
              </>
            )}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-600 dark:bg-slate-700">
          <AnalysisResultView
            result={result}
            isAnalyzing={isAnalyzing}
            onOpenSaveModal={onSave && result ? () => setIsSaveModalOpen(true) : undefined}
          />
        </div>
      </div>

      {isSaveModalOpen && result && onSave && (
        <SaveAnalyzedDishModal onClose={() => setIsSaveModalOpen(false)} result={result} onSave={onSave} />
      )}
    </div>
  );
};
