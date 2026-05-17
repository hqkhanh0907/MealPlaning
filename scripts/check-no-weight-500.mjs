#!/usr/bin/env node
/**
 * scripts/check-no-weight-500.mjs
 * Apple migration guard: Inter ladder is 300/400/600/700. Weight 500 forbidden.
 * Detects: `font-weight: 500;` and `font: ... 500 ...`.
 * Soft-warn by default; --strict or GUARD_STRICT=1 to hard-fail.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
const SCAN_DIR = join(ROOT, 'src');
const EXTS = ['.scss', '.css'];
const WEIGHT_RE = /font-weight\s*:\s*500\b/;
const FONT_SHORTHAND_500 = /^\s*font\s*:\s*[^;]*\b500\b/;

const violations = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full);
    else if (EXTS.some(e => entry.endsWith(e))) check(full);
  }
}
function check(path) {
  const rel = relative(ROOT, path);
  const lines = readFileSync(path, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (WEIGHT_RE.test(l) || FONT_SHORTHAND_500.test(l)) {
      violations.push({ rel, n: i + 1, snippet: l.trim().slice(0, 120) });
    }
  }
}
walk(SCAN_DIR);

if (violations.length === 0) { console.log('✓ check-no-weight-500: PASS'); process.exit(0); }
const log = STRICT ? console.error : console.warn;
log(`${STRICT ? '✗' : '⚠'} check-no-weight-500: ${violations.length} violation(s) (${STRICT ? 'STRICT' : 'soft-warn'}):`);
for (const v of violations) log(`  ${v.rel}:${v.n}  ${v.snippet}`);
process.exit(STRICT ? 1 : 0);
