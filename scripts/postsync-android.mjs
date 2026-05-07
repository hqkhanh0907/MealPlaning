#!/usr/bin/env node
/**
 * postsync-android.mjs
 *
 * Capacitor convention: /android/ is gitignored và được regenerate qua `npx cap sync`.
 * Một số custom Android manifest entries phải được re-applied sau mỗi sync.
 *
 * Story 2.2 (D1 fix): thêm POST_NOTIFICATIONS permission (Android 13+ runtime).
 *
 * Idempotent: chạy nhiều lần không tạo duplicate.
 *
 * Usage:
 *   node scripts/postsync-android.mjs
 *   npm run cap:sync              # tự động chạy postsync
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST = resolve(ROOT, 'android/app/src/main/AndroidManifest.xml');

const PATCHES = [
  {
    name: 'POST_NOTIFICATIONS (Story 2.2 D1)',
    test: /android\.permission\.POST_NOTIFICATIONS/,
    apply: (xml) =>
      xml.replace(
        /<uses-permission android:name="android\.permission\.INTERNET" \/>\s*\n(\s*)<\/manifest>/,
        '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n$1</manifest>',
      ),
  },
];

function main() {
  if (!existsSync(MANIFEST)) {
    console.warn(`[postsync] ${MANIFEST} không tồn tại — chạy 'npx cap add android' trước.`);
    process.exit(0);
  }
  let xml = readFileSync(MANIFEST, 'utf8');
  let changed = false;
  for (const patch of PATCHES) {
    if (patch.test.test(xml)) {
      console.log(`[postsync] ✓ already applied: ${patch.name}`);
      continue;
    }
    const next = patch.apply(xml);
    if (next === xml) {
      console.error(`[postsync] ✗ FAIL apply: ${patch.name} — manifest format unexpected`);
      process.exit(1);
    }
    xml = next;
    changed = true;
    console.log(`[postsync] + applied: ${patch.name}`);
  }
  if (changed) {
    writeFileSync(MANIFEST, xml, 'utf8');
    console.log(`[postsync] ✓ wrote ${MANIFEST}`);
  } else {
    console.log(`[postsync] no changes needed`);
  }
}

main();
