import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Pencil, Trash2, BookTemplate, Search, Tag, Sunrise, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MealTemplate, Dish, SupportedLang } from '../../types';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { getLocalizedField } from '../../utils/localize';

interface TemplateManagerProps {
  templates: MealTemplate[];
  dishes: Dish[];
  onApply: (template: MealTemplate) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onClose: () => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates, dishes, onApply, onDelete, onRename, onClose,
}) => {
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

  const getDishNames = useCallback((ids: string[]): string => {
    return ids
      .map(id => { const d = dishes.find(x => x.id === id); return d ? getLocalizedField(d.name, lang) : undefined; })
      .filter(Boolean)
      .join(', ');
  }, [dishes, lang]);

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
        className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-lg overflow-hidden flex flex-col max-h-[90dvh] sm:mx-4"
        data-testid="template-manager-modal"
      >
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('template.title')}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all min-h-11 min-w-11 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <BookTemplate className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('template.empty')}</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{t('template.emptyHint')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search + Tag Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    data-testid="input-template-search"
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('template.searchPlaceholder')}
                    aria-label={t('template.searchPlaceholder')}
                    className="w-full pl-9 pr-4 text-slate-800"
                  />
                </div>
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5" data-testid="template-tag-filters">
                    <button
                      type="button"
                      onClick={() => setFilterTag(null)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${filterTag ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : 'bg-emerald-500 text-white'}`}
                    >
                      {t('common.all')}
                    </button>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        data-testid={`filter-tag-${tag}`}
                        onClick={() => setFilterTag(prev => prev === tag ? null : tag)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${filterTag === tag ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-400 dark:text-slate-500">{t('template.noResults')}</p>
                </div>
              ) : (
              <div className="space-y-3">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-600"
                  data-testid={`template-item-${template.id}`}
                >
                  {renamingId === template.id ? (
                    <div className="flex items-center gap-2 mb-3">
                      <Input
                        type="text"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { confirmRename(); } else if (e.key === 'Escape') { cancelRename(); } }}
                        className="flex-1 text-slate-800 border-emerald-300"
                        data-testid="template-rename-input"
                        aria-label={t('template.rename')}
                        autoFocus
                      />
                      <button
                        onClick={confirmRename}
                        aria-label={t('common.confirm')}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all min-h-11 min-w-11 flex items-center justify-center"
                        data-testid="template-rename-confirm"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelRename}
                        aria-label={t('common.cancel')}
                        className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-all min-h-11 min-w-11 flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">{template.name}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {t('template.dishes', { count: getDishCount(template) })} · {t('template.created')} {new Date(template.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                      </p>
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {template.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                              <Tag className="w-2.5 h-2.5" />{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dish preview */}
                  {renamingId !== template.id && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 space-y-0.5">
                      {template.breakfastDishIds.length > 0 && (
                        <p className="flex items-center gap-1"><Sunrise className="size-3.5 inline-block shrink-0" aria-hidden="true" /> {getDishNames(template.breakfastDishIds)}</p>
                      )}
                      {template.lunchDishIds.length > 0 && (
                        <p className="flex items-center gap-1"><Sun className="size-3.5 inline-block shrink-0" aria-hidden="true" /> {getDishNames(template.lunchDishIds)}</p>
                      )}
                      {template.dinnerDishIds.length > 0 && (
                        <p className="flex items-center gap-1"><Moon className="size-3.5 inline-block shrink-0" aria-hidden="true" /> {getDishNames(template.dinnerDishIds)}</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {renamingId !== template.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApply(template)}
                        data-testid={`btn-apply-template-${template.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 active:scale-[0.98] transition-all min-h-11"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {t('template.apply')}
                      </button>
                      <button
                        onClick={() => startRename(template)}
                        data-testid={`btn-rename-template-${template.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-500 active:scale-[0.98] transition-all min-h-11"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {t('template.rename')}
                      </button>
                      <button
                        onClick={() => onDelete(template.id)}
                        data-testid={`btn-delete-template-${template.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50 active:scale-[0.98] transition-all min-h-11"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
