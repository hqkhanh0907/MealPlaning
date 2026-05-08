#!/usr/bin/env node
/**
 * scripts/check-status-ssot.mjs
 *
 * Single Source of Truth guard for sprint/story status.
 *
 * Enforces (per investigation report 2026-05-08, group G1):
 *  1. No `<this-story>` / `<TBD-commit>` / `<placeholder>` in canonical docs.
 *  2. Story status keywords (`ready-for-dev`, `ready-for-review`, `in-progress`)
 *     must NOT appear outside the SSOT (sprint-status.yaml + story files).
 *
 * The SSOT for status is `_bmad-output/implementation-artifacts/sprint-status.yaml`.
 * Story files in `_bmad-output/implementation-artifacts/<n>-<n>-*.md` may declare
 * their own `Status: <value>` line (BMAD convention) — that's allowed.
 *
 * Other docs (development-plan.md, epic-*.md, design-system.md, ...) MUST NOT
 * track per-story status — they should link to sprint-status.yaml instead.
 *
 * Run: `node scripts/check-status-ssot.mjs`
 * Exit 0 = pass, 1 = violations found.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

// Files / dirs that are allowed to contain status keywords.
const SSOT_ALLOWED = [
  '_bmad-output/implementation-artifacts/sprint-status.yaml',
  // Story files themselves — match by directory + filename pattern.
];
const STORY_FILE_REGEX = /_bmad-output\/implementation-artifacts\/\d+-\d+-[^/]+\.md$/;

// Planning artifacts may discuss status historically — exempt them too.
const PLANNING_DIR = '_bmad-output/planning-artifacts/';
// Investigation/retro plans may quote status as evidence.
const HERMES_PLANS = '.hermes/plans/';
// Sprint change proposals are historical records.
const ARCHIVE_DIRS = ['_bmad-output/_archive/', 'docs/.bmad/'];

// Patterns we forbid in canonical docs.
const PLACEHOLDER_PATTERNS = [
  /`<this-story>`/g,
  /`<TBD-commit>`/g,
  /`<TBD>`/g,
  /`<placeholder>`/g,
  /`<commit-sha>`/g,
];

// Status keywords that should ONLY live in SSOT.
// We DO allow them in code comments / changelog narrative; we only flag
// them when they appear as story-key-status pairs (e.g. "2-1-foo: ready-for-review").
const STATUS_PAIR_REGEX = /^\s*(?:[-*]\s+)?(\d+[-.]\d+[-a-z0-9-]*?)\s*:\s*(ready-for-dev|ready-for-review|in-progress|backlog)\b/gim;

const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === 'www' || entry === 'android' || entry === '.angular' || entry === '.claude' || entry === '_bmad') continue;
    // Skip the guard's own documentation in CLAUDE.md/AGENTS.md (which legitimately lists the placeholder strings).
    if (entry === 'CLAUDE.md' || entry === 'AGENTS.md' || entry === '.cursorrules') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full);
    else if (entry.endsWith('.md') || entry.endsWith('.yaml') || entry.endsWith('.yml')) checkFile(full);
  }
}

function checkFile(path) {
  const rel = relative(ROOT, path).replace(/\\/g, '/');

  // Skip SSOT itself + story files + planning artifacts + hermes plans + archives.
  if (SSOT_ALLOWED.includes(rel)) return;
  if (STORY_FILE_REGEX.test(rel)) return;
  if (rel.startsWith(PLANNING_DIR)) return;
  if (rel.startsWith(HERMES_PLANS)) return;
  if (ARCHIVE_DIRS.some(d => rel.startsWith(d))) return;
  // Skip this guard file's own scaffolding doc if any.
  if (rel.startsWith('scripts/')) return;
  // Skip BMAD vendor docs.
  if (rel.startsWith('_bmad/')) return;

  let content;
  try { content = readFileSync(path, 'utf8'); } catch { return; }

  // Check 1: placeholders.
  for (const pat of PLACEHOLDER_PATTERNS) {
    pat.lastIndex = 0;
    let m;
    while ((m = pat.exec(content)) !== null) {
      const lineNum = content.slice(0, m.index).split('\n').length;
      violations.push({ rel, lineNum, kind: 'placeholder', match: m[0] });
    }
  }

  // Check 2: status pairs.
  STATUS_PAIR_REGEX.lastIndex = 0;
  let m;
  while ((m = STATUS_PAIR_REGEX.exec(content)) !== null) {
    const lineNum = content.slice(0, m.index).split('\n').length;
    violations.push({
      rel, lineNum, kind: 'status-pair-outside-ssot',
      match: `${m[1]}: ${m[2]}`,
    });
  }
}

walk(ROOT);

if (violations.length === 0) {
  console.log('✓ check-status-ssot: PASS — no placeholders or status duplication outside SSOT.');
  process.exit(0);
}

console.error(`✗ check-status-ssot: FAIL — ${violations.length} violation(s):\n`);
for (const v of violations) {
  console.error(`  ${v.rel}:${v.lineNum}  [${v.kind}]  ${v.match}`);
}
console.error(`\nSSOT for story status: _bmad-output/implementation-artifacts/sprint-status.yaml`);
console.error(`Other docs MUST link to it, not duplicate status.`);
process.exit(1);
