/**
 * BasePage — common helpers for all Appium Page Objects.
 * Uses CSS `[data-testid]` selectors in webview context.
 */
type ContextCapableBrowser = typeof browser & {
  getContexts: () => Promise<string[]>;
  switchContext: (context: string) => Promise<void>;
};

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

  /** Check whether a testid element is currently displayed. */
  async isDisplayed(testid: string) {
    try {
      const elem = this.el(testid);
      return (await elem.isExisting()) && (await elem.isDisplayed());
    } catch {
      return false;
    }
  }

  /** Switch driver context to WEBVIEW (Capacitor hybrid).
   *  With appium:autoWebview=true, driver starts in webview context already.
   *  Falls back gracefully if context switching is not available. */
  async switchToWebview() {
    try {
      const b = browser as unknown as ContextCapableBrowser;
      const contexts = await b.getContexts();
      const webview = contexts.find((c: string) => c.startsWith('WEBVIEW'));
      if (webview) await b.switchContext(webview);
    } catch {
      // autoWebview is enabled — already in webview context
    }
  }

  /** Switch driver context back to NATIVE_APP. */
  async switchToNative() {
    try {
      await (browser as unknown as ContextCapableBrowser).switchContext('NATIVE_APP');
    } catch {
      // Ignore if context switching not available
    }
  }

  /** Navigate to a tab via bottom nav. */
  async navigateTo(tab: string) {
    await this.waitAndClick(`nav-${tab}`);
  }
}
