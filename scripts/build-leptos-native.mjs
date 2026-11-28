import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const version = '4.10.0';
const aarName = `sqlcipher-android-${version}.aar`;
const expectedHash = 'cc60b1a40d023bec06a1e56740db7172d2516668570140cd9de00ca90f84cd9f';
const soname = 'libhealthmate_capacitor.so';
const jniSymbols = [
  'Java_com_healthmate_ai_sync_MealPlanAccountPlugin_accountNative',
  'Java_com_healthmate_ai_sync_MealPlanSyncPlugin_catalogReadNative',
  'Java_com_healthmate_ai_sync_MealPlanSyncPlugin_dashboardSummaryNative',
  'Java_com_healthmate_ai_sync_MealPlanSyncPlugin_calendarDaysNative',
  'Java_com_healthmate_ai_sync_GroqTransport_decodeContentNative',
  'Java_com_healthmate_ai_sync_MealPlanProfilePlugin_profileNative',
];
const abis = new Map([
  ['arm64-v8a', ['aarch64-linux-android', 'aarch64-linux-android']],
  ['armeabi-v7a', ['armv7-linux-androideabi', 'armv7a-linux-androideabi']],
  ['x86_64', ['x86_64-linux-android', 'x86_64-linux-android']],
  ['x86', ['i686-linux-android', 'i686-linux-android']],
]);
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(
    'node scripts/build-leptos-native.mjs [--abi arm64-v8a,x86_64] [--out JNI_LIBS_DIRECTORY] [--aar SQLCIPHER_AAR]',
  );
  console.log(
    'Default: release libraries for all four Android ABIs under target/leptos-native/jniLibs.',
  );
  process.exit(0);
}
let requested = [...abis.keys()];
let output = join(root, 'target', 'leptos-native', 'jniLibs');
let suppliedAar = process.env.SQLCIPHER_ANDROID_AAR;
for (let i = 0; i < args.length; i += 2) {
  const flag = args[i],
    value = args[i + 1];
  if (!value || value.startsWith('--')) throw Error('Missing value for ' + flag);
  if (flag === '--abi') requested = [...new Set(value.split(','))];
  else if (flag === '--out') output = resolve(value);
  else if (flag === '--aar') suppliedAar = resolve(value);
  else throw Error('Unknown option ' + flag);
}
for (const abi of requested) if (!abis.has(abi)) throw Error('Unsupported Android ABI: ' + abi);

function findNdk() {
  const explicit = process.env.ANDROID_NDK_HOME || process.env.ANDROID_NDK_ROOT;
  if (explicit) return resolve(explicit);
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (sdk && existsSync(join(sdk, 'ndk'))) {
    const versions = readdirSync(join(sdk, 'ndk'), { withFileTypes: true }).filter(
      (d) => d.isDirectory() && /^\d+(\.\d+)*$/.test(d.name),
    );
    versions.sort((a, b) => b.name.localeCompare(a.name, 'en', { numeric: true }));
    if (versions.length) return join(sdk, 'ndk', versions[0].name);
  }
  throw Error('Install the Android NDK and set ANDROID_NDK_HOME or ANDROID_HOME.');
}
function llvmTools(ndk) {
  const prebuilt = join(ndk, 'toolchains', 'llvm', 'prebuilt');
  const os = { darwin: 'darwin', linux: 'linux', win32: 'windows' }[process.platform];
  const candidates = readdirSync(prebuilt).filter((name) => os && name.startsWith(os + '-'));
  const preferred = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
  const name = candidates.find((n) => n.endsWith(preferred)) || candidates[0];
  if (!name) throw Error('This NDK lacks LLVM tools for ' + process.platform);
  return join(prebuilt, name, 'bin');
}
async function locateAar(scratch) {
  const gradle = process.env.GRADLE_USER_HOME || join(homedir(), '.gradle');
  const cached = join(
    gradle,
    'caches',
    'modules-2',
    'files-2.1',
    'net.zetetic',
    'sqlcipher-android',
    version,
  );
  let file = suppliedAar;
  if (!file && existsSync(cached))
    file = readdirSync(cached)
      .map((id) => join(cached, id, aarName))
      .find(existsSync);
  if (!file) {
    const response = await fetch(
      `https://repo.maven.apache.org/maven2/net/zetetic/sqlcipher-android/${version}/${aarName}`,
      { signal: AbortSignal.timeout(90000) },
    );
    if (!response.ok) throw Error(`SQLCipher Maven download failed (${response.status})`);
    file = join(scratch, aarName);
    writeFileSync(file, new Uint8Array(await response.arrayBuffer()));
  }
  const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (actual !== expectedHash)
    throw Error('SQLCipher AAR does not match the pinned Android artifact');
  return resolve(file);
}
function verify(library, provider, readelf) {
  const text = (...args) =>
    execFileSync(readelf, args, { encoding: 'utf8', maxBuffer: 24 * 1024 * 1024 });
  const needed = text('-d', library);
  if (
    !needed.includes('Shared library: [libsqlcipher.so]') ||
    needed.includes('Shared library: [libsqlite3.so]')
  )
    throw Error('Rust must share the Capacitor SQLCipher runtime');
  const dynamicSymbols = text('--dyn-syms', '--wide', library);
  const exports = dynamicSymbols
    .split('\n')
    .filter((line) => line.includes('GLOBAL') && !line.includes(' UND '));
  for (const symbol of jniSymbols) {
    if (!exports.some((line) => line.trimEnd().endsWith(' ' + symbol)))
      throw Error('Missing JNI method: ' + symbol);
  }
  const providerSymbols = new Set(
    text('--dyn-syms', '--wide', provider)
      .split('\n')
      .filter((l) => !l.includes(' UND '))
      .map((l) => l.trim().split(/\s+/).at(-1)?.split('@')[0]),
  );
  const imports = [...dynamicSymbols.matchAll(/\bUND\s+(sqlite3_\w+)/g)].map((m) => m[1]);
  if (!imports.includes('sqlite3_open_v2') || imports.some((n) => !providerSymbols.has(n)))
    throw Error('SQLCipher does not export every SQLite symbol imported by Rust');
  for (const file of [library, provider]) {
    const loads = text('-lW', file)
      .split('\n')
      .filter((l) => /^\s*LOAD\s/.test(l));
    if (!loads.length || loads.some((l) => Number(l.trim().split(/\s+/).at(-1)) < 16384))
      throw Error('ELF is not 16 KiB page aligned: ' + basename(file));
  }
}

const pluginGradle = join(
  root,
  'node_modules',
  '@capacitor-community',
  'sqlite',
  'android',
  'build.gradle',
);
if (
  existsSync(pluginGradle) &&
  !readFileSync(pluginGradle, 'utf8').includes(`net.zetetic:sqlcipher-android:${version}@aar`)
)
  throw Error(
    'Verify the native dashboard SQLCipher pin against the installed Capacitor SQLite plugin.',
  );
const ndk = findNdk();
const bin = llvmTools(ndk);
const windows = process.platform === 'win32';
const exe = windows ? '.exe' : '';
const readelf = join(bin, 'llvm-readelf' + exe);
const jar = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', 'jar' + exe) : 'jar';
const cargo = process.env.CARGO || 'cargo';
const pinnedEnv = { ...process.env, RUSTUP_TOOLCHAIN: '1.100.1' };
const rust = execFileSync(process.env.RUSTC || 'rustc', ['--version'], {
  cwd: root,
  env: pinnedEnv,
  encoding: 'utf8',
});
if (!rust.startsWith('rustc 1.100.1 '))
  throw Error('Install Rust 1.100.1 for the native dashboard.');
const manifest = join(root, 'crates', 'healthmate-capacitor', 'Cargo.toml');
const targetDir = resolve(
  process.env.HEALTHMATE_NATIVE_TARGET_DIR ||
    process.env.CARGO_TARGET_DIR ||
    join(root, 'target', 'leptos-native', 'cargo'),
);
const vars = join(root, 'android', 'variables.gradle');
const minimum = existsSync(vars)
  ? Number(/\bminSdkVersion\s*=\s*(\d+)/.exec(readFileSync(vars, 'utf8'))?.[1] || 37)
  : 37;
const scratch = mkdtempSync(join(tmpdir(), 'healthmate-native-link-'));
try {
  const aar = await locateAar(scratch);
  const libraries = [];
  for (const abi of requested) {
    const [rust, clang] = abis.get(abi);
    const compiler = join(bin, `${clang}${minimum}-clang${windows ? '.cmd' : ''}`);
    if (!existsSync(compiler)) throw Error('Missing NDK compiler: ' + compiler);
    const member = `jni/${abi}/libsqlcipher.so`;
    execFileSync(jar, ['xf', aar, member], { cwd: scratch });
    const provider = join(scratch, member);
    const env = {
      ...pinnedEnv,
      CARGO_TARGET_DIR: targetDir,
      SQLCIPHER_LIB_DIR: join(scratch, 'jni', abi),
      SQLCIPHER_STATIC: '0',
      SQLCIPHER_NO_PKG_CONFIG: '1',
      LIBSQLITE3_SYS_USE_PKG_CONFIG: '1',
    };
    const key = rust.replaceAll('-', '_');
    env[`CARGO_TARGET_${key.toUpperCase()}_LINKER`] = compiler;
    env[`CC_${key}`] = compiler;
    env[`AR_${key}`] = join(bin, 'llvm-ar' + exe);
    if (env.CARGO_ENCODED_RUSTFLAGS)
      env.CARGO_ENCODED_RUSTFLAGS += '\x1f-Clink-arg=-Wl,-z,max-page-size=16384';
    else env.RUSTFLAGS = (env.RUSTFLAGS || '') + ' -Clink-arg=-Wl,-z,max-page-size=16384';
    execFileSync(
      cargo,
      ['build', '--locked', '--release', '--target', rust, '--manifest-path', manifest],
      { cwd: root, env, stdio: 'inherit' },
    );
    const library = join(targetDir, rust, 'release', soname);
    verify(library, provider, readelf);
    libraries.push([abi, library]);
  }
  for (const [abi, library] of libraries) {
    const dir = join(output, abi);
    mkdirSync(dir, { recursive: true });
    const target = join(dir, soname),
      prepared = target + '.partial-' + process.pid;
    copyFileSync(library, prepared);
    renameSync(prepared, target);
    console.log(target);
  }
  for (const abi of abis.keys())
    if (!requested.includes(abi)) rmSync(join(output, abi, soname), { force: true });
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
