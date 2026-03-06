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
    // Use document.querySelector inside execute() to avoid WebElement
    // deserialization failures in Chrome 91 Appium WebView — passing a
    // WebElement object as execute() argument results in a plain JS object
    // (not a DOM element) so el.click() would throw "not a function".
    await (browser as unknown as ContextCapableBrowser).execute((tid: string) => {
      const el = document.querySelector(`[data-testid="${tid}"]`) as HTMLElement;
      if (el) el.click();
    }, testid);
    // Give React time to process the event and commit the state update to DOM
    await browser.pause(300);
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
    // Use document.querySelector inside execute() — passing a WebElement
    // as execute() argument doesn't work in Chrome 91 Appium WebView
    // (element is not deserialized to DOM node, so .value/.dispatchEvent fail).
    // Also dispatches 'input' so React's onChange handler fires.
    await (browser as unknown as ContextCapableBrowser).execute((tid: string, v: string) => {
      const el = document.querySelector(`[data-testid="${tid}"]`) as HTMLInputElement & { _valueTracker?: { setValue: (v: string) => void } };
      if (!el) return;
      // Walk up prototype chain to find the native value setter (works for
      // both HTMLInputElement and HTMLSelectElement on Chrome 91).
      let proto = Object.getPrototypeOf(el);
      let descriptor: PropertyDescriptor | undefined;
      while (proto && !descriptor) {
        descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
        if (!descriptor) proto = Object.getPrototypeOf(proto);
      }
      if (descriptor?.set) {
        descriptor.set.call(el, v);
      } else {
        el.value = v;
      }
      // Invalidate React 18's internal value tracker so React detects the
      // change and fires onChange (without this, React thinks the value
      // hasn't changed and swallows the event).
      if (el._valueTracker) {
        el._valueTracker.setValue('');
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, testid, value);
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
