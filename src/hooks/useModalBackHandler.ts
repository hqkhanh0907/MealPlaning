import { useEffect, useRef } from 'react';

import { pushBackEntry, removeTopBackEntry } from '../services/backNavigationService';

export function useModalBackHandler(isOpen: boolean, onClose: () => void) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    isPushedRef.current = true;
    pushBackEntry(() => {
      if (!isPushedRef.current) {
        return;
      }
      isPushedRef.current = false;
      onCloseRef.current();
    });

    return () => {
      if (!isPushedRef.current) {
        return;
      }
      isPushedRef.current = false;
      removeTopBackEntry();
    };
  }, [isOpen]);
}
