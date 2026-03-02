import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { analyzeDishImage } from '../services/geminiService';
import { AnalyzedDishResult, SaveAnalyzedDishPayload } from '../types';
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
    if (!image) return;

    try {
      setIsAnalyzing(true);
      const [header, base64Data] = image.split(',');
      const mimeType = header.split(':')[1].split(';')[0];

      const analysis = await analyzeDishImage(base64Data, mimeType);
      setResult(analysis);
      onAnalysisCompleteRef.current(analysis);
    } catch (error) {
      logger.error({ component: 'AIImageAnalyzer', action: 'analyze' }, error);
      notify.error('Phân tích thất bại', 'Có lỗi xảy ra khi phân tích ảnh. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
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
                Đang phân tích...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Phân tích món ăn
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
