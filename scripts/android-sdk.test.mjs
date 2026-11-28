import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { configureAndroid17 } from './android-sdk.mjs';

test('the Capacitor template targets Android 17 after each sync', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'healthmate-sdk-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const files = [
    'variables.gradle',
    'build.gradle',
    'app/build.gradle',
    'gradle/wrapper/gradle-wrapper.properties',
    'gradle.properties',
  ];
  execFileSync('tar', [
    '-xzf',
    new URL('../node_modules/@capacitor/cli/assets/android-template.tar.gz', import.meta.url)
      .pathname,
    '-C',
    root,
    ...files,
  ]);
  const read = (file) => readFileSync(join(root, file), 'utf8');
  configureAndroid17(root);
  for (const key of ['minSdkVersion', 'targetSdkVersion', 'compileSdkVersion']) {
    assert.match(read('variables.gradle'), new RegExp(key + '\\s*=\\s*37\\b'));
  }
  assert.match(read('build.gradle'), /com\.android\.tools\.build:gradle:9\.3\.1/);
  assert.match(read('gradle/wrapper/gradle-wrapper.properties'), /gradle-9\.6\.1-bin\.zip/);
  assert.match(read('gradle/wrapper/gradle-wrapper.properties'), /distributionSha256Sum=9c0f7fae/);
  assert.match(read('app/build.gradle'), /proguard-android-optimize\.txt/);
  const after = files.map(read);
  configureAndroid17(root);
  assert.deepEqual(files.map(read), after);
});
