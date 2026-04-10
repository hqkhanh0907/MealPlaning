import { Edit3 } from 'lucide-react';
import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { CloseButton } from './CloseButton';
import { ModalBackdrop } from './ModalBackdrop';

interface DetailModalProps {
  title: string;
  editLabel: string;
  onClose: () => void;
  onEdit: () => void;
  children: React.ReactNode;
  description?: React.ReactNode;
}

export const DetailModal = ({
  title,
  editLabel,
  onClose,
  onEdit,
  children,
  description,
}: Readonly<DetailModalProps>) => {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();

  useModalBackHandler(true, onClose);

  return (
    <ModalBackdrop
      onClose={onClose}
      zIndex="z-60"
      role="dialog"
      ariaLabelledBy={titleId}
      ariaDescribedBy={description ? descriptionId : undefined}
      allowSwipeToDismiss={false}
      mobileLayout="sheet"
    >
      <section
        data-testid="detail-modal"
        className="bg-card relative flex max-h-[min(92dvh,48rem)] w-full flex-col overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-md sm:rounded-2xl"
      >
        <header className="bg-card border-border-subtle sticky top-0 z-10 border-b px-4 py-4 sm:px-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h4 id={titleId} className="text-foreground text-xl leading-tight font-semibold break-words">
                {title}
              </h4>
              {description ? (
                <div id={descriptionId} className="text-foreground-secondary mt-2 text-sm leading-6 break-words">
                  {description}
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                data-testid="btn-detail-edit"
                aria-label={t('common.edit')}
                className="text-muted-foreground hover:text-primary hover:bg-primary-subtle focus-visible:ring-ring inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                title={t('common.edit')}
              >
                <Edit3 aria-hidden="true" className="h-5 w-5" />
              </button>
              <CloseButton onClick={onClose} data-testid="btn-detail-close" />
            </div>
          </div>
        </header>

        <div
          data-testid="detail-modal-body"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
        >
          <div className="space-y-5 pb-4">{children}</div>
        </div>

        <footer
          data-testid="detail-modal-footer"
          className="bg-card/95 border-border-subtle sticky bottom-0 z-10 mt-auto border-t px-4 py-4 backdrop-blur sm:px-6"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}
        >
          <button
            type="button"
            onClick={onEdit}
            className="bg-primary text-primary-foreground hover:bg-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center font-semibold whitespace-normal transition-colors"
          >
            <Edit3 aria-hidden="true" className="h-5 w-5 shrink-0" />
            <span className="break-words">{editLabel}</span>
          </button>
        </footer>
      </section>
    </ModalBackdrop>
  );
};
