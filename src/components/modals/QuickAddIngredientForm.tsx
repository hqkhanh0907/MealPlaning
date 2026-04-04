import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Sparkles, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Resolver } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

import {
  type QuickAddIngredientData,
  quickAddIngredientDefaults,
  quickAddIngredientSchema,
} from '../../schemas/dishEditSchema';
import { suggestIngredientInfo } from '../../services/geminiService';
import { Ingredient, SupportedLang } from '../../types';
import { generateUUID } from '../../utils/helpers';
import { getLocalizedField } from '../../utils/localize';
import { StringNumberController } from '../form/StringNumberController';
import { UnitSelector } from '../shared/UnitSelector';

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

const QuickAddIngredientFormInner = ({ onAdd, onCancel }: QuickAddIngredientFormProps) => {
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

  const triggerAIFill = useCallback(
    (name: string, unit: string) => {
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
    },
    [setValue],
  );

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
      id: generateUUID(),
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
    <div className="fixed inset-0 z-70 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="close quick-add"
        className="absolute inset-0 cursor-default bg-black/30"
        onClick={handleCancel}
      />
      <div className="bg-card relative max-h-[80dvh] w-full space-y-4 overflow-y-auto overscroll-contain rounded-t-2xl p-6 shadow-xl sm:max-w-md sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <p className="text-primary text-base font-bold">{t('dish.quickAddTitle')}</p>
          <button
            type="button"
            onClick={handleCancel}
            aria-label={t('common.closeDialog')}
            className="text-muted-foreground hover:bg-accent rounded-full p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>
          <label htmlFor="qa-name" className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase">
            {t('dish.quickAddName')} <span className="text-rose-500">*</span>
          </label>
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
                onChange={e => {
                  field.onChange(e.target.value);
                  if (errors.qaName) clearErrors('qaName');
                }}
                onBlur={() => triggerAIFill(field.value, qaUnit.vi)}
                placeholder={t('dish.quickAddNamePlaceholder')}
                className={`w-full ${errors.qaName ? 'border-rose-500' : ''}`}
                aria-invalid={!!errors.qaName}
                aria-describedby={errors.qaName ? 'qa-name-error' : undefined}
                aria-required={true}
              />
            )}
          />
          {errors.qaName && (
            <p id="qa-name-error" className="mt-0.5 text-xs text-rose-500" role="alert">
              {errors.qaName.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="qa-unit" className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase">
            {t('dish.quickAddUnit')}
          </label>
          <Controller
            name="qaUnit"
            control={control}
            render={({ field }) => (
              <UnitSelector
                mode="bilingual"
                id="qa-unit"
                value={field.value}
                onChange={v => {
                  field.onChange(v);
                  triggerAIFill(qaName, v.vi);
                }}
                onBlur={field.onBlur}
                data-testid="qa-unit"
              />
            )}
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-muted-foreground text-xs font-semibold uppercase">
              {t('dish.quickAddNutrition')}
            </label>
            <div className="flex items-center gap-2">
              {qaAiLoading && (
                <span className="text-primary flex items-center gap-1 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
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
                  className="bg-color-ai-subtle text-color-ai hover:bg-color-ai/10 rounded-lg p-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {NUTRITION_FIELDS.map(({ label, name: fieldName }) => (
              <div key={label}>
                <label
                  htmlFor={`qa-${label.toLowerCase()}`}
                  className="text-muted-foreground mb-0.5 block text-xs font-semibold uppercase"
                >
                  {label} / {getDisplayUnit(qaUnit, lang)}
                </label>
                <StringNumberController<QuickAddIngredientData>
                  name={fieldName}
                  control={control}
                  inputMode="numeric"
                  testId={`qa-${label.toLowerCase()}`}
                  ariaLabel={`${label} / ${getDisplayUnit(qaUnit, lang)}`}
                  min={0}
                  disabled={qaAiLoading}
                  placeholder="0"
                  className="focus:border-primary border-border bg-card w-full rounded-lg border px-2 py-1.5 text-xs transition-all outline-none disabled:opacity-50"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleCancel}
            data-testid="btn-qa-cancel"
            className="text-muted-foreground bg-muted hover:bg-accent flex-1 rounded-xl py-2.5 text-sm font-medium transition-all"
          >
            {t('dish.quickAddCancel')}
          </button>
          <button
            type="button"
            onClick={handleFormSubmit}
            data-testid="btn-qa-submit"
            className="bg-primary text-primary-foreground hover:bg-primary flex flex-[2] items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all"
          >
            <Plus className="h-4 w-4" /> {t('dish.quickAddSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const QuickAddIngredientForm = React.memo(QuickAddIngredientFormInner);
