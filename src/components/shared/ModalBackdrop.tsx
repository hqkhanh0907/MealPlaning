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
 * Shared modal backdrop with accessibility attributes.
 * Provides dark overlay, backdrop-blur, responsive alignment
 * (bottom-sheet on mobile, centered on desktop), and proper
 * ARIA roles for screen readers.
 *
 * Also locks body scroll while open to prevent background scroll
 * bleeding on mobile (swipe up/down).
 */
export const ModalBackdrop: React.FC<ModalBackdropProps> = ({ onClose, zIndex = 'z-50', children }) => {
  const { t } = useTranslation();
  useEffect(() => {
    // iOS Safari ignores overflow:hidden on body — use position:fixed approach instead.
    // Capture scroll position before locking so we can restore it on cleanup.
    const scrollY = window.scrollY;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    return () => {
      body.style.overflow = prevOverflow;
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <dialog
      open
      className={`fixed inset-0 w-full h-full bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center ${zIndex} border-none p-0 m-0 max-w-none max-h-none`}
      aria-modal="true"
    >
      <button
        type="button"
        aria-label={t('common.close')}
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />
      {children}
    </dialog>
  );
};
