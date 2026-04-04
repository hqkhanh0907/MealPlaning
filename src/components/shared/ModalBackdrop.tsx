import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalBackdropProps {
  /** Handler called when clicking the backdrop overlay. */
  onClose: () => void;
  /** Tailwind z-index class (e.g. 'z-50', 'z-60', 'z-70', 'z-80'). Defaults to 'z-50'. */
  zIndex?: string;
  children: React.ReactNode;
}

/**
 * Reference-counted scroll lock depth.
 * Keeps track of how many <ModalBackdrop> instances are currently mounted.
 * We only apply the lock on the FIRST mount (depth 0 → 1) and only release
 * it on the LAST unmount (depth 1 → 0). This prevents the "double-restore"
 * race condition that occurs when nested modals (e.g. IngredientEditModal +
 * UnsavedChangesDialog) unmount simultaneously within the same React commit:
 * without the counter the inner backdrop's cleanup would restore the locked
 * body state AFTER the outer backdrop already unlocked it, permanently
 * blocking scrolling across every page.
 */
let _scrollLockDepth = 0;
let _savedScrollY = 0;

/**
 * Stack of Escape-key callbacks, one per mounted ModalBackdrop.
 * Only the topmost (last) entry responds to Escape, so nested modals
 * (e.g. UnsavedChangesDialog over IngredientEditModal) work correctly.
 */
const _escapeStack: Array<{ id: number; handler: () => void }> = [];
let _nextEscapeId = 0;

function _handleGlobalEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && _escapeStack.length > 0) {
    _escapeStack.at(-1)?.handler();
  }
}

/**
 * Shared modal backdrop with accessibility attributes.
 * Provides dark overlay, backdrop-blur, responsive alignment
 * (bottom-sheet on mobile, centered on desktop), and proper
 * ARIA roles for screen readers.
 *
 * Also locks body scroll while open to prevent background scroll
 * bleeding on mobile (swipe up/down). Uses a reference-counted
 * lock so that stacked modals (e.g. a confirmation dialog rendered
 * over a form modal) do not fight over the body style on unmount.
 */
export const ModalBackdrop = ({ onClose, zIndex = 'z-50', children }: ModalBackdropProps) => {
  const { t } = useTranslation();
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    // Only apply the iOS-safe position:fixed lock when this is the first
    // (outermost) modal. Inner modals simply increment the counter.
    if (_scrollLockDepth === 0) {
      // iOS Safari ignores overflow:hidden on body — use position:fixed approach.
      // Capture the real scroll position BEFORE locking.
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
        // Last modal closed — restore body scroll.
        const body = document.body;
        body.style.overflow = '';
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        window.scrollTo(0, _savedScrollY);
      }
    };
  }, []);

  // Stack-based Escape key handling: only the topmost modal responds.
  useEffect(() => {
    const id = _nextEscapeId++;
    const entry = { id, handler: () => onCloseRef.current() };
    _escapeStack.push(entry);

    // Register the global listener only once (when first modal mounts).
    if (_escapeStack.length === 1) {
      document.addEventListener('keydown', _handleGlobalEscape);
    }

    return () => {
      const idx = _escapeStack.findIndex(e => e.id === id);
      if (idx !== -1) _escapeStack.splice(idx, 1);

      if (_escapeStack.length === 0) {
        document.removeEventListener('keydown', _handleGlobalEscape);
      }
    };
  }, []);

  return (
    <dialog
      open
      className={`bg-background/50 fixed inset-0 flex h-full w-full items-end justify-center backdrop-blur-sm sm:items-center ${zIndex} pb-safe m-0 max-h-none max-w-none border-none px-0 pt-0 sm:p-0`}
      aria-modal="true"
    >
      <button
        type="button"
        aria-label={t('common.close')}
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />
      {children}
    </dialog>
  );
};
