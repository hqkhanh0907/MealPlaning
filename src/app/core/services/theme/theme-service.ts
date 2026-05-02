import { Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Applies the user-selected theme by writing a data-theme attribute on
 * <html>. When mode is 'system', the attribute is removed so the
 * prefers-color-scheme media query in SCSS takes over.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  apply(mode: ThemeMode): void {
    const html = document.documentElement;
    if (mode === 'system') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', mode);
    }
  }
}
