import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Sparkles, Loader2, X } from 'lucide-react';
import { Ingredient } from '../../types';
import { suggestIngredientInfo } from '../../services/geminiService';
import { useNotification } from '../../contexts/NotificationContext';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { UnsavedChangesDialog } from '../shared/UnsavedChangesDialog';
import { logger } from '../../utils/logger';

interface IngredientEditModalProps {
  /** Ingredient being edited, or null for creating a new ingredient. */
  editingItem: Ingredient | null;
  /** Called when a valid ingredient is saved (both normal save and save-from-unsaved-dialog). */
  onSubmit: (ingredient: Ingredient) => void;
  /** Called when the modal closes without saving (clean close or discard). */
  onClose: () => void;
}

const EMPTY_FORM: Omit<Ingredient, 'id'> = {
  name: '', caloriesPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, fiberPer100: 0, unit: '',
};

const getDisplayUnit = (unit: string) => {
  const u = unit.toLowerCase().trim();
  if (u === 'kg' || u === 'g') return '100g';
  if (u === 'l' || u === 'ml') return '100ml';
  return `1 ${unit}`;
};

export const IngredientEditModal: React.FC<IngredientEditModalProps> = ({
  editingItem, onSubmit, onClose,
}) => {
  const { t } = useTranslation();
  const notify = useNotification();

  const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>(
    () => editingItem ? { ...editingItem } : EMPTY_FORM,
  );
  const [formErrors, setFormErrors] = useState<{ name?: string; unit?: string }>({});
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Guard to prevent stale AI responses from updating a closed modal
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const hasChanges = useCallback((): boolean => {
    if (!editingItem) return formData.name !== '' || formData.unit !== '';
    return formData.name !== editingItem.name || formData.unit !== editingItem.unit ||
      formData.caloriesPer100 !== editingItem.caloriesPer100 || formData.proteinPer100 !== editingItem.proteinPer100 ||
      formData.carbsPer100 !== editingItem.carbsPer100 || formData.fatPer100 !== editingItem.fatPer100 ||
      formData.fiberPer100 !== editingItem.fiberPer100;
  }, [editingItem, formData]);

  const buildIngredient = (): Ingredient => ({
    ...formData,
    id: editingItem ? editingItem.id : `ing-${Date.now()}`,
  });

  const validate = (): boolean => {
    const errors: { name?: string; unit?: string } = {};
    if (!formData.name.trim()) errors.name = t('ingredient.validationName');
    if (!formData.unit.trim()) errors.unit = t('ingredient.validationUnit');
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return false; }
    return true;
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
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
    if (!formData.name || !formData.unit) return;
    try {
      setIsSearchingAI(true);
      const info = await suggestIngredientInfo(formData.name, formData.unit);
      if (!isMountedRef.current) return;
      setFormData(prev => ({
        ...prev,
        caloriesPer100: info.calories, proteinPer100: info.protein,
        carbsPer100: info.carbs, fatPer100: info.fat, fiberPer100: info.fiber,
      }));
    } catch (error) {
      logger.error({ component: 'IngredientEditModal', action: 'aiSearch' }, error);
      if (!isMountedRef.current) return;
      if (error instanceof Error && error.message === 'Timeout') {
        notify.warning(t('ingredient.aiTimeout'), t('ingredient.aiTimeoutDesc', { name: formData.name }));
      } else {
        notify.error(t('ingredient.aiLookupFailed'), t('ingredient.aiLookupFailedDesc', { name: formData.name }));
      }
    } finally {
      if (isMountedRef.current) setIsSearchingAI(false);
    }
  };

  return (
    <>
    <ModalBackdrop onClose={handleClose} zIndex="z-60">
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden max-h-[90vh] overflow-y-auto sm:mx-4">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{editingItem ? t('ingredient.editExisting') : t('ingredient.createNew')}</h4>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="ing-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('ingredient.ingredientName')}</label>
            <div className="flex gap-2">
              <input id="ing-name" value={formData.name} onChange={e => { setFormData({ ...formData, name: e.target.value }); if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined })); }} className={`flex-1 px-4 py-2.5 rounded-xl border ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100`} placeholder={t('ingredient.namePlaceholder')} data-testid="input-ing-name" />
              <button type="button" onClick={handleAISearch} disabled={!formData.name || !formData.unit || isSearchingAI} data-testid="btn-ai-search" className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" title={formData.unit ? t('ingredient.aiTooltip') : t('ingredient.aiTooltipNoUnit')}>
                {isSearchingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              </button>
            </div>
            {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="ing-unit" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('ingredient.unitLabel')}</label>
            <input id="ing-unit" value={formData.unit} onChange={e => { setFormData({ ...formData, unit: e.target.value }); if (formErrors.unit) setFormErrors(prev => ({ ...prev, unit: undefined })); }} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.unit ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100`} placeholder={t('ingredient.unitPlaceholder')} data-testid="input-ing-unit" />
            {formErrors.unit && <p className="text-xs text-rose-500 mt-1">{formErrors.unit}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(['caloriesPer100', 'proteinPer100', 'carbsPer100', 'fatPer100', 'fiberPer100'] as const).map(field => {
              const labels: Record<string, string> = { caloriesPer100: 'Calories', proteinPer100: 'Protein', carbsPer100: 'Carbs', fatPer100: 'Fat', fiberPer100: 'Fiber' };
              return (
                <div key={field}>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{labels[field]} / {getDisplayUnit(formData.unit)}</label>
                  <input type="number" required step="0.1" min="0" value={formData[field]} onChange={e => setFormData({ ...formData, [field]: Math.max(0, Number(e.target.value)) })} data-testid={`input-ing-${field.replace('Per100', '')}`} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100" />
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
