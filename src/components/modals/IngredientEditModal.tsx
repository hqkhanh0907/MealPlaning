import React, { useState, useCallback, useRef, useEffect } from 'react';
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

interface IngredientEditModalProps {
  /** Ingredient being edited, or null for creating a new ingredient. */
  editingItem: Ingredient | null;
  /** Called when a valid ingredient is saved (both normal save and save-from-unsaved-dialog). */
  onSubmit: (ingredient: Ingredient) => void;
  /** Called when the modal closes without saving (clean close or discard). */
  onClose: () => void;
}

const NUMERIC_FIELDS = ['caloriesPer100', 'proteinPer100', 'carbsPer100', 'fatPer100', 'fiberPer100'] as const;
type NutritionField = typeof NUMERIC_FIELDS[number];
type IngredientFormErrors = Partial<Record<'name' | 'unit' | NutritionField, string>>;

const EMPTY_FORM: Omit<Ingredient, 'id'> = {
  name: { vi: '' }, caloriesPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, fiberPer100: 0, unit: { vi: '' },
};

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

  const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>(
    () => editingItem ? { ...editingItem } : EMPTY_FORM,
  );
  const [formErrors, setFormErrors] = useState<IngredientFormErrors>({});
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Guard to prevent stale AI responses from updating a closed modal
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true; // ensure true after StrictMode double-invoke
    return () => { isMountedRef.current = false; };
  }, []);

  // String state for numeric inputs to allow clearing without snap-back on mobile
  const [numericInputs, setNumericInputs] = useState<Record<string, string>>(
    () => Object.fromEntries(NUMERIC_FIELDS.map(f => [f, String(editingItem ? Math.round(editingItem[f]) : 0)])),
  );

  const hasChanges = useCallback((): boolean => {
    const nameVal = formData.name[lang];
    const unitVal = formData.unit[lang];
    if (!editingItem) return nameVal !== '' || unitVal !== '' || NUMERIC_FIELDS.some(f => numericInputs[f] !== '0');
    return formData.name[lang] !== editingItem.name[lang] ||
      formData.unit[lang] !== editingItem.unit[lang] ||
      NUMERIC_FIELDS.some(f => {
        const orig = editingItem[f];
        const str = numericInputs[f];
        const n = Math.round(Number.parseFloat(str));
        if (str.trim() === '' || Number.isNaN(Number.parseFloat(str))) return true;
        return n !== Math.round(orig);
      });
  }, [editingItem, formData, lang, numericInputs]);

  const buildIngredient = (): Ingredient => ({
    ...formData,
    name: {
      vi: formData.name.vi,
    },
    unit: {
      vi: formData.unit.vi,
    },
    caloriesPer100: Math.round(Number.parseFloat(numericInputs.caloriesPer100)),
    proteinPer100: Math.round(Number.parseFloat(numericInputs.proteinPer100)),
    carbsPer100: Math.round(Number.parseFloat(numericInputs.carbsPer100)),
    fatPer100: Math.round(Number.parseFloat(numericInputs.fatPer100)),
    fiberPer100: Math.round(Number.parseFloat(numericInputs.fiberPer100)),
    id: editingItem ? editingItem.id : `ing-${Date.now()}`,
  });

  const validate = (): boolean => {
    const errors: IngredientFormErrors = {};
    if (!formData.name[lang].trim()) errors.name = t('ingredient.validationName');
    if (!formData.unit[lang].trim()) errors.unit = t('ingredient.validationUnit');
    for (const f of NUMERIC_FIELDS) {
      const v = numericInputs[f];
      if (v.trim() === '') {
        errors[f] = t('ingredient.validationNumberRequired');
      } else {
        const n = Number.parseFloat(v);
        if (Number.isNaN(n) || n < 0) errors[f] = t('ingredient.validationNumberNegative');
      }
    }
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return false; }
    return true;
  };

  const hasSubmittedRef = useRef(false);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (hasSubmittedRef.current) return;
    if (!validate()) return;
    hasSubmittedRef.current = true;
    onSubmit(buildIngredient());
  };

  const handleClose = () => {
    if (hasChanges()) { setShowUnsavedDialog(true); return; }
    onClose();
  };

  const handleSaveAndBack = () => {
    if (!validate()) { setShowUnsavedDialog(false); return; }
    onSubmit(buildIngredient());
  };

  const handleAISearch = async () => {
    const nameVi = getLocalizedField(formData.name, lang);
    const unitVi = getLocalizedField(formData.unit, lang);
    try {
      setIsSearchingAI(true);
      const info = await suggestIngredientInfo(nameVi, unitVi);
      if (!isMountedRef.current) return;
      setFormData(prev => ({
        ...prev,
        caloriesPer100: Math.round(info.calories), proteinPer100: Math.round(info.protein),
        carbsPer100: Math.round(info.carbs), fatPer100: Math.round(info.fat), fiberPer100: Math.round(info.fiber),
      }));
      setNumericInputs(prev => ({
        ...prev,
        caloriesPer100: String(Math.round(info.calories)), proteinPer100: String(Math.round(info.protein)),
        carbsPer100: String(Math.round(info.carbs)), fatPer100: String(Math.round(info.fat)), fiberPer100: String(Math.round(info.fiber)),
      }));
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="ing-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('ingredient.ingredientName')}</label>
            <div className="flex gap-2">
              <input id="ing-name" value={formData.name[lang]} onChange={e => { const val = e.target.value; setFormData(prev => ({ ...prev, name: { ...prev.name, [lang]: val } })); if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined })); }} className={`flex-1 px-4 py-2.5 rounded-xl border ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100`} placeholder={t('ingredient.namePlaceholder')} data-testid="input-ing-name" />
              <button type="button" onClick={handleAISearch} disabled={!getLocalizedField(formData.name, lang) || !getLocalizedField(formData.unit, lang) || isSearchingAI} data-testid="btn-ai-search" className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" aria-label={getLocalizedField(formData.unit, lang) ? t('ingredient.aiTooltip') : t('ingredient.aiTooltipNoUnit')}>
                {isSearchingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              </button>
            </div>
            {formErrors.name && <p data-testid="error-ing-name" className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="ing-unit" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('ingredient.unitLabel')}</label>
            <UnitSelector
              mode="bilingual"
              id="ing-unit"
              value={formData.unit}
              onChange={v => { setFormData(prev => ({ ...prev, unit: v })); if (formErrors.unit) setFormErrors(prev => ({ ...prev, unit: undefined })); }}
              error={!!formErrors.unit}
              data-testid="input-ing-unit"
            />
            {formErrors.unit && <p className="text-xs text-rose-500 mt-1">{formErrors.unit}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(['caloriesPer100', 'proteinPer100', 'carbsPer100', 'fatPer100', 'fiberPer100'] as const).map(field => {
              const labels: Record<string, string> = { caloriesPer100: 'Calories', proteinPer100: 'Protein', carbsPer100: 'Carbs', fatPer100: 'Fat', fiberPer100: 'Fiber' };
              return (
                <div key={field}>
                  <label htmlFor={`ing-${field}`} className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{labels[field]} / {getDisplayUnit(formData.unit, lang)}</label>
                  <input id={`ing-${field}`} name={`ing-${field}`} type="number" step="1" inputMode="numeric" value={numericInputs[field]} onChange={e => { const v = e.target.value; setNumericInputs(prev => ({ ...prev, [field]: v })); const n = Math.round(Number.parseFloat(v)); if (!Number.isNaN(n) && n >= 0) { setFormData(prev => ({ ...prev, [field]: n })); } if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined })); }} data-testid={`input-ing-${field.replace('Per100', '')}`} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors[field] ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} focus:border-emerald-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100`} />
                  {formErrors[field] && <p className="text-xs text-rose-500 mt-1" data-testid={`error-ing-${field.replace('Per100', '')}`}>{formErrors[field]}</p>}
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
