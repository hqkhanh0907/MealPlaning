/**
 * E2E smoke: app boots, WebView renders, screenshot saved.
 *
 * Per ADR-001 (Accepted): this proves the WDIO + Appium + UiAutomator2
 * pipeline works against the installed APK on emulator-5554. It does NOT
 * verify onboarding state — the device may already be onboarded
 * (`appium:noReset: true`).
 *
 * Onboarding-flow E2E with full reset lives in
 * `e2e/specs/onboarding-persist.e2e.ts` (next story).
 */
import { browser } from '@wdio/globals';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('HealthMate AI — smoke boot', () => {
  const SCREENSHOT_DIR = path.join(__dirname, '..', 'artifacts');

  before(() => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  it('boots, renders WebView, captures screenshot', async () => {
    // Capacitor's BridgeActivity hosts a system WebView whose class is
    // android.webkit.WebView. First paint takes ~3-6s on emulator-5554.
    await browser.pause(6000);

    const webView = await browser.$('android.webkit.WebView');
    await webView.waitForExist({ timeout: 30_000 });

    const exists = await webView.isExisting();
    if (!exists) {
      throw new Error('WebView did not render — Capacitor boot failed');
    }

    const shotPath = path.join(SCREENSHOT_DIR, 'smoke-boot.png');
    await browser.saveScreenshot(shotPath);

    // Save the page source for visual debugging when the smoke evolves.
    const src = await browser.getPageSource();
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'smoke-boot.xml'), src);
  });
});
