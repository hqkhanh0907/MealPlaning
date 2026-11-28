import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({
  options: { abi: { type: 'string' }, release: { type: 'boolean' } },
});
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
run('npm', ['run', 'build:leptos']);
const cap = join(root, 'node_modules/@capacitor/cli/bin/capacitor');
if (!existsSync(join(root, 'android/app/build.gradle')))
  run(process.execPath, [cap, 'add', 'android']);
run(process.execPath, [cap, 'sync', 'android']);
run(process.execPath, [
  'scripts/build-leptos-native.mjs',
  ...(values.abi ? ['--abi', values.abi] : []),
]);
run(join(root, process.platform === 'win32' ? 'android/gradlew.bat' : 'android/gradlew'), [
  '-p',
  'android',
  values.release ? ':app:assembleRelease' : ':app:assembleDebug',
]);
