import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { analyzeDishImage } from '../services/geminiService';
import { AnalyzedDishResult, SaveAnalyzedDishPayload, NotFoodImageError } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { ImageCapture } from './ImageCapture';
import { AnalysisResultView } from './AnalysisResultView';
import { SaveAnalyzedDishModal } from './modals/SaveAnalyzedDishModal';
import { logger } from '../utils/logger';

interface AIImageAnalyzerProps {
  onAnalysisComplete: (result: AnalyzedDishResult) => void;
  onSave?: (result: SaveAnalyzedDishPayload) => void;
}

export const AIImageAnalyzer: React.FC<AIImageAnalyzerProps> = ({ onAnalysisComplete, onSave }) => {
  const notify = useNotification();
  const { t } = useTranslation();
  // Ref avoids stale closures in async callbacks
  const onAnalysisCompleteRef = useRef(onAnalysisComplete);
  useEffect(() => { onAnalysisCompleteRef.current = onAnalysisComplete; }, [onAnalysisComplete]);

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
    const img = image!;
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
    <div data-testid="ai-image-analyzer" className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
      {!image && !result && (
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6 text-xs sm:text-sm text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5"><span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold">1</span><span>{t('ai.step1')}</span></div>
          <span className="text-slate-300 dark:text-slate-600">→</span>
          <div className="flex items-center gap-1.5"><span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold">2</span><span>{t('ai.step2')}</span></div>
          <span className="text-slate-300 dark:text-slate-600">→</span>
          <div className="flex items-center gap-1.5"><span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-xs font-bold">3</span><span>{t('ai.step3')}</span></div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ImageCapture image={image} onImageReady={handleImageReady} onClear={handleClearImage} />

          <button
            onClick={handleAnalyze}
            disabled={!image || isAnalyzing}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('ai.analyzing')}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {t('ai.analyzeDish')}
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6 border border-slate-100 dark:border-slate-600">
          <AnalysisResultView
            result={result}
            isAnalyzing={isAnalyzing}
            onOpenSaveModal={onSave && result ? () => setIsSaveModalOpen(true) : undefined}
          />
        </div>
      </div>

      {isSaveModalOpen && result && onSave && (
        <SaveAnalyzedDishModal
          onClose={() => setIsSaveModalOpen(false)}
          result={result}
          onSave={onSave}
        />
      )}
    </div>
  );
};
