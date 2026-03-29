import { useEffect, useRef } from 'react';
import { pushBackEntry, removeTopBackEntry } from '../services/backNavigationService';

/**
 * Hook xử lý nút Back (Android hardware / browser back / swipe gesture)
 * cho modal/overlay. Khi modal mở → push handler vào centralized back stack.
 * Khi user nhấn Back → service gọi onClose.
 * Khi modal đóng bằng code → remove handler khỏi stack.
 *
 * @param isOpen - Modal đang mở hay không
 * @param onClose - Callback khi user nhấn Back
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    isPushedRef.current = true;
    pushBackEntry(() => {
      isPushedRef.current = false;
      onCloseRef.current();
    });

    return () => {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        removeTopBackEntry();
      }
    };
  }, [isOpen]);
}
