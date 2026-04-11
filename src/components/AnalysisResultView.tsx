import { Image as ImageIcon, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/shared/EmptyState';
import { createSurfaceStateContract } from '@/components/shared/surfaceState';
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
          <div key={id} className="bg-card border-border-subtle rounded-xl border p-4 shadow-sm">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-48" />
        <div className="space-y-2">
          {['skeleton-ing-1', 'skeleton-ing-2', 'skeleton-ing-3'].map(id => (
            <div key={id} className="bg-card border-border-subtle flex justify-between rounded-xl border p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
      <div className="text-muted-foreground text-center text-sm font-medium">
        <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
        {t('ai.loadingHint')}
      </div>
    </div>
  );
};

const AnalysisEmptyState = () => {
  const { t } = useTranslation();
  const contract = createSurfaceStateContract({
    surface: 'ai.analysis',
    state: 'empty',
    copy: {
      title: t('ai.emptyTitle'),
      missing: t('ai.emptyMissing'),
      reason: t('ai.emptyReason'),
      nextStep: t('ai.emptyNextStep'),
    },
  });

  return (
    <div className="space-y-4">
      <EmptyState variant="standard" icon={ImageIcon} contract={contract} />
      <div className="bg-card border-border-subtle rounded-xl border p-4">
        <p className="text-foreground text-sm font-semibold">{t('ai.exampleTitle')}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t('ai.exampleDescription')}</p>
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
  <div className="bg-card border-border-subtle rounded-xl border p-4 shadow-sm">
    <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>
      {value} <span className="text-muted-foreground text-sm font-medium">{unit}</span>
    </p>
  </div>
);

const IngredientRow = ({ ing }: { ing: AnalyzedIngredient }) => {
  const n = calculateIngredientNutrition(toTempIngredient(ing), ing.amount);
  return (
    <tr className="hover:bg-accent transition-colors">
      <td className="text-foreground px-3 py-2 font-medium">{ing.name}</td>
      <td className="text-foreground-secondary px-3 py-2">
        {ing.amount} {ing.unit}
      </td>
      <td className="text-energy px-3 py-2 font-medium">{Math.round(n.calories)}</td>
      <td className="text-macro-protein px-3 py-2 font-medium">{Math.round(n.protein)}</td>
      <td className="text-macro-carbs px-3 py-2 font-medium">{Math.round(n.carbs)}</td>
      <td className="text-macro-fat px-3 py-2 font-medium">{Math.round(n.fat)}</td>
    </tr>
  );
};

const IngredientCard = ({ ing }: { ing: AnalyzedIngredient }) => {
  const n = calculateIngredientNutrition(toTempIngredient(ing), ing.amount);
  const { t } = useTranslation();
  return (
    <div className="bg-card border-border-subtle rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-foreground text-sm font-semibold">{ing.name}</p>
        <span className="text-muted-foreground text-xs font-medium">
          {ing.amount} {ing.unit}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="text-center">
          <p className="text-muted-foreground text-xs font-semibold uppercase">{t('common.calories')}</p>
          <p className="text-energy text-sm font-semibold">{Math.round(n.calories)}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground text-xs font-semibold uppercase">{t('common.protein')}</p>
          <p className="text-macro-protein text-sm font-semibold">{Math.round(n.protein)}g</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground text-xs font-semibold uppercase">{t('common.carbs')}</p>
          <p className="text-macro-carbs text-sm font-semibold">{Math.round(n.carbs)}g</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground text-xs font-semibold uppercase">{t('common.fat')}</p>
          <p className="text-macro-fat text-sm font-semibold">{Math.round(n.fat)}g</p>
        </div>
      </div>
    </div>
  );
};

export const AnalysisResultView = ({ result, isAnalyzing, onOpenSaveModal }: AnalysisResultViewProps) => {
  const { t } = useTranslation();
  if (isAnalyzing) return <AnalysisSkeleton />;
  if (!result) return <AnalysisEmptyState />;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-foreground mb-2 text-2xl font-semibold">{result.name}</h3>
        <p className="text-foreground-secondary leading-relaxed">{result.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NutritionCard
          label={t('ai.estimateCalories')}
          value={result.totalNutrition?.calories}
          unit="kcal"
          color="text-energy"
        />
        <NutritionCard
          label={t('ai.estimateProtein')}
          value={result.totalNutrition?.protein}
          unit="g"
          color="text-macro-protein"
        />
        <NutritionCard
          label={t('ai.estimateCarbs')}
          value={result.totalNutrition?.carbs}
          unit="g"
          color="text-macro-carbs"
        />
        <NutritionCard label={t('ai.estimateFat')} value={result.totalNutrition?.fat} unit="g" color="text-macro-fat" />
      </div>

      <div>
        <h4 className="text-foreground mb-3 font-semibold">{t('ai.ingredientDetail')}</h4>

        {/* Desktop: Table view */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase">
              <tr>
                <th className="rounded-l-lg px-3 py-2">{t('ingredient.title')}</th>
                <th className="px-3 py-2">{t('ingredient.quantity')}</th>
                <th className="px-3 py-2">{t('common.calories')}</th>
                <th className="px-3 py-2">{t('common.protein')}</th>
                <th className="px-3 py-2">{t('common.carbs')}</th>
                <th className="rounded-r-lg px-3 py-2">{t('common.fat')}</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
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

      <div className="border-ai/20 bg-ai-subtle text-ai rounded-xl border p-4 text-sm">
        <p className="mb-1 font-semibold">{t('ai.disclaimer')}</p>
        <p className="opacity-80">{t('ai.disclaimerText')}</p>
      </div>

      {onOpenSaveModal && (
        <button
          onClick={onOpenSaveModal}
          className="bg-ai hover:bg-ai/90 text-primary-foreground flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all"
        >
          <Save className="h-5 w-5" aria-hidden="true" />
          {t('ai.saveToLibrary')}
        </button>
      )}
    </div>
  );
};
