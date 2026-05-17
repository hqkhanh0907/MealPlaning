#!/usr/bin/env node
/**
 * scripts/check-inter-font.mjs
 * Verifies Inter is bundled and referenced.
 *   1. src/assets/fonts/Inter-{Light,Regular,SemiBold,Bold}.woff2 exist.
 *   2. src/theme/_typography.scss contains @font-face for each weight.
 * Hard-fail by default (this is a build precondition, not a migration warning).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const WEIGHTS = ['Light', 'Regular', 'SemiBold', 'Bold'];
const errors = [];

for (const w of WEIGHTS) {
  const p = join(ROOT, 'src/assets/fonts', `Inter-${w}.woff2`);
  if (!existsSync(p)) errors.push(`missing font file: src/assets/fonts/Inter-${w}.woff2`);
}

const typo = join(ROOT, 'src/theme/_typography.scss');
if (!existsSync(typo)) errors.push('missing src/theme/_typography.scss');
else {
  const txt = readFileSync(typo, 'utf8');
  for (const w of WEIGHTS) {
    if (!new RegExp(`Inter-${w}\\.woff2`).test(txt)) errors.push(`_typography.scss missing @font-face for Inter-${w}.woff2`);
  }
}

if (errors.length === 0) { console.log('✓ check-inter-font: PASS'); process.exit(0); }
console.error('✗ check-inter-font:');
for (const e of errors) console.error('  ' + e);
process.exit(1);
