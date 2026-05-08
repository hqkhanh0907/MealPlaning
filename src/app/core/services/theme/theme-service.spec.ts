import { TestBed } from '@angular/core/testing';
import { Theme } from './theme-service';

describe('Theme', () => {
  let theme: Theme;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    theme = TestBed.inject(Theme);
    document.documentElement.removeAttribute('data-theme');
  });

  afterAll(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it("apply('dark') sets data-theme to 'dark'", () => {
    theme.apply('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it("apply('light') sets data-theme to 'light'", () => {
    theme.apply('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it("apply('system') removes the data-theme attribute", () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    theme.apply('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it("apply('system') is a no-op when attribute already absent", () => {
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    theme.apply('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('switching modes overwrites previous attribute (dark → light → system)', () => {
    theme.apply('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    theme.apply('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    theme.apply('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('apply is idempotent — calling twice with same mode keeps attribute', () => {
    theme.apply('dark');
    theme.apply('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
