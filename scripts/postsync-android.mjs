#!/usr/bin/env node
/**
 * postsync-android.mjs
 *
 * Capacitor convention: /android/ is gitignored và được regenerate qua `npx cap sync`.
 * Một số custom Android files phải được re-applied sau mỗi sync (idempotent).
 *
 * Patches:
 *  - Story 2.2 (D1): POST_NOTIFICATIONS permission trong AndroidManifest.xml.
 *  - Story 2.5 (AC-3 + AC-4): release signing config + versionCode/versionName
 *    trong android/app/build.gradle.
 *  - Story 2.5 (AC-3): keystore.properties + *.jks vào android/.gitignore.
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
const BUILD_GRADLE = resolve(ROOT, 'android/app/build.gradle');
const ANDROID_GITIGNORE = resolve(ROOT, 'android/.gitignore');

// Read canonical version once from package.json so guard + gradle stay in sync.
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const VERSION_NAME = pkg.version;
// versionCode bumps manually per release-versioning.md — read from existing
// gradle and preserve it (postsync should never silently revert it).
function currentVersionCode(gradle) {
  const m = gradle.match(/versionCode\s+(\d+)/);
  return m ? Number(m[1]) : 1;
}

const MANIFEST_PATCHES = [
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

function patchManifest() {
  if (!existsSync(MANIFEST)) {
    console.warn(`[postsync] ${MANIFEST} không tồn tại — chạy 'npx cap add android' trước.`);
    return;
  }
  let xml = readFileSync(MANIFEST, 'utf8');
  let changed = false;
  for (const patch of MANIFEST_PATCHES) {
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
  if (changed) writeFileSync(MANIFEST, xml, 'utf8');
}

const SIGNING_BLOCK = `
// Story 2.5 (AC-3) — release signing from android/keystore.properties
// (rendered + cleaned by scripts/release/build-signed-apk.sh).
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystorePropertiesFile.withInputStream { keystoreProperties.load(it) }
}
`;

const SIGNING_CONFIGS_BLOCK = `    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            release {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
`;

function patchBuildGradle() {
  if (!existsSync(BUILD_GRADLE)) return;
  let g = readFileSync(BUILD_GRADLE, 'utf8');
  let changed = false;

  // 1. Sync versionName from package.json (AC-4). Preserve versionCode.
  const code = currentVersionCode(g);
  const versionRe = /(\n)\s{8}versionCode\s+\d+\s*\n\s{8}versionName\s+"[^"]+"/;
  const replacement = `$1        versionCode ${code}\n        versionName "${VERSION_NAME}"`;
  if (versionRe.test(g)) {
    const next = g.replace(versionRe, replacement);
    if (next !== g) {
      g = next;
      changed = true;
      console.log(`[postsync] + synced versionName="${VERSION_NAME}" (code=${code})`);
    } else {
      console.log(`[postsync] ✓ version already in sync (${VERSION_NAME}/${code})`);
    }
  }

  // 2. Inject keystore loader block before `android {`.
  if (!g.includes('keystorePropertiesFile')) {
    g = g.replace(/^apply plugin: 'com\.android\.application'\s*\n/m,
      `apply plugin: 'com.android.application'\n${SIGNING_BLOCK}`);
    changed = true;
    console.log(`[postsync] + injected keystore loader block`);
  } else {
    console.log(`[postsync] ✓ keystore loader already present`);
  }

  // 3. Inject signingConfigs block + signingConfig wiring inside buildTypes.release.
  if (!g.includes('signingConfigs {')) {
    g = g.replace(/(\s{4})buildTypes\s*\{/, `${SIGNING_CONFIGS_BLOCK}$1buildTypes {`);
    changed = true;
    console.log(`[postsync] + injected signingConfigs block`);
  }
  if (!/signingConfig\s+signingConfigs\.release/.test(g)) {
    g = g.replace(
      /(release\s*\{\s*\n\s+minifyEnabled\s+false\s*\n\s+proguardFiles[^\n]+)/,
      `$1\n            if (keystorePropertiesFile.exists()) {\n                signingConfig signingConfigs.release\n            }`,
    );
    changed = true;
    console.log(`[postsync] + wired release signingConfig`);
  }

  if (changed) writeFileSync(BUILD_GRADLE, g, 'utf8');
}

function patchAndroidGitignore() {
  if (!existsSync(ANDROID_GITIGNORE)) return;
  let txt = readFileSync(ANDROID_GITIGNORE, 'utf8');
  let changed = false;
  // Replace commented keystore lines with active ones; add keystore.properties.
  if (/^#\*\.jks/m.test(txt) || /^#\*\.keystore/m.test(txt)) {
    txt = txt.replace(/^#\*\.jks\s*$/m, '*.jks').replace(/^#\*\.keystore\s*$/m, '*.keystore');
    changed = true;
    console.log(`[postsync] + uncommented keystore ignore lines`);
  }
  if (!/^keystore\.properties$/m.test(txt)) {
    // Append after the *.keystore line if found, else at end.
    if (/^\*\.keystore$/m.test(txt)) {
      txt = txt.replace(/^\*\.keystore$/m, '*.keystore\nkeystore.properties');
    } else {
      txt = `${txt.trimEnd()}\nkeystore.properties\n`;
    }
    changed = true;
    console.log(`[postsync] + added keystore.properties to android/.gitignore`);
  }
  if (changed) writeFileSync(ANDROID_GITIGNORE, txt, 'utf8');
}

function main() {
  patchManifest();
  patchBuildGradle();
  patchAndroidGitignore();
  console.log('[postsync] done');
}

main();
