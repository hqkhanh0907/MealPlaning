#!/usr/bin/env node
/**
 * Design-token guard.
 *
 * Enforces that all `color:`, `background:`, `background-color:`, and
 * `font-size:` declarations in src/**\/*.scss / *.css use design-system
 * tokens (`var(--*)`) or explicit semantic keywords. Token definitions live
 * in `src/theme/variables.scss` (see CLAUDE.md "Design Tokens (MANDATORY)"
 * and design-system §2 / §6).
 *
 * Escape hatch: append `// allow-hardcode: <reason>` to the violating line
 * (or place it on the line above). The reason text is mandatory.
 *
 * Run manually: `npm run check:design-tokens`
 * Wired into `npm run check:guards` (build + Husky pre-commit + CI).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const CWD = process.cwd();

// Files that legitimately define raw tokens — skip entirely.
const SKIP_FILES = new Set([
  join(ROOT, 'theme', 'variables.scss'),
  join(ROOT, 'theme', '_palette.scss'),
]);

/** @param {string} dir @param {string[]} acc */
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      walk(p, acc);
    } else if ((p.endsWith('.scss') || p.endsWith('.css')) && !SKIP_FILES.has(p)) {
      acc.push(p);
    }
  }
  return acc;
}

const files = walk(ROOT);

// Regexes — keep simple, line-by-line.
// Match leading `color:` / `background:` / `background-color:` / `font-size:`
// Capture the value up to `;` or end of line.
const PROP_RE = /^\s*(color|background|background-color|font-size)\s*:\s*([^;]+?)\s*(?:;|$)/i;

// Allowed value patterns (tested against the raw value substring)
const allowedValue = (prop, value) => {
  // Strip !important + trailing comments
  const v = value.replace(/!important/i, '').replace(/\/\*.*\*\//g, '').trim();
  if (!v) return true;
  // Generic keyword allowlist
  const kw = /^(inherit|unset|initial|currentColor|transparent|none|auto|revert|revert-layer)$/i;
  if (kw.test(v)) return true;
  // Any value that's purely var(...) — possibly with fallback (string of tokens)
  // A token-only value contains no raw color literal.
  // Reject if it contains a hex literal #xxx, rgb(), rgba(), hsl(), hsla(),
  // or a CSS named color (small whitelist of frequently-misused) or numeric font-size.
  if (prop === 'font-size') {
    // Allowed: var(--*), 0, percent referencing var? — strict: must contain var(--font...) or be 0/inherit/etc.
    if (/^0(?:px|em|rem|%)?$/.test(v)) return true;
    if (/var\(\s*--font[^)]*\)/.test(v) && !/(\d+(?:\.\d+)?)(?:px|rem|em|pt)\b/.test(v.replace(/var\([^)]*\)/g, ''))) return true;
    // Reject any explicit unit literal not wrapped in var(--font*)
    return false;
  }
  // For color / background / background-color
  // Strip var(...) calls (including their fallback values) before checking for raw literals.
  // `var(--token, #fallback)` is acceptable — the fallback is safety only.
  let stripped = v;
  // Repeatedly strip balanced var(...) — handles nested
  let prev;
  do {
    prev = stripped;
    stripped = stripped.replace(/var\([^()]*\)/gi, '');
  } while (stripped !== prev);
  // If a hex / rgb / hsl literal remains AFTER stripping var(), it's hardcoded.
  if (/#[0-9a-f]{3,8}\b/i.test(stripped)) return false;
  if (/\brgba?\s*\(/i.test(stripped)) {
    // Allow rgba(var(--x-rgb), 0.NN) — i.e. uses an rgb token. Reject literal numeric rgba.
    // Strip rgba(...) inner; if inner contains digits-only triplet (no var()) → fail.
    const inner = v.match(/\brgba?\s*\(([^)]*)\)/i)?.[1] || '';
    if (!/var\(/.test(inner)) return false;
  }
  if (/\bhsla?\s*\(/i.test(v)) {
    const inner = v.match(/\bhsla?\s*\(([^)]*)\)/i)?.[1] || '';
    if (!/var\(/.test(inner)) return false;
  }
  // Common named colors that should NEVER be hardcoded
  if (/\b(white|black|red|blue|green|gray|grey|silver|orange|yellow|pink|purple|cyan|magenta|lime|maroon|navy|olive|teal|aqua|fuchsia|gold)\b/i.test(v)) {
    return false;
  }
  // Otherwise (var(...), gradients with var(...), etc.) → allow
  return true;
};

const violations = [];

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(PROP_RE);
    if (!m) continue;
    const [, prop, rawValue] = m;
    if (allowedValue(prop, rawValue)) continue;

    // Check escape hatch: same line trailing `// allow-hardcode: ...`
    // or previous line ending with such comment.
    const sameLineEscape = /\/\/\s*allow-hardcode\s*:\s*\S/.test(line) ||
                           /\/\*\s*allow-hardcode\s*:\s*[^*]+\*\//.test(line);
    const prev = lines[i - 1] || '';
    const prevLineEscape = /\/\/\s*allow-hardcode\s*:\s*\S/.test(prev.trim()) ||
                           /\/\*\s*allow-hardcode\s*:\s*[^*]+\*\//.test(prev.trim());
    if (sameLineEscape || prevLineEscape) continue;

    violations.push({
      file: relative(CWD, f),
      line: i + 1,
      prop,
      value: rawValue.trim(),
    });
  }
}

if (violations.length > 0) {
  console.error(`\n✖ Design-token guard FAILED — ${violations.length} violations`);
  console.error('  Reference: docs/3-design/design-system.md §2 / §6 + CLAUDE.md "Design Tokens".');
  console.error('  Fix: replace the literal with a var(--*) token from src/theme/variables.scss.');
  console.error('  Escape: add `// allow-hardcode: <reason>` on the same or previous line.');
  console.error('');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.prop}: ${v.value}`);
  }
  console.error('');
  process.exit(1);
}

console.log('✓ Design-token guard: all color/background/font-size declarations use tokens.');
