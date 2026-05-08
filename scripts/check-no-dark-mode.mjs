#!/usr/bin/env node
/**
 * scripts/check-no-dark-mode.mjs
 *
 * Guard: ensure no canonical doc / source file (re-)introduces dark mode.
 *
 * Per investigation report 2026-05-08, group G2: Story 2.6 removed dark mode
 * permanently. Body content of canonical docs MUST NOT teach or describe dark
 * mode patterns. Historical mentions live in:
 *   - docs/6-decisions/superseded-features.md (canonical record)
 *   - _bmad-output/planning-artifacts/* (historical sprint records)
 *   - docs/.bmad/* (BMAD brownfield snapshot, stale-notice banner)
 *   - .hermes/plans/* (investigation/retro plans)
 *   - design-system.md changelog rows (Audit Round history)
 *
 * Patterns flagged: `dark mode`, `dark-mode`, `prefers-color-scheme`,
 * `[data-theme="dark"]`, `@include dark-root`, `@use 'dark-mode'`.
 *
 * Run: `node scripts/check-no-dark-mode.mjs`
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

// Files / dirs allowed to mention dark mode (historical / decision records).
const ALLOWED = [
  'docs/6-decisions/superseded-features.md',
  'scripts/check-no-dark-mode.mjs',  // self
];
const ALLOWED_PREFIXES = [
  '_bmad-output/planning-artifacts/',
  '_bmad-output/implementation-artifacts/',  // story files describe what was done historically
  'docs/.bmad/',         // BMAD brownfield snapshots (stale-banner)
  '.hermes/plans/',      // retro / investigation plans
  '.qa-evidence/',
  'docs/3-design/explorations/',  // pre-direction exploration artifacts (color/typo/spacing decks)
  '.github/instructions/memory/',  // historical session memory
  '.github/instructions/',  // legacy IDE-assistant instruction docs (will be cleaned up later)
  '.github/agents/',  // BMAD agent prompts
];

// Files explicitly allowed as historical mention.
const ALLOWED_FILES = [
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/copilot-instructions.md',  // legacy AI assistant instructions, scheduled for cleanup
  'docs/5-development/deferred-items.md',  // contains ~~B7~~ CANCELLED row mentioning dark mode
];

// Patterns to flag.
const PATTERNS = [
  /\bdark[ -]?mode\b/gi,
  /prefers-color-scheme\s*:\s*dark/gi,
  /\[data-theme\s*=\s*["']dark["']\]/gi,
  /@include\s+dark-root\b/g,
  /@use\s+['"][^'"]*dark-mode['"]/g,
];

// Inside this file pattern, lines that match the changelog row regex are
// allowed to mention dark mode (these are immutable history rows).
const CHANGELOG_ROW = /^\| \d+\.\d+ \| \d{4}-\d{2}-\d{2} \|/;

const violations = [];
const SCAN_EXTS = ['.md', '.scss', '.css', '.ts', '.html'];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (
      entry === 'node_modules' || entry === '.git' || entry === 'dist' ||
      entry === 'www' || entry === 'android' || entry === '.angular' ||
      entry === '_bmad' || entry === '.claude'
    ) continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full);
    else if (SCAN_EXTS.some(e => entry.endsWith(e))) checkFile(full);
  }
}

function checkFile(path) {
  const rel = relative(ROOT, path).replace(/\\/g, '/');
  if (ALLOWED.includes(rel)) return;
  if (ALLOWED_FILES.includes(rel)) return;
  if (ALLOWED_PREFIXES.some(p => rel.startsWith(p))) return;

  let content;
  try { content = readFileSync(path, 'utf8'); } catch { return; }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Allow changelog rows in design-system.md.
    if (rel.endsWith('design-system.md') && CHANGELOG_ROW.test(line)) continue;
    // Allow story summaries in development-plan.md that explicitly reference Story 2.3/2.6 removal narrative.
    if (rel.endsWith('development-plan.md') && /Story 2\.[36][^\n]*(?:dark mode|removed|superseded)/i.test(line)) continue;
    // Allow the historical-context line: "Previous: 2.0 (..., dark-mode capable)" — only on line 6.
    if (rel.endsWith('design-system.md') && /^\*\*Previous:\*\*/.test(line)) continue;
    // Allow the light-only banner reference itself.
    if (/Light-only.*Dark mode is permanently removed/.test(line)) continue;
    if (/superseded-features\.md/.test(line)) continue;

    for (const pat of PATTERNS) {
      pat.lastIndex = 0;
      const m = pat.exec(line);
      if (m) {
        violations.push({ rel, lineNum: i + 1, match: m[0], snippet: line.trim().slice(0, 120) });
        break;
      }
    }
  }
}

walk(ROOT);

if (violations.length === 0) {
  console.log('✓ check-no-dark-mode: PASS — no dark-mode references in canonical docs/source.');
  process.exit(0);
}

console.error(`✗ check-no-dark-mode: FAIL — ${violations.length} violation(s):\n`);
for (const v of violations) {
  console.error(`  ${v.rel}:${v.lineNum}  [${v.match}]  ${v.snippet}`);
}
console.error(`\nDark mode was permanently removed in Story 2.6 (v0.2.1, 2026-05-08).`);
console.error(`Historical record: docs/6-decisions/superseded-features.md`);
process.exit(1);
