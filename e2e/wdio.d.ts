/**
 * Ambient type declarations for Appium E2E tests.
 * These provide minimal type stubs so VS Code doesn't show errors
 * before WDIO dependencies are installed.
 * 
 * Once you run `npm install` with WDIO packages, remove this file
 * and use the real @wdio types instead.
 */

// WebdriverIO global `$` selector
declare function $(selector: string): WebdriverIO.Element;
declare function $$(selector: string): WebdriverIO.Element[];

// WebdriverIO global `browser`
declare const browser: {
  getContexts(): Promise<string[]>;
  switchContext(context: string): Promise<void>;
  url(path: string): Promise<void>;
  pause(ms: number): Promise<void>;
  waitUntil(
    condition: () => Promise<boolean>,
    options?: { timeout?: number; interval?: number; timeoutMsg?: string }
  ): Promise<boolean>;
};

// Mocha globals
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => Promise<void>): void;
declare function before(fn: () => Promise<void>): void;
declare function after(fn: () => Promise<void>): void;
declare function beforeEach(fn: () => Promise<void>): void;
declare function afterEach(fn: () => Promise<void>): void;

// WebdriverIO expect extension
declare function expect(value: unknown): {
  toBeDisplayed(): Promise<void>;
  toHaveText(text: string): Promise<void>;
  toHaveTextContaining(text: string): Promise<void>;
  toBeExisting(): Promise<void>;
  toBeClickable(): Promise<void>;
  not: {
    toBeDisplayed(): Promise<void>;
    toBeExisting(): Promise<void>;
  };
};

// WebdriverIO Element type stub
declare namespace WebdriverIO {
  interface Element {
    click(): Promise<void>;
    setValue(value: string): Promise<void>;
    clearValue(): Promise<void>;
    getText(): Promise<string>;
    getAttribute(name: string): Promise<string>;
    isDisplayed(): Promise<boolean>;
    isExisting(): Promise<boolean>;
    waitForDisplayed(opts?: { timeout?: number; reverse?: boolean }): Promise<void>;
    waitForExist(opts?: { timeout?: number; reverse?: boolean }): Promise<void>;
    $: (selector: string) => Element;
    $$: (selector: string) => Element[];
  }
}

// @wdio/types stub
declare module '@wdio/types' {
  export interface Options {
    [key: string]: unknown;
  }
}
