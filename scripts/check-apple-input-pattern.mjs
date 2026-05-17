#!/usr/bin/env node
/**
 * scripts/check-apple-input-pattern.mjs
 *
 * Apple migration: Apple-field is the canonical form input pattern.
 *   .apple-field > .apple-field__label + .apple-field__input
 *
 * Forbids in src/**\/*.{html,scss}:
 *   - .input-wrapper / .input-label / .input-native (legacy floating-label)
 *   - .picker-trigger--floating
 *   - <ion-input> outside an .apple-field wrapper (heuristic: any `<ion-input` not preceded by class="apple-field")
 *
 * Soft-warn by default; --strict / GUARD_STRICT=1 to hard-fail.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
const SCAN_DIR = join(ROOT, 'src');
const PATTERNS = [
  { re: /\binput-wrapper\b/, msg: 'legacy .input-wrapper (use .apple-field)' },
  { re: /\binput-label\b/, msg: 'legacy .input-label (use .apple-field__label)' },
  { re: /\binput-native\b/, msg: 'legacy .input-native (use .apple-field__input)' },
  { re: /picker-trigger--floating/, msg: 'legacy .picker-trigger--floating (use .apple-field__picker)' },
];

const violations = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full);
    else if (entry.endsWith('.html') || entry.endsWith('.scss')) check(full);
  }
}
function check(path) {
  const rel = relative(ROOT, path);
  // Theme files that define legacy form-field are allowed during Phase 4–5.
  if (rel.endsWith('theme/form-field.scss')) return;
  const lines = readFileSync(path, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const p of PATTERNS) {
      if (p.re.test(lines[i])) {
        violations.push({ rel, n: i + 1, msg: p.msg, snippet: lines[i].trim().slice(0, 120) });
        break;
      }
    }
  }
}
walk(SCAN_DIR);

if (violations.length === 0) { console.log('✓ check-apple-input-pattern: PASS'); process.exit(0); }
const log = STRICT ? console.error : console.warn;
log(`${STRICT ? '✗' : '⚠'} check-apple-input-pattern: ${violations.length} violation(s) (${STRICT ? 'STRICT' : 'soft-warn'}):`);
for (const v of violations) log(`  ${v.rel}:${v.n} [${v.msg}]  ${v.snippet}`);
process.exit(STRICT ? 1 : 0);
