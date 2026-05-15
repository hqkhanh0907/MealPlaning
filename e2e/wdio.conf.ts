/**
 * WebdriverIO config for HealthMate AI E2E tests.
 *
 * Drives the installed APK on emulator-5554 via Appium + UiAutomator2.
 * Uses NATIVE_APP context to avoid WebView 147 CDP SIGTRAP
 * (see skill `mealplaning-emulator-fast-qa`).
 *
 * Prereqs:
 *   - Emulator booted: `~/Library/Android/sdk/emulator/emulator -avd <avd>`
 *   - APK installed: see `references/apk-delivery-and-scss-budget.md`
 *   - Appium server running: `npm run e2e:appium` in another shell
 */
export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: './e2e/tsconfig.json',

  specs: ['./specs/**/*.e2e.ts'],
  maxInstances: 1,

  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'emulator-5554',
      'appium:udid': 'emulator-5554',
      'appium:appPackage': 'com.healthmate.ai',
      'appium:appActivity': '.MainActivity',
      'appium:noReset': true, // keep installed app + DB; tests responsible for state
      'appium:newCommandTimeout': 240,
      // No chromedriver context — WebView 147 has SIGTRAP via CDP.
      // We drive native UI hierarchy + on-screen text instead.
    },
  ],

  logLevel: 'info',
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: { ui: 'bdd', timeout: 120_000 },

  // Appium server — assume running on default port 4723.
  hostname: '127.0.0.1',
  port: 4723,
  path: '/',
  protocol: 'http',
  // First UiAutomator2 session does on-device server install (~60-90s on
  // emulator-5554) — default 120s is borderline. Bump generously.
  connectionRetryTimeout: 240_000,
  connectionRetryCount: 1,
};
