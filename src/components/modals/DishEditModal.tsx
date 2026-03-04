import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Save, Search, Minus, X } from 'lucide-react';
import { Dish, Ingredient, DishIngredient, MealType, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { generateId } from '../../utils/helpers';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { UnsavedChangesDialog } from '../shared/UnsavedChangesDialog';
import { getMealTagOptions } from '../../data/constants';

interface DishEditModalProps {
  /** Dish being edited, or null for creating a new dish. */
  editingItem: Dish | null;
  ingredients: Ingredient[];
  /** Called when a valid dish is saved (both normal save and save-from-unsaved-dialog). */
  onSubmit: (dish: Dish) => void;
  /** Called when the modal closes without saving (clean close or discard). */
  onClose: () => void;
}

export const DishEditModal: React.FC<DishEditModalProps> = ({
  editingItem, ingredients, onSubmit, onClose,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const [nameVi, setNameVi] = useState(() => editingItem ? getLocalizedField(editingItem.name, 'vi') : '');
  const [nameEn, setNameEn] = useState(() => editingItem ? getLocalizedField(editingItem.name, 'en') : '');
  const [selectedIngredients, setSelectedIngredients] = useState<DishIngredient[]>(
    () => editingItem ? [...editingItem.ingredients] : [],
  );
  const [tags, setTags] = useState<MealType[]>(() => editingItem ? [...(editingItem.tags || [])] : []);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; tags?: string; ingredients?: string; amounts?: Partial<Record<string, string>> }>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // String state per ingredient amount to allow clearing/retyping without snap-back on mobile
  const [amountStrings, setAmountStrings] = useState<Record<string, string>>(
    () => Object.fromEntries((editingItem?.ingredients ?? []).map(si => [si.ingredientId, String(si.amount)])),
  );

  const hasChanges = useCallback((): boolean => {
    if (!editingItem) return nameVi !== '' || nameEn !== '' || selectedIngredients.length > 0 || tags.length > 0;
    if (nameVi !== getLocalizedField(editingItem.name, 'vi')) return true;
    if (nameEn !== getLocalizedField(editingItem.name, 'en')) return true;
    if (JSON.stringify(tags) !== JSON.stringify(editingItem.tags || [])) return true;
    if (selectedIngredients.length !== editingItem.ingredients.length) return true;
    return selectedIngredients.some((si, i) => {
      const orig = editingItem.ingredients[i];
      if (si.ingredientId !== orig.ingredientId) return true;
      const amtStr = amountStrings[si.ingredientId] ?? String(si.amount);
      const amtNum = Number.parseFloat(amtStr);
      if (amtStr.trim() === '' || Number.isNaN(amtNum)) return true;
      return amtNum !== orig.amount;
    });
  }, [editingItem, nameVi, nameEn, selectedIngredients, tags, amountStrings]);

  const buildDish = (): Dish => ({
    id: editingItem ? editingItem.id : generateId('dish'),
    name: { vi: nameVi.trim() || nameEn.trim(), en: nameEn.trim() || nameVi.trim() },
    ingredients: selectedIngredients.map(si => ({
      ...si,
      amount: Number.parseFloat(amountStrings[si.ingredientId] ?? String(si.amount)),
    })),
    tags,
  });

  const validate = (): boolean => {
    const errors: { name?: string; tags?: string; ingredients?: string; amounts?: Partial<Record<string, string>> } = {};
    if (!nameVi.trim()) errors.name = t('dish.validationName');
    if (tags.length === 0) errors.tags = t('dish.validationSelectMeal');
    if (selectedIngredients.length === 0) errors.ingredients = t('dish.validationIngredients');
    const amtErrors: Partial<Record<string, string>> = {};
    for (const si of selectedIngredients) {
      const v = (amountStrings[si.ingredientId] ?? '').trim();
      if (v === '') {
        amtErrors[si.ingredientId] = t('dish.validationAmountRequired');
      } else {
        const n = Number.parseFloat(v);
        if (Number.isNaN(n)) amtErrors[si.ingredientId] = t('dish.validationAmountRequired');
        else if (n < 0) amtErrors[si.ingredientId] = t('dish.validationAmountNegative');
      }
    }
    if (Object.keys(amtErrors).length > 0) errors.amounts = amtErrors;
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return false; }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(buildDish());
  };

  const handleClose = () => {
    if (hasChanges()) { setShowUnsavedDialog(true); return; }
    onClose();
  };

  const handleSaveAndBack = () => {
    if (!validate()) { setShowUnsavedDialog(false); return; }
    onSubmit(buildDish());
  };

  const handleAddIngredient = (ingId: string) => {
    if (selectedIngredients.some(si => si.ingredientId === ingId)) return;
    setSelectedIngredients(prev => [...prev, { ingredientId: ingId, amount: 100 }]);
    setAmountStrings(prev => ({ ...prev, [ingId]: '100' }));
    if (formErrors.ingredients) setFormErrors(prev => ({ ...prev, ingredients: undefined }));
  };

  const handleRemoveIngredient = (ingId: string) => {
    setSelectedIngredients(prev => prev.filter(si => si.ingredientId !== ingId));
    setAmountStrings(prev => { const r = { ...prev }; delete r[ingId]; return r; });
  };

  const handleUpdateAmount = (ingId: string, amount: number) => {
    setSelectedIngredients(prev => prev.map(si => si.ingredientId === ingId ? { ...si, amount } : si));
  };

  const handleTagToggle = (type: MealType, isActive: boolean) => {
    setTags(prev => isActive ? prev.filter(t => t !== type) : [...prev, type]);
    if (!isActive && formErrors.tags) setFormErrors(prev => ({ ...prev, tags: undefined }));
  };

  return (
    <>
    <ModalBackdrop onClose={handleClose} zIndex="z-60">
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-2xl h-[90dvh] sm:h-auto sm:max-h-[90dvh] overflow-hidden flex flex-col sm:mx-4">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{editingItem ? t('dish.editExisting') : t('dish.createNew')}</h4>
          <button onClick={handleClose} data-testid="btn-close-dish" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
          <div>
            <label htmlFor="dish-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('dish.dishName')}</label>
            <input id="dish-name" value={nameVi} onChange={e => { setNameVi(e.target.value); if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined })); }} className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100`} placeholder={t('dish.namePlaceholder')} data-testid="input-dish-name" />
            {formErrors.name && <p className="text-xs text-rose-500 mt-1" data-testid="error-dish-name">{formErrors.name}</p>}
            <label htmlFor="dish-name-en" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 mt-3">{t('dish.nameEnLabel', 'Tên món (EN)')}</label>
            <input id="dish-name-en" value={nameEn} onChange={e => setNameEn(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100" placeholder={t('dish.nameEnPlaceholder', 'e.g. Grilled chicken')} data-testid="input-dish-name-en" />
          </div>
          <div>
            <p className={`block text-xs font-bold uppercase mb-1.5 ${formErrors.tags ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>{t('dish.suitableFor')} <span className="text-rose-500">*</span></p>
            <div className="flex gap-2 flex-wrap">
              {getMealTagOptions(t).map(({ type, label, icon }) => {
                const isActive = tags.includes(type);
                return (
                  <button key={type} type="button" onClick={() => handleTagToggle(type, isActive)} data-testid={`tag-${type}`} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all min-h-11 ${isActive ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300'}`}>
                    {icon} {label}
                  </button>
                );
              })}
            </div>
            {formErrors.tags && <p className="text-xs text-rose-500 mt-1.5 font-medium">{formErrors.tags}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ingredient Selector */}
            <div className="space-y-3">
              <p className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('dish.selectIngredients')}</p>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={ingredientSearch} onChange={e => setIngredientSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100" placeholder={t('dish.searchIngredients')} />
              </div>
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-xl divide-y divide-slate-100 dark:divide-slate-700">
                {(() => {
                  const pickerSelectedIds = new Set(selectedIngredients.map(si => si.ingredientId));
                  const available = ingredients.filter(ing => !pickerSelectedIds.has(ing.id)).filter(ing => getLocalizedField(ing.name, lang).toLowerCase().includes(ingredientSearch.toLowerCase()));
                  if (available.length === 0) return <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">{pickerSelectedIds.size === ingredients.length ? t('dish.allIngredientsSelected') : t('dish.noIngredientFound')}</div>;
                  return available.map(ing => (
                    <button key={ing.id} type="button" onClick={() => handleAddIngredient(ing.id)} className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center justify-between group transition-all">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{getLocalizedField(ing.name, lang)}</span>
                      <Plus className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500" />
                    </button>
                  ));
                })()}
              </div>
            </div>
            {/* Selected Ingredients */}
            <div className="space-y-3">
              <p className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('dish.selectedIngredients')}</p>
              <div className="space-y-2">
                {selectedIngredients.map(si => {
                  const ing = ingredients.find(i => i.id === si.ingredientId);
                  if (!ing) return null;
                  return (
                    <div key={si.ingredientId} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{getLocalizedField(ing.name, lang)}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button type="button" onClick={() => { const a = Math.max(0, si.amount - 10); handleUpdateAmount(si.ingredientId, a); setAmountStrings(prev => ({ ...prev, [si.ingredientId]: String(a) })); }} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 active:bg-slate-300 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"><Minus className="w-3.5 h-3.5" /></button>
                          <input type="number" step="0.1" value={amountStrings[si.ingredientId] ?? String(si.amount)} onChange={e => { const v = e.target.value; setAmountStrings(prev => ({ ...prev, [si.ingredientId]: v })); const n = Number.parseFloat(v); if (!Number.isNaN(n) && n >= 0) { handleUpdateAmount(si.ingredientId, n); } if (formErrors.amounts?.[si.ingredientId]) { setFormErrors(prev => ({ ...prev, amounts: { ...prev.amounts, [si.ingredientId]: undefined } })); } }} data-testid={`input-dish-amount-${si.ingredientId}`} className={`w-16 px-2 py-1 text-sm text-center rounded-lg border ${formErrors.amounts?.[si.ingredientId] ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} outline-none focus:border-emerald-500 transition-all bg-white dark:bg-slate-700 dark:text-slate-100`} />
                          <button type="button" onClick={() => { const a = si.amount + 10; handleUpdateAmount(si.ingredientId, a); setAmountStrings(prev => ({ ...prev, [si.ingredientId]: String(a) })); }} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 active:bg-slate-300 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"><Plus className="w-3.5 h-3.5" /></button>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">{getLocalizedField(ing.unit, lang)}</span>
                        </div>
                        {formErrors.amounts?.[si.ingredientId] && <p className="text-xs text-rose-500 mt-1" data-testid={`error-dish-amount-${si.ingredientId}`}>{formErrors.amounts[si.ingredientId]}</p>}
                      </div>
                      <button type="button" onClick={() => handleRemoveIngredient(si.ingredientId)} className="p-2 text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  );
                })}
                {selectedIngredients.length === 0 && (
                  <div>
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl">{t('dish.noIngredientSelected')}</p>
                    {formErrors.ingredients && <p className="text-xs text-rose-500 mt-1" data-testid="error-dish-ingredients">{formErrors.ingredients}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-700">
          <button type="button" onClick={handleSubmit} data-testid="btn-save-dish" className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-sm shadow-emerald-200 dark:shadow-emerald-900 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-lg"><Save className="w-5 h-5" /> {t('dish.saveDish')}</button>
        </div>
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
