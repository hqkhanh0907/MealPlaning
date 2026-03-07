import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Sparkles, Loader2, Trash2, Copy, Save, BookTemplate } from 'lucide-react';

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

export const MealActionBar: React.FC<MealActionBarProps> = React.memo(({
  allEmpty, isSuggesting,
  onOpenTypeSelection, onSuggestMealPlan, onOpenClearPlan,
  onCopyPlan, onSaveTemplate, onOpenTemplateManager,
}) => {
  const { t } = useTranslation();

  return (
    <div data-testid="meal-action-bar" className="flex items-center gap-2 w-full flex-wrap">
      <button
        onClick={onOpenTypeSelection}
        data-testid="btn-plan-meal-section"
        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 dark:shadow-none min-h-11"
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
      {!allEmpty && onOpenClearPlan && (
        <button
          onClick={onOpenClearPlan}
          data-testid="btn-clear-plan"
          className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:bg-rose-100 dark:active:bg-rose-900/30 transition-all min-h-11 min-w-11"
          aria-label={t('calendar.clearPlan')}
          title={t('calendar.clearPlan')}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
      {!allEmpty && onCopyPlan && (
        <button
          onClick={onCopyPlan}
          data-testid="btn-copy-plan"
          className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:bg-indigo-100 dark:active:bg-indigo-900/30 transition-all min-h-11 min-w-11"
          aria-label={t('template.copyPlan')}
          title={t('template.copyPlan')}
        >
          <Copy className="w-5 h-5" />
        </button>
      )}
      {!allEmpty && onSaveTemplate && (
        <button
          onClick={onSaveTemplate}
          data-testid="btn-save-template"
          className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:bg-amber-100 dark:active:bg-amber-900/30 transition-all min-h-11 min-w-11"
          aria-label={t('template.saveAs')}
          title={t('template.saveAs')}
        >
          <Save className="w-5 h-5" />
        </button>
      )}
      {onOpenTemplateManager && (
        <button
          onClick={onOpenTemplateManager}
          data-testid="btn-template-manager"
          className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 active:bg-purple-100 dark:active:bg-purple-900/30 transition-all min-h-11 min-w-11"
          aria-label={t('template.manageTemplates')}
          title={t('template.manageTemplates')}
        >
          <BookTemplate className="w-5 h-5" />
        </button>
      )}
    </div>
  );
});

MealActionBar.displayName = 'MealActionBar';
