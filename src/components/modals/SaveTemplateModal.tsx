import React, { useState, useCallback, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { X, Save, ChefHat, Tag } from 'lucide-react';
import { DayPlan, Dish, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { Input } from '@/components/ui/input';
import {
  saveTemplateSchema,
  saveTemplateDefaults,
  MAX_NAME_LENGTH,
  type SaveTemplateFormData,
} from '../../schemas/saveTemplateSchema';

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

  const getDishInfo = useCallback((ids: string[]): { id: string; name: string }[] =>
    ids.map(id => dishes.find(d => d.id === id)).filter(Boolean).map(d => ({ id: d!.id, name: getLocalizedField(d!.name, lang) })),
  [dishes, lang]);

  const preview = useMemo(() => ({
    breakfast: getDishInfo(currentPlan.breakfastDishIds),
    lunch: getDishInfo(currentPlan.lunchDishIds),
    dinner: getDishInfo(currentPlan.dinnerDishIds),
  }), [currentPlan, getDishInfo]);

  const totalDishes = preview.breakfast.length + preview.lunch.length + preview.dinner.length;

  const onFormSubmit = useCallback((data: SaveTemplateFormData) => {
    onSave(data.name, data.tags.length > 0 ? data.tags : undefined);
  }, [onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      rhfSubmit(onFormSubmit)();
    }
  }, [rhfSubmit, onFormSubmit]);

  const PRESET_TAGS = useMemo(() => [
    t('template.tagHighProtein'), t('template.tagQuickMeals'), t('template.tagWeekend'),
    t('template.tagHealthy'), t('template.tagBudget'),
  ], [t]);

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !watchTags.includes(trimmed)) {
      setValue('tags', [...watchTags, trimmed], { shouldDirty: true });
    }
    setTagInput('');
  }, [watchTags, setValue]);

  const removeTag = useCallback((tag: string) => {
    setValue('tags', watchTags.filter(t => t !== tag), { shouldDirty: true });
  }, [watchTags, setValue]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  }, [tagInput, addTag]);

  const mealSections: { key: string; label: string; items: { id: string; name: string }[]; color: string }[] = [
    { key: 'breakfast', label: t('calendar.morning'), items: preview.breakfast, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
    { key: 'lunch', label: t('calendar.afternoon'), items: preview.lunch, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
    { key: 'dinner', label: t('calendar.evening'), items: preview.dinner, color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' },
  ];

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden flex flex-col max-h-[90dvh] sm:mx-4" data-testid="save-template-modal">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('template.saveTitle')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('template.saveSubtitle')}</p>
          </div>
          <button onClick={onClose} aria-label={t('common.closeDialog')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all min-h-11 min-w-11 flex items-center justify-center">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto">
          <div>
            <label htmlFor="template-name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('template.saveName')}</label>
            <Input
              id="template-name"
              data-testid="input-template-name"
              type="text"
              {...register('name')}
              onKeyDown={handleKeyDown}
              maxLength={MAX_NAME_LENGTH}
              placeholder={t('template.namePlaceholder')}
              autoFocus
              className={`w-full border-2 text-slate-800 min-h-12 ${
                showNameError
                  ? 'border-rose-300'
                  : ''
              }`}
            />
            <div className="flex items-center justify-between mt-1.5">
              {showNameError ? (
                <p className="text-xs text-rose-500 font-medium" role="alert">{errors.name?.message}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-slate-400 dark:text-slate-500">{watchName.length}/{MAX_NAME_LENGTH}</span>
            </div>
          </div>

          {/* Template Tags */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('template.tags')}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {watchTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button type="button" data-testid={`remove-tag-${tag}`} onClick={() => removeTag(tag)} className="ml-0.5 hover:text-rose-500" aria-label={`${t('common.delete')} ${tag}`}>
                    <X className="w-3 h-3" />
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
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESET_TAGS.filter(pt => !watchTags.includes(pt)).map(pt => (
                <button key={pt} type="button" data-testid={`preset-tag-${pt}`} onClick={() => addTag(pt)} className="text-[10px] font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-all">
                  + {pt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              {t('template.preview')} — {t('template.mealsCount', { count: totalDishes })}
            </p>
            <div className="space-y-2">
              {mealSections.map(({ key, label, items, color }) => (
                <div key={key} className={`rounded-xl px-4 py-3 ${color}`}>
                  <p className="text-xs font-bold uppercase mb-1">{label}</p>
                  {items.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <span key={item.id} className="inline-flex items-center gap-1 text-sm font-medium">
                          <ChefHat className="w-3 h-3" /> {item.name}
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

        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-700">
          <button
            data-testid="btn-save-template"
            onClick={rhfSubmit(onFormSubmit)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-12"
          >
            <Save className="w-4 h-4" />
            {t('template.save')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
