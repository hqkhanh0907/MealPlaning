import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Pencil, Trash2, BookTemplate } from 'lucide-react';
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
            <div className="space-y-3">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-600"
                  data-testid={`template-item-${template.id}`}
                >
                  {renamingId === template.id ? (
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') cancelRename(); }}
                        className="flex-1 px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        data-testid="template-rename-input"
                        autoFocus
                      />
                      <button
                        onClick={confirmRename}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all min-h-11 min-w-11 flex items-center justify-center"
                        data-testid="template-rename-confirm"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelRename}
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
                    </div>
                  )}

                  {/* Dish preview */}
                  {renamingId !== template.id && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 space-y-0.5">
                      {template.breakfastDishIds.length > 0 && (
                        <p>🌅 {getDishNames(template.breakfastDishIds)}</p>
                      )}
                      {template.lunchDishIds.length > 0 && (
                        <p>🌤️ {getDishNames(template.lunchDishIds)}</p>
                      )}
                      {template.dinnerDishIds.length > 0 && (
                        <p>🌙 {getDishNames(template.dinnerDishIds)}</p>
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
      </div>
    </ModalBackdrop>
  );
};
