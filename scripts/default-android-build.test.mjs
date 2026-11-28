import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const workspace = JSON.parse(readFileSync(new URL('../angular.json', import.meta.url)));
const build = workspace.projects.app.architect.build;
const config = (names) =>
  Object.assign({}, build.options, ...names.split(',').map((n) => build.configurations[n]));

test('the default production web bundle packages the Rust renderer for every mobile feature', () => {
  for (const name of [build.defaultConfiguration, 'production']) {
    const options = config(name);
    assert.ok(
      options.assets.some(
        (asset) => asset.output === 'assets/leptos' && asset.glob.includes('wasm'),
      ),
    );
    const routes = options.fileReplacements.map((entry) => entry.with);
    for (const feature of [
      'account',
      'onboarding',
      'dashboard',
      'calendar',
      'management',
      'fitness',
      'settings',
    ]) {
      assert.ok(
        routes.some(
          (route) => route.includes('/features/' + feature + '/') && route.includes('leptos'),
        ),
        feature,
      );
    }
  }
  assert.match(pkg.scripts.build, /node scripts\/build-leptos\.mjs/);
  assert.equal(pkg.scripts['build:prod'], 'npm run build');
  assert.ok(
    config('production,angular-reference').fileReplacements.every(
      (r) => !r.with.includes('leptos'),
    ),
  );
});
