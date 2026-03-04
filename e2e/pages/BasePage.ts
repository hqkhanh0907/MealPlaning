/**
 * BasePage — common helpers for all Appium Page Objects.
 * Uses CSS `[data-testid]` selectors in webview context.
 */
type ContextCapableBrowser = typeof browser & {
  getContexts: () => Promise<string[]>;
  switchContext: (context: string) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (fn: (...args: any[]) => void, ...args: unknown[]) => Promise<void>;
};

export class BasePage {
  /** Return element by data-testid (CSS selector for webview context). */
  el(testid: string) {
    return $(`[data-testid="${testid}"]`);
  }

  /** Wait for element to be displayed AND stable (handles modal open animations). */
  async waitForClickable(testid: string, timeout = 15_000) {
    const elem = this.el(testid);
    await elem.waitForDisplayed({ timeout });
    await browser.waitUntil(async () => elem.isEnabled(), {
      timeout,
      interval: 200,
      timeoutMsg: `Element [data-testid="${testid}"] not interactable after ${timeout}ms`,
    });
  }

  /** Wait for element and click. */
  async waitAndClick(testid: string) {
    const elem = this.el(testid);
    await elem.waitForDisplayed({ timeout: 15_000 });
    await browser.waitUntil(async () => elem.isEnabled(), {
      timeout: 15_000,
      interval: 200,
    });
    // Use JavaScript click() to bypass WebDriver interactability restrictions
    // that occur in Capacitor hybrid webview (Chrome 91, Android API 31).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (browser as unknown as ContextCapableBrowser).execute((el: any) => {
      el.click();
    }, elem);
  }

  /**
   * Type into an input identified by data-testid.
   * Uses JavaScript setValue as fallback for Capacitor webview where
   * WebDriver's clearValue/setValue may fail with "element not interactable"
   * due to body scroll-lock positioning applied by ModalBackdrop.
   */
  async type(testid: string, value: string) {
    const elem = this.el(testid);
    await elem.waitForDisplayed({ timeout: 15_000 });
    await browser.waitUntil(async () => elem.isEnabled(), {
      timeout: 15_000,
      interval: 200,
    });
    // Use JavaScript to set value directly — bypasses WebDriver interactability
    // checks that fail on Capacitor hybrid webview (Chrome 91, Android API 31).
    // Also dispatches an 'input' event so React's onChange handler fires.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (browser as unknown as ContextCapableBrowser).execute((el: any, v: string) => {
      const descriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(el), 'value'
      );
      descriptor?.set?.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, elem, value);
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
