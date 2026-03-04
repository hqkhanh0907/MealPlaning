import React from 'react';
import { Loader2, Image as ImageIcon, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnalyzedDishResult, AnalyzedIngredient } from '../types';
import { toTempIngredient, calculateIngredientNutrition } from '../utils/nutrition';

interface AnalysisResultViewProps {
  result: AnalyzedDishResult | null;
  isAnalyzing: boolean;
  onOpenSaveModal?: () => void;
}

const AnalysisSkeleton: React.FC = () => {
  const { t } = useTranslation();
  return (
  <div className="space-y-6 animate-pulse">
    <div>
      <div className="h-7 bg-slate-200 rounded-lg w-2/3 mb-3" />
      <div className="h-4 bg-slate-200 rounded w-full mb-1.5" />
      <div className="h-4 bg-slate-200 rounded w-4/5" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      {['skeleton-cal', 'skeleton-pro', 'skeleton-carb', 'skeleton-fat'].map((id) => (
        <div key={id} className="bg-white p-4 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
          <div className="h-3 bg-slate-200 rounded w-16 mb-2" />
          <div className="h-7 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
    <div>
      <div className="h-5 bg-slate-200 rounded w-48 mb-3" />
      <div className="space-y-2">
        {['skeleton-ing-1', 'skeleton-ing-2', 'skeleton-ing-3'].map((id) => (
          <div key={id} className="bg-white p-3 rounded-xl border border-slate-100 dark:border-slate-600 flex justify-between">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-4 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
    <div className="text-center text-sm text-slate-500 font-medium">
      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
      {t('ai.loadingHint')}
    </div>
  </div>
  );
};

const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center space-y-4">
    <ImageIcon className="w-16 h-16 opacity-20" />
    <p>{t('ai.emptyHint')}</p>
  </div>
  );
};

const NutritionCard: React.FC<{ label: string; value: number; unit: string; color: string }> = ({ label, value, unit, color }) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value} <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{unit}</span></p>
  </div>
);

const IngredientRow: React.FC<{ ing: AnalyzedIngredient }> = ({ ing }) => {
  const n = calculateIngredientNutrition(toTempIngredient(ing), ing.amount);
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
      <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{ing.name}</td>
      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{ing.amount} {ing.unit}</td>
      <td className="px-3 py-2 font-medium text-orange-500">{Math.round(n.calories)}</td>
      <td className="px-3 py-2 font-medium text-blue-500">{Math.round(n.protein)}</td>
      <td className="px-3 py-2 font-medium text-amber-500">{Math.round(n.carbs)}</td>
      <td className="px-3 py-2 font-medium text-rose-500">{Math.round(n.fat)}</td>
    </tr>
  );
};

const IngredientCard: React.FC<{ ing: AnalyzedIngredient }> = ({ ing }) => {
  const n = calculateIngredientNutrition(toTempIngredient(ing), ing.amount);
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
      <div className="flex justify-between items-center mb-2">
        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{ing.name}</p>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{ing.amount} {ing.unit}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t('common.calories')}</p>
          <p className="text-sm font-bold text-orange-500">{Math.round(n.calories)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t('common.protein')}</p>
          <p className="text-sm font-bold text-blue-500">{Math.round(n.protein)}g</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t('common.carbs')}</p>
          <p className="text-sm font-bold text-amber-500">{Math.round(n.carbs)}g</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t('common.fat')}</p>
          <p className="text-sm font-bold text-rose-500">{Math.round(n.fat)}g</p>
        </div>
      </div>
    </div>
  );
};

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result, isAnalyzing, onOpenSaveModal }) => {
  const { t } = useTranslation();
  if (isAnalyzing) return <AnalysisSkeleton />;
  if (!result) return <EmptyState />;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{result.name}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{result.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NutritionCard label={t('ai.estimateCalories')} value={result.totalNutrition?.calories} unit="kcal" color="text-orange-500" />
        <NutritionCard label={t('ai.estimateProtein')} value={result.totalNutrition?.protein} unit="g" color="text-blue-500" />
        <NutritionCard label={t('ai.estimateCarbs')} value={result.totalNutrition?.carbs} unit="g" color="text-amber-500" />
        <NutritionCard label={t('ai.estimateFat')} value={result.totalNutrition?.fat} unit="g" color="text-rose-500" />
      </div>

      <div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3">{t('ai.ingredientDetail')}</h4>

        {/* Desktop: Table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2 rounded-l-lg">{t('ingredient.title')}</th>
                <th className="px-3 py-2">{t('ingredient.quantity')}</th>
                <th className="px-3 py-2">{t('common.calories')}</th>
                <th className="px-3 py-2">{t('common.protein')}</th>
                <th className="px-3 py-2">{t('common.carbs')}</th>
                <th className="px-3 py-2 rounded-r-lg">{t('common.fat')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-600">
              {result.ingredients.map((ing, idx) => (
                <IngredientRow key={`desktop-${ing.name}-${idx}`} ing={ing} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Card list view */}
        <div className="sm:hidden space-y-3">
          {result.ingredients.map((ing, idx) => (
            <IngredientCard key={`mobile-${ing.name}-${idx}`} ing={ing} />
          ))}
        </div>
      </div>
      
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800 text-sm text-indigo-800 dark:text-indigo-300">
        <p className="font-bold mb-1">{t('ai.disclaimer')}</p>
        <p className="opacity-80">{t('ai.disclaimerText')}</p>
      </div>

      {onOpenSaveModal && (
        <button 
          onClick={onOpenSaveModal}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {t('ai.saveToLibrary')}
        </button>
      )}
    </div>
  );
};
