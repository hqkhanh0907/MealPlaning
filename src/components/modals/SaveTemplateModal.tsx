import { zodResolver } from '@hookform/resolvers/zod';
import { ChefHat, Save, Tag, X } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import {
  MAX_NAME_LENGTH,
  saveTemplateDefaults,
  type SaveTemplateFormData,
  saveTemplateSchema,
} from '../../schemas/saveTemplateSchema';
import { DayPlan, Dish, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface SaveTemplateModalProps {
  currentPlan: DayPlan;
  dishes: Dish[];
  onSave: (name: string, tags?: string[]) => void;
  onClose: () => void;
}

export const SaveTemplateModal = ({ currentPlan, dishes, onSave, onClose }: SaveTemplateModalProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  useModalBackHandler(true, onClose);

  const {
    register,
    handleSubmit: rhfSubmit,
    control,
    setValue,
    formState: { errors, touchedFields, isSubmitted: formStateIsSubmitted },
  } = useForm<SaveTemplateFormData>({
    resolver: zodResolver(saveTemplateSchema) as unknown as Resolver<SaveTemplateFormData>,
    mode: 'onBlur',
    defaultValues: saveTemplateDefaults,
  });

  const [tagInput, setTagInput] = useState('');

  const showNameError = (touchedFields.name || formStateIsSubmitted) && errors.name;
  const [watchName, watchTags] = useWatch({ control, name: ['name', 'tags'] });

  const getDishInfo = useCallback(
    (ids: string[]): { id: string; name: string }[] =>
      ids
        .map(id => dishes.find(d => d.id === id))
        .filter(Boolean)
        .map(d => ({ id: d!.id, name: getLocalizedField(d!.name, lang) })),
    [dishes, lang],
  );

  const preview = useMemo(
    () => ({
      breakfast: getDishInfo(currentPlan.breakfastDishIds),
      lunch: getDishInfo(currentPlan.lunchDishIds),
      dinner: getDishInfo(currentPlan.dinnerDishIds),
    }),
    [currentPlan, getDishInfo],
  );

  const totalDishes = preview.breakfast.length + preview.lunch.length + preview.dinner.length;

  const onFormSubmit = useCallback(
    (data: SaveTemplateFormData) => {
      onSave(data.name, data.tags.length > 0 ? data.tags : undefined);
    },
    [onSave],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        rhfSubmit(onFormSubmit)();
      }
    },
    [rhfSubmit, onFormSubmit],
  );

  const PRESET_TAGS = useMemo(
    () => [
      t('template.tagHighProtein'),
      t('template.tagQuickMeals'),
      t('template.tagWeekend'),
      t('template.tagHealthy'),
      t('template.tagBudget'),
    ],
    [t],
  );

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (trimmed && !watchTags.includes(trimmed)) {
        setValue('tags', [...watchTags, trimmed], { shouldDirty: true });
      }
      setTagInput('');
    },
    [watchTags, setValue],
  );

  const removeTag = useCallback(
    (tag: string) => {
      setValue(
        'tags',
        watchTags.filter(t => t !== tag),
        { shouldDirty: true },
      );
    },
    [watchTags, setValue],
  );

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(tagInput);
      }
    },
    [tagInput, addTag],
  );

  const mealSections: { key: string; label: string; items: { id: string; name: string }[]; color: string }[] = [
    {
      key: 'breakfast',
      label: t('calendar.morning'),
      items: preview.breakfast,
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    },
    {
      key: 'lunch',
      label: t('calendar.afternoon'),
      items: preview.lunch,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    },
    {
      key: 'dinner',
      label: t('calendar.evening'),
      items: preview.dinner,
      color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
    },
  ];

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="bg-card relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-md sm:rounded-2xl"
        data-testid="save-template-modal"
      >
        <div className="border-border-subtle flex items-center justify-between border-b px-6 py-5 sm:px-8 sm:py-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('template.saveTitle')}</h3>
            <p className="text-muted-foreground text-sm">{t('template.saveSubtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-6 sm:p-8">
          <div>
            <label
              htmlFor="template-name"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              {t('template.saveName')}
            </label>
            <Input
              id="template-name"
              data-testid="input-template-name"
              type="text"
              {...register('name')}
              onKeyDown={handleKeyDown}
              maxLength={MAX_NAME_LENGTH}
              placeholder={t('template.namePlaceholder')}
              autoFocus
              className={`min-h-12 w-full border-2 text-slate-800 ${showNameError ? 'border-rose-300' : ''}`}
            />
            <div className="mt-1.5 flex items-center justify-between">
              {showNameError ? (
                <p className="text-xs font-medium text-rose-500" role="alert">
                  {errors.name?.message}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {watchName.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
          </div>

          {/* Template Tags */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('template.tags')}
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {watchTags.map(tag => (
                <span
                  key={tag}
                  className="text-primary-emphasis inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-medium dark:bg-emerald-900/30"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button
                    type="button"
                    data-testid={`remove-tag-${tag}`}
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:text-rose-500"
                    aria-label={`${t('common.delete')} ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <Input
              data-testid="input-template-tag"
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={t('template.tagPlaceholder')}
              aria-label={t('template.tags')}
              className="w-full text-slate-800"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_TAGS.filter(pt => !watchTags.includes(pt)).map(pt => (
                <button
                  key={pt}
                  type="button"
                  data-testid={`preset-tag-${pt}`}
                  onClick={() => addTag(pt)}
                  className="text-muted-foreground hover:bg-primary-subtle rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium transition-all hover:text-emerald-600 dark:bg-slate-700 dark:hover:bg-emerald-900/20"
                >
                  + {pt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              {t('template.preview')} — {t('template.mealsCount', { count: totalDishes })}
            </p>
            <div className="space-y-2">
              {mealSections.map(({ key, label, items, color }) => (
                <div key={key} className={`rounded-xl px-4 py-3 ${color}`}>
                  <p className="mb-1 text-xs font-semibold uppercase">{label}</p>
                  {items.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {items.map(item => (
                        <span key={item.id} className="inline-flex items-center gap-1 text-sm font-medium">
                          <ChefHat className="h-3 w-3" /> {item.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs opacity-60">{t('copyPlan.noMeals')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-border-subtle border-t px-6 py-4 sm:px-8">
          <button
            data-testid="btn-save-template"
            onClick={rhfSubmit(onFormSubmit)}
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {t('template.save')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
