import { Copy, FolderOpen, MoreVertical, Plus, Save, ShoppingCart, Sparkles, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface MealActionBarProps {
  allEmpty: boolean;
  isSuggesting?: boolean;
  onOpenTypeSelection: () => void;
  onSuggestMealPlan?: () => void;
  onOpenClearPlan?: () => void;
  onCopyPlan?: () => void;
  onSaveTemplate?: () => void;
  onOpenTemplateManager?: () => void;
  onOpenGrocery?: () => void;
}

export const MealActionBar = React.memo(function MealActionBar({
  allEmpty,
  isSuggesting = false,
  onOpenTypeSelection,
  onSuggestMealPlan,
  onOpenClearPlan,
  onCopyPlan,
  onSaveTemplate,
  onOpenTemplateManager,
  onOpenGrocery,
}: MealActionBarProps) {
  const { t } = useTranslation();

  const hasNonDestructiveItems = !!(
    onSuggestMealPlan ||
    onOpenGrocery ||
    onCopyPlan ||
    onSaveTemplate ||
    onOpenTemplateManager
  );
  const showClearPlan = !allEmpty && !!onOpenClearPlan;
  const hasMenuItems = hasNonDestructiveItems || showClearPlan;

  if (allEmpty) {
    return (
      <div data-testid="meal-action-bar" className="flex w-full items-center">
        <button
          onClick={onOpenTypeSelection}
          data-testid="btn-plan-meal-section"
          className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('calendar.addDish')}
        </button>
      </div>
    );
  }

  return (
    <div data-testid="meal-action-bar" className="flex w-full items-center gap-2">
      <button
        onClick={onOpenTypeSelection}
        data-testid="btn-plan-meal-section"
        className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold shadow-sm transition-all active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t('calendar.addDish')}
      </button>
      {hasMenuItems && (
        <DropdownMenu>
          <DropdownMenuTrigger
            data-testid="btn-more-actions"
            className="hover:bg-accent active:bg-muted text-muted-foreground flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2.5 transition-all"
            aria-label={t('calendar.moreActions')}
          >
            <MoreVertical className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="min-w-[200px]">
            {onSuggestMealPlan && (
              <DropdownMenuItem data-testid="btn-ai-suggest" disabled={isSuggesting} onClick={onSuggestMealPlan}>
                <Sparkles className={`h-4 w-4${isSuggesting ? 'animate-spin' : ''}`} aria-hidden="true" />
                {isSuggesting ? t('calendar.aiSuggesting') : t('calendar.aiSuggest')}
              </DropdownMenuItem>
            )}
            {onOpenGrocery && (
              <DropdownMenuItem data-testid="btn-open-grocery" onClick={onOpenGrocery}>
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                {t('grocery.title')}
              </DropdownMenuItem>
            )}
            {onCopyPlan && (
              <DropdownMenuItem data-testid="btn-copy-plan" onClick={onCopyPlan}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                {t('template.copyPlan')}
              </DropdownMenuItem>
            )}
            {onSaveTemplate && (
              <DropdownMenuItem data-testid="btn-save-template" onClick={onSaveTemplate}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {t('template.saveAs')}
              </DropdownMenuItem>
            )}
            {onOpenTemplateManager && (
              <DropdownMenuItem data-testid="btn-template-manager" onClick={onOpenTemplateManager}>
                <FolderOpen className="h-4 w-4" aria-hidden="true" />
                {t('template.manageTemplates')}
              </DropdownMenuItem>
            )}
            {hasNonDestructiveItems && showClearPlan && <DropdownMenuSeparator />}
            {showClearPlan && (
              <DropdownMenuItem data-testid="btn-clear-plan" variant="destructive" onClick={onOpenClearPlan}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t('calendar.clearPlan')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
});

MealActionBar.displayName = 'MealActionBar';
