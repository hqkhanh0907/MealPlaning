#!/usr/bin/env node
/**
 * scripts/check-no-segment-control.mjs
 * Apple migration guard: <ion-segment> and <ion-segment-button> are forbidden.
 * Use .apple-chip-row + .apple-chip instead.
 * Soft-warn by default; --strict / GUARD_STRICT=1 to hard-fail.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
const SCAN_DIR = join(ROOT, 'src');
const RE = /<ion-segment(\s|>)|<ion-segment-button(\s|>)/;

const violations = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full);
    else if (entry.endsWith('.html')) check(full);
  }
}
function check(path) {
  const rel = relative(ROOT, path);
  const lines = readFileSync(path, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (RE.test(lines[i])) violations.push({ rel, n: i + 1, snippet: lines[i].trim().slice(0, 120) });
  }
}
walk(SCAN_DIR);

if (violations.length === 0) { console.log('✓ check-no-segment-control: PASS'); process.exit(0); }
const log = STRICT ? console.error : console.warn;
log(`${STRICT ? '✗' : '⚠'} check-no-segment-control: ${violations.length} violation(s) (${STRICT ? 'STRICT' : 'soft-warn'}):`);
for (const v of violations) log(`  ${v.rel}:${v.n}  ${v.snippet}`);
process.exit(STRICT ? 1 : 0);
