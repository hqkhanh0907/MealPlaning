import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Save, Search, Minus, X, Loader2, Sparkles, Clock } from 'lucide-react';
import { Dish, Ingredient, DishIngredient, MealType, SupportedLang, SuggestedDishIngredient } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { generateId } from '../../utils/helpers';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { UnsavedChangesDialog } from '../shared/UnsavedChangesDialog';
import { getMealTagOptions } from '../../data/constants';
import { suggestIngredientInfo, suggestDishIngredients } from '../../services/geminiService';
import { UnitSelector } from '../shared/UnitSelector';
import { AISuggestIngredientsPreview, ConfirmedSuggestion } from './AISuggestIngredientsPreview';

interface DishEditModalProps {
  /** Dish being edited, or null for creating a new dish. */
  editingItem: Dish | null;
  ingredients: Ingredient[];
  /** All dishes — used to compute ingredient usage frequency for "recently used" section. */
  allDishes?: Dish[];
  /** Called when a valid dish is saved (both normal save and save-from-unsaved-dialog). */
  onSubmit: (dish: Dish) => void;
  /** Called when the modal closes without saving (clean close or discard). */
  onClose: () => void;
  /** Optional: called when a new ingredient is created inline to propagate it to parent state. */
  onCreateIngredient?: (ing: Ingredient) => void;
}

/** Step size for ± amount buttons based on current value magnitude. */
const getAmountStep = (amount: number): number => {
  if (amount < 10) return 1;
  if (amount < 100) return 5;
  return 10;
};

/** Display unit for nutrition labels: "100g" for g/kg, "100ml" for ml/l, "1 {unit}" for others. */
const getDisplayUnit = (unit: { vi: string; en: string }, lang: SupportedLang) => {
  const u = getLocalizedField(unit, lang).toLowerCase().trim();
  if (u === 'kg' || u === 'g') return '100g';
  if (u === 'l' || u === 'ml') return '100ml';
  return `1 ${getLocalizedField(unit, lang)}`;
};

export const DishEditModal: React.FC<DishEditModalProps> = ({
  editingItem, ingredients, allDishes = [], onSubmit, onClose, onCreateIngredient,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const [namePrimary, setNamePrimary] = useState(() => editingItem ? getLocalizedField(editingItem.name, lang) : '');
  const [selectedIngredients, setSelectedIngredients] = useState<DishIngredient[]>(
    () => editingItem ? [...editingItem.ingredients] : [],
  );
  const [tags, setTags] = useState<MealType[]>(() => editingItem ? [...(editingItem.tags || [])] : []);
  const [rating, setRating] = useState<number>(() => editingItem?.rating ?? 0);
  const [notes, setNotes] = useState<string>(() => editingItem?.notes ?? '');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; tags?: string; ingredients?: string; amounts?: Partial<Record<string, string>> }>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // String state per ingredient amount to allow clearing/retyping without snap-back on mobile
  const [amountStrings, setAmountStrings] = useState<Record<string, string>>(
    () => Object.fromEntries((editingItem?.ingredients ?? []).map(si => [si.ingredientId, String(Math.round(si.amount))])),
  );

  // Quick-add ingredient inline form state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qaName, setQaName] = useState('');
  const [qaUnit, setQaUnit] = useState<{ vi: string; en: string }>({ vi: 'g', en: 'g' });
  const [qaCal, setQaCal] = useState('');
  const [qaProtein, setQaProtein] = useState('');
  const [qaCarbs, setQaCarbs] = useState('');
  const [qaFat, setQaFat] = useState('');
  const [qaFiber, setQaFiber] = useState('');
  const [qaAiLoading, setQaAiLoading] = useState(false);
  const [qaError, setQaError] = useState('');
  const [extraIngredients, setExtraIngredients] = useState<Ingredient[]>([]);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);

  // AI Suggest Ingredients state
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedDishIngredient[] | null>(null);
  const [aiSuggestError, setAiSuggestError] = useState('');
  const aiSuggestAbortRef = useRef<AbortController | null>(null);

  // Combine passed-in ingredients + any newly created inline ingredients
  const allIngredients = useMemo(() => [...ingredients, ...extraIngredients], [ingredients, extraIngredients]);

  const ingredientFrequency = useMemo(() => {
    const freq = new Map<string, number>();
    for (const dish of allDishes) {
      for (const di of dish.ingredients) {
        freq.set(di.ingredientId, (freq.get(di.ingredientId) ?? 0) + 1);
      }
    }
    return freq;
  }, [allDishes]);

  const hasChanges = useCallback((): boolean => {
    if (!editingItem) return namePrimary !== '' || selectedIngredients.length > 0 || tags.length > 0 || rating > 0 || notes !== '';
    if (namePrimary !== getLocalizedField(editingItem.name, lang)) return true;
    if (JSON.stringify(tags) !== JSON.stringify(editingItem.tags || [])) return true;
    if (rating !== (editingItem.rating ?? 0)) return true;
    if (notes !== (editingItem.notes ?? '')) return true;
    if (selectedIngredients.length !== editingItem.ingredients.length) return true;
    return selectedIngredients.some((si, i) => {
      const orig = editingItem.ingredients[i];
      if (si.ingredientId !== orig.ingredientId) return true;
      const amtStr = amountStrings[si.ingredientId] ?? String(si.amount);
      return amtStr.trim() === '' || Number.isNaN(Number.parseFloat(amtStr)) || Math.round(Number.parseFloat(amtStr)) !== Math.round(orig.amount);
    });
  }, [editingItem, namePrimary, lang, selectedIngredients, tags, amountStrings, rating, notes]);

  const buildDish = (): Dish => ({
    id: editingItem ? editingItem.id : generateId('dish'),
    name: {
      vi: lang === 'vi' ? namePrimary.trim() : (editingItem?.name.vi ?? namePrimary.trim()),
      en: lang === 'en' ? namePrimary.trim() : (editingItem?.name.en ?? namePrimary.trim()),
    },
    ingredients: selectedIngredients.map(si => ({
      ...si,
      amount: Math.round(Number.parseFloat(amountStrings[si.ingredientId] ?? String(si.amount))),
    })),
    tags,
    ...(rating > 0 ? { rating } : {}),
    ...(notes.trim() ? { notes: notes.trim() } : {}),
  });

  const validate = (): boolean => {
    const errors: { name?: string; tags?: string; ingredients?: string; amounts?: Partial<Record<string, string>> } = {};
    if (!namePrimary.trim()) errors.name = t('dish.validationName');
    if (tags.length === 0) errors.tags = t('dish.validationSelectMeal');
    if (selectedIngredients.length === 0) errors.ingredients = t('dish.validationIngredients');
    const amtErrors: Partial<Record<string, string>> = {};
    for (const si of selectedIngredients) {
      const v = (amountStrings[si.ingredientId] ?? '').trim();
      if (v === '' || Number.isNaN(Number.parseFloat(v))) {
        amtErrors[si.ingredientId] = t('dish.validationAmountRequired');
      } else if (Number.parseFloat(v) < 0) {
        amtErrors[si.ingredientId] = t('dish.validationAmountNegative');
      }
    }
    if (Object.keys(amtErrors).length > 0) errors.amounts = amtErrors;
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return false; }
    return true;
  };

  const hasSubmittedRef = useRef(false);

  const handleSubmit = () => {
    if (hasSubmittedRef.current) return;
    if (!validate()) return;
    hasSubmittedRef.current = true;
    // Flush newly-created extra ingredients to parent ONLY on successful save
    extraIngredients.forEach(ing => onCreateIngredient?.(ing));
    onSubmit(buildDish());
  };

  const handleClose = () => {
    aiSuggestAbortRef.current?.abort();
    if (hasChanges()) { setShowUnsavedDialog(true); return; }
    onClose();
  };

  const handleAiSuggest = useCallback(async () => {
    if (!namePrimary.trim()) return;
    aiSuggestAbortRef.current?.abort();
    const ctrl = new AbortController();
    aiSuggestAbortRef.current = ctrl;
    setAiSuggestLoading(true);
    setAiSuggestError('');
    try {
      const results = await suggestDishIngredients(namePrimary.trim(), ctrl.signal);
      if (!ctrl.signal.aborted) {
        setAiSuggestions(results);
      }
    } catch {
      if (!ctrl.signal.aborted) {
        setAiSuggestError(t('dish.aiSuggestError'));
      }
    } finally {
      if (!ctrl.signal.aborted) setAiSuggestLoading(false);
    }
  }, [namePrimary, t]);

  const handleAiSuggestConfirm = useCallback((selected: ConfirmedSuggestion[]) => {
    for (const item of selected) {
      if (item.matchedIngredient) {
        const matchedId = item.matchedIngredient.id;
        const alreadyAdded = selectedIngredients.some(si => si.ingredientId === matchedId);
        if (!alreadyAdded) {
          setSelectedIngredients(prev => [...prev, { ingredientId: matchedId, amount: item.amount }]);
          setAmountStrings(prev => ({ ...prev, [matchedId]: String(item.amount) }));
        }
      } else {
        const newIng: Ingredient = {
          id: generateId('ing'),
          name: { vi: item.suggestion.name, en: item.suggestion.name },
          unit: { vi: item.suggestion.unit, en: item.suggestion.unit },
          caloriesPer100: item.suggestion.calories,
          proteinPer100: item.suggestion.protein,
          carbsPer100: item.suggestion.carbs,
          fatPer100: item.suggestion.fat,
          fiberPer100: item.suggestion.fiber,
        };
        setExtraIngredients(prev => [...prev, newIng]);
        setSelectedIngredients(prev => [...prev, { ingredientId: newIng.id, amount: item.amount }]);
        setAmountStrings(prev => ({ ...prev, [newIng.id]: String(item.amount) }));
      }
    }
    setAiSuggestions(null);
    if (formErrors.ingredients) setFormErrors(prev => ({ ...prev, ingredients: undefined }));
  }, [selectedIngredients, formErrors.ingredients]);

  const handleSaveAndBack = () => {
    if (!validate()) { setShowUnsavedDialog(false); return; }
    extraIngredients.forEach(ing => onCreateIngredient?.(ing));
    onSubmit(buildDish());
  };

  const handleAddIngredient = useCallback((ingId: string) => {
    setSelectedIngredients(prev => [...prev, { ingredientId: ingId, amount: 100 }]);
    setAmountStrings(prev => ({ ...prev, [ingId]: '100' }));
    if (formErrors.ingredients) setFormErrors(prev => ({ ...prev, ingredients: undefined }));
  }, [formErrors.ingredients]);

  const handleRemoveIngredient = (ingId: string) => {
    setSelectedIngredients(prev => prev.filter(si => si.ingredientId !== ingId));
    setAmountStrings(prev => { const r = { ...prev }; delete r[ingId]; return r; });
  };

  const handleUpdateAmount = (ingId: string, amount: number) => {
    setSelectedIngredients(prev => prev.map(si => si.ingredientId === ingId ? { ...si, amount } : si));
  };

  const handleTagToggle = (type: MealType, isActive: boolean) => {    setTags(prev => isActive ? prev.filter(t => t !== type) : [...prev, type]);
    if (!isActive && formErrors.tags) setFormErrors(prev => ({ ...prev, tags: undefined }));
  };

  const resetQuickAdd = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiAbortRef.current?.abort();
    setShowQuickAdd(false);
    setQaName('');
    setQaUnit({ vi: 'g', en: 'g' });
    setQaCal('');
    setQaProtein('');
    setQaCarbs('');
    setQaFat('');
    setQaFiber('');
    setQaAiLoading(false);
    setQaError('');
  }, []);

  const triggerAIFill = useCallback((name: string, unit: string) => {
    if (!name.trim() || !unit.trim()) return;
    // unit here is the vi/display value
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiAbortRef.current?.abort();
    aiTimerRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      aiAbortRef.current = ctrl;
      setQaAiLoading(true);
      try {
        const info = await suggestIngredientInfo(name.trim(), unit.trim(), ctrl.signal);
        if (!ctrl.signal.aborted) {
          setQaCal(String(Math.round(info.calories)));
          setQaProtein(String(Math.round(info.protein)));
          setQaCarbs(String(Math.round(info.carbs)));
          setQaFat(String(Math.round(info.fat)));
          setQaFiber(String(Math.round(info.fiber)));
        }
      } catch {
        // silent — user fills manually
      } finally {
        setQaAiLoading(false);
      }
    }, 800);
  }, []);

  const handleQuickCreate = useCallback(() => {
    if (!qaName.trim()) { setQaError(t('dish.quickAddValidationName')); return; }
    const primaryName = qaName.trim();
    const newIng: Ingredient = {
      id: generateId('ing'),
      name: { vi: primaryName, en: primaryName },
      unit: { vi: qaUnit.vi.trim() || 'g', en: qaUnit.en.trim() || 'g' },
      caloriesPer100: Number(qaCal) || 0,
      proteinPer100: Number(qaProtein) || 0,
      carbsPer100: Number(qaCarbs) || 0,
      fatPer100: Number(qaFat) || 0,
      fiberPer100: Number(qaFiber) || 0,
    };
    setExtraIngredients(prev => [...prev, newIng]);
    handleAddIngredient(newIng.id);
    resetQuickAdd();
  }, [qaName, qaUnit, qaCal, qaProtein, qaCarbs, qaFat, qaFiber, t, handleAddIngredient, resetQuickAdd]);

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
            <div className="flex items-center gap-2">
              <input id="dish-name" value={namePrimary} onChange={e => { setNamePrimary(e.target.value); if (formErrors.name) { setFormErrors(prev => ({ ...prev, name: undefined })); } setAiSuggestError(''); }} className={`flex-1 px-4 py-2.5 rounded-xl border ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100`} placeholder={t('dish.namePlaceholder')} data-testid="input-dish-name" />
              {aiSuggestLoading ? (
                <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center" data-testid="ai-suggest-loading">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={!namePrimary.trim()}
                  title={t('dish.aiSuggestButton')}
                  data-testid="btn-ai-suggest"
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              )}
            </div>
            {formErrors.name && <p className="text-xs text-rose-500 mt-1" data-testid="error-dish-name">{formErrors.name}</p>}
            {aiSuggestError && <p className="text-xs text-rose-500 mt-1" data-testid="ai-suggest-error">{aiSuggestError}</p>}
            {aiSuggestLoading && <p className="text-xs text-indigo-500 mt-1">{t('dish.aiSuggestLoading')}</p>}
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

          {/* Rating & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('dish.rating')}</p>
              <div className="flex gap-1" data-testid="dish-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    data-testid={`star-${star}`}
                    onClick={() => setRating(prev => prev === star ? 0 : star)}
                    className={`p-1 text-2xl transition-all min-h-11 min-w-11 flex items-center justify-center rounded-lg ${star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'}`}
                    aria-label={`${star} ${t('dish.stars')}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('dish.notes')}</p>
              <textarea
                data-testid="dish-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('dish.notesPlaceholder')}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ingredient Selector */}
            <div className="space-y-3">
              <p className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('dish.selectIngredients')}</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="dish-ingredient-search" data-testid="input-dish-ingredient-search" name="dish-ingredient-search" aria-label={t('dish.searchIngredients')} value={ingredientSearch} onChange={e => setIngredientSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100" placeholder={t('dish.searchIngredients')} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(v => !v)}
                  title={t('dish.quickAddTitle')}
                  data-testid="btn-quick-add-ingredient"
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showQuickAdd ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-xl divide-y divide-slate-100 dark:divide-slate-700">
                {(() => {
                  const pickerSelectedIds = new Set(selectedIngredients.map(si => si.ingredientId));
                  const available = allIngredients.filter(ing => !pickerSelectedIds.has(ing.id)).filter(ing => getLocalizedField(ing.name, lang).toLowerCase().includes(ingredientSearch.toLowerCase()));
                  if (available.length === 0) return <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">{pickerSelectedIds.size === allIngredients.length ? t('dish.allIngredientsSelected') : t('dish.noIngredientFound')}</div>;
                  const recentlyUsed = available.filter(ing => ingredientFrequency.has(ing.id)).sort((a, b) => (ingredientFrequency.get(b.id) ?? 0) - (ingredientFrequency.get(a.id) ?? 0)).slice(0, 10);
                  const recentIds = new Set(recentlyUsed.map(ing => ing.id));
                  const rest = available.filter(ing => !recentIds.has(ing.id));
                  const renderIngButton = (ing: Ingredient) => (
                    <button key={ing.id} data-testid={`btn-add-ing-${ing.id}`} type="button" onClick={() => handleAddIngredient(ing.id)} className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center justify-between group transition-all">
                      <div className="flex-1 min-w-0">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{getLocalizedField(ing.name, lang)}</span>
                        <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{Math.round(ing.caloriesPer100)}cal · {Math.round(ing.proteinPer100)}g pro</span>
                      </div>
                      <Plus className="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500" />
                    </button>
                  );
                  return (
                    <>
                      {recentlyUsed.length > 0 && !ingredientSearch && (
                        <>
                          <div data-testid="recently-used-header" className="px-4 py-2 bg-amber-50/50 dark:bg-amber-900/10 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('dish.recentlyUsed')}</span>
                          </div>
                          {recentlyUsed.map(renderIngButton)}
                          {rest.length > 0 && (
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('dish.allIngredients')}</span>
                            </div>
                          )}
                        </>
                      )}
                      {ingredientSearch ? available.map(renderIngButton) : rest.map(renderIngButton)}
                    </>
                  );
                })()}
              </div>
              {/* Quick-add bottom sheet overlay */}
              {showQuickAdd && (
                <div className="fixed inset-0 z-70 flex items-end sm:items-center justify-center">
                  {/* backdrop — keyboard-accessible via aria-hidden, close via Escape is handled by ModalBackdrop */}
                  <button type="button" aria-label="close quick-add" className="absolute inset-0 bg-black/30 cursor-default" onClick={resetQuickAdd} />
                  <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md p-6 space-y-4 max-h-[80dvh] overflow-y-auto overscroll-contain">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{t('dish.quickAddTitle')}</p>
                      <button type="button" onClick={resetQuickAdd} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500"><X className="w-5 h-5" /></button>
                    </div>
                    <div>
                      <label htmlFor="qa-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('dish.quickAddName')} <span className="text-rose-500">*</span></label>
                      <input
                        id="qa-name"
                        name="qa-name"
                        data-testid="input-qa-name"
                        value={qaName}
                        onChange={e => { setQaName(e.target.value); setQaError(''); }}
                        onBlur={() => triggerAIFill(qaName, qaUnit.vi)}
                        placeholder={t('dish.quickAddNamePlaceholder')}
                        className={`w-full px-3 py-2 text-sm rounded-xl border ${qaError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} bg-white dark:bg-slate-700 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all`}
                      />
                      {qaError && <p className="text-xs text-rose-500 mt-0.5">{qaError}</p>}
                    </div>
                    <div>
                      <label htmlFor="qa-unit" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('dish.quickAddUnit')}</label>
                      <UnitSelector
                        mode="bilingual"
                        id="qa-unit"
                        value={qaUnit}
                        onChange={v => { setQaUnit(v); triggerAIFill(qaName, v.vi); }}
                        data-testid="qa-unit"
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
                              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                        {[
                          { label: 'Cal', value: qaCal, setter: setQaCal },
                          { label: 'Protein', value: qaProtein, setter: setQaProtein },
                          { label: 'Carbs', value: qaCarbs, setter: setQaCarbs },
                          { label: 'Fat', value: qaFat, setter: setQaFat },
                          { label: 'Fiber', value: qaFiber, setter: setQaFiber },
                        ].map(({ label, value, setter }) => (
                          <div key={label}>
                            <label htmlFor={`qa-${label.toLowerCase()}`} className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">{label} / {getDisplayUnit(qaUnit, lang)}</label>
                            <input
                              id={`qa-${label.toLowerCase()}`}
                              name={`qa-${label.toLowerCase()}`}
                              type="number"
                              min="0"
                              step="1"
                              inputMode="numeric"
                              value={value}
                              onChange={e => setter(e.target.value)}
                              disabled={qaAiLoading}
                              placeholder="0"
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={resetQuickAdd} data-testid="btn-qa-cancel" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                        {t('dish.quickAddCancel')}
                      </button>
                      <button type="button" onClick={handleQuickCreate} data-testid="btn-qa-submit" className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5">
                        <Plus className="w-4 h-4" /> {t('dish.quickAddSubmit')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Selected Ingredients */}
            <div className="space-y-3">
              <p className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('dish.selectedIngredients')}</p>
              <div className="space-y-2">
                {selectedIngredients.map(si => {
                  const ing = allIngredients.find(i => i.id === si.ingredientId);
                  if (!ing) return null;
                  return (
                    <div key={si.ingredientId} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{getLocalizedField(ing.name, lang)}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button type="button" onClick={() => { const step = getAmountStep(si.amount); const a = Math.max(0, si.amount - step); handleUpdateAmount(si.ingredientId, a); setAmountStrings(prev => ({ ...prev, [si.ingredientId]: String(a) })); }} className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 active:bg-slate-300 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"><Minus className="w-4 h-4" /></button>
                          <input type="number" step="1" inputMode="numeric" value={amountStrings[si.ingredientId] ?? String(si.amount)} onChange={e => { const v = e.target.value; setAmountStrings(prev => ({ ...prev, [si.ingredientId]: v })); const n = Math.round(Number.parseFloat(v)); if (!Number.isNaN(n) && n >= 0) { handleUpdateAmount(si.ingredientId, n); } if (formErrors.amounts?.[si.ingredientId]) { setFormErrors(prev => ({ ...prev, amounts: { ...prev.amounts, [si.ingredientId]: undefined } })); } }} data-testid={`input-dish-amount-${si.ingredientId}`} id={`dish-amount-${si.ingredientId}`} name={`dish-amount-${si.ingredientId}`} aria-label={getLocalizedField(ing.name, lang)} className={`w-16 px-2 py-1 text-sm text-center rounded-lg border ${formErrors.amounts?.[si.ingredientId] ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} outline-none focus:border-emerald-500 transition-all bg-white dark:bg-slate-700 dark:text-slate-100`} />
                          <button type="button" onClick={() => { const step = getAmountStep(si.amount); const a = si.amount + step; handleUpdateAmount(si.ingredientId, a); setAmountStrings(prev => ({ ...prev, [si.ingredientId]: String(a) })); }} className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 active:bg-slate-300 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"><Plus className="w-4 h-4" /></button>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">{getLocalizedField(ing.unit, lang)}</span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{Math.round(ing.caloriesPer100 * si.amount / 100)}cal · {Math.round(ing.proteinPer100 * si.amount / 100)}g pro · {Math.round(ing.carbsPer100 * si.amount / 100)}g carb · {Math.round(ing.fatPer100 * si.amount / 100)}g fat</p>
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
        {/* Live nutrition preview */}
        {selectedIngredients.length > 0 && (() => {
          const totals = selectedIngredients.reduce((acc, si) => {
            const ing = allIngredients.find(i => i.id === si.ingredientId);
            if (!ing) return acc;
            const factor = si.amount / 100;
            return {
              cal: acc.cal + ing.caloriesPer100 * factor,
              prot: acc.prot + ing.proteinPer100 * factor,
              carbs: acc.carbs + ing.carbsPer100 * factor,
              fat: acc.fat + ing.fatPer100 * factor,
            };
          }, { cal: 0, prot: 0, carbs: 0, fat: 0 });
          return (
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-around gap-3 text-center">
              <div><p className="text-xs text-slate-400 dark:text-slate-500">🔥 KCal</p><p data-testid="dish-total-calories" className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(totals.cal)}</p></div>
              <div><p className="text-xs text-slate-400 dark:text-slate-500">💪 Protein</p><p className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(totals.prot)}g</p></div>
              <div><p className="text-xs text-slate-400 dark:text-slate-500">🌾 Carbs</p><p className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(totals.carbs)}g</p></div>
              <div><p className="text-xs text-slate-400 dark:text-slate-500">💧 Fat</p><p className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(totals.fat)}g</p></div>
            </div>
          );
        })()}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700">
          <button type="button" onClick={handleSubmit} data-testid="btn-save-dish" className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-sm shadow-emerald-200 dark:shadow-emerald-900 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-lg"><Save className="w-5 h-5" /> {t('dish.saveDish')}</button>
        </div>
      </div>
    </ModalBackdrop>

    {aiSuggestions !== null && (
      <AISuggestIngredientsPreview
        dishName={namePrimary}
        suggestions={aiSuggestions}
        existingIngredients={allIngredients}
        onConfirm={handleAiSuggestConfirm}
        onClose={() => setAiSuggestions(null)}
      />
    )}

    <UnsavedChangesDialog
      isOpen={showUnsavedDialog}
      onSave={handleSaveAndBack}
      onDiscard={onClose}
      onCancel={() => setShowUnsavedDialog(false)}
    />
    </>
  );
};
