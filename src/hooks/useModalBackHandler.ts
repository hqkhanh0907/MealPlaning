import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * Global counter: khi > 0, popstate events là do programmatic history.back(),
 * không phải do user nhấn Back. Dùng để tránh xử lý sai.
 */
let programmaticBackCount = 0;

/**
 * Hook xử lý nút Back (Android hardware / browser back / swipe gesture)
 * cho modal. Khi modal mở → push 1 history entry.
 * Khi user nhấn Back → gọi onClose thay vì thoát app.
 * Khi modal đóng bằng code → pop history entry mà không trigger onClose.
 *
 * @param isOpen - Modal đang mở hay không
 * @param onClose - Callback khi user nhấn Back
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      // Modal vừa đóng bằng code → pop history entry nếu đã push
      if (isPushedRef.current) {
        isPushedRef.current = false;
        programmaticBackCount++;
        window.history.back();
      }
      return;
    }

    // Modal vừa mở → push history entry
    window.history.pushState({ modal: true }, '');
    isPushedRef.current = true;

    // Browser popstate (swipe back on iOS Safari, browser back)
    const handlePopState = () => {
      // Skip programmatic back events
      if (programmaticBackCount > 0) {
        programmaticBackCount--;
        return;
      }
      if (isPushedRef.current) {
        isPushedRef.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Native Android back button via Capacitor
    let removeBackButtonListener: (() => void) | null = null;

    if (Capacitor.isNativePlatform()) {
      App.addListener('backButton', ({ canGoBack }) => {
        if (isPushedRef.current) {
          // Trigger popstate which will call onClose
          window.history.back();
        } else if (!canGoBack) {
          App.exitApp();
        }
      }).then(handle => {
        removeBackButtonListener = () => handle.remove();
      });
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (removeBackButtonListener) {
        removeBackButtonListener();
      }
    };
  }, [isOpen]);
}
