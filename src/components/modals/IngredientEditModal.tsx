import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Loader2, Save, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { generateUUID } from '@/utils/helpers';
import { blockNegativeKeys } from '@/utils/numericInputHandlers';

import { useNotification } from '../../contexts/NotificationContext';
import { useIngredientSmartFill } from '../../hooks/useIngredientSmartFill';
import {
  ingredientEditDefaults,
  type IngredientEditFormData,
  ingredientEditSchema,
} from '../../schemas/ingredientEditSchema';
import { suggestIngredientInfo } from '../../services/geminiService';
import { Ingredient, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { logger } from '../../utils/logger';
import { CloseButton } from '../shared/CloseButton';
import { DisabledReason } from '../shared/DisabledReason';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { UnitSelector } from '../shared/UnitSelector';
import { UnsavedChangesDialog } from '../shared/UnsavedChangesDialog';

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

export const IngredientEditModal = ({ editingItem, onSubmit, onClose }: IngredientEditModalProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const notify = useNotification();

  const NAME_MAX_LENGTH = 80;

  const {
    register,
    handleSubmit: rhfSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<IngredientEditFormData>({
    resolver: zodResolver(ingredientEditSchema) as unknown as Resolver<IngredientEditFormData>,
    mode: 'onTouched',
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

  useEffect(() => {
    if (editingItem) {
      reset({
        name: { vi: editingItem.name.vi ?? '' },
        unit: { vi: editingItem.unit.vi ?? '' },
        caloriesPer100: Math.round(editingItem.caloriesPer100),
        proteinPer100: Math.round(editingItem.proteinPer100),
        carbsPer100: Math.round(editingItem.carbsPer100),
        fatPer100: Math.round(editingItem.fatPer100),
        fiberPer100: Math.round(editingItem.fiberPer100),
      });
    } else {
      reset(ingredientEditDefaults);
    }
  }, [editingItem, reset]);

  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const { findMatch, isAutoFilled, setAutoFilled, autoFillTimestamp } = useIngredientSmartFill(editingItem?.id);
  const [highlightFields, setHighlightFields] = useState(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (autoFillTimestamp > 0) {
      setHighlightFields(true);
      const timer = setTimeout(() => setHighlightFields(false), 300);
      return () => clearTimeout(timer);
    }
  }, [autoFillTimestamp]);

  const hasSubmittedRef = useRef(false);

  const watchName = watch('name.vi');
  const watchUnit = watch('unit');
  const aiSearchMissingInput = !watchName || !getLocalizedField(watchUnit, lang);

  const buildIngredient = useCallback(
    (data: IngredientEditFormData): Ingredient => ({
      id: editingItem ? editingItem.id : generateUUID(),
      name: { vi: data.name.vi },
      unit: { vi: data.unit.vi },
      caloriesPer100: Math.round(data.caloriesPer100),
      proteinPer100: Math.round(data.proteinPer100),
      carbsPer100: Math.round(data.carbsPer100),
      fatPer100: Math.round(data.fatPer100),
      fiberPer100: Math.round(data.fiberPer100),
    }),
    [editingItem],
  );

  const onFormSubmit = useCallback(
    (data: IngredientEditFormData) => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      onSubmit(buildIngredient(data));
    },
    [onSubmit, buildIngredient],
  );

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowUnsavedDialog(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleSaveAndBack = useCallback(() => {
    rhfSubmit(
      data => {
        onSubmit(buildIngredient(data));
      },
      () => {
        setShowUnsavedDialog(false);
      },
    )();
  }, [rhfSubmit, onSubmit, buildIngredient]);

  const applySmartFill = useCallback(
    (match: Ingredient) => {
      setValue('caloriesPer100', Math.round(match.caloriesPer100), { shouldDirty: true });
      setValue('proteinPer100', Math.round(match.proteinPer100), { shouldDirty: true });
      setValue('carbsPer100', Math.round(match.carbsPer100), { shouldDirty: true });
      setValue('fatPer100', Math.round(match.fatPer100), { shouldDirty: true });
      setValue('fiberPer100', Math.round(match.fiberPer100), { shouldDirty: true });
      if (match.unit?.vi) {
        setValue('unit', { vi: match.unit.vi }, { shouldDirty: true });
      }
    },
    [setValue],
  );

  const handleNameBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const nameValue = e.target.value;
      const match = findMatch(nameValue);
      if (match) {
        applySmartFill(match);
      }
    },
    [findMatch, applySmartFill],
  );

  const handleNameChange = useCallback(() => {
    if (isAutoFilled) setAutoFilled(false);
  }, [isAutoFilled, setAutoFilled]);

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
        <div className="bg-card relative max-h-[90dvh] w-full overflow-hidden overflow-y-auto overscroll-contain rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-md sm:rounded-2xl">
          <div className="border-border-subtle flex items-center justify-between border-b px-6 py-4">
            <h4 className="text-foreground text-lg font-semibold">
              {editingItem ? t('ingredient.editExisting') : t('ingredient.createNew')}
            </h4>
            <CloseButton onClick={handleClose} data-testid="btn-close-ingredient" />
          </div>
          <form noValidate onSubmit={rhfSubmit(onFormSubmit)} className="space-y-4 p-6">
            <div>
              <label htmlFor="ing-name" className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase">
                {t('ingredient.ingredientName')}{' '}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="flex gap-2">
                <Input
                  id="ing-name"
                  {...register('name.vi', { onBlur: handleNameBlur, onChange: handleNameChange })}
                  maxLength={NAME_MAX_LENGTH}
                  className={`flex-1 ${errors.name?.vi ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : ''}`}
                  placeholder={t('ingredient.namePlaceholder')}
                  data-testid="input-ing-name"
                  aria-invalid={!!errors.name?.vi}
                  aria-required={true}
                />
                <button
                  type="button"
                  onClick={handleAISearch}
                  disabled={aiSearchMissingInput || isSearchingAI}
                  aria-describedby={aiSearchMissingInput && !isSearchingAI ? 'ai-search-disabled-reason' : undefined}
                  data-testid="btn-ai-search"
                  className="bg-ai-subtle text-ai hover:bg-ai/10 rounded-xl px-3 py-2 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={
                    getLocalizedField(watchUnit, lang) ? t('ingredient.aiTooltip') : t('ingredient.aiTooltipNoUnit')
                  }
                >
                  {isSearchingAI ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                </button>
              </div>
              <DisabledReason
                id="ai-search-disabled-reason"
                reason={t('disabledReason.enterNameAndUnit')}
                show={aiSearchMissingInput && !isSearchingAI}
              />
              {errors.name?.vi && (
                <p data-testid="error-ing-name" className="text-destructive mt-1 text-xs" role="alert">
                  {errors.name.vi.message}
                </p>
              )}
              {watchName.length > NAME_MAX_LENGTH * 0.8 && (
                <p className="text-muted-foreground mt-1 text-right text-xs" data-testid="ing-name-counter">
                  {watchName.length}/{NAME_MAX_LENGTH}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ing-unit" className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase">
                {t('ingredient.unitLabel')}{' '}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </label>
              <UnitSelector
                mode="bilingual"
                id="ing-unit"
                value={watchUnit}
                onChange={v => setValue('unit', v, { shouldDirty: true, shouldValidate: true })}
                error={!!errors.unit?.vi}
                data-testid="input-ing-unit"
              />
              {errors.unit?.vi && (
                <p className="text-destructive mt-1 text-xs" role="alert">
                  {errors.unit.vi.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {NUMERIC_FIELDS.map(field => {
                const labels: Record<string, string> = {
                  caloriesPer100: 'Calories',
                  proteinPer100: 'Protein',
                  carbsPer100: 'Carbs',
                  fatPer100: 'Fat',
                  fiberPer100: 'Fiber',
                };
                return (
                  <div key={field}>
                    <label
                      htmlFor={`ing-${field}`}
                      className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase"
                    >
                      {labels[field]} / {getDisplayUnit(watchUnit, lang)}
                    </label>
                    <Input
                      id={`ing-${field}`}
                      type="number"
                      step="1"
                      min="0"
                      inputMode="decimal"
                      onKeyDown={blockNegativeKeys}
                      {...register(field, { valueAsNumber: true })}
                      data-testid={`input-ing-${field.replace('Per100', '')}`}
                      className={`w-full ${errors[field] ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : ''} ${highlightFields ? 'ring-ring/50 ring-2' : ''}`}
                      aria-invalid={!!errors[field]}
                    />
                    {errors[field] && (
                      <p
                        className="text-destructive mt-1 text-xs"
                        role="alert"
                        data-testid={`error-ing-${field.replace('Per100', '')}`}
                      >
                        {errors[field].message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {isAutoFilled && (
              <p
                className="text-muted-foreground mt-1 flex items-center gap-1 text-xs"
                data-testid="smart-fill-indicator"
              >
                <CheckCircle className="text-success h-3 w-3" />
                <span>{t('ingredient.autoFilled')}</span>
                <span className="text-muted-foreground/70">— {t('ingredient.autoFillHint')}</span>
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              <span className="text-destructive" aria-hidden="true">
                *
              </span>{' '}
              {t('common.requiredField')}
            </p>
            <div className="pt-4">
              <button
                type="submit"
                data-testid="btn-save-ingredient"
                className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-lg font-semibold shadow-sm transition-all"
              >
                <Save className="h-5 w-5" aria-hidden="true" /> {t('ingredient.saveIngredient')}
              </button>
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
