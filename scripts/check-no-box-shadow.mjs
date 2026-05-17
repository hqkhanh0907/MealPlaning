#!/usr/bin/env node
/**
 * scripts/check-no-box-shadow.mjs
 *
 * Apple migration guard: only `box-shadow: var(--apple-shadow-product)` is
 * allowed in src/**\/*.{scss,css}. Any other box-shadow declaration must carry
 * a `// allow-shadow: <reason>` comment on the same line or the line above.
 *
 * Default: soft-warn (exit 0). Pass --strict or GUARD_STRICT=1 to hard-fail.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
const SCAN_DIR = join(ROOT, 'src');
const EXTS = ['.scss', '.css'];
const SHADOW_RE = /^\s*box-shadow\s*:/;
const ALLOWED = /var\(--apple-shadow-product\)/;
const ESCAPE = /\/\/\s*allow-shadow:/;

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
    const line = lines[i];
    if (!SHADOW_RE.test(line)) continue;
    if (ALLOWED.test(line)) continue;
    if (ESCAPE.test(line)) continue;
    if (i > 0 && ESCAPE.test(lines[i - 1])) continue;
    violations.push({ rel, n: i + 1, snippet: line.trim().slice(0, 120) });
  }
}
walk(SCAN_DIR);

if (violations.length === 0) { console.log('✓ check-no-box-shadow: PASS'); process.exit(0); }
const log = STRICT ? console.error : console.warn;
const mark = STRICT ? '✗' : '⚠';
log(`${mark} check-no-box-shadow: ${violations.length} violation(s) (${STRICT ? 'STRICT' : 'soft-warn'}):`);
for (const v of violations) log(`  ${v.rel}:${v.n}  ${v.snippet}`);
process.exit(STRICT ? 1 : 0);
