/**
 * Visual smoke test for the B3 form-unify refactor.
 *
 * Drives a minimal onboarding then opens body-edit and goals-edit so we
 * can eyeball that the floating-label markup still renders correctly after
 * we replaced the raw `.input-wrapper` with `<app-form-field>`.
 *
 * NOT a regression spec — the assertion is just "screen rendered without crash";
 * the human checks the screenshot.
 */
import { browser } from '@wdio/globals';
import {
  clearAppData,
  forceStop,
  launchApp,
  scrollIntoViewByText,
  snapshot,
  tapByText,
  typeByResourceId,
  waitForText,
} from '../helpers/app-driver';

describe('B3 — Settings forms render after floating-label normalize', () => {
  before(async () => {
    await forceStop();
    await clearAppData();
    await launchApp();
  });

  it('reaches body-edit and goals-edit', async () => {
    // ── Onboarding (minimum viable to land on dashboard) ──
    await waitForText('Mục tiêu', 30_000);
    await tapByText('Giảm cân');
    await tapByText('Tiếp tục');

    await waitForText('Chiều cao', 15_000);
    await typeByResourceId('field-height', '170');
    await typeByResourceId('field-weight', '65');
    await typeByResourceId('field-age', '30');
    await tapByText('Nam');
    await tapByText('Tiếp tục');

    await waitForText('Mức vận động', 15_000);
    await tapByText('Ít vận động');
    await scrollIntoViewByText('Chưa bao giờ');
    await tapByText('Chưa bao giờ');
    await scrollIntoViewByText('Hoàn tất');
    await tapByText('Hoàn tất');

    // ── Open Settings via gear icon on dashboard ──
    await waitForText('Tổng quan', 15_000);
    // Settings gear button has only icon — tap by content-desc fallback
    const settingsBtn = await browser.$('android=new UiSelector().className("android.widget.Button").descriptionContains("settings")');
    if (await settingsBtn.isExisting()) {
      await settingsBtn.click();
    } else {
      // fallback: tap top-right corner where gear lives
      await browser.execute('mobile: clickGesture', { x: 1010, y: 156 });
    }

    // ── body-edit ──
    await waitForText('Cơ thể', 10_000);
    await tapByText('Cơ thể');
    await waitForText('Chiều cao (cm)', 10_000);
    await snapshot('b3-form-unify', '01-body-edit');

    // back to settings
    await browser.back();
    await waitForText('Cài đặt', 5_000).catch(() => waitForText('Mục tiêu', 5_000));

    // ── goals-edit ──
    await tapByText('Mục tiêu');
    await waitForText('Calo (kcal)', 10_000);
    await snapshot('b3-form-unify', '02-goals-edit');
  });
});
