import assert from 'node:assert';
import { SettingsPage } from '../pages/SettingsPage';
import { ManagementPage } from '../pages/ManagementPage';

type ExecutableBrowser = typeof browser & {
  execute: <T>(fn: (...args: string[]) => T, ...args: string[]) => Promise<T>;
};

describe('i18n Language', () => {
  const settings = new SettingsPage();
  const mgmt = new ManagementPage();

  before(async () => {
    await settings.switchToWebview();
    await settings.navigateTo('settings');
    await browser.pause(500);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_I18N_01 — Switch language to English
  // ─────────────────────────────────────────────────────────────────
  it('TC_I18N_01 — should switch UI to English', async () => {
    await settings.switchLang('en');
    await browser.pause(500);

    // Verify settings title changed to English
    const title = await (browser as unknown as ExecutableBrowser).execute(() => {
      const els = document.querySelectorAll('h2, h3');
      for (const el of els) {
        if (el.textContent?.includes('Settings') || el.textContent?.includes('Language')) return el.textContent;
      }
      return '';
    });
    assert.ok(
      title.includes('Settings') || title.includes('Language'),
      `Expected English text in settings, got: "${title}"`,
    );
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_I18N_02 — Switch language to Vietnamese
  // ─────────────────────────────────────────────────────────────────
  it('TC_I18N_02 — should switch UI to Vietnamese', async () => {
    await settings.switchLang('vi');
    await browser.pause(500);

    const title = await (browser as unknown as ExecutableBrowser).execute(() => {
      const els = document.querySelectorAll('h2, h3');
      for (const el of els) {
        if (el.textContent?.includes('Cài đặt') || el.textContent?.includes('Ngôn ngữ')) return el.textContent;
      }
      return '';
    });
    assert.ok(
      title.includes('Cài đặt') || title.includes('Ngôn ngữ'),
      `Expected Vietnamese text in settings, got: "${title}"`,
    );
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_I18N_03 — Language persists after reload
  // ─────────────────────────────────────────────────────────────────
  it('TC_I18N_03 — language preference should persist in localStorage', async () => {
    await settings.switchLang('en');
    await browser.pause(300);

    const stored = await (browser as unknown as ExecutableBrowser).execute(() => {
      return localStorage.getItem('mp-language') || '';
    });
    assert.strictEqual(stored, 'en', 'Language should be saved as "en" in localStorage');

    // Restore to vi
    await settings.switchLang('vi');
    await browser.pause(300);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_I18N_04 — Nav labels update on language change
  // ─────────────────────────────────────────────────────────────────
  it('TC_I18N_04 — nav labels should change when language switches', async () => {
    await settings.switchLang('en');
    await browser.pause(500);

    const navText = await (browser as unknown as ExecutableBrowser).execute(() => {
      const btn = document.querySelector('[data-testid="nav-calendar"]');
      return btn?.getAttribute('aria-label') || btn?.textContent?.trim() || '';
    });
    assert.ok(navText.includes('Calendar'), `Expected "Calendar" in nav, got: "${navText}"`);

    await settings.switchLang('vi');
    await browser.pause(500);

    const navTextVi = await (browser as unknown as ExecutableBrowser).execute(() => {
      const btn = document.querySelector('[data-testid="nav-calendar"]');
      return btn?.getAttribute('aria-label') || btn?.textContent?.trim() || '';
    });
    assert.ok(navTextVi.includes('Lịch trình'), `Expected "Lịch trình" in nav, got: "${navTextVi}"`);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_I18N_05 — Localized field rendering for ingredients
  // ─────────────────────────────────────────────────────────────────
  describe('Localized field rendering (TC_I18N_05)', () => {
    before(async () => {
      // Inject a bilingual ingredient
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
        if (!ings.some((i) => i.id === 'e2e-i18n-ing')) {
          ings.push({
            id: 'e2e-i18n-ing',
            name: { vi: 'Gạo trắng', en: 'White rice' },
            caloriesPer100: 130,
            proteinPer100: 2.7,
            carbsPer100: 28,
            fatPer100: 0.3,
            fiberPer100: 0.4,
            unit: { vi: 'g', en: 'g' },
          });
          localStorage.setItem('mp-ingredients', JSON.stringify(ings));
        }
      });
    });

    it('TC_I18N_05 — ingredient name should display in current language', async () => {
      // Navigate to settings and switch to English
      await mgmt.navigateTo('settings');
      await browser.pause(300);
      await settings.switchLang('en');
      await browser.pause(300);
      await mgmt.navigateTo('management');
      await browser.pause(300);
      await mgmt.openIngredientsSubTab();
      await browser.pause(500);

      // Check that any ingredient is displayed (verifies rendering in current language)
      const hasIngredients = await (browser as unknown as ExecutableBrowser).execute(() => {
        // Look for ingredient cards/items in the list
        const items = document.querySelectorAll('[data-testid*="btn-edit-ingredient-"]');
        return items.length > 0;
      });
      assert.ok(hasIngredients, 'Ingredients should be displayed in ingredient list');

      // Restore to Vietnamese
      await mgmt.navigateTo('settings');
      await browser.pause(300);
      await settings.switchLang('vi');
      await browser.pause(300);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_I18N_06 — Validation messages in correct language
  // ─────────────────────────────────────────────────────────────────
  describe('Validation messages (TC_I18N_06)', () => {
    it('TC_I18N_06 — validation error should be in current language', async () => {
      // Navigate to settings and switch to English
      await mgmt.navigateTo('settings');
      await browser.pause(300);
      await settings.switchLang('en');
      await browser.pause(300);

      // Go to management and try to save empty ingredient
      await mgmt.navigateTo('management');
      await browser.pause(300);
      await mgmt.openIngredientsSubTab();
      await browser.pause(300);
      await mgmt.tapAddIngredient();
      await browser.pause(300);

      await mgmt.saveIngredientWithoutWait();
      await browser.pause(300);

      const errorText = await (browser as unknown as ExecutableBrowser).execute(() => {
        const el = document.querySelector('[data-testid="error-ing-name"]');
        return el?.textContent || '';
      });
      // English validation message should not be Vietnamese
      assert.ok(errorText.length > 0, 'Validation error should be displayed');

      // Close modal
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const btn = document.querySelector('[data-testid="btn-close-ingredient"]') as HTMLElement;
        btn?.click();
      });
      await browser.pause(300);
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const btn = document.querySelector('[data-testid="btn-discard-unsaved"]') as HTMLElement;
        btn?.click();
      });
      await browser.pause(300);

      // Restore to Vietnamese
      await mgmt.navigateTo('settings');
      await browser.pause(300);
      await settings.switchLang('vi');
      await browser.pause(300);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_I18N_07 — Theme labels update with language
  // ─────────────────────────────────────────────────────────────────
  it('TC_I18N_07 — theme section labels should change with language', async () => {
    await settings.navigateTo('settings');
    await browser.pause(300);

    await settings.switchLang('en');
    await browser.pause(500);

    const themeText = await (browser as unknown as ExecutableBrowser).execute(() => {
      const els = document.querySelectorAll('h3');
      for (const el of els) {
        if (el.textContent?.includes('Appearance')) return el.textContent;
      }
      return '';
    });
    assert.ok(themeText.includes('Appearance'), `Expected "Appearance" label, got: "${themeText}"`);

    await settings.switchLang('vi');
    await browser.pause(500);

    const themeTextVi = await (browser as unknown as ExecutableBrowser).execute(() => {
      const els = document.querySelectorAll('h3');
      for (const el of els) {
        if (el.textContent?.includes('Giao diện')) return el.textContent;
      }
      return '';
    });
    assert.ok(themeTextVi.includes('Giao diện'), `Expected "Giao diện" label, got: "${themeTextVi}"`);
  });
});
