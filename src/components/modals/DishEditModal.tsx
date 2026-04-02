import { zodResolver } from '@hookform/resolvers/zod';
import {
  Clock,
  Droplets,
  Dumbbell,
  Flame,
  Loader2,
  Minus,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Wheat,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Resolver } from 'react-hook-form';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

import { getMealTagOptions } from '../../data/constants';
import { type DishEditFormData, dishEditSchema } from '../../schemas/dishEditSchema';
import { suggestDishIngredients } from '../../services/geminiService';
import { Dish, Ingredient, MealType, SuggestedDishIngredient, SupportedLang } from '../../types';
import { generateUUID } from '../../utils/helpers';
import { getLocalizedField } from '../../utils/localize';
import { StringNumberController } from '../form/StringNumberController';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { UnsavedChangesDialog } from '../shared/UnsavedChangesDialog';
import { AISuggestIngredientsPreview, ConfirmedSuggestion } from './AISuggestIngredientsPreview';
import { QuickAddIngredientForm } from './QuickAddIngredientForm';

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

export const DishEditModal = ({
  editingItem,
  ingredients,
  allDishes = [],
  onSubmit,
  onClose,
  onCreateIngredient,
}: DishEditModalProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;

  const {
    control,
    getValues,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, isDirty },
  } = useForm<DishEditFormData>({
    resolver: zodResolver(dishEditSchema) as unknown as Resolver<DishEditFormData>,
    mode: 'onBlur',
    defaultValues: {
      name: editingItem ? getLocalizedField(editingItem.name, lang) : '',
      tags: editingItem ? ([...(editingItem.tags || [])] as DishEditFormData['tags']) : [],
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
        const inputEl = ingId
          ? document.querySelector<HTMLInputElement>(`[data-testid="input-dish-amount-${ingId}"]`)
          : null;
        const displayValue = inputEl?.value ?? '';
        const parsedDisplay = Number.parseFloat(displayValue);
        if (displayValue !== '' && !Number.isNaN(parsedDisplay) && parsedDisplay >= 0) {
          clearErrors(`ingredients.${i}.amount`);
        }
      }
    }
  });

  const buildDish = (values: DishEditFormData): Dish => ({
    id: editingItem ? editingItem.id : generateUUID(),
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
      const inputEl = document.querySelector<HTMLInputElement>(
        `[data-testid="input-dish-amount-${values.ingredients[i].ingredientId}"]`,
      );
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
    if (isDirty) {
      setShowUnsavedDialog(true);
      return;
    }
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

  const handleAiSuggestConfirm = useCallback(
    (selected: ConfirmedSuggestion[]) => {
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
            id: generateUUID(),
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
    },
    [getValues, append, errors.ingredients, clearErrors],
  );

  const handleSaveAndBack = () => {
    if (!validateForm()) {
      setShowUnsavedDialog(false);
      return;
    }
    extraIngredients.forEach(ing => onCreateIngredient?.(ing));
    onSubmit(buildDish(getValues()));
  };

  const handleAddIngredient = useCallback(
    (ingId: string) => {
      append({ ingredientId: ingId, amount: 100 });
      if (errors.ingredients?.message) clearErrors('ingredients');
    },
    [append, errors.ingredients, clearErrors],
  );

  const handleRemoveIngredient = (ingId: string) => {
    const idx = fields.findIndex(f => f.ingredientId === ingId);
    if (idx !== -1) remove(idx);
  };

  const handleTagToggle = (type: MealType, isActive: boolean) => {
    const currentTags = getValues('tags');
    if (isActive) {
      setValue(
        'tags',
        currentTags.filter(t2 => t2 !== type),
        { shouldDirty: true },
      );
    } else {
      setValue('tags', [...currentTags, type] as DishEditFormData['tags'], { shouldDirty: true });
      if (errors.tags) clearErrors('tags');
    }
  };

  const handleQuickAddIngredient = useCallback(
    (newIng: Ingredient) => {
      setExtraIngredients(prev => [...prev, newIng]);
      handleAddIngredient(newIng.id);
    },
    [handleAddIngredient],
  );

  return (
    <>
      <ModalBackdrop onClose={handleClose} zIndex="z-60">
        <div className="bg-card relative flex h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {editingItem ? t('dish.editExisting') : t('dish.createNew')}
            </h4>
            <button
              onClick={handleClose}
              data-testid="btn-close-dish"
              aria-label={t('common.closeDialog')}
              className="dark:text-muted-foreground flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-6">
            <div>
              <label htmlFor="dish-name" className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">
                {t('dish.dishName')}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="dish-name"
                  autoComplete="off"
                  value={watchedName}
                  onChange={e => {
                    setValue('name', e.target.value, { shouldDirty: true });
                    if (errors.name) {
                      clearErrors('name');
                    }
                    setAiSuggestError('');
                  }}
                  className={`flex-1 ${errors.name ? 'border-rose-500' : ''}`}
                  placeholder={t('dish.namePlaceholder')}
                  data-testid="input-dish-name"
                />
                {aiSuggestLoading ? (
                  <div
                    className="flex h-10 min-h-11 w-10 min-w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30"
                    data-testid="ai-suggest-loading"
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={!watchedName.trim()}
                    title={t('dish.aiSuggestButton')}
                    aria-label={t('dish.aiSuggestButton')}
                    data-testid="btn-ai-suggest"
                    className="flex h-10 min-h-11 w-10 min-w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-all hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                  >
                    <Sparkles className="h-5 w-5" />
                  </button>
                )}
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500" data-testid="error-dish-name">
                  {errors.name.message}
                </p>
              )}
              {aiSuggestError && (
                <p className="mt-1 text-xs text-rose-500" data-testid="ai-suggest-error">
                  {aiSuggestError}
                </p>
              )}
              {aiSuggestLoading && <p className="mt-1 text-xs text-indigo-500">{t('dish.aiSuggestLoading')}</p>}
            </div>
            <div>
              <p
                className={`mb-1.5 block text-xs font-bold uppercase ${errors.tags ? 'text-rose-500' : 'text-muted-foreground'}`}
              >
                {t('dish.suitableFor')} <span className="text-rose-500">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {getMealTagOptions(t).map(({ type, label, icon: TagIcon }) => {
                  const isActive = watchedTags.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTagToggle(type, isActive)}
                      data-testid={`tag-${type}`}
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600'}`}
                    >
                      <TagIcon className="size-4" aria-hidden="true" /> {label}
                    </button>
                  );
                })}
              </div>
              {errors.tags && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.tags.message}</p>}
            </div>

            {/* Rating & Notes */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">{t('dish.rating')}</p>
                <div className="flex gap-1" data-testid="dish-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      data-testid={`star-${star}`}
                      onClick={() => setValue('rating', watchedRating === star ? 0 : star, { shouldDirty: true })}
                      className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1 text-2xl transition-all ${star <= watchedRating ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300 dark:text-slate-600'}`}
                      aria-label={`${star} ${t('dish.stars')}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">{t('dish.notes')}</p>
                <textarea
                  data-testid="dish-notes"
                  value={watchedNotes ?? ''}
                  onChange={e => setValue('notes', e.target.value, { shouldDirty: true })}
                  placeholder={t('dish.notesPlaceholder')}
                  rows={2}
                  className="focus:border-primary w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition-all outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Ingredient Selector */}
              <div className="space-y-3">
                <p className="text-muted-foreground block text-xs font-bold uppercase">{t('dish.selectIngredients')}</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="dish-ingredient-search"
                      autoComplete="off"
                      data-testid="input-dish-ingredient-search"
                      name="dish-ingredient-search"
                      aria-label={t('dish.searchIngredients')}
                      value={ingredientSearch}
                      onChange={e => setIngredientSearch(e.target.value)}
                      className="w-full pr-4 pl-9"
                      placeholder={t('dish.searchIngredients')}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(v => !v)}
                    title={t('dish.quickAddTitle')}
                    aria-label={t('dish.quickAddTitle')}
                    data-testid="btn-quick-add-ingredient"
                    className={`flex h-10 min-h-11 w-10 min-w-11 shrink-0 items-center justify-center rounded-xl transition-all ${showQuickAdd ? 'bg-primary text-primary-foreground' : 'text-primary bg-slate-100 hover:bg-emerald-50 dark:bg-slate-700 dark:hover:bg-emerald-900/30'}`}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-600">
                  {(() => {
                    const pickerSelectedIds = new Set(fields.map(f => f.ingredientId));
                    const available = allIngredients
                      .filter(ing => !pickerSelectedIds.has(ing.id))
                      .filter(ing =>
                        getLocalizedField(ing.name, lang).toLowerCase().includes(ingredientSearch.toLowerCase()),
                      );
                    if (available.length === 0)
                      return (
                        <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-500">
                          {pickerSelectedIds.size === allIngredients.length
                            ? t('dish.allIngredientsSelected')
                            : t('dish.noIngredientFound')}
                        </div>
                      );
                    const recentlyUsed = available
                      .filter(ing => ingredientFrequency.has(ing.id))
                      .sort((a, b) => (ingredientFrequency.get(b.id) ?? 0) - (ingredientFrequency.get(a.id) ?? 0))
                      .slice(0, 10);
                    const recentIds = new Set(recentlyUsed.map(ing => ing.id));
                    const rest = available.filter(ing => !recentIds.has(ing.id));
                    const renderIngButton = (ing: Ingredient) => (
                      <button
                        key={ing.id}
                        data-testid={`btn-add-ing-${ing.id}`}
                        type="button"
                        onClick={() => handleAddIngredient(ing.id)}
                        className="group flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {getLocalizedField(ing.name, lang)}
                          </span>
                          <span className="ml-2 text-xs text-slate-500 dark:text-slate-500">
                            {Math.round(ing.caloriesPer100)}cal · {Math.round(ing.proteinPer100)}g pro
                          </span>
                        </div>
                        <Plus className="group-hover:text-primary h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                      </button>
                    );
                    return (
                      <>
                        {recentlyUsed.length > 0 && !ingredientSearch && (
                          <>
                            <div
                              data-testid="recently-used-header"
                              className="flex items-center gap-1.5 bg-amber-50/50 px-4 py-2 dark:bg-amber-900/10"
                            >
                              <Clock className="h-3 w-3 text-amber-500" />
                              <span className="text-[10px] font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400">
                                {t('dish.recentlyUsed')}
                              </span>
                            </div>
                            {recentlyUsed.map(renderIngButton)}
                            {rest.length > 0 && (
                              <div className="bg-slate-50 px-4 py-2 dark:bg-slate-700/50">
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-500">
                                  {t('dish.allIngredients')}
                                </span>
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
                  <QuickAddIngredientForm onAdd={handleQuickAddIngredient} onCancel={() => setShowQuickAdd(false)} />
                )}
              </div>
              {/* Selected Ingredients */}
              <div className="space-y-3">
                <p className="text-muted-foreground block text-xs font-bold uppercase">
                  {t('dish.selectedIngredients')}
                </p>
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const ing = allIngredients.find(i => i.id === field.ingredientId);
                    if (!ing) return null;
                    const currentAmount = watchedIngredients[index]?.amount;
                    const safeAmount =
                      typeof currentAmount === 'number' && !Number.isNaN(currentAmount) ? currentAmount : 0;
                    return (
                      <div
                        key={field.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {getLocalizedField(ing.name, lang)}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const step = getAmountStep(safeAmount);
                                const a = Math.max(0, safeAmount - step);
                                setValue(`ingredients.${index}.amount`, a, { shouldDirty: true });
                              }}
                              aria-label={`${t('common.decrease')} ${getLocalizedField(ing.name, lang)}`}
                              className="flex h-10 min-h-11 w-10 min-w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <StringNumberController<DishEditFormData>
                              name={`ingredients.${index}.amount`}
                              control={control}
                              inputMode="numeric"
                              testId={`input-dish-amount-${field.ingredientId}`}
                              ariaLabel={getLocalizedField(ing.name, lang)}
                              className={`w-16 rounded-lg border px-2 py-1 text-center text-sm ${errors.ingredients?.[index]?.amount ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'} focus:border-primary bg-white transition-all outline-none dark:bg-slate-700 dark:text-slate-100`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const step = getAmountStep(safeAmount);
                                const a = safeAmount + step;
                                setValue(`ingredients.${index}.amount`, a, { shouldDirty: true });
                              }}
                              aria-label={`${t('common.increase')} ${getLocalizedField(ing.name, lang)}`}
                              className="flex h-10 min-h-11 w-10 min-w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <span className="text-muted-foreground ml-1 text-xs font-medium">
                              {getLocalizedField(ing.unit, lang)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                            {Math.round((ing.caloriesPer100 * safeAmount) / 100)}cal ·{' '}
                            {Math.round((ing.proteinPer100 * safeAmount) / 100)}g pro ·{' '}
                            {Math.round((ing.carbsPer100 * safeAmount) / 100)}g carb ·{' '}
                            {Math.round((ing.fatPer100 * safeAmount) / 100)}g fat
                          </p>
                          {errors.ingredients?.[index]?.amount && (
                            <p
                              className="mt-1 text-xs text-rose-500"
                              data-testid={`error-dish-amount-${field.ingredientId}`}
                            >
                              {errors.ingredients[index].amount.message}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(field.ingredientId)}
                          aria-label={`${t('common.delete')} ${getLocalizedField(ing.name, lang)}`}
                          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-rose-400 transition-all hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                  {fields.length === 0 && (
                    <div>
                      <p className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-500">
                        {t('dish.noIngredientSelected')}
                      </p>
                      {errors.ingredients?.message && (
                        <p className="mt-1 text-xs text-rose-500" data-testid="error-dish-ingredients">
                          {errors.ingredients.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Live nutrition preview */}
          {fields.length > 0 &&
            (() => {
              const totals = watchedIngredients.reduce(
                (acc, si) => {
                  const ing = allIngredients.find(i => i.id === si.ingredientId);
                  if (!ing) return acc;
                  const safeAmt = typeof si.amount === 'number' && !Number.isNaN(si.amount) ? si.amount : 0;
                  const factor = safeAmt / 100;
                  return {
                    cal: acc.cal + ing.caloriesPer100 * factor,
                    prot: acc.prot + ing.proteinPer100 * factor,
                    carbs: acc.carbs + ing.carbsPer100 * factor,
                    fat: acc.fat + ing.fatPer100 * factor,
                  };
                },
                { cal: 0, prot: 0, carbs: 0, fat: 0 },
              );
              return (
                <div className="flex items-center justify-around gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3 text-center dark:border-slate-700 dark:bg-slate-700/50">
                  <div>
                    <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                      <Flame className="size-3.5" aria-hidden="true" /> KCal
                    </p>
                    <p
                      data-testid="dish-total-calories"
                      className="text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      {Math.round(totals.cal)}
                    </p>
                  </div>
                  <div>
                    <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                      <Dumbbell className="size-3.5" aria-hidden="true" /> Protein
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(totals.prot)}g</p>
                  </div>
                  <div>
                    <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                      <Wheat className="size-3.5" aria-hidden="true" /> Carbs
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(totals.carbs)}g</p>
                  </div>
                  <div>
                    <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                      <Droplets className="size-3.5" aria-hidden="true" /> Fat
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(totals.fat)}g</p>
                  </div>
                </div>
              );
            })()}
          <div className="border-t border-slate-100 p-6 dark:border-slate-700">
            <button
              type="button"
              onClick={handleFormSubmit}
              data-testid="btn-save-dish"
              className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-lg font-bold shadow-sm transition-all dark:shadow-emerald-900"
            >
              <Save className="h-5 w-5" /> {t('dish.saveDish')}
            </button>
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
