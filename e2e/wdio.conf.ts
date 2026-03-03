export const config = {
  runner: 'local',
  tsConfigPath: './e2e/tsconfig.json',
  specs: ['./e2e/specs/**/*.spec.ts'],
  maxInstances: 1,

  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
      'appium:autoWebview': true,
      'appium:chromedriverAutodownload': true,
      'appium:noReset': false,
    },
  ],

  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
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
};
