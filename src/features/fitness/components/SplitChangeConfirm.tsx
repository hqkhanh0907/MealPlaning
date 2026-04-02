import { AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import type { SplitChangePreview, SplitType } from '../types';

interface SplitChangeConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newSplit: SplitType;
  mode: 'regenerate' | 'remap';
  preview: SplitChangePreview;
  isLoading: boolean;
}

const splitNameKeys: Record<SplitType, string> = {
  full_body: 'fitness.splitChanger.fullBody',
  upper_lower: 'fitness.splitChanger.upperLower',
  ppl: 'fitness.splitChanger.ppl',
  bro_split: 'fitness.splitChanger.broSplit',
  custom: 'fitness.splitChanger.custom',
};

export function SplitChangeConfirm({
  open,
  onClose,
  onConfirm,
  newSplit,
  mode,
  preview,
  isLoading,
}: Readonly<SplitChangeConfirmProps>) {
  const { t } = useTranslation();

  const isRegenerate = mode === 'regenerate';
  const splitName = t(splitNameKeys[newSplit]);

  return (
    <Sheet
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-2xl"
        style={{ overscrollBehavior: 'contain' }}
        data-testid="split-change-confirm-sheet"
      >
        <SheetHeader>
          <div className="flex items-center gap-2">
            {isRegenerate ? (
              <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" data-testid="warning-icon" />
            ) : (
              <Info className="h-5 w-5 text-blue-500" aria-hidden="true" data-testid="info-icon" />
            )}
            <SheetTitle data-testid="confirm-title">
              {t('fitness.splitChanger.changeTo', { split: splitName })}
            </SheetTitle>
          </div>
          <SheetDescription data-testid="confirm-description">
            {isRegenerate ? t('fitness.splitChanger.regenerateWarning') : t('fitness.splitChanger.remapDesc')}
          </SheetDescription>
        </SheetHeader>

        {/* Remap preview summary */}
        {!isRegenerate && (
          <div className="flex flex-wrap gap-2 px-4 text-sm tabular-nums" data-testid="confirm-remap-summary">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              {String(preview.mapped.length)} {t('fitness.splitChanger.mapped')}
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              {String(preview.suggested.length)} {t('fitness.splitChanger.suggested')}
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-800 dark:bg-red-900 dark:text-red-200">
              {String(preview.unmapped.length)} {t('fitness.splitChanger.unmapped')}
            </span>
          </div>
        )}

        <SheetFooter className="flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 touch-manipulation"
            data-testid="cancel-button"
          >
            {t('fitness.splitChanger.cancel')}
          </Button>
          <Button
            variant={isRegenerate ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 touch-manipulation"
            data-testid="confirm-button"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
                  aria-hidden="true"
                />
                {t('fitness.splitChanger.confirm')}
              </span>
            ) : (
              t('fitness.splitChanger.confirm')
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
