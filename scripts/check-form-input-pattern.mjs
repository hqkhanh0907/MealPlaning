#!/usr/bin/env node
/**
 * Form input pattern guard.
 *
 * Ensures no component reintroduces the deprecated stacked `<label class="field">`
 * input pattern. Canonical pattern lives in `src/theme/form-field.scss` — see
 * CLAUDE.md "Form Inputs (MANDATORY)" and design-system §8.6.1.
 *
 * Run manually: `npm run check:form-pattern`
 * Wired into `npm run build` so every build enforces compliance.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'src', 'app');

/** @param {string} dir @param {string[]} acc */
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (p.endsWith('.ts') && !p.endsWith('.spec.ts')) acc.push(p);
  }
  return acc;
}

const files = walk(ROOT);

const stackedRe = /<label[^>]*class="[^"]*\bfield\b[^"]*"[\s\S]{0,400}?<input/g;
const inlineWrapperRe = /styles\s*:\s*[`'"][\s\S]*?\.input-wrapper\s*\{/m;
const oldPickerRe = /class="picker-trigger"(?!--floating)/g;

const violations = [];

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  if (stackedRe.test(src)) {
    violations.push({
      file: f,
      kind: 'deprecated stacked <label class="field"><input> pattern',
    });
  }
  if (inlineWrapperRe.test(src)) {
    violations.push({
      file: f,
      kind: 'inline .input-wrapper styles (must live in src/theme/form-field.scss)',
    });
  }
  if (oldPickerRe.test(src)) {
    violations.push({
      file: f,
      kind: 'class="picker-trigger" (use .picker-trigger--floating inside .input-wrapper)',
    });
  }
}

if (violations.length > 0) {
  console.error('\n✖ Form input pattern guard FAILED');
  console.error('  Canonical pattern: src/theme/form-field.scss (see CLAUDE.md "Form Inputs").');
  console.error('  Use: <div class="input-wrapper"><label class="input-label">…</label><input class="input-native"/></div>');
  console.error();
  for (const v of violations) {
    console.error(`  - ${v.kind}`);
    console.error(`    ${v.file}`);
  }
  console.error();
  process.exit(1);
}

console.log('✓ Form input pattern guard: all components use canonical floating-label markup.');
