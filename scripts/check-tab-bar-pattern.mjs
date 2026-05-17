#!/usr/bin/env node
/**
 * scripts/check-tab-bar-pattern.mjs
 * If <ion-tab-bar> exists in any src/**\/*.html, the enclosing <ion-tabs>
 * MUST carry class="apple-tab-bar" (or class includes apple-tab-bar).
 * Soft-warn by default.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
const SCAN_DIR = join(ROOT, 'src');

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
  const src = readFileSync(path, 'utf8');
  if (!/<ion-tab-bar\b/.test(src)) return;
  const tabsMatch = src.match(/<ion-tabs\b[^>]*>/);
  if (!tabsMatch) {
    violations.push({ rel, msg: '<ion-tab-bar> present but no <ion-tabs> wrapper found' });
    return;
  }
  if (!/class\s*=\s*"[^"]*\bapple-tab-bar\b[^"]*"/.test(tabsMatch[0])) {
    violations.push({ rel, msg: `<ion-tabs> missing class="apple-tab-bar": ${tabsMatch[0].slice(0, 120)}` });
  }
}
walk(SCAN_DIR);

if (violations.length === 0) { console.log('✓ check-tab-bar-pattern: PASS'); process.exit(0); }
const log = STRICT ? console.error : console.warn;
log(`${STRICT ? '✗' : '⚠'} check-tab-bar-pattern: ${violations.length} violation(s) (${STRICT ? 'STRICT' : 'soft-warn'}):`);
for (const v of violations) log(`  ${v.rel}  ${v.msg}`);
process.exit(STRICT ? 1 : 0);
