#!/usr/bin/env node
/**
 * Check both Android version fields against package.json before building.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(ROOT, 'android');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

if (!Number.isSafeInteger(pkg.androidVersionCode) || pkg.androidVersionCode < 1) {
  console.error('✗ Version sync guard: package.json needs a positive androidVersionCode.');
  process.exit(1);
}

if (
  process.argv.includes('--if-android-present') &&
  !fs.lstatSync(androidDir, { throwIfNoEntry: false })
) {
  console.log('Version sync guard skipped: android directory is absent.');
  process.exit(0);
}

const gradle = fs.readFileSync(path.join(androidDir, 'app/build.gradle'), 'utf8');

const versionName = gradle.match(/\bversionName\s+"([^"]+)"/)?.[1];
const versionCode = Number(gradle.match(/\bversionCode\s+(\d+)/)?.[1]);

if (pkg.version !== versionName || pkg.androidVersionCode !== versionCode) {
  console.error(
    `✗ Version sync guard: package.json (${pkg.version}/${pkg.androidVersionCode}) does not match Gradle (${versionName}/${versionCode}).`,
  );
  console.error('  Run npm run cap:sync -- android before building.');
  process.exit(1);
}

console.log(`✓ Version sync guard: package.json and Android both use ${pkg.version}/${versionCode}.`);
