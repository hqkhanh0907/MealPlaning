import { BookTemplate, Copy, Loader2, MoreVertical, Plus, Save, ShoppingCart, Sparkles, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface MealActionBarProps {
  allEmpty: boolean;
  isSuggesting: boolean;
  onOpenTypeSelection: () => void;
  onSuggestMealPlan: () => void;
  onOpenClearPlan?: () => void;
  onCopyPlan?: () => void;
  onSaveTemplate?: () => void;
  onOpenTemplateManager?: () => void;
  onOpenGrocery?: () => void;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className: string;
  testId: string;
}

export const MealActionBar = React.memo(function MealActionBar({
  allEmpty,
  isSuggesting,
  onOpenTypeSelection,
  onSuggestMealPlan,
  onOpenClearPlan,
  onCopyPlan,
  onSaveTemplate,
  onOpenTemplateManager,
  onOpenGrocery,
}: MealActionBarProps) {
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
      icon: <Trash2 className="h-4 w-4" aria-hidden="true" />,
      label: t('calendar.clearPlan'),
      onClick: onOpenClearPlan,
      className: 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30',
      testId: 'btn-clear-plan',
    });
  }
  if (!allEmpty && onCopyPlan) {
    menuItems.push({
      key: 'copy',
      icon: <Copy className="h-4 w-4" aria-hidden="true" />,
      label: t('template.copyPlan'),
      onClick: onCopyPlan,
      className: 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
      testId: 'btn-copy-plan',
    });
  }
  if (!allEmpty && onSaveTemplate) {
    menuItems.push({
      key: 'save',
      icon: <Save className="h-4 w-4" aria-hidden="true" />,
      label: t('template.saveAs'),
      onClick: onSaveTemplate,
      className: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30',
      testId: 'btn-save-template',
    });
  }
  if (onOpenTemplateManager) {
    menuItems.push({
      key: 'template',
      icon: <BookTemplate className="h-4 w-4" aria-hidden="true" />,
      label: t('template.manageTemplates'),
      onClick: onOpenTemplateManager,
      className: 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
      testId: 'btn-template-manager',
    });
  }

  return (
    <div data-testid="meal-action-bar" className="flex w-full flex-wrap items-center gap-2">
      <button
        onClick={onOpenTypeSelection}
        data-testid="btn-plan-meal-section"
        className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold shadow-sm transition-all active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t('calendar.planMeal')}
      </button>
      <button
        onClick={onSuggestMealPlan}
        disabled={isSuggesting}
        data-testid="btn-ai-suggest"
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 font-medium text-indigo-600 transition-all hover:bg-indigo-100 active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
      >
        {isSuggesting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{t('calendar.aiSuggest')}</span>
        <span className="sm:hidden">AI</span>
      </button>
      {onOpenGrocery && (
        <button
          onClick={onOpenGrocery}
          data-testid="btn-open-grocery"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 font-medium text-amber-600 transition-all hover:bg-amber-100 active:scale-[0.98] dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('grocery.title')}</span>
          <span className="sm:hidden">{t('grocery.titleShort')}</span>
        </button>
      )}
      {menuItems.length > 0 && (
        <div className="relative ml-auto" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            data-testid="btn-more-actions"
            className="hover:text-foreground-secondary text-muted-foreground hover:bg-accent active:bg-muted flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2.5 transition-all dark:active:bg-slate-600"
            aria-label={t('calendar.moreActions')}
            title={t('calendar.moreActions')}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div
              data-testid="more-actions-menu"
              className="bg-card border-border absolute top-full right-0 z-50 mt-1 max-w-[calc(100vw-2rem)] min-w-[200px] rounded-xl border py-1 shadow-lg shadow-black/5 dark:shadow-black/10"
            >
              {menuItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => {
                    item.onClick();
                    closeMenu();
                  }}
                  data-testid={item.testId}
                  className={`flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${item.className}`}
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
