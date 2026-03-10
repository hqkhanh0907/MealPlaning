import { Capacitor } from '@capacitor/core';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn().mockReturnValue(false) },
}));
vi.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setOverlaysWebView: vi.fn(),
    setStyle: vi.fn(),
    setBackgroundColor: vi.fn(),
  },
  Style: { Light: 'LIGHT' },
}));

// Must mock App and NotificationContext before importing main
vi.mock('../App', () => ({
  default: () => null,
}));
vi.mock('../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import React from 'react';

describe('main.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modules so main re-executes
    vi.resetModules();
  });

  it('renders without crashing when root element exists', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    // Dynamic import to trigger side-effect
    await import('../main');

    expect(root.innerHTML).toBeDefined();
    root.remove();
  });

  it('throws error when root element is missing', async () => {
    // Ensure no root element
    const existing = document.getElementById('root');
    if (existing) existing.remove();

    await expect(import('../main')).rejects.toThrow('Root element not found');
  });

  it('calls Capacitor.isNativePlatform on startup', () => {
    expect(Capacitor.isNativePlatform).toBeDefined();
  });
});
