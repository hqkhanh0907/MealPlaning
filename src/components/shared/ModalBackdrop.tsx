import React from 'react';

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
 */
export const ModalBackdrop: React.FC<ModalBackdropProps> = ({ onClose, zIndex = 'z-50', children }) => (
  <dialog
    open
    className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center ${zIndex} border-none p-0 m-0 max-w-none max-h-none`}
    aria-modal="true"
  >
    <button
      type="button"
      aria-label="Đóng"
      className="absolute inset-0 w-full h-full cursor-default"
      onClick={onClose}
      tabIndex={-1}
    />
    {children}
  </dialog>
);
