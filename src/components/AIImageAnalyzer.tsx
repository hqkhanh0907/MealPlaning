import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
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
      className="bg-card border-border-subtle rounded-2xl border p-6 shadow-sm sm:p-8"
    >
      {!image && !result && (
        <div className="mb-6 space-y-4">
          <div className="bg-ai-subtle border-ai/20 rounded-2xl border p-4">
            <h3 className="text-ai text-base font-semibold">{t('ai.valueTitle')}</h3>
            <p className="text-ai mt-1 text-sm">{t('ai.valueDescription')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="bg-card text-foreground rounded-full px-3 py-1 text-xs font-medium">
                {t('ai.valueBadgeCalories')}
              </span>
              <span className="bg-card text-foreground rounded-full px-3 py-1 text-xs font-medium">
                {t('ai.valueBadgeProtein')}
              </span>
              <span className="bg-card text-foreground rounded-full px-3 py-1 text-xs font-medium">
                {t('ai.valueBadgeExamples')}
              </span>
            </div>
          </div>
          <div className="text-muted-foreground flex items-center justify-center gap-4 text-xs sm:gap-6 sm:text-sm">
            <div className="flex items-center gap-1.5">
              <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
                1
              </span>
              <span>{t('ai.step1')}</span>
            </div>
            <ArrowRight className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            <div className="flex items-center gap-1.5">
              <span className="bg-ai-subtle text-ai flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
                2
              </span>
              <span>{t('ai.step2')}</span>
            </div>
            <ArrowRight className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            <div className="flex items-center gap-1.5">
              <span className="bg-energy-subtle text-energy flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
                3
              </span>
              <span>{t('ai.step3')}</span>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <ImageCapture image={image} onImageReady={handleImageReady} onClear={handleClearImage} />

          <button
            onClick={handleAnalyze}
            disabled={!image || isAnalyzing}
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                {t('ai.analyzing')}
              </>
            ) : (
              <>
                <Sparkles className="text-ai h-5 w-5" aria-hidden="true" />
                {t('ai.analyzeDish')}
              </>
            )}
          </button>
        </div>

        <div className="border-border-subtle bg-muted rounded-2xl border p-6">
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
