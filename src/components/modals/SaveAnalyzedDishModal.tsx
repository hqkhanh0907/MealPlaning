import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, Sparkles, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Resolver } from 'react-hook-form';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

import { useNotification } from '../../contexts/NotificationContext';
import { getMealTagOptions } from '../../data/constants';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { type SaveAnalyzedDishFormData, saveAnalyzedDishSchema } from '../../schemas/saveAnalyzedDishSchema';
import { suggestIngredientInfo } from '../../services/geminiService';
import { AnalyzedDishResult, MealType, SaveAnalyzedDishPayload } from '../../types';
import { logger } from '../../utils/logger';
import { StringNumberController } from '../form/StringNumberController';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { UnitSelector } from '../shared/UnitSelector';

/** Display unit for nutrition labels: "100g" for g/kg, "100ml" for ml/l, "1 {unit}" for others. */
const getDisplayUnit = (unit: string) => {
  const u = unit.toLowerCase().trim();
  if (u === 'kg' || u === 'g') return '100g';
  if (u === 'l' || u === 'ml') return '100ml';
  return `1 ${unit}`;
};

function toggleMealTag(currentTags: MealType[], tagType: MealType): MealType[] {
  return currentTags.includes(tagType) ? currentTags.filter(v => v !== tagType) : [...currentTags, tagType];
}

interface SaveAnalyzedDishModalProps {
  onClose: () => void;
  result: AnalyzedDishResult;
  onSave: (payload: SaveAnalyzedDishPayload) => void;
}

export const SaveAnalyzedDishModal = ({ onClose, result, onSave }: SaveAnalyzedDishModalProps) => {
  const { t } = useTranslation();
  const notify = useNotification();

  const { control, watch, getValues, setValue } = useForm<SaveAnalyzedDishFormData>({
    resolver: zodResolver(saveAnalyzedDishSchema) as unknown as Resolver<SaveAnalyzedDishFormData>,
    mode: 'onBlur',
    defaultValues: {
      name: result.name,
      description: result.description,
      saveDish: true,
      dishTags: [],
      ingredients: result.ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        nutritionPerStandardUnit: {
          calories: ing.nutritionPerStandardUnit.calories,
          protein: ing.nutritionPerStandardUnit.protein,
          carbs: ing.nutritionPerStandardUnit.carbs,
          fat: ing.nutritionPerStandardUnit.fat,
          fiber: ing.nutritionPerStandardUnit.fiber,
        },
      })),
    },
  });

  const { fields } = useFieldArray({ control, name: 'ingredients' });
  const saveDish = watch('saveDish');
  const watchedIngredients = watch('ingredients');

  const [selectedIngredients, setSelectedIngredients] = useState<boolean[]>(() =>
    new Array(result.ingredients.length).fill(true),
  );
  const [researchingIngredientIndex, setResearchingIngredientIndex] = useState<number | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  useModalBackHandler(true, onClose);

  const hasSubmittedRef = useRef(false);

  const handleConfirmSave = () => {
    if (hasSubmittedRef.current) return;

    const formData = getValues();
    const parsed = saveAnalyzedDishSchema.safeParse(formData);

    if (!parsed.success) {
      const hasDishTagsError = parsed.error.issues.some(issue => issue.path.includes('dishTags'));
      if (hasDishTagsError) {
        setTagError(t('saveAnalyzed.validationSelectMeal'));
      }
      return;
    }

    hasSubmittedRef.current = true;
    const finalIngredients = parsed.data.ingredients.filter((_, idx) => selectedIngredients[idx]);
    const payload = {
      ...result,
      name: parsed.data.name,
      description: parsed.data.description,
      ingredients: finalIngredients,
      shouldCreateDish: parsed.data.saveDish,
      tags: parsed.data.saveDish ? (parsed.data.dishTags as MealType[]) : undefined,
    };
    onSave(payload);
    onClose();
  };

  const toggleIngredientSelection = (index: number) => {
    const next = [...selectedIngredients];
    next[index] = !next[index];
    setSelectedIngredients(next);
  };

  const toggleAllIngredients = () => {
    const allSelected = selectedIngredients.every(Boolean);
    setSelectedIngredients(new Array(selectedIngredients.length).fill(!allSelected));
  };

  const handleResearchIngredient = async (index: number) => {
    const ingredients = getValues('ingredients');
    const ingredient = ingredients[index];
    if (!ingredient.name) return;

    try {
      setResearchingIngredientIndex(index);
      const info = await suggestIngredientInfo(ingredient.name, ingredient.unit);
      setValue(`ingredients.${index}.nutritionPerStandardUnit`, {
        calories: info.calories,
        protein: info.protein,
        carbs: info.carbs,
        fat: info.fat,
        fiber: info.fiber,
      });
    } catch (error) {
      logger.error({ component: 'SaveAnalyzedDishModal', action: 'researchIngredient' }, error);
      notify.error(t('saveAnalyzed.lookupFailed'), t('saveAnalyzed.lookupFailedDesc'));
    } finally {
      setResearchingIngredientIndex(null);
    }
  };

  return (
    <ModalBackdrop onClose={onClose} zIndex="z-70">
      <div className="bg-card relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-h-[90dvh] sm:max-w-4xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('saveAnalyzed.title')}</h4>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="dark:text-muted-foreground rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto overscroll-contain p-6">
          {/* Dish Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
              <h5 className="font-bold text-slate-800 dark:text-slate-100">{t('saveAnalyzed.dishInfo')}</h5>
              <label className="-mr-2 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 transition-colors active:bg-slate-100 dark:active:bg-slate-700">
                <Controller
                  name="saveDish"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={e => field.onChange(e.target.checked)}
                      className="text-primary focus:ring-ring h-5 w-5 rounded border-slate-300"
                    />
                  )}
                />
                <span className="text-sm font-medium text-slate-600">{t('saveAnalyzed.saveDish')}</span>
              </label>
            </div>

            {saveDish && (
              <div className="animate-in fade-in slide-in-from-top-2 grid grid-cols-1 gap-4 duration-300">
                <div>
                  <label
                    htmlFor="ai-dish-name"
                    className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase"
                  >
                    {t('saveAnalyzed.dishName')}
                  </label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="ai-dish-name"
                        autoComplete="off"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className="w-full"
                      />
                    )}
                  />
                </div>
                <div>
                  <label
                    htmlFor="ai-dish-desc"
                    className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase"
                  >
                    {t('saveAnalyzed.description')}
                  </label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        id="ai-dish-desc"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className="focus:border-primary w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base transition-all outline-none sm:text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        rows={2}
                      />
                    )}
                  />
                </div>
                <div>
                  <span className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">
                    {t('saveAnalyzed.suitableFor')} <span className="text-rose-500">*</span>
                  </span>
                  <Controller
                    name="dishTags"
                    control={control}
                    render={({ field: tagsField }) => (
                      <div className="flex gap-2">
                        {getMealTagOptions(t).map(opt => {
                          const isActive = tagsField.value.includes(opt.type);
                          return (
                            <button
                              key={opt.type}
                              type="button"
                              onClick={() => {
                                tagsField.onChange(toggleMealTag(tagsField.value, opt.type));
                                setTagError(null);
                              }}
                              className={`min-h-11 flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                                isActive
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-muted-foreground bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600'
                              }`}
                            >
                              <opt.icon className="inline-block size-4" aria-hidden="true" /> {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  {tagError && <p className="mt-1.5 text-xs font-medium text-rose-500">{tagError}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Ingredients List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
              <h5 className="font-bold text-slate-800 dark:text-slate-100">{t('saveAnalyzed.ingredientDetail')}</h5>
              <button
                onClick={toggleAllIngredients}
                className="text-primary text-sm font-medium transition-colors hover:text-emerald-700"
              >
                {selectedIngredients.every(Boolean) ? t('common.deselectAll') : t('common.selectAll')}
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className={`rounded-xl border p-4 transition-all ${selectedIngredients[idx] ? 'border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/50' : 'bg-card border-slate-100 opacity-60 dark:border-slate-700'}`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 transition-colors active:bg-slate-100 dark:active:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedIngredients[idx]}
                        onChange={() => toggleIngredientSelection(idx)}
                        className="text-primary focus:ring-ring h-5 w-5 rounded border-slate-300"
                      />
                      <span className="text-muted-foreground text-xs font-bold uppercase dark:text-slate-500">
                        {t('saveAnalyzed.ingredientNum', { num: idx + 1 })}
                      </span>
                    </label>
                    <button
                      onClick={() => handleResearchIngredient(idx)}
                      disabled={researchingIngredientIndex === idx || !selectedIngredients[idx]}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition-all hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                    >
                      {researchingIngredientIndex === idx ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {t('ai.aiResearch')}
                    </button>
                  </div>

                  <div
                    className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${!selectedIngredients[idx] && 'pointer-events-none opacity-50'}`}
                  >
                    <div className="md:col-span-1">
                      <label
                        htmlFor={`ai-ing-name-${idx}`}
                        className="text-muted-foreground mb-1 block text-xs font-bold uppercase"
                      >
                        {t('common.name')}
                      </label>
                      <Controller
                        name={`ingredients.${idx}.name`}
                        control={control}
                        render={({ field: nameField }) => (
                          <Input
                            id={`ai-ing-name-${idx}`}
                            autoComplete="off"
                            value={nameField.value}
                            onChange={nameField.onChange}
                            onBlur={nameField.onBlur}
                            className="w-full"
                          />
                        )}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label
                        htmlFor={`ai-ing-amount-${idx}`}
                        className="text-muted-foreground mb-1 block text-xs font-bold uppercase"
                      >
                        {t('ingredient.quantity')}
                      </label>
                      <StringNumberController
                        name={`ingredients.${idx}.amount`}
                        control={control}
                        inputMode="numeric"
                        min={0}
                        testId={`ai-ing-amount-${idx}`}
                        className="focus:border-primary w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label
                        htmlFor={`ai-ing-unit-${idx}`}
                        className="text-muted-foreground mb-1 block text-xs font-bold uppercase"
                      >
                        {t('common.unit')}
                      </label>
                      <Controller
                        name={`ingredients.${idx}.unit`}
                        control={control}
                        render={({ field: unitField }) => (
                          <UnitSelector
                            mode="single"
                            value={unitField.value}
                            onChange={unitField.onChange}
                            data-testid={`ai-ing-unit-${idx}`}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div
                    className={`bg-card mt-3 rounded-lg border border-slate-100 p-3 dark:border-slate-600 ${!selectedIngredients[idx] && 'pointer-events-none opacity-50'}`}
                  >
                    <p className="text-muted-foreground mb-2 text-xs font-bold uppercase">
                      {t('saveAnalyzed.nutritionLabel')} / {getDisplayUnit(watchedIngredients[idx]?.unit ?? 'g')}
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <div>
                        <label
                          htmlFor={`ai-ing-cal-${idx}`}
                          className="mb-0.5 block text-[10px] text-slate-500 dark:text-slate-500"
                        >
                          {t('common.calories')}
                        </label>
                        <StringNumberController
                          name={`ingredients.${idx}.nutritionPerStandardUnit.calories`}
                          control={control}
                          inputMode="numeric"
                          min={0}
                          testId={`ai-ing-cal-${idx}`}
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`ai-ing-pro-${idx}`}
                          className="mb-0.5 block text-[10px] text-slate-500 dark:text-slate-500"
                        >
                          Protein
                        </label>
                        <StringNumberController
                          name={`ingredients.${idx}.nutritionPerStandardUnit.protein`}
                          control={control}
                          inputMode="numeric"
                          min={0}
                          testId={`ai-ing-pro-${idx}`}
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`ai-ing-carbs-${idx}`}
                          className="mb-0.5 block text-[10px] text-slate-500 dark:text-slate-500"
                        >
                          Carbs
                        </label>
                        <StringNumberController
                          name={`ingredients.${idx}.nutritionPerStandardUnit.carbs`}
                          control={control}
                          inputMode="numeric"
                          min={0}
                          testId={`ai-ing-carbs-${idx}`}
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`ai-ing-fat-${idx}`}
                          className="mb-0.5 block text-[10px] text-slate-500 dark:text-slate-500"
                        >
                          Fat
                        </label>
                        <StringNumberController
                          name={`ingredients.${idx}.nutritionPerStandardUnit.fat`}
                          control={control}
                          inputMode="numeric"
                          min={0}
                          testId={`ai-ing-fat-${idx}`}
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`ai-ing-fiber-${idx}`}
                          className="mb-0.5 block text-[10px] text-slate-500 dark:text-slate-500"
                        >
                          Fiber
                        </label>
                        <StringNumberController
                          name={`ingredients.${idx}.nutritionPerStandardUnit.fiber`}
                          control={control}
                          inputMode="numeric"
                          min={0}
                          testId={`ai-ing-fiber-${idx}`}
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pb-safe flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="min-h-12 rounded-xl px-5 py-3 font-bold text-slate-600 transition-all hover:bg-slate-200 active:bg-slate-300 dark:hover:bg-slate-700"
          >
            {t('saveAnalyzed.cancelSave')}
          </button>
          <button
            onClick={handleConfirmSave}
            data-testid="btn-confirm-save-analyzed"
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary active:bg-primary/80 flex min-h-12 items-center gap-2 rounded-xl px-6 py-3 font-bold shadow-sm transition-all"
          >
            <Save className="h-5 w-5" />
            {t('saveAnalyzed.confirmSave')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
