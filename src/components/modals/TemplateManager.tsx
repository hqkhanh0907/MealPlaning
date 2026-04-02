import { BookTemplate, Check, Moon, Pencil, Search, Sun, Sunrise, Tag, Trash2, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { Dish, MealTemplate, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface TemplateManagerProps {
  templates: MealTemplate[];
  dishes: Dish[];
  onApply: (template: MealTemplate) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onClose: () => void;
}

export const TemplateManager = ({ templates, dishes, onApply, onDelete, onRename, onClose }: TemplateManagerProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  useModalBackHandler(true, onClose);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const startRename = useCallback((template: MealTemplate) => {
    setRenamingId(template.id);
    setRenameValue(template.name);
  }, []);

  const confirmRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
      setRenamingId(null);
      setRenameValue('');
    }
  }, [renamingId, renameValue, onRename]);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue('');
  }, []);

  const getDishCount = useCallback((template: MealTemplate): number => {
    return template.breakfastDishIds.length + template.lunchDishIds.length + template.dinnerDishIds.length;
  }, []);

  const getDishNames = useCallback(
    (ids: string[]): string => {
      return ids
        .map(id => {
          const d = dishes.find(x => x.id === id);
          return d ? getLocalizedField(d.name, lang) : undefined;
        })
        .filter(Boolean)
        .join(', ');
    },
    [dishes, lang],
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const tmpl of templates) {
      if (tmpl.tags) tmpl.tags.forEach(tag => tagSet.add(tag));
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tmpl => tmpl.name.toLowerCase().includes(q));
    }
    if (filterTag) {
      result = result.filter(tmpl => tmpl.tags?.includes(filterTag));
    }
    return result;
  }, [templates, searchQuery, filterTag]);

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:mx-4 sm:max-w-lg sm:rounded-2xl dark:bg-slate-800"
        data-testid="template-manager-modal"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8 sm:py-6 dark:border-slate-700">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('template.title')}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {templates.length === 0 ? (
            <div className="py-8 text-center">
              <BookTemplate className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="font-medium text-slate-500 dark:text-slate-400">{t('template.empty')}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">{t('template.emptyHint')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search + Tag Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    data-testid="input-template-search"
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('template.searchPlaceholder')}
                    aria-label={t('template.searchPlaceholder')}
                    className="w-full pr-4 pl-9 text-slate-800"
                  />
                </div>
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5" data-testid="template-tag-filters">
                    <button
                      type="button"
                      onClick={() => setFilterTag(null)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${filterTag ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' : 'bg-emerald-500 text-white'}`}
                    >
                      {t('common.all')}
                    </button>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        data-testid={`filter-tag-${tag}`}
                        onClick={() => setFilterTag(prev => (prev === tag ? null : tag))}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${filterTag === tag ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-emerald-900/20'}`}
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-500">{t('template.noResults')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/50"
                      data-testid={`template-item-${template.id}`}
                    >
                      {renamingId === template.id ? (
                        <div className="mb-3 flex items-center gap-2">
                          <Input
                            type="text"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                confirmRename();
                              } else if (e.key === 'Escape') {
                                cancelRename();
                              }
                            }}
                            className="flex-1 border-emerald-300 text-slate-800"
                            data-testid="template-rename-input"
                            aria-label={t('template.rename')}
                            autoFocus
                          />
                          <button
                            onClick={confirmRename}
                            aria-label={t('common.confirm')}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-emerald-600 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                            data-testid="template-rename-confirm"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelRename}
                            aria-label={t('common.cancel')}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 dark:hover:bg-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">{template.name}</h4>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
                            {t('template.dishes', { count: getDishCount(template) })} · {t('template.created')}{' '}
                            {new Date(template.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                          </p>
                          {template.tags && template.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {template.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                >
                                  <Tag className="h-2.5 w-2.5" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dish preview */}
                      {renamingId !== template.id && (
                        <div className="mb-3 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {template.breakfastDishIds.length > 0 && (
                            <p className="flex items-center gap-1">
                              <Sunrise className="inline-block size-3.5 shrink-0" aria-hidden="true" />{' '}
                              {getDishNames(template.breakfastDishIds)}
                            </p>
                          )}
                          {template.lunchDishIds.length > 0 && (
                            <p className="flex items-center gap-1">
                              <Sun className="inline-block size-3.5 shrink-0" aria-hidden="true" />{' '}
                              {getDishNames(template.lunchDishIds)}
                            </p>
                          )}
                          {template.dinnerDishIds.length > 0 && (
                            <p className="flex items-center gap-1">
                              <Moon className="inline-block size-3.5 shrink-0" aria-hidden="true" />{' '}
                              {getDishNames(template.dinnerDishIds)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      {renamingId !== template.id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onApply(template)}
                            data-testid={`btn-apply-template-${template.id}`}
                            className="flex min-h-11 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-600 active:scale-[0.98]"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {t('template.apply')}
                          </button>
                          <button
                            onClick={() => startRename(template)}
                            data-testid={`btn-rename-template-${template.id}`}
                            className="flex min-h-11 items-center gap-1.5 rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-300 active:scale-[0.98] dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            {t('template.rename')}
                          </button>
                          <button
                            onClick={() => onDelete(template.id)}
                            data-testid={`btn-delete-template-${template.id}`}
                            className="flex min-h-11 items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-600 transition-all hover:bg-rose-200 active:scale-[0.98] dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t('template.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalBackdrop>
  );
};
