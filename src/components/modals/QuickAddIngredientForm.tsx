import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useForm, Controller } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ingredient, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { generateId } from '../../utils/helpers';
import { suggestIngredientInfo } from '../../services/geminiService';
import { UnitSelector } from '../shared/UnitSelector';
import { StringNumberController } from '../form/StringNumberController';
import {
  quickAddIngredientSchema,
  type QuickAddIngredientData,
  quickAddIngredientDefaults,
} from '../../schemas/dishEditSchema';

interface QuickAddIngredientFormProps {
  onAdd: (ingredient: Ingredient) => void;
  onCancel: () => void;
}

const getDisplayUnit = (unit: Ingredient['unit'], lang: SupportedLang) => {
  const u = getLocalizedField(unit, lang).toLowerCase().trim();
  if (u === 'kg' || u === 'g') return '100g';
  if (u === 'l' || u === 'ml') return '100ml';
  return `1 ${getLocalizedField(unit, lang)}`;
};

const NUTRITION_FIELDS = [
  { label: 'Cal', name: 'qaCal' as const },
  { label: 'Protein', name: 'qaProtein' as const },
  { label: 'Carbs', name: 'qaCarbs' as const },
  { label: 'Fat', name: 'qaFat' as const },
  { label: 'Fiber', name: 'qaFiber' as const },
];

const QuickAddIngredientFormInner: React.FC<QuickAddIngredientFormProps> = ({ onAdd, onCancel }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;

  const {
    control,
    getValues,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<QuickAddIngredientData>({
    resolver: zodResolver(quickAddIngredientSchema) as unknown as Resolver<QuickAddIngredientData>,
    mode: 'onBlur',
    defaultValues: quickAddIngredientDefaults,
  });

  const qaName = watch('qaName');
  const qaUnit = watch('qaUnit');

  const [qaAiLoading, setQaAiLoading] = useState(false);

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      aiAbortRef.current?.abort();
    };
  }, []);

  const triggerAIFill = useCallback((name: string, unit: string) => {
    if (!name.trim() || !unit.trim()) return;
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiAbortRef.current?.abort();
    aiTimerRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      aiAbortRef.current = ctrl;
      setQaAiLoading(true);
      try {
        const info = await suggestIngredientInfo(name.trim(), unit.trim(), ctrl.signal);
        if (!ctrl.signal.aborted) {
          setValue('qaCal', Math.round(info.calories));
          setValue('qaProtein', Math.round(info.protein));
          setValue('qaCarbs', Math.round(info.carbs));
          setValue('qaFat', Math.round(info.fat));
          setValue('qaFiber', Math.round(info.fiber));
        }
      } catch {
        // silent — user fills manually
      } finally {
        setQaAiLoading(false);
      }
    }, 800);
  }, [setValue]);

  const handleCancel = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiAbortRef.current?.abort();
    onCancel();
  }, [onCancel]);

  const handleFormSubmit = useCallback(() => {
    const data = getValues();
    if (!data.qaName.trim()) {
      setError('qaName', { type: 'validate', message: t('dish.quickAddValidationName') });
      return;
    }
    const newIng: Ingredient = {
      id: generateId('ing'),
      name: { vi: data.qaName.trim(), en: data.qaName.trim() },
      unit: { vi: data.qaUnit.vi.trim() || 'g' },
      caloriesPer100: data.qaCal || 0,
      proteinPer100: data.qaProtein || 0,
      carbsPer100: data.qaCarbs || 0,
      fatPer100: data.qaFat || 0,
      fiberPer100: data.qaFiber || 0,
    };
    onAdd(newIng);
    onCancel();
  }, [getValues, setError, t, onAdd, onCancel]);

  return (
    <div className="fixed inset-0 z-70 flex items-end sm:items-center justify-center">
      <button type="button" aria-label="close quick-add" className="absolute inset-0 bg-black/30 cursor-default" onClick={handleCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md p-6 space-y-4 max-h-[80dvh] overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{t('dish.quickAddTitle')}</p>
          <button type="button" onClick={handleCancel} aria-label={t('common.closeDialog')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <div>
          <label htmlFor="qa-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('dish.quickAddName')} <span className="text-rose-500">*</span></label>
          <Controller
            name="qaName"
            control={control}
            render={({ field }) => (
              <Input
                ref={field.ref}
                id="qa-name"
                name="qa-name"
                data-testid="input-qa-name"
                value={field.value}
                onChange={e => { field.onChange(e.target.value); if (errors.qaName) clearErrors('qaName'); }}
                onBlur={() => triggerAIFill(field.value, qaUnit.vi)}
                placeholder={t('dish.quickAddNamePlaceholder')}
                className={`w-full ${errors.qaName ? 'border-rose-500' : ''}`}
              />
            )}
          />
          {errors.qaName && <p className="text-xs text-rose-500 mt-0.5">{errors.qaName.message}</p>}
        </div>
        <div>
          <label htmlFor="qa-unit" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('dish.quickAddUnit')}</label>
          <Controller
            name="qaUnit"
            control={control}
            render={({ field }) => (
              <UnitSelector
                mode="bilingual"
                id="qa-unit"
                value={field.value}
                onChange={v => { field.onChange(v); triggerAIFill(qaName, v.vi); }}
                onBlur={field.onBlur}
                data-testid="qa-unit"
              />
            )}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('dish.quickAddNutrition')}</label>
            <div className="flex items-center gap-2">
              {qaAiLoading && (
                <span className="text-xs text-emerald-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('dish.quickAddAiFilling')}
                </span>
              )}
              {!qaAiLoading && (
                <button
                  type="button"
                  onClick={() => triggerAIFill(qaName, qaUnit.vi)}
                  disabled={!qaName.trim()}
                  data-testid="btn-qa-ai-fill"
                  title={t('dish.quickAddAiFillButton')}
                  aria-label={t('dish.quickAddAiFillButton')}
                  className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {NUTRITION_FIELDS.map(({ label, name: fieldName }) => (
              <div key={label}>
                <label htmlFor={`qa-${label.toLowerCase()}`} className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">{label} / {getDisplayUnit(qaUnit, lang)}</label>
                <StringNumberController<QuickAddIngredientData>
                  name={fieldName}
                  control={control}
                  inputMode="numeric"
                  testId={`qa-${label.toLowerCase()}`}
                  ariaLabel={`${label} / ${getDisplayUnit(qaUnit, lang)}`}
                  min={0}
                  disabled={qaAiLoading}
                  placeholder="0"
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleCancel} data-testid="btn-qa-cancel" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
            {t('dish.quickAddCancel')}
          </button>
          <button type="button" onClick={handleFormSubmit} data-testid="btn-qa-submit" className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" /> {t('dish.quickAddSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const QuickAddIngredientForm = React.memo(QuickAddIngredientFormInner);
