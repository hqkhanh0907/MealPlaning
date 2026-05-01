#!/usr/bin/env node
/**
 * Macro naming guard.
 *
 * Enforces full English macro names (Protein / Carbs / Fat / Fiber) in UI
 * surface code. Forbids:
 *   - `P:`, `C:`, `F:` followed by space (e.g. `P: 22g`)
 *   - `Carb` (singular) — must be `Carbs`
 *   - `Chất xơ` (Vietnamese) — must be `Fiber` (per design-system.md §2.6.1)
 *
 * Scope: src/**\/*.{html,ts,scss} (skip *.spec.ts, *.test.ts, this script,
 * and `src/theme/variables.scss`).
 *
 * Skips inside line comments (// ... and <!-- ... -->) and block comments
 * (\/* ... *\/) within a single line.
 *
 * Escape hatch: append `// allow-macro-naming: <reason>` (or
 * `<!-- allow-macro-naming: <reason> -->` for HTML) to the violating line.
 *
 * Run manually: `npm run check:macro-naming`
 * Wired into `npm run check:guards`.
 *
 * See: docs/3-design/design-system.md §2.6.1
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const CWD = process.cwd();

const SKIP_BASENAMES = new Set(['variables.scss']);

/** @param {string} dir @param {string[]} acc */
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      walk(p, acc);
    } else {
      const isTarget =
        (p.endsWith('.html') || p.endsWith('.ts') || p.endsWith('.scss')) &&
        !p.endsWith('.spec.ts') &&
        !p.endsWith('.test.ts') &&
        !SKIP_BASENAMES.has(name);
      if (isTarget) acc.push(p);
    }
  }
  return acc;
}

const PATTERNS = [
  {
    name: 'macro-abbrev',
    re: /\b([PCF]):\s/g,
    msg: (m) => `Use full macro name instead of "${m[1]}:" (Protein/Carbs/Fat). See design-system.md §2.6.1.`,
  },
  {
    name: 'carb-singular',
    re: /\bCarb\b(?!s)/g,
    msg: () => `Use "Carbs" (plural). See design-system.md §2.6.1.`,
  },
  {
    name: 'chat-xo',
    re: /Chất xơ/g,
    msg: () => `Use "Fiber" (English) instead of "Chất xơ". See design-system.md §2.6.1.`,
  },
];

/** Strip line comments (//, <!-- -->) and same-line block comments (/* *\/). */
function stripComments(line, ext) {
  let out = line;
  // Block comment same-line: /* ... */
  out = out.replace(/\/\*[\s\S]*?\*\//g, '');
  // HTML comment same-line: <!-- ... -->
  if (ext === 'html') {
    out = out.replace(/<!--[\s\S]*?-->/g, '');
  }
  // Line comment // (TS / SCSS) — but not inside string. Cheap heuristic: cut at first `//` that follows whitespace or line start.
  if (ext === 'ts' || ext === 'scss') {
    const idx = out.search(/(^|\s)\/\/.*/);
    if (idx >= 0) out = out.slice(0, idx);
  }
  return out;
}

const files = walk(ROOT);
const violations = [];

for (const file of files) {
  const ext = file.endsWith('.html') ? 'html' : file.endsWith('.ts') ? 'ts' : 'scss';
  const lines = readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (/allow-macro-naming:/.test(raw)) continue;
    const stripped = stripComments(raw, ext);
    for (const p of PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(stripped)) !== null) {
        violations.push({
          file: relative(CWD, file),
          line: i + 1,
          rule: p.name,
          msg: p.msg(m),
          snippet: raw.trim(),
        });
      }
    }
  }
}

if (violations.length === 0) {
  console.log(`✅ check:macro-naming — ${files.length} files scanned, no violations.`);
  process.exit(0);
}

console.error(`❌ check:macro-naming — ${violations.length} violation(s):\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.rule}]`);
  console.error(`    ${v.msg}`);
  console.error(`    > ${v.snippet}\n`);
}
console.error(
  `Fix: replace with full names (Protein/Carbs/Fat/Fiber). See docs/3-design/design-system.md §2.6.1.`,
);
console.error(`Escape hatch: append "// allow-macro-naming: <reason>" if intentional.`);
process.exit(1);
