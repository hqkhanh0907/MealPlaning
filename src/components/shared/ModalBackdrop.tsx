import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalBackdropProps {
  onClose: () => void;
  zIndex?: string;
  children: React.ReactNode;
  role?: 'dialog' | 'alertdialog';
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  allowSwipeToDismiss?: boolean;
  mobileLayout?: 'sheet' | 'center';
}

let _scrollLockDepth = 0;
let _savedScrollY = 0;

type ModalStackEntry = {
  id: number;
  dismissOnEscape: boolean;
  handleClose: () => void;
  getContainer: () => HTMLElement | null;
};

const _modalStack: ModalStackEntry[] = [];
let _nextModalId = 0;

const FOCUSABLE_SELECTOR = [
  'button:not([tabindex="-1"]):not([disabled])',
  'a[href]:not([tabindex="-1"])',
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(element => {
    const style = globalThis.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && !element.hasAttribute('hidden');
  });
}

function handleGlobalKeydown(event: KeyboardEvent) {
  const topmost = _modalStack.at(-1);
  if (!topmost) return;

  if (event.key === 'Escape') {
    if (!topmost.dismissOnEscape) return;
    event.preventDefault();
    topmost.handleClose();
    return;
  }

  if (event.key !== 'Tab') return;

  const container = topmost.getContainer();
  if (!container) return;

  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable.at(-1) ?? first;
  const active = document.activeElement as HTMLElement | null;
  const isInside = active ? container.contains(active) : false;

  if (event.shiftKey) {
    if (!isInside || active === first) {
      event.preventDefault();
      last.focus();
    }
    return;
  }

  if (!isInside || active === last) {
    event.preventDefault();
    first.focus();
  }
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof globalThis.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener?.('change', handleChange);

    return () => {
      mediaQuery.removeEventListener?.('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

export const ModalBackdrop = ({
  onClose,
  zIndex = 'z-50',
  children,
  role = 'dialog',
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  allowSwipeToDismiss,
  mobileLayout = 'sheet',
}: Readonly<ModalBackdropProps>) => {
  const { t } = useTranslation();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const modalId = useMemo(() => _nextModalId++, []);
  const generatedLabelId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const dragStartY = useRef(0);
  const dragDeltaY = useRef(0);
  const isDragging = useRef(false);
  const swipeEnabled = allowSwipeToDismiss ?? mobileLayout === 'sheet';
  const labelledBy = ariaLabelledBy ?? generatedLabelId;

  const handleClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  const resetDragPosition = useCallback(
    (animated: boolean) => {
      const node = contentRef.current;
      if (!node) return;
      node.style.transition = animated && !prefersReducedMotion ? 'transform 0.2s ease-out' : 'none';
      node.style.transform = '';
    },
    [prefersReducedMotion],
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!swipeEnabled) return;
      dragStartY.current = event.touches[0].clientY;
      dragDeltaY.current = 0;
      isDragging.current = true;
      if (contentRef.current) {
        contentRef.current.style.transition = 'none';
      }
    },
    [swipeEnabled],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!swipeEnabled || !isDragging.current || !contentRef.current) return;
      const delta = Math.max(0, event.touches[0].clientY - dragStartY.current);
      dragDeltaY.current = delta;
      if (prefersReducedMotion) return;
      contentRef.current.style.transform = `translateY(${delta}px)`;
    },
    [prefersReducedMotion, swipeEnabled],
  );

  const handleTouchEnd = useCallback(() => {
    if (!swipeEnabled || !isDragging.current) return;
    isDragging.current = false;
    if (dragDeltaY.current >= 120) {
      resetDragPosition(false);
      handleClose();
    } else {
      resetDragPosition(true);
    }
    dragDeltaY.current = 0;
  }, [handleClose, resetDragPosition, swipeEnabled]);

  useEffect(() => {
    if (_scrollLockDepth === 0) {
      _savedScrollY = window.scrollY;
      const body = document.body;
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.top = `-${_savedScrollY}px`;
      body.style.width = '100%';
    }
    _scrollLockDepth += 1;

    return () => {
      _scrollLockDepth = Math.max(0, _scrollLockDepth - 1);
      if (_scrollLockDepth === 0) {
        const body = document.body;
        body.style.overflow = '';
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        window.scrollTo(0, _savedScrollY);
      }
    };
  }, []);

  useEffect(() => {
    _modalStack.push({
      id: modalId,
      dismissOnEscape: closeOnEscape,
      handleClose,
      getContainer: () => contentRef.current,
    });

    if (_modalStack.length === 1) {
      document.addEventListener('keydown', handleGlobalKeydown);
    }

    return () => {
      const index = _modalStack.findIndex(entry => entry.id === modalId);
      if (index !== -1) {
        _modalStack.splice(index, 1);
      }
      if (_modalStack.length === 0) {
        document.removeEventListener('keydown', handleGlobalKeydown);
      }
    };
  }, [closeOnEscape, handleClose, modalId]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const frame = requestAnimationFrame(() => {
      const container = contentRef.current;
      if (!container) return;
      if (container.contains(document.activeElement)) return;

      const autofocusTarget = container.querySelector<HTMLElement>('[autofocus]');
      const target = autofocusTarget ?? getFocusableElements(container)[0] ?? container;
      target.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      previousFocusRef.current?.focus();
    };
  }, []);

  const rootClassName = [
    'bg-background/50 fixed inset-0 m-0 flex h-full w-full overflow-hidden overscroll-none border-none backdrop-blur-sm',
    mobileLayout === 'center'
      ? 'items-center justify-center px-4 py-4 sm:px-6'
      : 'items-end justify-center px-0 sm:items-center sm:px-4 sm:py-4',
    zIndex,
  ].join(' ');

  const contentWrapperClassName = [
    'pointer-events-none relative flex w-full overflow-hidden',
    mobileLayout === 'center' ? 'items-center justify-center' : 'items-end justify-center sm:items-center',
  ].join(' ');

  return (
    <dialog
      open
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={ariaDescribedBy}
      className={rootClassName}
      style={{
        paddingTop:
          mobileLayout === 'center'
            ? 'max(env(safe-area-inset-top, 0px), 1rem)'
            : 'max(env(safe-area-inset-top, 0px), 0.5rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)',
      }}
      data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
    >
      <button
        type="button"
        aria-label={t('common.close')}
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={closeOnBackdropClick ? handleClose : undefined}
        tabIndex={-1}
      />
      <div className={contentWrapperClassName}>
        {swipeEnabled ? (
          <div
            data-testid="modal-grab-handle"
            className="bg-muted-foreground/30 pointer-events-auto absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full sm:hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        ) : null}
        <div
          ref={contentRef}
          data-modal-content="true"
          tabIndex={-1}
          className="pointer-events-auto relative flex max-h-full w-full flex-col overflow-hidden overscroll-contain focus:outline-none"
        >
          {ariaLabelledBy ? null : (
            <span id={generatedLabelId} className="sr-only">
              {t('common.dialog')}
            </span>
          )}
          {children}
        </div>
      </div>
    </dialog>
  );
};
