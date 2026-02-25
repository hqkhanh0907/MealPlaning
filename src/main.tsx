import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import './index.css';

// Configure native status bar when running as a native app
const initNativeStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#00000000' });

    // Fallback: if env(safe-area-inset-top) returns 0, set CSS variable manually
    const computed = getComputedStyle(document.documentElement).getPropertyValue('--sat').trim();
    if (!computed || computed === '0px' || computed === '0') {
      document.documentElement.style.setProperty('--sat', '28px');
    }
  } catch {
    // Silently fail on web
  }
};

initNativeStatusBar();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </StrictMode>,
);
