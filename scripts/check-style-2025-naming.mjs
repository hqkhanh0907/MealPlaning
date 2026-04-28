#!/usr/bin/env node
/**
 * Style 2025 naming guard.
 *
 * After Phase C refactor (2026-04-28), the codebase uses Angular Style 2025:
 *   - File names: NO `.component.ts`, `.service.ts`, `.directive.ts`, `.pipe.ts` suffix.
 *   - Class names: NO `Component`, `Service`, `Directive`, `Pipe` suffix.
 *
 * Allowlist:
 *   - `*.spec.ts` keep `.spec` (Angular Style Guide).
 *   - `app.routes.ts`, `*.routes.ts` keep `.routes` (Angular Style Guide).
 *   - `*.model.ts` allowed for plain interfaces (Style Guide does not forbid).
 *   - Class `AppFormField` is allowed even though renamed away from `FormField`
 *     to avoid clashing with `@angular/forms/signals.FormField`. The class
 *     suffix rule below already permits it (no forbidden suffix).
 *
 * Reference: docs/4-architecture/coding-conventions.md §1.
 *
 * Run manually: `npm run check:style-2025`
 * Wired into `npm run build`.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = join(process.cwd(), 'src', 'app');

/** @param {string} dir @param {string[]} acc */
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (p.endsWith('.ts')) acc.push(p);
  }
  return acc;
}

const files = walk(ROOT);
const violations = [];

// Forbidden file-name suffixes (Style 2016 leftovers).
const forbiddenFileSuffix = /\.(component|service|directive|pipe)(\.spec)?\.ts$/;

// Forbidden class name suffixes appearing in `export class X<Suffix>`.
// Note: `Pipe` suffix is technically used by Angular built-ins (CurrencyPipe etc.)
// but project source MUST use Style 2025 (no suffix on our own pipes).
const forbiddenClassSuffix =
  /^export\s+(?:default\s+)?(?:abstract\s+)?class\s+\w+(Component|Service|Directive|Pipe)\b/m;

for (const f of files) {
  const name = basename(f);
  if (forbiddenFileSuffix.test(name)) {
    violations.push({
      file: f,
      kind: `file name uses Style 2016 suffix (\`.component\` / \`.service\` / \`.directive\` / \`.pipe\`)`,
    });
  }
  const src = readFileSync(f, 'utf8');
  const m = src.match(forbiddenClassSuffix);
  if (m) {
    violations.push({
      file: f,
      kind: `class name ends with \`${m[1]}\` — Style 2025 forbids the suffix`,
    });
  }
}

if (violations.length > 0) {
  console.error('\n✖ Style 2025 naming guard FAILED');
  console.error('  Rule: no `.component`/`.service`/`.directive`/`.pipe` suffix on files');
  console.error('        and no `Component`/`Service`/`Directive`/`Pipe` suffix on classes.');
  console.error('  Reference: docs/4-architecture/coding-conventions.md §1.');
  console.error();
  for (const v of violations) {
    console.error(`  - ${v.kind}`);
    console.error(`    ${v.file}`);
  }
  console.error();
  process.exit(1);
}

console.log('✓ Style 2025 naming guard: no Style 2016 leftovers in src/app/.');
