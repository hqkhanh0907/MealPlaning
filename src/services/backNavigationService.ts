import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

type BackHandler = () => void;

const handlerStack: BackHandler[] = [];
let programmaticBackCount = 0;
let initialized = false;

export function pushBackEntry(handler: BackHandler): void {
  handlerStack.push(handler);
  globalThis.history.pushState({ backNav: true, depth: handlerStack.length }, '');
}

export function removeTopBackEntry(): void {
  if (handlerStack.length === 0) return;
  handlerStack.pop();
  programmaticBackCount++;
  globalThis.history.back();
}

export function removeBackEntries(count: number): void {
  const toRemove = Math.min(count, handlerStack.length);
  if (toRemove === 0) return;
  for (let i = 0; i < toRemove; i++) {
    handlerStack.pop();
  }
  programmaticBackCount++;
  globalThis.history.go(-toRemove);
}

export function getBackStackDepth(): number {
  return handlerStack.length;
}

export function initBackNavigation(): () => void {
  if (initialized) return () => {};
  initialized = true;

  const handlePopState = (): void => {
    if (programmaticBackCount > 0) {
      programmaticBackCount--;
      return;
    }
    const handler = handlerStack.pop();
    if (handler) {
      handler();
    }
  };

  globalThis.addEventListener('popstate', handlePopState);

  let removeCapacitorListener: (() => void) | null = null;

  if (Capacitor.isNativePlatform()) {
    void App.addListener('backButton', ({ canGoBack }) => {
      if (handlerStack.length > 0 || canGoBack) {
        globalThis.history.back();
      } else {
        void App.exitApp();
      }
    }).then(handle => {
      removeCapacitorListener = () => {
        void handle.remove();
      };
    });
  }

  return () => {
    globalThis.removeEventListener('popstate', handlePopState);
    if (removeCapacitorListener) removeCapacitorListener();
    initialized = false;
  };
}
