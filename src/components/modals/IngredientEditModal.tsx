import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Save, Sparkles, Loader2, X } from 'lucide-react';
import { Ingredient, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { suggestIngredientInfo } from '../../services/geminiService';
import { useNotification } from '../../contexts/NotificationContext';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { UnsavedChangesDialog } from '../shared/UnsavedChangesDialog';
import { UnitSelector } from '../shared/UnitSelector';
import { logger } from '../../utils/logger';
import { Input } from '@/components/ui/input';
import {
  ingredientEditSchema,
  ingredientEditDefaults,
  type IngredientEditFormData,
} from '../../schemas/ingredientEditSchema';

interface IngredientEditModalProps {
  editingItem: Ingredient | null;
  onSubmit: (ingredient: Ingredient) => void;
  onClose: () => void;
}

const NUMERIC_FIELDS = ['caloriesPer100', 'proteinPer100', 'carbsPer100', 'fatPer100', 'fiberPer100'] as const;

const getDisplayUnit = (unit: Ingredient['unit'], lang: SupportedLang) => {
  const u = getLocalizedField(unit, lang).toLowerCase().trim();
  if (u === 'kg' || u === 'g') return '100g';
  if (u === 'l' || u === 'ml') return '100ml';
  return `1 ${getLocalizedField(unit, lang)}`;
};

export const IngredientEditModal: React.FC<IngredientEditModalProps> = ({
  editingItem, onSubmit, onClose,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const notify = useNotification();

  const {
    register,
    handleSubmit: rhfSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<IngredientEditFormData>({
    resolver: zodResolver(ingredientEditSchema) as unknown as Resolver<IngredientEditFormData>,
    mode: 'onBlur',
    defaultValues: editingItem
      ? {
          name: { vi: editingItem.name.vi ?? '' },
          unit: { vi: editingItem.unit.vi ?? '' },
          caloriesPer100: Math.round(editingItem.caloriesPer100),
          proteinPer100: Math.round(editingItem.proteinPer100),
          carbsPer100: Math.round(editingItem.carbsPer100),
          fatPer100: Math.round(editingItem.fatPer100),
          fiberPer100: Math.round(editingItem.fiberPer100),
        }
      : ingredientEditDefaults,
  });

  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const hasSubmittedRef = useRef(false);

  const watchName = watch('name.vi');
  const watchUnit = watch('unit');

  const buildIngredient = useCallback((data: IngredientEditFormData): Ingredient => ({
    id: editingItem ? editingItem.id : `ing-${Date.now()}`,
    name: { vi: data.name.vi },
    unit: { vi: data.unit.vi },
    caloriesPer100: Math.round(data.caloriesPer100),
    proteinPer100: Math.round(data.proteinPer100),
    carbsPer100: Math.round(data.carbsPer100),
    fatPer100: Math.round(data.fatPer100),
    fiberPer100: Math.round(data.fiberPer100),
  }), [editingItem]);

  const onFormSubmit = useCallback((data: IngredientEditFormData) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    onSubmit(buildIngredient(data));
  }, [onSubmit, buildIngredient]);

  const handleClose = useCallback(() => {
    if (isDirty) { setShowUnsavedDialog(true); return; }
    onClose();
  }, [isDirty, onClose]);

  const handleSaveAndBack = useCallback(() => {
    rhfSubmit((data) => {
      onSubmit(buildIngredient(data));
    }, () => {
      setShowUnsavedDialog(false);
    })();
  }, [rhfSubmit, onSubmit, buildIngredient]);

  const handleAISearch = async () => {
    const nameVi = watchName;
    const unitVi = getLocalizedField(watchUnit, lang);
    try {
      setIsSearchingAI(true);
      const info = await suggestIngredientInfo(nameVi, unitVi);
      if (!isMountedRef.current) return;
      setValue('caloriesPer100', Math.round(info.calories), { shouldDirty: true });
      setValue('proteinPer100', Math.round(info.protein), { shouldDirty: true });
      setValue('carbsPer100', Math.round(info.carbs), { shouldDirty: true });
      setValue('fatPer100', Math.round(info.fat), { shouldDirty: true });
      setValue('fiberPer100', Math.round(info.fiber), { shouldDirty: true });
    } catch (error) {
      logger.error({ component: 'IngredientEditModal', action: 'aiSearch' }, error);
      if (!isMountedRef.current) return;
      if (error instanceof Error && error.message === 'Timeout') {
        notify.warning(t('ingredient.aiTimeout'), t('ingredient.aiTimeoutDesc', { name: nameVi }));
      } else {
        notify.error(t('ingredient.aiLookupFailed'), t('ingredient.aiLookupFailedDesc', { name: nameVi }));
      }
    } finally {
      if (isMountedRef.current) setIsSearchingAI(false);
    }
  };

  return (
    <>
    <ModalBackdrop onClose={handleClose} zIndex="z-60">
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden max-h-[90dvh] overflow-y-auto overscroll-contain sm:mx-4">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{editingItem ? t('ingredient.editExisting') : t('ingredient.createNew')}</h4>
                <button onClick={handleClose} data-testid="btn-close-ingredient" aria-label={t('common.closeDialog')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={rhfSubmit(onFormSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="ing-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('ingredient.ingredientName')}</label>
            <div className="flex gap-2">
              <Input id="ing-name" {...register('name.vi')} className={`flex-1 ${errors.name?.vi ? 'border-rose-500' : ''}`} placeholder={t('ingredient.namePlaceholder')} data-testid="input-ing-name" />
              <button type="button" onClick={handleAISearch} disabled={!watchName || !getLocalizedField(watchUnit, lang) || isSearchingAI} data-testid="btn-ai-search" className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" aria-label={getLocalizedField(watchUnit, lang) ? t('ingredient.aiTooltip') : t('ingredient.aiTooltipNoUnit')}>
                {isSearchingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              </button>
            </div>
            {errors.name?.vi && <p data-testid="error-ing-name" className="text-xs text-rose-500 mt-1" role="alert">{errors.name.vi.message}</p>}
          </div>

          <div>
            <label htmlFor="ing-unit" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('ingredient.unitLabel')}</label>
            <UnitSelector
              mode="bilingual"
              id="ing-unit"
              value={watchUnit}
              onChange={v => setValue('unit', v, { shouldDirty: true, shouldValidate: true })}
              error={!!errors.unit?.vi}
              data-testid="input-ing-unit"
            />
            {errors.unit?.vi && <p className="text-xs text-rose-500 mt-1" role="alert">{errors.unit.vi.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {NUMERIC_FIELDS.map(field => {
              const labels: Record<string, string> = { caloriesPer100: 'Calories', proteinPer100: 'Protein', carbsPer100: 'Carbs', fatPer100: 'Fat', fiberPer100: 'Fiber' };
              return (
                <div key={field}>
                  <label htmlFor={`ing-${field}`} className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{labels[field]} / {getDisplayUnit(watchUnit, lang)}</label>
                  <Input id={`ing-${field}`} type="number" step="1" inputMode="numeric" {...register(field, { valueAsNumber: true })} data-testid={`input-ing-${field.replace('Per100', '')}`} className={`w-full ${errors[field] ? 'border-rose-500' : ''}`} />
                  {errors[field] && <p className="text-xs text-rose-500 mt-1" role="alert" data-testid={`error-ing-${field.replace('Per100', '')}`}>{errors[field].message}</p>}
                </div>
              );
            })}
          </div>
          <div className="pt-4">
            <button type="submit" data-testid="btn-save-ingredient" className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-sm shadow-emerald-200 dark:shadow-emerald-900 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-lg"><Save className="w-5 h-5" /> {t('ingredient.saveIngredient')}</button>
          </div>
        </form>
      </div>
    </ModalBackdrop>

    <UnsavedChangesDialog
      isOpen={showUnsavedDialog}
      onSave={handleSaveAndBack}
      onDiscard={onClose}
      onCancel={() => setShowUnsavedDialog(false)}
    />
    </>
  );
};
