/**
 * E2E: onboarding 3-step → DB persist → reload.
 *
 * Motivation (ADR-001): Story 2.6 collapsed 6 SQLite migrations into 1.
 * Phase 3 will add a 2nd migration. We need automated proof that:
 *   1. A fresh install can complete onboarding via the 3-step wizard
 *      (step 1: goal, step 2: body+gender, step 3: activity+gym).
 *   2. After "Hoàn tất" the user_profile row is persisted to SQLite.
 *   3. After force-stop + relaunch, the user lands on the dashboard
 *      (NOT on onboarding) — proving the persist + boot-detection works.
 *
 * Reset strategy: `adb shell pm clear` in `before()` (full wipe).
 *
 * Default seed (matches `references/emulator-fast-qa.md` §2):
 *   Goal: Giảm cân
 *   Body: 170 cm / 60 kg / 30 yo / Nam
 *   Activity: Ít vận động
 *   Gym: Chưa bao giờ
 */
import { browser } from '@wdio/globals';
import * as assert from 'node:assert/strict';
import {
  adb,
  clearAppData,
  forceStop,
  launchApp,
  scrollIntoViewByText,
  snapshot,
  tapByText,
  typeByResourceId,
  waitForText,
  querySqlite,
} from '../helpers/app-driver';

const RUN = 'onboarding-persist';

describe('HealthMate AI — onboarding persists across restart', function () {
  this.timeout(300_000);

  before(async () => {
    // Full reset: wipe app data (DB, prefs), kill any running session,
    // then let Appium auto-launch via its session capabilities.
    forceStop();
    clearAppData();
    // Re-launch and wait for splash → onboarding step 1.
    launchApp();
    // Splash takes 6-8s on emulator-5554 (skill §3 pitfall).
    await browser.pause(10_000);
  });

  it('completes the 3-step wizard and persists user_profile', async () => {
    // ── Step 1: Goal ──────────────────────────────────────────────────
    await waitForText('Mục tiêu', 30_000);
    await snapshot(RUN, '01-step1-goal');
    await tapByText('Giảm cân');
    await tapByText('Tiếp tục');

    // ── Step 2: Body info (height/weight/age + gender) ────────────────
    await waitForText('Chiều cao', 15_000);
    await snapshot(RUN, '02-step2-body-empty');
    await typeByResourceId('field-height', '170');
    await typeByResourceId('field-weight', '60');
    await typeByResourceId('field-age', '30');
    // Hide the soft keyboard so the Tiếp tục button is reachable.
    adb('shell', 'input', 'keyevent', '4');
    await browser.pause(500);
    await tapByText('Nam');
    await snapshot(RUN, '03-step2-body-filled');
    await tapByText('Tiếp tục');

    // ── Step 3: Activity level + gym experience ───────────────────────
    // BOTH radio groups MUST be selected — otherwise step2bValid() = false
    // and "Hoàn tất" stays disabled.
    await waitForText('Mức vận động', 15_000);
    await snapshot(RUN, '04-step3-activity');
    await tapByText('Ít vận động');
    // Gym section is below the fold — scroll into view first.
    await scrollIntoViewByText('Chưa bao giờ').catch(() => undefined);
    await tapByText('Chưa bao giờ');
    await snapshot(RUN, '05-step3-filled');

    // ── Final: Hoàn tất ───────────────────────────────────────────────
    await scrollIntoViewByText('Hoàn tất').catch(() => undefined);
    await tapByText('Hoàn tất');
    // Onboarding completion writes to SQLite + navigates to dashboard.
    // Allow time for the write + navigation animation.
    await browser.pause(4_000);
    await snapshot(RUN, '06-after-hoan-tat');

    // ── Verify SQLite persistence ─────────────────────────────────────
    const profiles = querySqlite(
      'SELECT * FROM user_profile;',
    ) as Record<string, unknown>[];
    assert.equal(profiles.length, 1, 'expected exactly one user_profile row');
    const p = profiles[0];
    assert.equal(p['height_cm'], 170);
    assert.equal(p['weight_kg'], 60);
    assert.equal(p['age'], 30);

    // onboarding_completed flag — column name verified via schema dump
    // (see Story 2.6 collapsed v1 schema). If this assertion fails after
    // a schema rename, update both this line AND the assertion below.
    assert.equal(p['onboarding_completed'], 1);
  });

  it('lands on dashboard after force-stop + relaunch (no re-onboarding)', async () => {
    // Skill §3 pitfall: tab bar disappears right after Hoàn tất.
    // The fix is the same restart we test here — so this also verifies
    // the post-onboarding tab-bar visibility regression stays fixed.
    forceStop();
    await browser.pause(1_000);
    launchApp();
    await browser.pause(8_000); // splash + boot
    await snapshot(RUN, '07-after-restart');

    // Dashboard tab is "Tổng quan" — assert it's visible AND we are NOT
    // back on the onboarding goal screen.
    await waitForText('Tổng quan', 20_000);
    const onboardingProbe = await browser.$(
      'android=new UiSelector().textContains("Mục tiêu của bạn")',
    );
    assert.equal(
      await onboardingProbe.isExisting(),
      false,
      'onboarding goal screen leaked back after restart — persistence broken',
    );
  });
});
