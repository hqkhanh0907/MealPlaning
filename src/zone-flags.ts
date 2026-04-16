/**
 * Prevents Angular change detection from
 * running with certain Web Component callbacks
 */

// Make this file a module so `declare global` works
export {};

declare global {
  interface Window {
    __Zone_disable_customElements: boolean;
  }
}

window.__Zone_disable_customElements = true;
