/**
 * BasePage — common helpers for all Appium Page Objects.
 * Uses CSS `[data-testid]` selectors in webview context.
 */
export class BasePage {
  /** Return element by data-testid (CSS selector for webview context). */
  el(testid: string) {
    return $(`[data-testid="${testid}"]`);
  }

  /** Wait for element and click. */
  async waitAndClick(testid: string) {
    const elem = this.el(testid);
    await elem.waitForDisplayed({ timeout: 10_000 });
    await elem.click();
  }

  /** Type into an input identified by data-testid. */
  async type(testid: string, value: string) {
    const elem = this.el(testid);
    await elem.waitForDisplayed({ timeout: 10_000 });
    await elem.clearValue();
    await elem.setValue(value);
  }

  /** Get text content of element. */
  async getText(testid: string) {
    const elem = this.el(testid);
    await elem.waitForDisplayed({ timeout: 10_000 });
    return elem.getText();
  }

  /** Switch driver context to WEBVIEW (Capacitor hybrid).
   *  With appium:autoWebview=true, driver starts in webview context already.
   *  Falls back gracefully if context switching is not available. */
  async switchToWebview() {
    try {
      const b = browser as any;
      const contexts = await b.getContexts();
      const webview = (contexts as string[]).find((c: string) => c.startsWith('WEBVIEW'));
      if (webview) await b.switchContext(webview);
    } catch {
      // autoWebview is enabled — already in webview context
    }
  }

  /** Switch driver context back to NATIVE_APP. */
  async switchToNative() {
    try {
      await (browser as any).switchContext('NATIVE_APP');
    } catch {
      // Ignore if context switching not available
    }
  }

  /** Navigate to a tab via bottom nav. */
  async navigateTo(tab: string) {
    await this.waitAndClick(`nav-${tab}`);
  }
}
