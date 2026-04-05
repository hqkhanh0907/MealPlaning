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
      /* v8 ignore start -- defensive: tags is always array from store */
      tags: editingItem ? ([...(editingItem.tags || [])] as DishEditFormData['tags']) : [],
      /* v8 ignore stop */
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

  // Memoize ingredient picker data to avoid recalculating on every render
  const selectedIngredientIds = useMemo(() => new Set(fields.map(f => f.ingredientId)), [fields]);
  const filteredIngredients = useMemo(() => {
    const available = allIngredients
      .filter(ing => !selectedIngredientIds.has(ing.id))
      .filter(ing => getLocalizedField(ing.name, lang).toLowerCase().includes(ingredientSearch.toLowerCase()));
    const recentlyUsed = available
      .filter(ing => ingredientFrequency.has(ing.id))
      /* v8 ignore start -- defensive: ingredientFrequency always has values for filtered ingredients */
      .sort((a, b) => (ingredientFrequency.get(b.id) ?? 0) - (ingredientFrequency.get(a.id) ?? 0))
      /* v8 ignore stop */
      .slice(0, 10);
    const recentIds = new Set(recentlyUsed.map(ing => ing.id));
    const rest = available.filter(ing => !recentIds.has(ing.id));
    return { available, recentlyUsed, rest };
  }, [allIngredients, selectedIngredientIds, ingredientSearch, lang, ingredientFrequency]);

  // Clear ingredient amount errors reactively when display value becomes valid
  useEffect(() => {
    const ingErrors = errors.ingredients;
    if (!ingErrors) return;
    for (let i = 0; i < watchedIngredients.length; i++) {
      const indexed = ingErrors as unknown as Record<number, { amount?: { message?: string } }>;
      const entry = indexed?.[i];
      if (entry?.amount) {
        const ingId = watchedIngredients[i]?.ingredientId;
        /* v8 ignore start -- defensive: ingId is always defined for indexed entries */
        const inputEl = ingId
          ? document.querySelector<HTMLInputElement>(`[data-testid="input-dish-amount-${ingId}"]`)
          : null;
        /* v8 ignore stop */
        /* v8 ignore start -- defensive: inputEl is always found by testid */
        const displayValue = inputEl?.value ?? '';
        /* v8 ignore stop */
        const parsedDisplay = Number.parseFloat(displayValue);
        if (displayValue !== '' && !Number.isNaN(parsedDisplay) && parsedDisplay >= 0) {
          clearErrors(`ingredients.${i}.amount`);
        }
      }
    }
  }); // No deps: intentionally runs every render — reads from DOM which is outside React's dep tracking

  const buildDish = (values: DishEditFormData): Dish => ({
    id: editingItem ? editingItem.id : generateUUID(),
    name: {
      vi: values.name.trim(),
    },
    ingredients: values.ingredients.map(si => ({
      ...si,
      /* v8 ignore start -- defensive: validation always catches NaN before buildDish runs */
      amount: Math.round(Number.isNaN(si.amount) ? 0 : si.amount),
      /* v8 ignore stop */
    })),
    tags: values.tags as MealType[],
    ...(values.rating > 0 ? { rating: values.rating } : {}),
    /* v8 ignore start -- defensive: notes is always string from defaultValues */
    ...((values.notes ?? '').trim() ? { notes: (values.notes ?? '').trim() } : {}),
    /* v8 ignore stop */
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
    /* v8 ignore start -- defensive: button is disabled when name is empty */
    if (!currentName.trim()) return;
    /* v8 ignore stop */
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
    /* v8 ignore start -- defensive: remove button only rendered for existing fields */
    if (idx !== -1) remove(idx);
    /* v8 ignore stop */
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
          <div className="border-border-subtle flex items-center justify-between border-b px-6 py-4">
            <h4 className="text-foreground text-lg font-semibold">
              {editingItem ? t('dish.editExisting') : t('dish.createNew')}
            </h4>
            <button
              onClick={handleClose}
              data-testid="btn-close-dish"
              aria-label={t('common.closeDialog')}
              className="dark:text-muted-foreground text-muted-foreground hover:bg-accent focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-6">
            <div>
              <label htmlFor="dish-name" className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase">
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
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'dish-name-error' : undefined}
                />
                {aiSuggestLoading ? (
                  <div
                    className="bg-color-ai-subtle flex h-10 min-h-11 w-10 min-w-11 shrink-0 items-center justify-center rounded-xl"
                    data-testid="ai-suggest-loading"
                  >
                    <Loader2 className="text-color-ai h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={!watchedName.trim()}
                    title={t('dish.aiSuggestButton')}
                    aria-label={t('dish.aiSuggestButton')}
                    data-testid="btn-ai-suggest"
                    className="bg-color-ai-subtle text-color-ai hover:bg-color-ai/10 flex h-10 min-h-11 w-10 min-w-11 shrink-0 items-center justify-center rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Sparkles className="h-5 w-5" />
                  </button>
                )}
              </div>
              {errors.name && (
                <p
                  id="dish-name-error"
                  className="text-destructive mt-1 text-xs"
                  data-testid="error-dish-name"
                  role="alert"
                >
                  {errors.name.message}
                </p>
              )}
              {aiSuggestError && (
                <p className="text-destructive mt-1 text-xs" data-testid="ai-suggest-error">
                  {aiSuggestError}
                </p>
              )}
              {aiSuggestLoading && <p className="text-color-ai mt-1 text-xs">{t('dish.aiSuggestLoading')}</p>}
            </div>
            <div>
              <p
                className={`mb-1.5 block text-xs font-semibold uppercase ${errors.tags ? 'text-destructive' : 'text-muted-foreground'}`}
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
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground-secondary bg-muted hover:bg-accent active:bg-accent'}`}
                    >
                      <TagIcon className="size-4" aria-hidden="true" /> {label}
                    </button>
                  );
                })}
              </div>
              {errors.tags && (
                <p className="text-destructive mt-1.5 text-xs font-medium" role="alert">
                  {errors.tags.message}
                </p>
              )}
            </div>

            {/* Rating & Notes */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase">{t('dish.rating')}</p>
                <div className="flex gap-1" data-testid="dish-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      data-testid={`star-${star}`}
                      onClick={() => setValue('rating', watchedRating === star ? 0 : star, { shouldDirty: true })}
                      className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1 text-2xl transition-all ${star <= watchedRating ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-300'}`}
                      aria-label={`${star} ${t('dish.stars')}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase">{t('dish.notes')}</p>
                <textarea
                  data-testid="dish-notes"
                  value={
                    /* v8 ignore next -- defensive: watchedNotes always string from defaultValues */
                    watchedNotes ?? ''
                  }
                  onChange={e => setValue('notes', e.target.value, { shouldDirty: true })}
                  placeholder={t('dish.notesPlaceholder')}
                  rows={2}
                  className="focus:border-primary border-border bg-card w-full resize-none rounded-xl border px-3 py-2 text-sm transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Ingredient Selector */}
              <div className="space-y-3">
                <p className="text-muted-foreground block text-xs font-semibold uppercase">
                  {t('dish.selectIngredients')}
                </p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
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
                    className={`flex h-10 min-h-11 w-10 min-w-11 shrink-0 items-center justify-center rounded-xl transition-all ${showQuickAdd ? 'bg-primary text-primary-foreground' : 'text-primary hover:bg-primary-subtle bg-muted'}`}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="border-border divide-border max-h-60 divide-y overflow-y-auto rounded-xl border">
                  {(() => {
                    const { available, recentlyUsed, rest } = filteredIngredients;
                    if (available.length === 0)
                      return (
                        <div className="text-muted-foreground px-4 py-6 text-center text-sm">
                          {selectedIngredientIds.size === allIngredients.length
                            ? t('dish.allIngredientsSelected')
                            : t('dish.noIngredientFound')}
                        </div>
                      );
                    const renderIngButton = (ing: Ingredient) => (
                      <button
                        key={ing.id}
                        data-testid={`btn-add-ing-${ing.id}`}
                        type="button"
                        onClick={() => handleAddIngredient(ing.id)}
                        className="group hover:bg-primary-subtle flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-foreground font-medium">{getLocalizedField(ing.name, lang)}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            {Math.round(ing.caloriesPer100)}cal · {Math.round(ing.proteinPer100)}g pro
                          </span>
                        </div>
                        <Plus className="group-hover:text-primary text-muted-foreground h-4 w-4 shrink-0" />
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
                              <Clock className="h-3 w-3 text-amber-500" aria-hidden="true" />
                              <span className="text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
                                {t('dish.recentlyUsed')}
                              </span>
                            </div>
                            {recentlyUsed.map(renderIngButton)}
                            {rest.length > 0 && (
                              <div className="bg-muted px-4 py-2">
                                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
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
                <p className="text-muted-foreground block text-xs font-semibold uppercase">
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
                        className="border-border bg-muted flex items-center justify-between rounded-xl border p-4"
                      >
                        <div className="flex-1">
                          <p className="text-foreground text-sm font-semibold">{getLocalizedField(ing.name, lang)}</p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const step = getAmountStep(safeAmount);
                                const a = Math.max(0, safeAmount - step);
                                setValue(`ingredients.${index}.amount`, a, { shouldDirty: true });
                              }}
                              aria-label={`${t('common.decrease')} ${getLocalizedField(ing.name, lang)}`}
                              className="text-foreground-secondary bg-muted hover:bg-accent active:bg-accent flex h-10 min-h-11 w-10 min-w-11 items-center justify-center rounded-lg transition-all"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <StringNumberController<DishEditFormData>
                              name={`ingredients.${index}.amount`}
                              control={control}
                              inputMode="numeric"
                              testId={`input-dish-amount-${field.ingredientId}`}
                              ariaLabel={getLocalizedField(ing.name, lang)}
                              aria-required={true}
                              className={`w-16 rounded-lg border px-2 py-1 text-center text-sm ${errors.ingredients?.[index]?.amount ? 'border-rose-500' : 'border-border'} focus:border-primary bg-card transition-all outline-none`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const step = getAmountStep(safeAmount);
                                const a = safeAmount + step;
                                setValue(`ingredients.${index}.amount`, a, { shouldDirty: true });
                              }}
                              aria-label={`${t('common.increase')} ${getLocalizedField(ing.name, lang)}`}
                              className="text-foreground-secondary bg-muted hover:bg-accent active:bg-accent flex h-10 min-h-11 w-10 min-w-11 items-center justify-center rounded-lg transition-all"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <span className="text-muted-foreground ml-1 text-xs font-medium">
                              {getLocalizedField(ing.unit, lang)}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {Math.round((ing.caloriesPer100 * safeAmount) / 100)}cal ·{' '}
                            {Math.round((ing.proteinPer100 * safeAmount) / 100)}g pro ·{' '}
                            {Math.round((ing.carbsPer100 * safeAmount) / 100)}g carb ·{' '}
                            {Math.round((ing.fatPer100 * safeAmount) / 100)}g fat
                          </p>
                          {errors.ingredients?.[index]?.amount && (
                            <p
                              className="text-destructive mt-1 text-xs"
                              data-testid={`error-dish-amount-${field.ingredientId}`}
                              role="alert"
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
                      <p className="border-border text-muted-foreground rounded-xl border-2 border-dashed py-8 text-center text-sm">
                        {t('dish.noIngredientSelected')}
                      </p>
                      {errors.ingredients?.message && (
                        <p className="text-destructive mt-1 text-xs" data-testid="error-dish-ingredients" role="alert">
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
                <div className="border-border-subtle bg-muted flex items-center justify-around gap-3 border-t px-6 py-3 text-center">
                  <div>
                    <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <Flame className="size-3.5" aria-hidden="true" /> KCal
                    </p>
                    <p data-testid="dish-total-calories" className="text-foreground text-sm font-semibold">
                      {Math.round(totals.cal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <Dumbbell className="size-3.5" aria-hidden="true" /> Protein
                    </p>
                    <p className="text-foreground text-sm font-semibold">{Math.round(totals.prot)}g</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <Wheat className="size-3.5" aria-hidden="true" /> Carbs
                    </p>
                    <p className="text-foreground text-sm font-semibold">{Math.round(totals.carbs)}g</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <Droplets className="size-3.5" aria-hidden="true" /> Fat
                    </p>
                    <p className="text-foreground text-sm font-semibold">{Math.round(totals.fat)}g</p>
                  </div>
                </div>
              );
            })()}
          <div className="border-border-subtle border-t p-6">
            <button
              type="button"
              onClick={handleFormSubmit}
              data-testid="btn-save-dish"
              className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-lg font-semibold shadow-sm transition-all"
            >
              <Save className="h-5 w-5" aria-hidden="true" /> {t('dish.saveDish')}
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
