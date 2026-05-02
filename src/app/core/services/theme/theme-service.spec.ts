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
});
