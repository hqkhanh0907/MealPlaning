import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Save, Search, Minus, X, Loader2, Sparkles, Clock, Flame, Dumbbell, Wheat, Droplets } from 'lucide-react';
import { Dish, Ingredient, MealType, SupportedLang, SuggestedDishIngredient } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { generateId } from '../../utils/helpers';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { UnsavedChangesDialog } from '../shared/UnsavedChangesDialog';
import { getMealTagOptions } from '../../data/constants';
import { suggestDishIngredients } from '../../services/geminiService';
import { AISuggestIngredientsPreview, ConfirmedSuggestion } from './AISuggestIngredientsPreview';
import { QuickAddIngredientForm } from './QuickAddIngredientForm';
import { StringNumberController } from '../form/StringNumberController';
import { dishEditSchema, type DishEditFormData } from '../../schemas/dishEditSchema';
import { Input } from '@/components/ui/input';

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

export const DishEditModal: React.FC<DishEditModalProps> = ({
  editingItem, ingredients, allDishes = [], onSubmit, onClose, onCreateIngredient,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;

  const { control, getValues, setValue, setError, clearErrors, watch, formState: { errors, isDirty } } = useForm<DishEditFormData>({
    resolver: zodResolver(dishEditSchema),
    mode: 'onBlur',
    defaultValues: {
      name: editingItem ? getLocalizedField(editingItem.name, lang) : '',
      tags: editingItem ? [...(editingItem.tags || [])] as DishEditFormData['tags'] : [],
      rating: editingItem?.rating ?? 0,
      notes: editingItem?.notes ?? '',
      ingredients: editingItem
        ? editingItem.ingredients.map(i => ({ ingredientId: i.ingredientId, amount: Math.round(i.amount) }))
        : [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });

  const [ingredientSearch, setIngredientSearch] = useState('');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const watchedName = watch('name');
  const watchedTags = watch('tags');
  const watchedRating = watch('rating');
  const watchedNotes = watch('notes');
  const watchedIngredients = watch('ingredients');

  // Quick-add ingredient inline form state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [extraIngredients, setExtraIngredients] = useState<Ingredient[]>([]);

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

  // Clear ingredient amount errors reactively when display value becomes valid
  useEffect(() => {
    const ingErrors = errors.ingredients;
    if (!ingErrors) return;
    for (let i = 0; i < watchedIngredients.length; i++) {
      const indexed = ingErrors as unknown as Record<number, { amount?: { message?: string } }>;
      const entry = indexed?.[i];
      if (entry?.amount) {
        const ingId = watchedIngredients[i]?.ingredientId;
        const inputEl = ingId ? document.querySelector(`[data-testid="input-dish-amount-${ingId}"]`) as HTMLInputElement | null : null;
        const displayValue = inputEl?.value ?? '';
        const parsedDisplay = Number.parseFloat(displayValue);
        if (displayValue !== '' && !Number.isNaN(parsedDisplay) && parsedDisplay >= 0) {
          clearErrors(`ingredients.${i}.amount`);
        }
      }
    }
  });

  const buildDish = (values: DishEditFormData): Dish => ({
    id: editingItem ? editingItem.id : generateId('dish'),
    name: {
      vi: values.name.trim(),
    },
    ingredients: values.ingredients.map(si => ({
      ...si,
      amount: Math.round(Number.isNaN(si.amount) ? 0 : si.amount),
    })),
    tags: values.tags as MealType[],
    ...(values.rating > 0 ? { rating: values.rating } : {}),
    ...((values.notes ?? '').trim() ? { notes: (values.notes ?? '').trim() } : {}),
  });

  const validateForm = (): boolean => {
    const values = getValues();
    let hasError = false;

    if (!values.name.trim()) {
      setError('name', { message: t('dish.validationName') });
      hasError = true;
    }
    if (values.tags.length === 0) {
      setError('tags', { message: t('dish.validationSelectMeal') });
      hasError = true;
    }
    if (values.ingredients.length === 0) {
      setError('ingredients', { message: t('dish.validationIngredients') });
      hasError = true;
    }

    for (let i = 0; i < values.ingredients.length; i++) {
      const inputEl = document.querySelector(`[data-testid="input-dish-amount-${values.ingredients[i].ingredientId}"]`) as HTMLInputElement | null;
      const displayValue = inputEl ? inputEl.value : String(values.ingredients[i].amount);
      if (displayValue === '' || Number.isNaN(Number.parseFloat(displayValue))) {
        setError(`ingredients.${i}.amount`, { message: t('dish.validationAmountRequired') });
        hasError = true;
      } else if (Number.parseFloat(displayValue) < 0) {
        setError(`ingredients.${i}.amount`, { message: t('dish.validationAmountNegative') });
        hasError = true;
      }
    }

    return !hasError;
  };

  const hasSubmittedRef = useRef(false);

  const handleFormSubmit = () => {
    if (hasSubmittedRef.current) return;
    if (!validateForm()) return;
    hasSubmittedRef.current = true;
    extraIngredients.forEach(ing => onCreateIngredient?.(ing));
    onSubmit(buildDish(getValues()));
  };

  const handleClose = () => {
    aiSuggestAbortRef.current?.abort();
    if (isDirty) { setShowUnsavedDialog(true); return; }
    onClose();
  };

  const handleAiSuggest = useCallback(async () => {
    const currentName = getValues('name');
    if (!currentName.trim()) return;
    aiSuggestAbortRef.current?.abort();
    const ctrl = new AbortController();
    aiSuggestAbortRef.current = ctrl;
    setAiSuggestLoading(true);
    setAiSuggestError('');
    try {
      const results = await suggestDishIngredients(currentName.trim(), ctrl.signal);
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
  }, [getValues, t]);

  const handleAiSuggestConfirm = useCallback((selected: ConfirmedSuggestion[]) => {
    const currentIngredients = getValues('ingredients');
    for (const item of selected) {
      if (item.matchedIngredient) {
        const matchedId = item.matchedIngredient.id;
        const alreadyAdded = currentIngredients.some(si => si.ingredientId === matchedId);
        if (!alreadyAdded) {
          append({ ingredientId: matchedId, amount: item.amount });
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
        append({ ingredientId: newIng.id, amount: item.amount });
      }
    }
    setAiSuggestions(null);
    if (errors.ingredients?.message) clearErrors('ingredients');
  }, [getValues, append, errors.ingredients, clearErrors]);

  const handleSaveAndBack = () => {
    if (!validateForm()) { setShowUnsavedDialog(false); return; }
    extraIngredients.forEach(ing => onCreateIngredient?.(ing));
    onSubmit(buildDish(getValues()));
  };

  const handleAddIngredient = useCallback((ingId: string) => {
    append({ ingredientId: ingId, amount: 100 });
    if (errors.ingredients?.message) clearErrors('ingredients');
  }, [append, errors.ingredients, clearErrors]);

  const handleRemoveIngredient = (ingId: string) => {
    const idx = fields.findIndex(f => f.ingredientId === ingId);
    if (idx !== -1) remove(idx);
  };

  const handleTagToggle = (type: MealType, isActive: boolean) => {
    const currentTags = getValues('tags');
    if (isActive) {
      setValue('tags', currentTags.filter(t2 => t2 !== type) as DishEditFormData['tags'], { shouldDirty: true });
    } else {
      setValue('tags', [...currentTags, type] as DishEditFormData['tags'], { shouldDirty: true });
      if (errors.tags) clearErrors('tags');
    }
  };

  const handleQuickAddIngredient = useCallback((newIng: Ingredient) => {
    setExtraIngredients(prev => [...prev, newIng]);
    handleAddIngredient(newIng.id);
  }, [handleAddIngredient]);

  return (
    <>
    <ModalBackdrop onClose={handleClose} zIndex="z-60">
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-2xl h-[90dvh] sm:h-auto sm:max-h-[90dvh] overflow-hidden flex flex-col sm:mx-4">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{editingItem ? t('dish.editExisting') : t('dish.createNew')}</h4>
          <button onClick={handleClose} data-testid="btn-close-dish" aria-label={t('common.closeDialog')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 min-h-11 min-w-11 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
          <div>
            <label htmlFor="dish-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t('dish.dishName')}</label>
            <div className="flex items-center gap-2">
              <Input id="dish-name" autoComplete="off" value={watchedName} onChange={e => { setValue('name', e.target.value, { shouldDirty: true }); if (errors.name) clearErrors('name'); setAiSuggestError(''); }} className={`flex-1 ${errors.name ? 'border-rose-500' : ''}`} placeholder={t('dish.namePlaceholder')} data-testid="input-dish-name" />
              {aiSuggestLoading ? (
                <div className="shrink-0 w-10 h-10 min-h-11 min-w-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center" data-testid="ai-suggest-loading">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={!watchedName.trim()}
                  title={t('dish.aiSuggestButton')}
                  aria-label={t('dish.aiSuggestButton')}
                  data-testid="btn-ai-suggest"
                  className="shrink-0 w-10 h-10 min-h-11 min-w-11 rounded-xl flex items-center justify-center transition-all bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              )}
            </div>
            {errors.name && <p className="text-xs text-rose-500 mt-1" data-testid="error-dish-name">{errors.name.message}</p>}
            {aiSuggestError && <p className="text-xs text-rose-500 mt-1" data-testid="ai-suggest-error">{aiSuggestError}</p>}
            {aiSuggestLoading && <p className="text-xs text-indigo-500 mt-1">{t('dish.aiSuggestLoading')}</p>}
          </div>
          <div>
            <p className={`block text-xs font-bold uppercase mb-1.5 ${errors.tags ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>{t('dish.suitableFor')} <span className="text-rose-500">*</span></p>
            <div className="flex gap-2 flex-wrap">
              {getMealTagOptions(t).map(({ type, label, icon: TagIcon }) => {
                const isActive = watchedTags.includes(type);
                return (
                  <button key={type} type="button" onClick={() => handleTagToggle(type, isActive)} data-testid={`tag-${type}`} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all min-h-11 inline-flex items-center gap-1.5 ${isActive ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300'}`}>
                    <TagIcon className="size-4" aria-hidden="true" /> {label}
                  </button>
                );
              })}
            </div>
            {errors.tags && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.tags.message}</p>}
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
                      onClick={() => setValue('rating', watchedRating === star ? 0 : star, { shouldDirty: true })}
                      className={`p-1 text-2xl transition-all min-h-11 min-w-11 flex items-center justify-center rounded-lg ${star <= watchedRating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'}`}
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
                value={watchedNotes ?? ''}
                onChange={e => setValue('notes', e.target.value, { shouldDirty: true })}
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
                  <Input id="dish-ingredient-search" autoComplete="off" data-testid="input-dish-ingredient-search" name="dish-ingredient-search" aria-label={t('dish.searchIngredients')} value={ingredientSearch} onChange={e => setIngredientSearch(e.target.value)} className="w-full pl-9 pr-4" placeholder={t('dish.searchIngredients')} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(v => !v)}
                  title={t('dish.quickAddTitle')}
                  aria-label={t('dish.quickAddTitle')}
                  data-testid="btn-quick-add-ingredient"
                  className={`shrink-0 w-10 h-10 min-h-11 min-w-11 rounded-xl flex items-center justify-center transition-all ${showQuickAdd ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-xl divide-y divide-slate-100 dark:divide-slate-700">
                {(() => {
                  const pickerSelectedIds = new Set(fields.map(f => f.ingredientId));
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
                <QuickAddIngredientForm
                  onAdd={handleQuickAddIngredient}
                  onCancel={() => setShowQuickAdd(false)}
                />
              )}
            </div>
            {/* Selected Ingredients */}
            <div className="space-y-3">
              <p className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('dish.selectedIngredients')}</p>
              <div className="space-y-2">
                {fields.map((field, index) => {
                  const ing = allIngredients.find(i => i.id === field.ingredientId);
                  if (!ing) return null;
                  const currentAmount = watchedIngredients[index]?.amount;
                  const safeAmount = (typeof currentAmount === 'number' && !Number.isNaN(currentAmount)) ? currentAmount : 0;
                  return (
                    <div key={field.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{getLocalizedField(ing.name, lang)}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button type="button" onClick={() => { const step = getAmountStep(safeAmount); const a = Math.max(0, safeAmount - step); setValue(`ingredients.${index}.amount`, a, { shouldDirty: true }); }} aria-label={`${t('common.decrease')} ${getLocalizedField(ing.name, lang)}`} className="w-10 h-10 min-h-11 min-w-11 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 active:bg-slate-300 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"><Minus className="w-4 h-4" /></button>
                          <StringNumberController<DishEditFormData>
                            name={`ingredients.${index}.amount`}
                            control={control}
                            inputMode="numeric"
                            testId={`input-dish-amount-${field.ingredientId}`}
                            ariaLabel={getLocalizedField(ing.name, lang)}
                            className={`w-16 px-2 py-1 text-sm text-center rounded-lg border ${errors.ingredients?.[index]?.amount ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} outline-none focus:border-emerald-500 transition-all bg-white dark:bg-slate-700 dark:text-slate-100`}
                          />
                          <button type="button" onClick={() => { const step = getAmountStep(safeAmount); const a = safeAmount + step; setValue(`ingredients.${index}.amount`, a, { shouldDirty: true }); }} aria-label={`${t('common.increase')} ${getLocalizedField(ing.name, lang)}`} className="w-10 h-10 min-h-11 min-w-11 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 active:bg-slate-300 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"><Plus className="w-4 h-4" /></button>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">{getLocalizedField(ing.unit, lang)}</span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{Math.round(ing.caloriesPer100 * safeAmount / 100)}cal · {Math.round(ing.proteinPer100 * safeAmount / 100)}g pro · {Math.round(ing.carbsPer100 * safeAmount / 100)}g carb · {Math.round(ing.fatPer100 * safeAmount / 100)}g fat</p>
                        {errors.ingredients?.[index]?.amount && <p className="text-xs text-rose-500 mt-1" data-testid={`error-dish-amount-${field.ingredientId}`}>{errors.ingredients[index].amount.message}</p>}
                      </div>
                      <button type="button" onClick={() => handleRemoveIngredient(field.ingredientId)} aria-label={`${t('common.delete')} ${getLocalizedField(ing.name, lang)}`} className="p-2 text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 rounded-lg transition-all min-h-11 min-w-11 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  );
                })}
                {fields.length === 0 && (
                  <div>
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl">{t('dish.noIngredientSelected')}</p>
                    {errors.ingredients?.message && <p className="text-xs text-rose-500 mt-1" data-testid="error-dish-ingredients">{errors.ingredients.message}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Live nutrition preview */}
        {fields.length > 0 && (() => {
          const totals = watchedIngredients.reduce((acc, si) => {
            const ing = allIngredients.find(i => i.id === si.ingredientId);
            if (!ing) return acc;
            const safeAmt = (typeof si.amount === 'number' && !Number.isNaN(si.amount)) ? si.amount : 0;
            const factor = safeAmt / 100;
            return {
              cal: acc.cal + ing.caloriesPer100 * factor,
              prot: acc.prot + ing.proteinPer100 * factor,
              carbs: acc.carbs + ing.carbsPer100 * factor,
              fat: acc.fat + ing.fatPer100 * factor,
            };
          }, { cal: 0, prot: 0, carbs: 0, fat: 0 });
          return (
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-around gap-3 text-center">
              <div><p className="text-xs text-slate-400 dark:text-slate-500 inline-flex items-center gap-1"><Flame className="size-3.5" aria-hidden="true" /> KCal</p><p data-testid="dish-total-calories" className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(totals.cal)}</p></div>
              <div><p className="text-xs text-slate-400 dark:text-slate-500 inline-flex items-center gap-1"><Dumbbell className="size-3.5" aria-hidden="true" /> Protein</p><p className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(totals.prot)}g</p></div>
              <div><p className="text-xs text-slate-400 dark:text-slate-500 inline-flex items-center gap-1"><Wheat className="size-3.5" aria-hidden="true" /> Carbs</p><p className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(totals.carbs)}g</p></div>
              <div><p className="text-xs text-slate-400 dark:text-slate-500 inline-flex items-center gap-1"><Droplets className="size-3.5" aria-hidden="true" /> Fat</p><p className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(totals.fat)}g</p></div>
            </div>
          );
        })()}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700">
          <button type="button" onClick={handleFormSubmit} data-testid="btn-save-dish" className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-sm shadow-emerald-200 dark:shadow-emerald-900 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-lg"><Save className="w-5 h-5" /> {t('dish.saveDish')}</button>
        </div>
      </div>
    </ModalBackdrop>

    {aiSuggestions !== null && (
      <AISuggestIngredientsPreview
        dishName={watchedName}
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
