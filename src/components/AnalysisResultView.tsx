import { Image as ImageIcon, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import { AnalyzedDishResult, AnalyzedIngredient } from '../types';
import { calculateIngredientNutrition, toTempIngredient } from '../utils/nutrition';

interface AnalysisResultViewProps {
  result: AnalyzedDishResult | null;
  isAnalyzing: boolean;
  onOpenSaveModal?: () => void;
}

const AnalysisSkeleton = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-3 h-7 w-2/3 rounded-lg" />
        <Skeleton className="mb-1.5 h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {['skeleton-cal', 'skeleton-pro', 'skeleton-carb', 'skeleton-fat'].map(id => (
          <div
            key={id}
            className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800"
          >
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-48" />
        <div className="space-y-2">
          {['skeleton-ing-1', 'skeleton-ing-2', 'skeleton-ing-3'].map(id => (
            <div
              key={id}
              className="flex justify-between rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-600 dark:bg-slate-800"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
      <div className="text-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
        {t('ai.loadingHint')}
      </div>
    </div>
  );
};

const EmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-5 py-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 to-indigo-50 dark:from-emerald-900/20 dark:to-indigo-900/20">
        <ImageIcon className="h-12 w-12 text-emerald-400/60 dark:text-emerald-500/40" />
      </div>
      <div className="space-y-2">
        <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">{t('ai.title')}</h4>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {t('ai.emptyHint')}
        </p>
      </div>
    </div>
  );
};

const NutritionCard = ({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) => (
  <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800">
    <p className="mb-1 text-xs font-bold text-slate-500 uppercase dark:text-slate-500">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>
      {value} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit}</span>
    </p>
  </div>
);

const IngredientRow = ({ ing }: { ing: AnalyzedIngredient }) => {
  const n = calculateIngredientNutrition(toTempIngredient(ing), ing.amount);
  return (
    <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-600">
      <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{ing.name}</td>
      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
        {ing.amount} {ing.unit}
      </td>
      <td className="px-3 py-2 font-medium text-orange-500">{Math.round(n.calories)}</td>
      <td className="px-3 py-2 font-medium text-blue-500">{Math.round(n.protein)}</td>
      <td className="px-3 py-2 font-medium text-amber-500">{Math.round(n.carbs)}</td>
      <td className="px-3 py-2 font-medium text-rose-500">{Math.round(n.fat)}</td>
    </tr>
  );
};

const IngredientCard = ({ ing }: { ing: AnalyzedIngredient }) => {
  const n = calculateIngredientNutrition(toTempIngredient(ing), ing.amount);
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-600 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{ing.name}</p>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {ing.amount} {ing.unit}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-500">{t('common.calories')}</p>
          <p className="text-sm font-bold text-orange-500">{Math.round(n.calories)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-500">{t('common.protein')}</p>
          <p className="text-sm font-bold text-blue-500">{Math.round(n.protein)}g</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-500">{t('common.carbs')}</p>
          <p className="text-sm font-bold text-amber-500">{Math.round(n.carbs)}g</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-500">{t('common.fat')}</p>
          <p className="text-sm font-bold text-rose-500">{Math.round(n.fat)}g</p>
        </div>
      </div>
    </div>
  );
};

export const AnalysisResultView = ({ result, isAnalyzing, onOpenSaveModal }: AnalysisResultViewProps) => {
  const { t } = useTranslation();
  if (isAnalyzing) return <AnalysisSkeleton />;
  if (!result) return <EmptyState />;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{result.name}</h3>
        <p className="leading-relaxed text-slate-600 dark:text-slate-400">{result.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NutritionCard
          label={t('ai.estimateCalories')}
          value={result.totalNutrition?.calories}
          unit="kcal"
          color="text-orange-500"
        />
        <NutritionCard
          label={t('ai.estimateProtein')}
          value={result.totalNutrition?.protein}
          unit="g"
          color="text-blue-500"
        />
        <NutritionCard
          label={t('ai.estimateCarbs')}
          value={result.totalNutrition?.carbs}
          unit="g"
          color="text-amber-500"
        />
        <NutritionCard label={t('ai.estimateFat')} value={result.totalNutrition?.fat} unit="g" color="text-rose-500" />
      </div>

      <div>
        <h4 className="mb-3 font-bold text-slate-800 dark:text-slate-100">{t('ai.ingredientDetail')}</h4>

        {/* Desktop: Table view */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="rounded-l-lg px-3 py-2">{t('ingredient.title')}</th>
                <th className="px-3 py-2">{t('ingredient.quantity')}</th>
                <th className="px-3 py-2">{t('common.calories')}</th>
                <th className="px-3 py-2">{t('common.protein')}</th>
                <th className="px-3 py-2">{t('common.carbs')}</th>
                <th className="rounded-r-lg px-3 py-2">{t('common.fat')}</th>
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
        <div className="space-y-3 sm:hidden">
          {result.ingredients.map((ing, idx) => (
            <IngredientCard key={`mobile-${ing.name}-${idx}`} ing={ing} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
        <p className="mb-1 font-bold">{t('ai.disclaimer')}</p>
        <p className="opacity-80">{t('ai.disclaimerText')}</p>
      </div>

      {onOpenSaveModal && (
        <button
          onClick={onOpenSaveModal}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white transition-all hover:bg-indigo-700"
        >
          <Save className="h-5 w-5" />
          {t('ai.saveToLibrary')}
        </button>
      )}
    </div>
  );
};
