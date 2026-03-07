import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Sparkles, Loader2, Trash2, Copy, Save, BookTemplate, MoreVertical } from 'lucide-react';

export interface MealActionBarProps {
  allEmpty: boolean;
  isSuggesting: boolean;
  onOpenTypeSelection: () => void;
  onSuggestMealPlan: () => void;
  onOpenClearPlan?: () => void;
  onCopyPlan?: () => void;
  onSaveTemplate?: () => void;
  onOpenTemplateManager?: () => void;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className: string;
  testId: string;
}

export const MealActionBar: React.FC<MealActionBarProps> = React.memo(({
  allEmpty, isSuggesting,
  onOpenTypeSelection, onSuggestMealPlan, onOpenClearPlan,
  onCopyPlan, onSaveTemplate, onOpenTemplateManager,
}) => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, closeMenu]);

  const menuItems: MenuItem[] = [];

  if (!allEmpty && onOpenClearPlan) {
    menuItems.push({
      key: 'clear',
      icon: <Trash2 className="w-4 h-4" />,
      label: t('calendar.clearPlan'),
      onClick: onOpenClearPlan,
      className: 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30',
      testId: 'btn-clear-plan',
    });
  }
  if (!allEmpty && onCopyPlan) {
    menuItems.push({
      key: 'copy',
      icon: <Copy className="w-4 h-4" />,
      label: t('template.copyPlan'),
      onClick: onCopyPlan,
      className: 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
      testId: 'btn-copy-plan',
    });
  }
  if (!allEmpty && onSaveTemplate) {
    menuItems.push({
      key: 'save',
      icon: <Save className="w-4 h-4" />,
      label: t('template.saveAs'),
      onClick: onSaveTemplate,
      className: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30',
      testId: 'btn-save-template',
    });
  }
  if (onOpenTemplateManager) {
    menuItems.push({
      key: 'template',
      icon: <BookTemplate className="w-4 h-4" />,
      label: t('template.manageTemplates'),
      onClick: onOpenTemplateManager,
      className: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30',
      testId: 'btn-template-manager',
    });
  }

  return (
    <div data-testid="meal-action-bar" className="flex items-center gap-2 w-full flex-wrap">
      <button
        onClick={onOpenTypeSelection}
        data-testid="btn-plan-meal-section"
        className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 dark:shadow-none min-h-11"
      >
        <Plus className="w-4 h-4" />
        {t('calendar.planMeal')}
      </button>
      <button
        onClick={onSuggestMealPlan}
        disabled={isSuggesting}
        data-testid="btn-ai-suggest"
        className="flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-[0.98] transition-all disabled:opacity-50 min-h-11"
      >
        {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        <span className="hidden sm:inline">{t('calendar.aiSuggest')}</span>
        <span className="sm:hidden">AI</span>
      </button>
      {menuItems.length > 0 && (
        <div className="relative ml-auto" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            data-testid="btn-more-actions"
            className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-all min-h-11 min-w-11"
            aria-label={t('calendar.moreActions')}
            title={t('calendar.moreActions')}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div
              data-testid="more-actions-menu"
              className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 py-1 min-w-[200px]"
            >
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { item.onClick(); closeMenu(); }}
                  data-testid={item.testId}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all min-h-11 ${item.className}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MealActionBar.displayName = 'MealActionBar';
