import { TestBed } from '@angular/core/testing';
import { Theme } from './theme-service';

describe('Theme (light-only deprecated shim — Story 2.6)', () => {
  let theme: Theme;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    theme = TestBed.inject(Theme);
    document.documentElement.removeAttribute('data-theme');
  });

  afterAll(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('apply() with no argument removes any data-theme attribute', () => {
    document.documentElement.setAttribute('data-theme', 'stale');
    theme.apply();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it("apply('light') is a no-op (attribute stays absent)", () => {
    theme.apply('light');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('apply() is idempotent across multiple calls', () => {
    theme.apply('light');
    theme.apply('light');
    theme.apply();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
