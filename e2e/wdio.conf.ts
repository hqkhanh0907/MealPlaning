export const config = {
  runner: 'local',
  rootDir: process.cwd(),
  tsConfigPath: './e2e/tsconfig.json',
  specs: ['./e2e/specs/**/*.spec.ts'],
  maxInstances: 1,

  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:app': './android/app/build/outputs/apk/release/app-release.apk',
      'appium:chromedriverAutodownload': true,
      'appium:noReset': true,
      // Only return WEBVIEW contexts that have an actual loaded page
      'appium:ensureWebviewsHavePages': true,
      'appium:uiautomator2ServerLaunchTimeout': 120000,
      'appium:uiautomator2ServerInstallTimeout': 120000,
    },
  ],

  logLevel: 'info',
  bail: 0,
  waitforTimeout: process.env.CI ? 45000 : 30000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: process.env.CI ? 120000 : 60000,
  },

  services: [
    [
      'appium',
      {
        args: { relaxedSecurity: true },
      },
    ],
  ],

  async before() {
    // Switch to WEBVIEW context manually (replaces deprecated autoWebview: true)
    const maxWait = 30000;
    const interval = 1500;
    const start = Date.now();
    const b = browser as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
    let switched = false;
    while (!switched && Date.now() - start < maxWait) {
      const contexts = (typeof b.getContexts === 'function' ? await b.getContexts() : []) as string[];
      const webview = contexts.find((c: string) => c.startsWith('WEBVIEW'));
      if (webview) {
        if (typeof b.switchContext === 'function') await b.switchContext(webview);
        switched = true;
      } else {
        await browser.pause(interval);
      }
    }
    if (!switched) {
      console.warn('[wdio] No WEBVIEW context found after 30s, staying in NATIVE_APP');
      return;
    }
    const exec = browser as unknown as { execute: (fn: () => unknown) => Promise<unknown> };
    const ciTimeout = process.env.CI ? 60000 : 30000;

    // Check if we need to set onboarding flag (first boot of fresh APK)
    const needsReload = await exec.execute(() => {
      const key = 'app-onboarding-storage';
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify({ state: { isAppOnboarded: true }, version: 0 }));
        return true;
      }
      return false;
    });

    if (needsReload) {
      // Reload and wait for the page to actually start reloading
      await exec.execute(() => { location.reload(); });
      await browser.pause(3000);
      // Re-switch to webview context (reload may reset context)
      try {
        const b = browser as unknown as { getContexts: () => Promise<string[]>; switchContext: (c: string) => Promise<void> };
        const ctxs = await b.getContexts();
        const wv = ctxs.find((c: string) => c.startsWith('WEBVIEW'));
        if (wv) await b.switchContext(wv);
      } catch { /* already in webview */ }
    }

    // Wait for document to be fully loaded
    await browser.waitUntil(
      async () => {
        try {
          const state = await exec.execute(() => document.readyState);
          return state === 'complete';
        } catch {
          return false;
        }
      },
      { timeout: 30000, interval: 1000, timeoutMsg: 'document.readyState never reached "complete"' }
    );
    // Wait for React root to have children (app actually rendered)
    await browser.waitUntil(
      async () => {
        try {
          const hasContent = await exec.execute(() => {
            const root = document.getElementById('root');
            return root ? root.children.length > 0 : false;
          });
          return !!hasContent;
        } catch {
          return false;
        }
      },
      { timeout: ciTimeout, interval: 2000, timeoutMsg: 'React app did not render in #root' }
    );
    // Wait for bottom nav to be present (app fully loaded, not stuck on onboarding/error)
    await browser.waitUntil(
      async () => {
        try {
          const hasNav = await exec.execute(() => !!document.querySelector('[data-testid="nav-calendar"]'));
          return !!hasNav;
        } catch {
          return false;
        }
      },
      { timeout: ciTimeout, interval: 2000, timeoutMsg: 'Bottom nav did not appear' }
    );
    // Extra buffer for React to settle after initial render
    await browser.pause(2000);
  },

  async afterTest(_test: unknown, _context: unknown, result: { passed: boolean }) {
    if (!result.passed) {
      try {
        const exec = browser as unknown as { execute: <T>(fn: () => T) => Promise<T> };
        const diag = await exec.execute(() => {
          const root = document.getElementById('root');
          return {
            url: location.href,
            title: document.title,
            rootChildren: root ? root.children.length : -1,
            rootHTML: root ? root.innerHTML.substring(0, 500) : 'NO ROOT',
            bodyHTML: document.body.innerHTML.substring(0, 300),
          };
        });
        console.log('[E2E DIAG] Page state on failure:', JSON.stringify(diag, null, 2));
      } catch (e) {
        console.log('[E2E DIAG] Could not capture page state:', e);
      }
    }
  },
};
