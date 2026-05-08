#!/usr/bin/env node
/**
 * PC-1 guard — external templates and styles are mandatory.
 *
 * Project Convention PC-1 (binary, no exceptions): every Angular component
 * MUST declare `templateUrl` + `styleUrl` (or `styleUrls`). Inline `template:`
 * or `styles:` / `styles: [\`…\`]` inside @Component metadata is forbidden.
 *
 * Reference: docs/4-architecture/coding-conventions.md §2.2,
 *            CLAUDE.md "Coding Guidelines" → Components.
 *
 * Run manually: `npm run check:pc1`
 * Wired into `npm run build`.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

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
const violations = [];

// Match @Component({ ... }) decorator block
const componentDecoratorRe = /@Component\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
// Inside the decorator block, look for inline template / styles keys
const inlineTemplateRe = /(?<![A-Za-z_])template\s*:\s*[`'"]/;
const inlineStylesRe = /(?<![A-Za-z_])styles\s*:\s*\[/;
// Required external references
const templateUrlRe = /(?<![A-Za-z_])templateUrl\s*:\s*['"]([^'"]+)['"]/;
const styleUrlRe = /(?<![A-Za-z_])styleUrl\s*:\s*['"]([^'"]+)['"]/;
const styleUrlsRe = /(?<![A-Za-z_])styleUrls\s*:\s*\[\s*['"]([^'"]+)['"]/;

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  let m;
  componentDecoratorRe.lastIndex = 0;
  while ((m = componentDecoratorRe.exec(src)) !== null) {
    const meta = m[1];

    // 1. Inline template/styles forbidden
    if (inlineTemplateRe.test(meta)) {
      violations.push({ file: f, kind: 'inline `template:` (use `templateUrl` + external .html)' });
    }
    if (inlineStylesRe.test(meta)) {
      violations.push({ file: f, kind: 'inline `styles: [...]` (use `styleUrl` + external .scss)' });
    }

    // 2. Both templateUrl AND styleUrl/styleUrls REQUIRED
    const hasTemplateUrl = templateUrlRe.test(meta);
    const styleSingle = styleUrlRe.exec(meta);
    const styleMulti = styleUrlsRe.exec(meta);

    if (!hasTemplateUrl && !inlineTemplateRe.test(meta)) {
      violations.push({ file: f, kind: 'missing `templateUrl` (PC-1 requires external .html)' });
    }
    if (!styleSingle && !styleMulti && !inlineStylesRe.test(meta)) {
      violations.push({ file: f, kind: 'missing `styleUrl` (PC-1 requires external .scss — create empty file with header comment if no styles needed)' });
    }

    // 3. Referenced .scss must exist on disk (catches typos)
    const styleRef = styleSingle?.[1] ?? styleMulti?.[1];
    if (styleRef) {
      const absStyle = resolve(dirname(f), styleRef);
      if (!existsSync(absStyle)) {
        violations.push({ file: f, kind: `\`styleUrl: '${styleRef}'\` references missing file (${absStyle})` });
      }
    }
  }
}

if (violations.length > 0) {
  console.error('\n✖ PC-1 guard FAILED — inline template/styles or missing external refs detected');
  console.error('  Rule: every @Component MUST use `templateUrl` + `styleUrl`.');
  console.error('  Reference: docs/4-architecture/coding-conventions.md §2.2');
  console.error();
  for (const v of violations) {
    console.error(`  - ${v.kind}`);
    console.error(`    ${v.file}`);
  }
  console.error();
  process.exit(1);
}

console.log('✓ PC-1 guard: all components use external templateUrl + styleUrl.');
