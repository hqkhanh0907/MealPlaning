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
        className="bg-card relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-lg sm:rounded-2xl"
        data-testid="template-manager-modal"
      >
        <div className="border-border-subtle flex items-center justify-between border-b px-6 py-5 sm:px-8 sm:py-6">
          <div>
            <h3 className="text-foreground text-xl font-semibold">{t('template.title')}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="text-muted-foreground hover:bg-accent flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {templates.length === 0 ? (
            <div className="py-8 text-center">
              <BookTemplate className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground font-medium">{t('template.empty')}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t('template.emptyHint')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search + Tag Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    data-testid="input-template-search"
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('template.searchPlaceholder')}
                    aria-label={t('template.searchPlaceholder')}
                    className="text-foreground w-full pr-4 pl-9"
                    maxLength={100}
                  />
                </div>
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5" data-testid="template-tag-filters">
                    <button
                      type="button"
                      onClick={() => setFilterTag(null)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${filterTag ? 'text-muted-foreground bg-muted' : 'bg-primary text-primary-foreground'}`}
                    >
                      {t('common.all')}
                    </button>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        data-testid={`filter-tag-${tag}`}
                        onClick={() => setFilterTag(prev => (prev === tag ? null : tag))}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${filterTag === tag ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary-subtle bg-muted'}`}
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
                  <p className="text-muted-foreground text-sm">{t('template.noResults')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className="border-border-subtle bg-muted rounded-2xl border p-4"
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
                            className="text-foreground border-primary/30 flex-1"
                            data-testid="template-rename-input"
                            aria-label={t('template.rename')}
                            autoFocus
                          />
                          <button
                            onClick={confirmRename}
                            aria-label={t('common.confirm')}
                            className="hover:bg-primary-subtle text-primary flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-all"
                            data-testid="template-rename-confirm"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelRename}
                            aria-label={t('common.cancel')}
                            className="text-muted-foreground hover:bg-accent flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-all"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <h4 className="text-foreground font-semibold">{template.name}</h4>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {t('template.dishes', { count: getDishCount(template) })} · {t('template.created')}{' '}
                            {new Date(template.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                          </p>
                          {template.tags && template.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {template.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="bg-primary/10 text-primary inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium"
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
                        <div className="text-muted-foreground mb-3 space-y-0.5 text-xs">
                          {template.breakfastDishIds.length > 0 && (
                            <p className="flex items-center gap-1">
                              <Sunrise className="text-energy inline-block size-3.5 shrink-0" aria-hidden="true" />{' '}
                              {getDishNames(template.breakfastDishIds)}
                            </p>
                          )}
                          {template.lunchDishIds.length > 0 && (
                            <p className="flex items-center gap-1">
                              <Sun className="text-energy inline-block size-3.5 shrink-0" aria-hidden="true" />{' '}
                              {getDishNames(template.lunchDishIds)}
                            </p>
                          )}
                          {template.dinnerDishIds.length > 0 && (
                            <p className="flex items-center gap-1">
                              <Moon className="text-info inline-block size-3.5 shrink-0" aria-hidden="true" />{' '}
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
                            className="bg-primary text-primary-foreground hover:bg-primary flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-[0.98]"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {t('template.apply')}
                          </button>
                          <button
                            onClick={() => startRename(template)}
                            data-testid={`btn-rename-template-${template.id}`}
                            className="text-foreground-secondary bg-muted hover:bg-accent flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-[0.98]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            {t('template.rename')}
                          </button>
                          <button
                            onClick={() => onDelete(template.id)}
                            data-testid={`btn-delete-template-${template.id}`}
                            className="bg-rose/10 text-rose hover:bg-rose/15 flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-[0.98]"
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
