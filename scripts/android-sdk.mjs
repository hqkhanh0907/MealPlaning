import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const wrapperChecksum = '9c0f7faeeb306cb14e4279a3e084ca6b596894089a0638e68a07c945a32c9e14';

function setting(content, key, value) {
  const line = new RegExp('^' + key.replaceAll('.', '\\.') + '\\s*=.*$', 'm');
  if (line.test(content)) return content.replace(line, key + '=' + value);
  return content.trimEnd() + '\n' + key + '=' + value + '\n';
}

function replaceRequired(content, expression, value) {
  if (!expression.test(content))
    throw new Error('Unrecognized Capacitor Android template: ' + expression);
  return content.replace(expression, value);
}

export function configureAndroid17(androidDir) {
  const transforms = {
    'variables.gradle': (text) => {
      for (const key of ['minSdkVersion', 'compileSdkVersion', 'targetSdkVersion']) {
        text = replaceRequired(
          text,
          new RegExp('^(\\s*' + key + '\\s*=\\s*)\\d+', 'm'),
          (_, prefix) => prefix + '37',
        );
      }
      return text;
    },
    'build.gradle': (text) =>
      replaceRequired(
        text,
        /com\.android\.tools\.build:gradle:[\d.]+/,
        'com.android.tools.build:gradle:9.3.1',
      ),
    'app/build.gradle': (text) =>
      replaceRequired(
        text,
        /getDefaultProguardFile\('proguard-android(?:-optimize)?\.txt'\)/,
        "getDefaultProguardFile('proguard-android-optimize.txt')",
      ),
    'gradle/wrapper/gradle-wrapper.properties': (text) =>
      setting(
        replaceRequired(text, /gradle-[\d.]+-(?:bin|all)\.zip/, 'gradle-9.6.1-bin.zip'),
        'distributionSha256Sum',
        wrapperChecksum,
      ),
    'gradle.properties': (text) =>
      setting(setting(text, 'android.newDsl', 'false'), 'android.builtInKotlin', 'false'),
  };
  const changes = [];
  for (const [file, transform] of Object.entries(transforms)) {
    const path = join(androidDir, file);
    const original = readFileSync(path, 'utf8');
    const updated = transform(original);
    if (updated !== original) changes.push({ path, updated });
  }
  for (const { path, updated } of changes) writeFileSync(path, updated);
}
