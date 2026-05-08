import { Injectable } from '@angular/core';

/**
 * @deprecated Story 2.6 (2026-05-08) — dark mode was removed; the app is
 * light-only. This service is kept as a no-op shim so existing call sites
 * compile while we wait to delete it in a future cleanup. New code MUST
 * NOT introduce theme switching: the user_profile.theme column is locked
 * to 'light' via CHECK constraint at the DB layer.
 */
export type ThemeMode = 'light';

@Injectable({ providedIn: 'root' })
export class Theme {
  /**
   * @deprecated No-op. Always renders the light palette regardless of
   * argument. Kept only to preserve call sites.
   */
  apply(_mode: ThemeMode = 'light'): void {
    document.documentElement.removeAttribute('data-theme');
  }
}
