import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = resolve(root, 'crates/healthmate-leptos/Cargo.toml');
const cargo = process.env.CARGO || 'cargo';
const bindgen = process.env.WASM_BINDGEN || 'wasm-bindgen';
const metadata = JSON.parse(
  execFileSync(
    cargo,
    ['metadata', '--locked', '--format-version', '1', '--no-deps', '--manifest-path', manifest],
    { encoding: 'utf8' },
  ),
);
const webPackage = metadata.packages.find((item) => item.manifest_path === manifest);
const library = webPackage?.targets.find((target) => target.crate_types.includes('cdylib'));
if (!library) throw new Error('Missing Leptos WebAssembly library target.');
const triple = 'wasm32-unknown-unknown';
execFileSync(
  cargo,
  ['build', '--manifest-path', manifest, '--locked', '--release', '--target', triple],
  { stdio: 'inherit' },
);
const output = resolve(root, 'target/leptos-web');
mkdirSync(output, { recursive: true });
execFileSync(
  bindgen,
  [
    '--target',
    'web',
    '--out-dir',
    output,
    '--out-name',
    'healthmate_dashboard',
    resolve(
      metadata.target_directory,
      triple,
      'release',
      library.name.replaceAll('-', '_') + '.wasm',
    ),
  ],
  { stdio: 'inherit' },
);
