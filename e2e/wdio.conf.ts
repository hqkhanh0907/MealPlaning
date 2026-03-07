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
      'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
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
  waitforTimeout: 30000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
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
    // Wait for Capacitor React app to finish loading inside the WebView
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
    // Clear localStorage to isolate test state between spec files, then reload
    await exec.execute(() => { localStorage.clear(); });
    await exec.execute(() => { location.reload(); });
    // Wait for page to be ready again after reload
    await browser.waitUntil(
      async () => {
        try {
          const state = await exec.execute(() => document.readyState);
          return state === 'complete';
        } catch {
          return false;
        }
      },
      { timeout: 30000, interval: 1000, timeoutMsg: 'App did not reload in 30s' }
    );
    // Extra buffer for React to finish mounting after document ready
    await browser.pause(2000);
  },
};
