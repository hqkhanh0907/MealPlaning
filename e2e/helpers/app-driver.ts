/**
 * Helpers for driving the HealthMate AI app via Appium UiAutomator2.
 *
 * Conventions:
 *   - All locators use Vietnamese on-screen text (avoid coupling to coords or
 *     Angular internal selectors that would break on UI tweaks).
 *   - Screenshots saved per-step under e2e/artifacts/<runName>/ for debugging.
 */
import { browser } from '@wdio/globals';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ADB = path.join(
  process.env['HOME'] ?? '',
  'Library/Android/sdk/platform-tools/adb',
);
const SERIAL = 'emulator-5554';
const PKG = 'com.healthmate.ai';

export function adb(...args: string[]): string {
  return execFileSync(ADB, ['-s', SERIAL, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function clearAppData(): void {
  adb('shell', 'pm', 'clear', PKG);
}

export function launchApp(): void {
  adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
}

export function forceStop(): void {
  adb('shell', 'am', 'force-stop', PKG);
}

/**
 * Tap an on-screen element whose visible text contains `needle`.
 * Throws after `timeoutMs` if not found.
 */
export async function tapByText(
  needle: string,
  opts: { timeoutMs?: number; instance?: number } = {},
): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const sel = opts.instance != null
    ? `new UiSelector().textContains("${needle}").instance(${opts.instance})`
    : `new UiSelector().textContains("${needle}")`;
  const el = await browser.$(`android=${sel}`);
  await el.waitForExist({ timeout: timeoutMs });
  await el.click();
}

/** Wait for any node containing `needle` to appear. Useful as a screen-ready probe. */
export async function waitForText(needle: string, timeoutMs = 30_000): Promise<void> {
  const el = await browser.$(
    `android=new UiSelector().textContains("${needle}")`,
  );
  await el.waitForExist({ timeout: timeoutMs });
}

/** Scroll down within the active scrollable container until `needle` is visible. */
export async function scrollIntoViewByText(needle: string): Promise<void> {
  const sel =
    `new UiScrollable(new UiSelector().scrollable(true).instance(0))` +
    `.scrollIntoView(new UiSelector().textContains("${needle}"))`;
  // UiScrollable.scrollIntoView only executes when the element resolution
  // is awaited — calling browser.$(...) alone does NOT trigger the scroll.
  const el = await browser.$(`android=${sel}`);
  await el.waitForExist({ timeout: 10_000 });
}

/**
 * Tap the nearest clickable ancestor of a text node.
 *
 * NOTE: in Capacitor WebView the entire <ion-content> tends to be the
 * single clickable container, so the UiSelector.clickable(true)
 * .childSelector(...) chain often does NOT find a tighter match.
 * For most cases plain `tapByText` works because the text node itself
 * inherits the click handler from the WebView. Keep this helper for
 * native (non-WebView) scenarios.
 */
export async function tapClickableContaining(needle: string, timeoutMs = 15_000): Promise<void> {
  const sel =
    `new UiSelector().clickable(true)` +
    `.childSelector(new UiSelector().textContains("${needle}"))`;
  const el = await browser.$(`android=${sel}`);
  await el.waitForExist({ timeout: timeoutMs });
  await el.click();
}

/**
 * Type into an input identified by Android resource-id (e.g. `field-height`).
 * Uses click-to-focus + `adb shell input text` so we bypass the
 * ACTION_SET_PROGRESS binding that ion-input nodes expose to UiAutomator
 * (setValue() would fail on those with "ACTION_SET_PROGRESS has failed").
 */
export async function typeByResourceId(
  resourceId: string,
  text: string,
): Promise<void> {
  const sel = `new UiSelector().resourceId("${resourceId}")`;
  const el = await browser.$(`android=${sel}`);
  await el.waitForExist({ timeout: 15_000 });
  await el.click(); // focus the input
  // adb input text doesn't handle special chars but plain digits are safe.
  adb('shell', 'input', 'text', text);
}

/**
 * @deprecated Prefer `typeByResourceId` — ion-input EditTexts trip
 * ACTION_SET_PROGRESS when WDIO's setValue() is used.
 */
export async function typeIntoEditText(
  index: number,
  text: string,
): Promise<void> {
  const sel = `new UiSelector().className("android.widget.EditText").instance(${index})`;
  const el = await browser.$(`android=${sel}`);
  await el.waitForExist({ timeout: 15_000 });
  await el.click();
  adb('shell', 'input', 'text', text);
}

/** Save a PNG snapshot of current screen under e2e/artifacts/<runName>/<step>.png */
export async function snapshot(runName: string, step: string): Promise<string> {
  const dir = path.join(__dirname, '..', 'artifacts', runName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${step}.png`);
  await browser.saveScreenshot(file);
  return file;
}

/**
 * Read a SQLite table from the on-device app DB via `adb run-as`.
 * Returns rows as object array (uses sqlite3 .mode json).
 *
 * sqlite3 binary is NOT on the emulator — we copy the DB out via cat-pipe,
 * then query locally. WAL files merged via `PRAGMA wal_checkpoint(FULL)`.
 */
export function querySqlite(sql: string): unknown[] {
  // 1. Copy DB out of app sandbox to a host tmp file.
  const tmpDb = `/tmp/healthmate-${Date.now()}.db`;
  // run-as cat the file (works without root on debug builds).
  const dbContent = execFileSync(
    ADB,
    [
      '-s', SERIAL, 'exec-out',
      'run-as', PKG,
      'cat', `databases/healthmateSQLite.db`,
    ],
    { encoding: 'buffer' },
  );
  fs.writeFileSync(tmpDb, dbContent);
  // 2. Also pull WAL if it exists, so recent writes are visible.
  try {
    const wal = execFileSync(
      ADB,
      [
        '-s', SERIAL, 'exec-out',
        'run-as', PKG,
        'cat', `databases/healthmateSQLite.db-wal`,
      ],
      { encoding: 'buffer' },
    );
    if (wal.length > 0) fs.writeFileSync(`${tmpDb}-wal`, wal);
  } catch {
    /* no WAL — DB already checkpointed */
  }
  // 3. Query via local sqlite3.
  const out = execFileSync(
    'sqlite3',
    [tmpDb, '-json', sql],
    { encoding: 'utf8' },
  ).trim();
  fs.unlinkSync(tmpDb);
  try { fs.unlinkSync(`${tmpDb}-wal`); } catch { /* ignore */ }
  if (!out) return [];
  return JSON.parse(out) as unknown[];
}

export const APP_PKG = PKG;
