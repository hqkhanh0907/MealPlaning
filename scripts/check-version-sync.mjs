#!/usr/bin/env node
/**
 * Story 2.5 (AC-4) — keep package.json `version` and android `versionName` in sync.
 *
 * Policy (docs/5-development/release-versioning.md):
 *   - SemVer 0.MAJOR.MINOR until 1.0 release.
 *   - Bump `package.json` version FIRST, then mirror into
 *     android/app/build.gradle `versionName`. `versionCode` increments by 1
 *     on every release build (manual, monotonically increasing).
 *
 * Fails if the two strings drift, so a forgotten bump can't slip into a
 * signed APK.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const gradle = fs.readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8');

const versionNameMatch = gradle.match(/versionName\s+"([^"]+)"/);
if (!versionNameMatch) {
  console.error('✗ Version sync guard: cannot locate versionName in android/app/build.gradle');
  process.exit(1);
}
const versionName = versionNameMatch[1];

if (pkg.version !== versionName) {
  console.error(
    `✗ Version sync guard: package.json (${pkg.version}) ≠ android versionName (${versionName}).`,
  );
  console.error('  Update both atomically per docs/5-development/release-versioning.md.');
  process.exit(1);
}

console.log(`✓ Version sync guard: package.json + android both at ${pkg.version}.`);
